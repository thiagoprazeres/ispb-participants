/**
 * SSG — ISPB Participants Catalog Static Site Generator
 *
 * Generates site/ from:
 *   - src/index.ts (canonical data — no logic duplication)
 *   - docs/*.md (documentation pages)
 *   - current/, snapshots/, schemas/ (copied as-is)
 *
 * Run: tsx web/ssg.ts
 * Output: site/
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(REPO_ROOT, 'site');
const BASE = (process.env.BASE_PATH ?? '/ispb-participants').replace(/\/$/, '');

// ─── import canonical data from src/index.ts (no logic duplication) ──────────

import {
  INSTITUTIONS,
  getCatalogMetadata,
  getMetadata,
} from '../src/index.js';

import type { InstitutionEntry } from '../src/catalog/types.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

async function ensureClean(dir: string) {
  await rm(dir, { force: true, recursive: true });
  await mkdir(dir, { recursive: true });
}

async function write(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

// ─── design tokens & layout ───────────────────────────────────────────────────

const COLORS = {
  ink: '#0f1f26',
  muted: '#4d6670',
  line: '#d4dde1',
  paper: '#f5f7f8',
  bg: '#ffffff',
  brand: '#025c75',
  brandLight: '#e8f4f7',
  spi: '#1a6b3c',
  spiBg: '#eaf5ee',
  pixActive: '#0057a8',
  pixActiveBg: '#e6f0fb',
  pixAdhesion: '#7c4d00',
  pixAdhesionBg: '#fef4e5',
  noMatch: '#6b2d2d',
  noMatchBg: '#fdf0f0',
} as const;

const CSS = `
:root {
  --ink: ${COLORS.ink};
  --muted: ${COLORS.muted};
  --line: ${COLORS.line};
  --paper: ${COLORS.paper};
  --bg: ${COLORS.bg};
  --brand: ${COLORS.brand};
  --brand-light: ${COLORS.brandLight};
  --radius: 10px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.6;
}
a { color: var(--brand); text-decoration: none; }
a:hover { text-decoration: underline; }
code, pre {
  font-family: "SFMono-Regular", Menlo, "Consolas", monospace;
  font-size: 0.875em;
}
pre {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}
code { background: var(--paper); padding: 0.1em 0.35em; border-radius: 4px; }
pre code { background: none; padding: 0; }
h1, h2, h3, h4 { font-weight: 600; line-height: 1.3; }
h1 { font-size: 1.75rem; }
h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; }
h3 { font-size: 1.05rem; margin: 1.5rem 0 0.5rem; }
p { margin: 0.75rem 0; }
ul, ol { margin: 0.75rem 0 0.75rem 1.5rem; }
li { margin: 0.25rem 0; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 0.5rem 0.75rem; text-align: left; }
th { background: var(--paper); font-weight: 600; }
hr { border: none; border-top: 1px solid var(--line); margin: 2rem 0; }

/* layout */
.site-header {
  background: var(--bg);
  border-bottom: 1px solid var(--line);
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.site-header .brand {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--brand);
  white-space: nowrap;
}
.site-nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
}
.site-nav a { color: var(--muted); }
.site-nav a:hover, .site-nav a.active { color: var(--brand); }
.site-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.site-footer {
  border-top: 1px solid var(--line);
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted);
  background: var(--bg);
}
.site-footer a { color: var(--muted); }

/* badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.badge-spi    { background: ${COLORS.spiBg}; color: ${COLORS.spi}; border-color: ${COLORS.spi}33; }
.badge-pix    { background: ${COLORS.pixActiveBg}; color: ${COLORS.pixActive}; border-color: ${COLORS.pixActive}33; }
.badge-adhesion { background: ${COLORS.pixAdhesionBg}; color: ${COLORS.pixAdhesion}; border-color: ${COLORS.pixAdhesion}33; }
.badge-off    { background: #f0f0f0; color: #888; border-color: #ccc; }

/* confidence chip */
.conf-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.02em;
}
.conf-exact  { background: ${COLORS.spiBg}; color: ${COLORS.spi}; }
.conf-cnpj   { background: #fff8e1; color: #6b4900; }
.conf-no     { background: ${COLORS.noMatchBg}; color: ${COLORS.noMatch}; }
.conf-derived { background: #f0f0f0; color: #555; }

/* cards */
.card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  margin: 1rem 0;
}
.card-title { font-size: 1.05rem; font-weight: 600; }
.card-subtitle { font-size: 0.875rem; color: var(--muted); margin-top: 0.2rem; }
.card-meta { font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; }
.card-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.75rem; }
.card-fields { margin-top: 1rem; display: grid; gap: 0.4rem; font-size: 0.875rem; }
.card-field { display: grid; grid-template-columns: 180px 1fr; gap: 0.5rem; }
.card-field-label { color: var(--muted); font-size: 0.8rem; }

/* search */
.search-box {
  display: flex;
  gap: 0.5rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 0.875rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--ink);
  background: var(--bg);
  outline: none;
}
.search-input:focus { border-color: var(--brand); }
.search-btn {
  padding: 0.6rem 1rem;
  border: 1px solid var(--brand);
  border-radius: var(--radius);
  background: var(--brand);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.search-btn:hover { opacity: 0.88; }
.search-results { margin-top: 1rem; }
.result-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  margin: 0.5rem 0;
  background: var(--bg);
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.12s;
}
.result-item:hover { border-color: var(--brand); text-decoration: none; }
.result-ispb {
  font-family: monospace;
  font-size: 0.85rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
  color: var(--muted);
  flex-shrink: 0;
}
.result-name { font-weight: 600; font-size: 0.95rem; }
.result-short { font-size: 0.8rem; color: var(--muted); }

/* alert boxes */
.notice {
  padding: 0.875rem 1rem;
  border-radius: var(--radius);
  border-left: 3px solid var(--brand);
  background: var(--brand-light);
  font-size: 0.875rem;
  margin: 1rem 0;
}
.notice-warn {
  border-color: ${COLORS.pixAdhesion};
  background: ${COLORS.pixAdhesionBg};
}

/* page hero */
.hero { margin-bottom: 2rem; }
.hero-title { font-size: 2rem; font-weight: 700; }
.hero-sub { color: var(--muted); margin-top: 0.5rem; font-size: 1rem; }
.hero-meta { margin-top: 0.75rem; font-size: 0.8rem; color: var(--muted); }

/* responsive */
@media (max-width: 600px) {
  .site-header { padding: 0.75rem 1rem; }
  .site-main { padding: 1.25rem 1rem 3rem; }
  .card-field { grid-template-columns: 1fr; }
  h1 { font-size: 1.4rem; }
}
`;

// ─── layout shell ─────────────────────────────────────────────────────────────

const NAV_PAGES = [
  { slug: 'index', label: 'Catálogo' },
  { slug: 'getting-started', label: 'Getting started', docFile: 'getting-started.md' },
  { slug: 'api', label: 'API', docFile: 'api.md' },
  { slug: 'which-export', label: 'Qual export?', docFile: 'which-export.md' },
  { slug: 'datasets', label: 'Datasets', docFile: 'datasets.md' },
  { slug: 'semantic-scope', label: 'Semântica', docFile: 'semantic-scope.md' },
  { slug: 'provenance', label: 'Proveniência', docFile: 'provenance.md' },
  { slug: 'schemas', label: 'Schemas', docFile: 'schemas.md' },
  { slug: 'snapshots', label: 'Snapshots', docFile: 'snapshots.md' },
  { slug: 'changelog', label: 'Changelog', docFile: 'changelog.md' },
] as const;

function layout(opts: {
  title: string;
  activeSlug: string;
  content: string;
  snapshotDate: string;
}): string {
  const nav = NAV_PAGES.map(p => {
    const isActive = p.slug === opts.activeSlug;
    const href = p.slug === 'index' ? `${BASE}/index.html` : `${BASE}/${p.slug}.html`;
    return `<a href="${href}"${isActive ? ' class="active"' : ''}>${p.label}</a>`;
  }).join('\n        ');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${opts.title} — ISPB Participants Catalog</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="site-header">
    <a href="${BASE}/index.html" class="brand">ISPB Participants Catalog</a>
    <nav class="site-nav">
      ${nav}
    </nav>
  </header>
  <main class="site-main">
    ${opts.content}
  </main>
  <footer class="site-footer">
    <p>
      Snapshot: <strong>${opts.snapshotDate}</strong> ·
      Fonte: <a href="https://www.bcb.gov.br" target="_blank" rel="noopener">Banco Central do Brasil</a> ·
      Catálogo: <a href="https://github.com/thiagoprazeres/ispb-participants" target="_blank" rel="noopener">thiagoprazeres/ispb-participants</a>
    </p>
    <p style="margin-top:0.4rem">
      Código: <a href="https://github.com/thiagoprazeres/ispb-participants/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a> ·
      Dados derivados: <a href="https://github.com/thiagoprazeres/ispb-participants/blob/main/LICENSE_DATA" target="_blank" rel="noopener">ODC-By 1.0</a> ·
      Não é publicação oficial do Banco Central
    </p>
  </footer>
</body>
</html>`;
}

