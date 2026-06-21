import { join } from 'path';
import { extractIdentifierTokens, scanTypeScriptFiles } from './source-scanner';
import {
  AVOID_LIST_EXACT_IDENTIFIERS,
  isCellDecoratorIdentifier,
} from './forbidden-symbols';

describe('Architecture guard: ubiquitous-language avoid-list (PRD §4 / §9)', () => {
  const srcDir = join(__dirname, '..', '..');

  // forbidden-symbols.ts documents the avoid-list as string literals; exclude this
  // guard's own directory so it doesn't flag its own documentation.
  const files = scanTypeScriptFiles(srcDir).filter(
    (file) => !file.relativePath.startsWith('shared/__arch__/'),
  );

  it('should_find_source_files_when_scanning_src', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('should_use_no_avoid_list_identifier_when_scanning_every_source_file', () => {
    const violations: string[] = [];

    for (const file of files) {
      for (const token of extractIdentifierTokens(file.content)) {
        const isBanned =
          AVOID_LIST_EXACT_IDENTIFIERS.includes(token) ||
          isCellDecoratorIdentifier(token);

        if (isBanned) {
          violations.push(`${file.relativePath} uses "${token}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
