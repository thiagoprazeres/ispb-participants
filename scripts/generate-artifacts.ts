import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPromotedCanonicalDatasets } from '../src/catalog/loaders.js';
import {
  buildDataPackage,
  buildPackageProjection,
  writeDerivedDocs,
  writeGeneratedPackageFiles,
  writeSchemaFiles,
} from '../src/catalog/metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateArtifactsStage(repoRoot: string) {
  const { datasets, manifest } = await loadPromotedCanonicalDatasets(repoRoot);

  await writeSchemaFiles(repoRoot);
  await writeDerivedDocs(repoRoot);
  await writeGeneratedPackageFiles(repoRoot, buildPackageProjection(datasets, manifest));
  await writeFileSafe(
    path.join(repoRoot, 'datapackage.json'),
    await buildDataPackage(repoRoot, manifest)
  );

  return { manifest };
}

async function writeFileSafe(targetPath: string, content: string) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(targetPath, content, 'utf8');
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const result = await generateArtifactsStage(repoRoot);

  console.log(`Generated artifacts from snapshot ${result.manifest.snapshot_date}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