// ─── badge & chip helpers ─────────────────────────────────────────────────────

function spiStatus(entry: InstitutionEntry): string {
  return entry.inSpi
    ? `<span class="badge badge-spi">SPI ✓</span>`
    : `<span class="badge badge-off">SPI —</span>`;
}

function pixStatus(entry: InstitutionEntry): string {
  if (entry.inPixActive) return `<span class="badge badge-pix">Pix ativo ✓</span>`;
  if (entry.inPixAdhesion) return `<span class="badge badge-adhesion">Pix adesão</span>`;
  return `<span class="badge badge-off">Pix —</span>`;
}

function confidenceChip(conf: InstitutionEntry['matchConfidence']): string {
  const map: Record<string, [string, string]> = {
    exact_ispb: ['conf-exact', 'ISPB exato'],
    unique_cnpj: ['conf-cnpj', 'CNPJ único'],
    no_auto_match: ['conf-no', 'sem match'],
    derived: ['conf-derived', 'derivado'],
  };
  const [cls, label] = map[conf] ?? ['conf-derived', conf];
  return `<span class="conf-chip ${cls}" title="matchConfidence: ${conf}">${label}</span>`;
}

// ─── index page (search + overview) ──────────────────────────────────────────

function buildIndexSearchIndex(): string {
  const entries = Object.values(INSTITUTIONS).map(e => ({
    i: e.ispb,
    n: e.name,
    s: e.shortName,
    si: e.inSpi,
    pa: e.inPixActive,
    ad: e.inPixAdhesion,
    mc: e.matchConfidence,
  }));
  return JSON.stringify(entries);
}

