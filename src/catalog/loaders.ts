import { execFile as execFileCallback } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  CURRENT_DIR,
  DEFAULT_TIMEOUT_MS,
  HEADLESS_RENDER_BUDGET_MS,
  SOURCES_DIR,
} from './schemas.js';
import {
  asciiFold,
  extractDateFromUrl,
  parsePublishedDate,
  stripHtmlTags,
} from './normalize.js';
import type {
  CanonicalDatasets,
  FetchedCatalogSources,
  ResolvedSource,
  SnapshotManifest,
  SourceDatasetName,
  SourceRegistryEntry,
} from './types.js';

const execFile = promisify(execFileCallback);
const latin1Decoder = new TextDecoder('latin1');

type LinkAnchor = {
  href: string;
  text: string;
};

export async function readSourceRegistry(repoRoot: string): Promise<SourceRegistryEntry[]> {
  const registryPath = path.join(repoRoot, SOURCES_DIR, 'registry.json');
  const raw = await readFile(registryPath, 'utf8');
  return JSON.parse(raw) as SourceRegistryEntry[];
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFile('sh', ['-lc', `command -v ${command}`]);
    return true;
  } catch {
    return false;
  }
}

export async function locateChromeBinary(): Promise<string> {
  const envCandidates = [
    process.env.CHROME_BIN,
    process.env.GOOGLE_CHROME_BIN,
    process.env.CHROMIUM_BIN,
  ].filter(Boolean) as string[];

  for (const candidate of envCandidates) {
    return candidate;
  }

  const commandCandidates = [
    'google-chrome-stable',
    'google-chrome',
    'chromium-browser',
    'chromium',
    'chrome',
  ];

  for (const candidate of commandCandidates) {
    if (await commandExists(candidate)) return candidate;
  }

  const macCandidate = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    await stat(macCandidate);
    return macCandidate;
  } catch {
    throw new Error(
      'Could not locate a Chrome or Chromium binary. Set CHROME_BIN or install Chrome.'
    );
  }
}

export async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    headers: {
      'user-agent': 'ISPB Participants Catalog bot/1.0 (+github actions)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function fetchText(url: string, encoding: 'utf-8' | 'latin1' = 'utf-8') {
  const buffer = await fetchBuffer(url);
  const utf8Text = buffer.toString('utf8');
  if (encoding === 'utf-8' && !utf8Text.includes('\uFFFD')) {
    return utf8Text;
  }
  return latin1Decoder.decode(buffer);
}

export function parseAnchors(dom: string): LinkAnchor[] {
  const anchors = [...dom.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gis)];
  return anchors.map(match => ({
    href: match[1]!,
    text: stripHtmlTags(match[2] ?? ''),
  }));
}

export function extractCsvUrlFromPdfBuffer(pdfBuffer: Buffer): string {
  const latin1 = pdfBuffer.toString('latin1');
  const match = latin1.match(/https:\/\/www\.bcb\.gov\.br\/[^)\s]+\.csv/gi);
  if (!match?.length) {
    throw new Error('Could not extract an official CSV URL from the official PDF.');
  }
  return match[0]!;
}

async function renderPageDomWithBudget(url: string, budgetMs: number): Promise<string> {
  const chrome = await locateChromeBinary();
  const { stdout } = await execFile(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      `--virtual-time-budget=${budgetMs}`,
      '--dump-dom',
      url,
    ],
    {
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        GOOGLE_API_KEY: '',
      },
    }
  );

  if (!stdout.includes('<html')) {
    throw new Error(`Rendered DOM for ${url} did not look like HTML.`);
  }

  return stdout;
}

export async function renderPageDom(url: string): Promise<string> {
  return renderPageDomWithBudget(url, HEADLESS_RENDER_BUDGET_MS);
}

