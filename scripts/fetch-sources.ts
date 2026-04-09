import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchCatalogSources } from '../src/catalog/loaders.js';
import { PipelineStageError } from '../src/catalog/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchSourcesStage(repoRoot: string) {
  try {
    return await fetchCatalogSources(repoRoot);
  } catch (error) {
    throw new PipelineStageError(
      'fetch',
      error instanceof Error ? error.message : String(error),
      'catalog'
    );
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const fetched = await fetchSourcesStage(repoRoot);

  console.log(`Collected at: ${fetched.collectedAt}`);
  for (const [dataset, source] of Object.entries(fetched.sources)) {
    console.log(`${dataset}: ${source.csvUrl}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    const message =
      error instanceof PipelineStageError
        ? `[${error.stage}] ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(message);
    process.exit(1);
  });
}