function buildIndexPage(meta: ReturnType<typeof getMetadata>): string {
  const searchIndexJson = buildIndexSearchIndex();

  const content = `
<div class="hero">
  <h1 class="hero-title">ISPB Participants Catalog</h1>
  <p class="hero-sub">Catálogo público derivado de fonte oficial do Banco Central do Brasil para participantes do SPI e do Pix.</p>
  <p class="hero-meta">
    Snapshot: <strong>${meta.sourceDate}</strong> ·
    ${meta.recordCount} instituições indexadas ·
    <a href="${BASE}/datasets.html">4 datasets canônicos</a>
  </p>
</div>

<div class="notice">
  <strong>Este catálogo não é a publicação oficial do Banco Central.</strong>
  É um artefato derivado, versionado e auditável. Cada registro preserva origem, método de matching e grau de confiança.
</div>

<h2>Buscar instituição</h2>
<div class="search-box">
  <input id="search-ispb" class="search-input" type="text" placeholder="ISPB (ex: 60746948)" maxlength="8" inputmode="numeric">
  <input id="search-name" class="search-input" type="text" placeholder="Buscar por nome...">
</div>
<div id="search-results" class="search-results"></div>

<h2>Artefatos do catálogo</h2>
<div class="card">
  <div style="display:grid;gap:0.5rem;font-size:0.9rem;">
    <div>📄 <a href="${BASE}/current/spi_participants.json">current/spi_participants.json</a> &nbsp;·&nbsp; <a href="${BASE}/current/spi_participants.csv">CSV</a></div>
    <div>📄 <a href="${BASE}/current/pix_active_participants.json">current/pix_active_participants.json</a> &nbsp;·&nbsp; <a href="${BASE}/current/pix_active_participants.csv">CSV</a></div>
    <div>📄 <a href="${BASE}/current/pix_in_adhesion.json">current/pix_in_adhesion.json</a> &nbsp;·&nbsp; <a href="${BASE}/current/pix_in_adhesion.csv">CSV</a></div>
    <div>📄 <a href="${BASE}/current/catalog_crosswalk.json">current/catalog_crosswalk.json</a> &nbsp;·&nbsp; <a href="${BASE}/current/catalog_crosswalk.csv">CSV</a></div>
    <div>📋 <a href="${BASE}/current/manifest.json">current/manifest.json</a></div>
    <div>📦 <a href="${BASE}/datapackage.json">datapackage.json</a></div>
  </div>
</div>

<h2>Pacote npm</h2>
<div class="card">
  <div style="font-size:0.9rem;">
    <code style="font-size:1rem;">npm install @thiagoprazeres/ispb-participants</code>
    <p style="margin-top:0.75rem;color:var(--muted);">
      Inclui <code>INSTITUTIONS</code>, <code>SPI_PARTICIPANTS</code>, <code>PIX_ACTIVE_PARTICIPANTS</code>, <code>PIX_IN_ADHESION</code>
      e helpers de lookup e busca. Dados embutidos no bundle — sem chamadas de rede.
    </p>
    <p><a href="${BASE}/api.html">Referência da API →</a> · <a href="${BASE}/which-export.html">Qual export usar? →</a></p>
  </div>
</div>

<script>
(function() {
  var INDEX = ${searchIndexJson};

  function fold(s) {
    return (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  }

  function badge(si, pa, ad) {
    var b = [];
    if (si) b.push('<span class="badge badge-spi">SPI</span>');
    if (pa) b.push('<span class="badge badge-pix">Pix ativo</span>');
    if (ad) b.push('<span class="badge badge-adhesion">Pix adesão</span>');
    if (!si && !pa && !ad) b.push('<span class="badge badge-off">—</span>');
    return b.join(' ');
  }

  function renderItem(e) {
    return '<a class="result-item" href="${BASE}/institutions/' + e.i + '.html">' +
      '<span class="result-ispb">' + e.i + '</span>' +
      '<span>' +
        '<div class="result-name">' + e.n + '</div>' +
        '<div class="result-short">' + (e.s !== e.n ? e.s + ' · ' : '') + badge(e.si, e.pa, e.ad) + '</div>' +
      '</span>' +
    '</a>';
  }

  function search() {
    var ispbQ = document.getElementById('search-ispb').value.trim().padStart(8, '0').replace(/^0+(?!$)/, '');
    var nameQ = fold(document.getElementById('search-name').value.trim());
    var results = [];

    if (document.getElementById('search-ispb').value.trim()) {
      var padded = document.getElementById('search-ispb').value.trim().padStart(8, '0');
      var match = INDEX.find(function(e) { return e.i === padded; });
      if (match) results = [match];
    } else if (nameQ.length >= 2) {
      results = INDEX.filter(function(e) {
        return fold(e.n).includes(nameQ) || fold(e.s).includes(nameQ);
      }).slice(0, 50);
    }

    var el = document.getElementById('search-results');
    if (!document.getElementById('search-ispb').value.trim() && !document.getElementById('search-name').value.trim()) {
      el.innerHTML = '';
      return;
    }
    if (results.length === 0) {
      el.innerHTML = '<p style="color:var(--muted);font-size:0.875rem;">Nenhum resultado encontrado.</p>';
      return;
    }
    el.innerHTML = results.map(renderItem).join('');
  }

  document.getElementById('search-ispb').addEventListener('input', search);
  document.getElementById('search-name').addEventListener('input', search);
})();
</script>`;

  return layout({
    title: 'Catálogo',
    activeSlug: 'index',
    content,
    snapshotDate: meta.sourceDate,
  });
}

