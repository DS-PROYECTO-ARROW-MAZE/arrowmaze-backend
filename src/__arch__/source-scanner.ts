import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';

export interface ScannedFile {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}

export function scanTypeScriptFiles(rootDir: string): ScannedFile[] {
  const absoluteRoot = resolve(rootDir);
  const files: ScannedFile[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);

      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.endsWith('.ts')) continue;

      files.push({
        path: fullPath,
        relativePath: toPosixPath(relative(absoluteRoot, fullPath)),
        content: readFileSync(fullPath, 'utf-8'),
      });
    }
  };

  walk(absoluteRoot);
  return files;
}

const IMPORT_SPECIFIER_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /^\s*import\s+['"]([^'"]+)['"]/gm,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
] as const;

export function extractImportSpecifiers(content: string): string[] {
  const specifiers = new Set<string>();

  for (const pattern of IMPORT_SPECIFIER_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

export function resolveImportTarget(
  fromFile: string,
  specifier: string,
): string {
  return toPosixPath(resolve(dirname(fromFile), specifier));
}

const IDENTIFIER_PATTERN = /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g;

export function extractIdentifierTokens(content: string): string[] {
  return [...new Set(content.match(IDENTIFIER_PATTERN) ?? [])];
}
