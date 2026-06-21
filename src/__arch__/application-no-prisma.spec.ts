import { join } from 'path';
import {
  extractImportSpecifiers,
  resolveImportTarget,
  scanTypeScriptFiles,
} from './source-scanner';
import { FRAMEWORK_FORBIDDEN_IMPORT_PREFIXES } from './forbidden-symbols';

describe('Architecture guard: application never imports Prisma (PRD §7.7)', () => {
  const applicationDir = join(__dirname, '..', 'application');
  const files = scanTypeScriptFiles(applicationDir);

  it('should_find_application_files_when_scanning_the_application_layer', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('should_import_no_forbidden_framework_when_scanning_every_application_file', () => {
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

  it('should_import_no_infrastructure_symbol_such_as_PrismaService_when_scanning_every_application_file', () => {
    const violations: string[] = [];

    for (const file of files) {
      for (const specifier of extractImportSpecifiers(file.content)) {
        if (!specifier.startsWith('.')) continue;

        const target = resolveImportTarget(file.path, specifier);
        if (target.includes('/src/infrastructure/')) {
          violations.push(
            `${file.relativePath} imports infrastructure "${specifier}"`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