function selectLatestAnchor(
  anchors: LinkAnchor[],
  predicate: (anchor: LinkAnchor) => boolean
): LinkAnchor | null {
  const candidates = anchors
    .filter(predicate)
    .map(anchor => ({
      anchor,
      date: parsePublishedDate(anchor.text) ?? extractDateFromUrl(anchor.href) ?? '0000-00-00',
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  if (!candidates.length) return null;
  return candidates[0]!.anchor;
}

async function resolveLatestOfficialDocument(
  registry: SourceRegistryEntry,
  predicate: (anchor: LinkAnchor) => boolean
): Promise<LinkAnchor> {
  const budgets = [
    HEADLESS_RENDER_BUDGET_MS,
    HEADLESS_RENDER_BUDGET_MS + 10_000,
    HEADLESS_RENDER_BUDGET_MS + 20_000,
  ];

  let apiMentionsIdentifier = false;
  try {
    const apiPayload = await fetchText(registry.official_page_api_url);
    apiMentionsIdentifier = apiPayload.includes(registry.content_identifier);
  } catch {
    apiMentionsIdentifier = false;
  }

  for (let attempt = 0; attempt < budgets.length; attempt += 1) {
    const dom = await renderPageDomWithBudget(registry.official_page_url, budgets[attempt]!);
    const anchors = parseAnchors(dom);
    const match = selectLatestAnchor(anchors, predicate);
    if (match) return match;

    if (attempt < budgets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1_500 * (attempt + 1)));
    }
  }

  const identifierNote = apiMentionsIdentifier
    ? ` The official page API still advertises the content identifier "${registry.content_identifier}".`
    : '';

  throw new Error(
    `No matching official download link was found in the rendered page for ${registry.dataset}.${identifierNote}`
  );
}

async function resolveSpiSource(registry: SourceRegistryEntry): Promise<ResolvedSource> {
  const pdfAnchor = await resolveLatestOfficialDocument(
    registry,
    anchor =>
      anchor.href.includes('/content/estabilidadefinanceira/spi-pdf/') &&
      anchor.href.endsWith('.pdf')
  );
  const pdfBuffer = await fetchBuffer(pdfAnchor.href);
  const csvUrl = extractCsvUrlFromPdfBuffer(pdfBuffer);

  return {
    registry,
    officialPageUrl: registry.official_page_url,
    officialPageApiUrl: registry.official_page_api_url,
    pdfUrl: pdfAnchor.href,
    csvUrl,
    pdfTitle: pdfAnchor.text,
    sourcePublicationDate:
      parsePublishedDate(pdfAnchor.text) ?? extractDateFromUrl(pdfAnchor.href),
  };
}

async function resolvePixSource(registry: SourceRegistryEntry): Promise<ResolvedSource> {
  const pdfAnchor = await resolveLatestOfficialDocument(
    registry,
    anchor =>
      anchor.href.includes('/content/estabilidadefinanceira/participantes_pix_pdf/') &&
      anchor.href.endsWith('.pdf')
  );
  const pdfBuffer = await fetchBuffer(pdfAnchor.href);
  const csvUrl = extractCsvUrlFromPdfBuffer(pdfBuffer);

  return {
    registry,
    officialPageUrl: registry.official_page_url,
    officialPageApiUrl: registry.official_page_api_url,
    pdfUrl: pdfAnchor.href,
    csvUrl,
    pdfTitle: pdfAnchor.text,
    sourcePublicationDate:
      parsePublishedDate(pdfAnchor.text) ?? extractDateFromUrl(pdfAnchor.href),
  };
}

export async function resolveOfficialSources(
  repoRoot: string
): Promise<Record<SourceDatasetName, ResolvedSource>> {
  const registryEntries = await readSourceRegistry(repoRoot);
  const registryMap = new Map(registryEntries.map(entry => [entry.dataset, entry]));
  const spiRegistry = registryMap.get('spi_participants');
  const pixActiveRegistry = registryMap.get('pix_active_participants');
  const pixAdhesionRegistry = registryMap.get('pix_in_adhesion');

  if (!spiRegistry || !pixActiveRegistry || !pixAdhesionRegistry) {
    throw new Error('sources/registry.json is missing one or more mandatory datasets.');
  }

  const spi = await resolveSpiSource(spiRegistry);
  const pixShared = await resolvePixSource(pixActiveRegistry);

  return {
    spi_participants: spi,
    pix_active_participants: pixShared,
    pix_in_adhesion: {
      ...pixShared,
      registry: pixAdhesionRegistry,
    },
  };
}

export async function fetchCatalogSources(repoRoot: string): Promise<FetchedCatalogSources> {
  const collectedAt = new Date().toISOString();
  const sources = await resolveOfficialSources(repoRoot);

  const [spiCsvText, pixCsvText] = await Promise.all([
    fetchText(sources.spi_participants.csvUrl),
    fetchText(sources.pix_active_participants.csvUrl),
  ]);

  return {
    collectedAt,
    sources,
    raw: {
      spiCsvText,
      pixCsvText,
    },
  };
}

async function readCurrentJson<T>(repoRoot: string, filename: string): Promise<T> {
  const content = await readFile(path.join(repoRoot, CURRENT_DIR, filename), 'utf8');
  return JSON.parse(content) as T;
}

export async function loadPromotedCanonicalDatasets(repoRoot: string): Promise<{
  datasets: CanonicalDatasets;
  manifest: SnapshotManifest;
}> {
  const [
    spi_participants,
    pix_active_participants,
    pix_in_adhesion,
    catalog_crosswalk,
    manifest,
  ] = await Promise.all([
    readCurrentJson<CanonicalDatasets['spi_participants']>(repoRoot, 'spi_participants.json'),
    readCurrentJson<CanonicalDatasets['pix_active_participants']>(
      repoRoot,
      'pix_active_participants.json'
    ),
    readCurrentJson<CanonicalDatasets['pix_in_adhesion']>(repoRoot, 'pix_in_adhesion.json'),
    readCurrentJson<CanonicalDatasets['catalog_crosswalk']>(repoRoot, 'catalog_crosswalk.json'),
    readCurrentJson<SnapshotManifest>(repoRoot, 'manifest.json'),
  ]);

  return {
    datasets: {
      spi_participants,
      pix_active_participants,
      pix_in_adhesion,
      catalog_crosswalk,
    },
    manifest,
  };
}

