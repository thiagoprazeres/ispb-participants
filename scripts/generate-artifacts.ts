import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPromotedCanonicalDatasets } from '../src/catalog/loaders.js';
import {
  buildDataPackage,
  buildPackageProjection,
  buildPagesSite,
  writeDerivedDocs,
  writeGeneratedPackageFiles,
  writeSchemaFiles,
} from '../src/catalog/metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type GenerateOptions = {
  site?: boolean;
};

export async function generateArtifactsStage(repoRoot: string, options: GenerateOptions = {}) {
  const { datasets, manifest } = await loadPromotedCanonicalDatasets(repoRoot);

  await writeSchemaFiles(repoRoot);
  await writeDerivedDocs(repoRoot);
  await writeGeneratedPackageFiles(repoRoot, buildPackageProjection(datasets, manifest));
  await writeFileSafe(
    path.join(repoRoot, 'datapackage.json'),
    await buildDataPackage(repoRoot, manifest)
  );

  let siteRoot: string | undefined;
  if (options.site) {
    siteRoot = await buildPagesSite(repoRoot);
  }

  return { manifest, siteRoot };
}

async function writeFileSafe(targetPath: string, content: string) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(targetPath, content, 'utf8');
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const includeSite = process.argv.includes('--site');
  const result = await generateArtifactsStage(repoRoot, { site: includeSite });

  console.log(`Generated artifacts from snapshot ${result.manifest.snapshot_date}.`);
  if (result.siteRoot) {
    console.log(`Site built at ${result.siteRoot}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

