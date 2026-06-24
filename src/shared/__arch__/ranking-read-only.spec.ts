import { join } from 'path';
import { extractIdentifierTokens, scanTypeScriptFiles } from './source-scanner';

describe('Architecture guard: ranking read-only (PRD §9.5)', () => {
  const srcDir = join(__dirname, '..', '..');
  const files = scanTypeScriptFiles(srcDir).filter(
    (file) =>
      !file.relativePath.startsWith('shared/__arch__/') &&
      (file.relativePath.includes('ranking') ||
        file.relativePath.includes('consulta-ranking') ||
        file.relativePath.includes('leaderboard')),
  );

  it('should_find_ranking_files_when_scanning_the_source_tree', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('should_have_no_publicar_write_method_in_any_ranking_file', () => {
    const violations: string[] = [];

    for (const file of files) {
      const tokens = extractIdentifierTokens(file.content);
      if (tokens.includes('publicar')) {
        violations.push(`${file.relativePath} contains "publicar"`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('should_have_only_obtenerTop_read_interface_in_port_files', () => {
    const portFiles = files.filter(
      (f) =>
        f.relativePath.includes('consulta-ranking.port') ||
        f.relativePath.includes('consulta-ranking-prisma'),
    );

    const writeTokens = ['guardar', 'crear', 'actualizar', 'eliminar'];
    const violations: string[] = [];

    for (const file of portFiles) {
      const tokens = extractIdentifierTokens(file.content);
      const foundWrites = writeTokens.filter((token) => tokens.includes(token));
      if (foundWrites.length > 0) {
        violations.push(
          `${file.relativePath} has write-related identifiers: ${foundWrites.join(', ')}`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