// ─── institution page ─────────────────────────────────────────────────────────

function buildInstitutionPage(entry: InstitutionEntry, snapshotDate: string): string {
  const fields: [string, string][] = [
    ['ISPB', `<code>${entry.ispb}</code>`],
    ['Nome', entry.name],
    ['Nome reduzido', entry.shortName],
    ['CNPJ', entry.cnpj ? `<code>${entry.cnpj}</code>` : '<span style="color:var(--muted)">—</span>'],
    ['Tipo de instituição', entry.institutionType ?? '<span style="color:var(--muted)">—</span>'],
    ['Autorizado pelo BCB', entry.authorizedByBcb === true ? 'Sim' : entry.authorizedByBcb === false ? 'Não' : '<span style="color:var(--muted)">—</span>'],
    ['Tipo SPI', entry.spiParticipationType ?? '<span style="color:var(--muted)">—</span>'],
    ['Tipo Pix', entry.pixParticipationType ?? '<span style="color:var(--muted)">—</span>'],
    ['Modalidade Pix', entry.pixParticipationMode ?? '<span style="color:var(--muted)">—</span>'],
    ['Datasets de origem', entry.sourceDatasets.map(d => `<code>${d}</code>`).join(', ') || '<span style="color:var(--muted)">—</span>'],
    ['Match confidence', confidenceChip(entry.matchConfidence) + `&nbsp;<span style="font-size:0.75rem;color:var(--muted)">${matchConfidenceLabel(entry.matchConfidence)}</span>`],
    ['Fonte canônica', `<a href="${entry.canonicalSource}" target="_blank" rel="noopener">${entry.canonicalSource}</a>`],
  ];

  const adhesionWarn = (!entry.inPixActive && entry.inPixAdhesion)
    ? `<div class="notice notice-warn" style="margin-top:1rem;">
        Esta instituição está em <strong>processo de adesão</strong> ao Pix — não é participante ativo.
        Não apresentar como "participa do Pix".
       </div>`
    : '';

  const content = `
<div style="margin-bottom:1rem;font-size:0.875rem;color:var(--muted)">
  <a href="${BASE}/index.html">← Catálogo</a>
</div>

<div class="card">
  <div class="card-title">${entry.name}</div>
  <div class="card-subtitle">${entry.shortName !== entry.name ? entry.shortName + ' · ' : ''}<code style="font-size:0.875rem">${entry.ispb}</code></div>
  <div class="card-badges">
    ${spiStatus(entry)}
    ${pixStatus(entry)}
    ${confidenceChip(entry.matchConfidence)}
  </div>
  ${adhesionWarn}
  <div class="card-fields" style="margin-top:1.25rem;">
    ${fields.map(([label, value]) => `
    <div class="card-field">
      <span class="card-field-label">${label}</span>
      <span>${value}</span>
    </div>`).join('')}
  </div>
</div>

<h2>Sobre este registro</h2>
<p style="font-size:0.875rem;color:var(--muted);">
  Esta entrada é parte do índice derivado <code>INSTITUTIONS</code>, gerado a partir dos datasets canônicos do catálogo.
  O campo <code>matchConfidence</code> indica o grau de certeza do agrupamento entre datasets.
  <a href="${BASE}/semantic-scope.html">Como interpretar este registro →</a>
</p>
<p style="font-size:0.875rem;color:var(--muted);">
  Dados canônicos em: <a href="${entry.canonicalSource}" target="_blank" rel="noopener">${entry.canonicalSource}</a>
</p>`;

  return layout({
    title: entry.name,
    activeSlug: 'index',
    content,
    snapshotDate,
  });
}

