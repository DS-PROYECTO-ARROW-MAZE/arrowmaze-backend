import { join } from 'path';
import {
  extractImportSpecifiers,
  resolveImportTarget,
  scanTypeScriptFiles,
} from './source-scanner';
import { FRAMEWORK_FORBIDDEN_IMPORT_PREFIXES } from './forbidden-symbols';

describe('Architecture guard: domain purity (ADR-0004)', () => {
  const domainDir = join(__dirname, '..', '..', 'domain');
  const files = scanTypeScriptFiles(domainDir);

  it('should_find_domain_files_when_scanning_the_domain_layer', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('should_import_no_forbidden_framework_when_scanning_every_domain_file', () => {
    const violations: string[] = [];

    for (const file of files) {
      for (const specifier of extractImportSpecifiers(file.content)) {
        const isForbidden = FRAMEWORK_FORBIDDEN_IMPORT_PREFIXES.some((prefix) =>
          specifier.startsWith(prefix),
        );
        if (isForbidden) {
          violations.push(`${file.relativePath} imports "${specifier}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('should_import_no_outer_layer_when_scanning_every_domain_file', () => {
    const violations: string[] = [];

    for (const file of files) {
      for (const specifier of extractImportSpecifiers(file.content)) {
        if (!specifier.startsWith('.')) continue;

        const target = resolveImportTarget(file.path, specifier);
        if (
          target.includes('/src/application/') ||
          target.includes('/src/infrastructure/')
        ) {
          violations.push(
            `${file.relativePath} imports outer layer "${specifier}"`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
