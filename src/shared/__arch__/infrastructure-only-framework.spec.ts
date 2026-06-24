import { join } from 'path';
import { extractImportSpecifiers, scanTypeScriptFiles } from './source-scanner';

/**
 * Architecture guard (ADR-0004): NestJS / HTTP framework coupling must live only in the
 * outer ring. Domain and application are framework-free, and even within `src/` the only
 * places allowed to import `@nestjs/*` outside `infrastructure/` are the bootstrap
 * composition root (`main.ts`) and the root module wiring (`app.module.ts`).
 *
 * This closes the gap the inward-purity guards leave open: a stray `@Controller()` /
 * `@Injectable()` parked at `src/` root (e.g. the deleted `app.controller.ts`) would slip
 * past `domain-purity` and `application-no-prisma`, which only scan their own layers.
 */
describe('Architecture guard: framework confined to infrastructure (ADR-0004)', () => {
  const srcDir = join(__dirname, '..', '..');

  // The composition root is permitted to reference the framework directly.
  const BOOTSTRAP_ALLOW_LIST = ['main.ts', 'app.module.ts'];

  const files = scanTypeScriptFiles(srcDir).filter(
    (file) =>
      !file.relativePath.startsWith('infrastructure/') &&
      !file.relativePath.startsWith('shared/__arch__/') &&
      !BOOTSTRAP_ALLOW_LIST.includes(file.relativePath),
  );

  it('should_find_non_infrastructure_files_when_scanning_src', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('should_import_no_nestjs_framework_outside_infrastructure_and_the_bootstrap_root', () => {
    const violations: string[] = [];

    for (const file of files) {
      for (const specifier of extractImportSpecifiers(file.content)) {
        if (specifier.startsWith('@nestjs/')) {
          violations.push(`${file.relativePath} imports "${specifier}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