function matchConfidenceLabel(conf: InstitutionEntry['matchConfidence']): string {
  const map: Record<string, string> = {
    exact_ispb: 'Match determinístico por ISPB',
    unique_cnpj: 'Match por CNPJ único (sem ISPB)',
    no_auto_match: 'Sem match automático — CNPJ ambíguo ou ausente',
    derived: 'Entrada derivada sem ISPB identificável',
  };
  return map[conf] ?? conf;
}

// ─── doc page ─────────────────────────────────────────────────────────────────

async function buildDocPage(opts: {
  slug: string;
  docFile: string;
  snapshotDate: string;
}): Promise<string> {
  const { marked } = await import('marked');
  const mdPath = path.join(REPO_ROOT, 'docs', opts.docFile);
  const md = await readFile(mdPath, 'utf8');
  const html = await marked.parse(md);
  const label = NAV_PAGES.find(p => p.slug === opts.slug)?.label ?? opts.slug;
  return layout({
    title: label,
    activeSlug: opts.slug,
    content: html,
    snapshotDate: opts.snapshotDate,
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const meta = getMetadata();
  const catalogMeta = getCatalogMetadata();
  const snapshotDate = meta.sourceDate;

  console.log(`Building site for snapshot ${snapshotDate}…`);

  await ensureClean(SITE_DIR);

  // index page
  await write(path.join(SITE_DIR, 'index.html'), buildIndexPage(meta));
  console.log('  ✓ index.html');

  // doc pages
  let docCount = 0;
  for (const page of NAV_PAGES) {
    if (page.slug === 'index') continue;
    if (!('docFile' in page)) continue;
    const html = await buildDocPage({
      slug: page.slug,
      docFile: page.docFile,
      snapshotDate,
    });
    await write(path.join(SITE_DIR, `${page.slug}.html`), html);
    docCount++;
  }
  console.log(`  ✓ ${docCount} doc pages`);

  // institution pages
  const entries = Object.values(INSTITUTIONS);
  const institutionsDir = path.join(SITE_DIR, 'institutions');
  await mkdir(institutionsDir, { recursive: true });
  for (const entry of entries) {
    const html = buildInstitutionPage(entry, snapshotDate);
    await write(path.join(institutionsDir, `${entry.ispb}.html`), html);
  }
  console.log(`  ✓ ${entries.length} institution pages`);

  // copy static assets
  const assetsToCopy: [string, string][] = [
    [path.join(REPO_ROOT, 'current'), path.join(SITE_DIR, 'current')],
    [path.join(REPO_ROOT, 'snapshots'), path.join(SITE_DIR, 'snapshots')],
    [path.join(REPO_ROOT, 'schemas'), path.join(SITE_DIR, 'schemas')],
  ];
  for (const [src, dst] of assetsToCopy) {
    await cp(src, dst, { recursive: true });
  }

  const filesToCopy: [string, string][] = [
    [path.join(REPO_ROOT, 'datapackage.json'), path.join(SITE_DIR, 'datapackage.json')],
    [path.join(REPO_ROOT, 'LICENSE'), path.join(SITE_DIR, 'LICENSE')],
    [path.join(REPO_ROOT, 'LICENSE_DATA'), path.join(SITE_DIR, 'LICENSE_DATA')],
  ];
  for (const [src, dst] of filesToCopy) {
    await cp(src, dst);
  }
  console.log('  ✓ static assets copied');

  console.log(`\nSite built at ${SITE_DIR}`);
  console.log(`  Pages: 1 index + ${docCount} docs + ${entries.length} institutions`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
