// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['src/main.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nestjs/*'],
              message: 'Domain/application layers must not import from NestJS.',
            },
            {
              group: ['@prisma/client'],
              message: 'Domain/application layers must not import from Prisma.',
            },
            {
              group: ['bcrypt'],
              message: 'Domain/application layers must not import bcrypt directly.',
            },
            {
              group: ['rxjs', 'rxjs/*'],
              message: 'Domain/application layers must not import RxJS (ADR-0004).',
            },
          ],
        },
      ],
    },
  },
  {
    // PRD §4 avoid-list (ubiquitous-language guard) — see src/__arch__/forbidden-symbols.ts
    // for the test-level scanner and the rationale behind each banned identifier.
    files: ['src/**/*.ts'],
    rules: {
      'id-denylist': [
        'error',
        'CeldaSalida',
        'Composite',
        'NivelFacil',
        'NivelMedio',
        'NivelDificil',
        'PuntuacionPorTiempo',
        'CargadorNiveles',
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Identifier[name=/^Celda.*Decorator.*$/]',
          message: 'No Decorator pattern over Celda (PRD §4 "cell decorators").',
        },
      ],
    },
  },
);
