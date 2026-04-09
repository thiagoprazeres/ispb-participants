import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCatalogDirectory, validateRepositoryState } from '../src/catalog/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function validateCatalogStage(repoRoot: string) {
  return validateRepositoryState(repoRoot);
}

export async function validateStagedCatalogStage(currentDir: string) {
  return validateCatalogDirectory(currentDir);
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const validation = await validateCatalogStage(repoRoot);

  if (validation.warnings.length > 0) {
    console.log(`Warnings: ${validation.warnings.length}`);
    for (const warning of validation.warnings) {
      console.log(`- [${warning.dataset}] ${warning.message}`);
    }
  }

  console.log(`Checks passed: ${validation.checks.length}`);
  for (const check of validation.checks) {
    console.log(`- ${check}`);
  }

  if (!validation.ok) {
    throw new Error(
      validation.errors
        .map(error => `[${error.stage ?? 'unknown'}][${error.dataset}] ${error.message}`)
        .join(' | ')
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

