import { describe, it } from 'node:test';
import path from 'node:path';
import { RuleTester } from 'eslint';
import plugin from '../eslint/feature-boundaries.js';

RuleTester.describe = describe;
RuleTester.it = it;

const cwd = process.cwd();
const file = (rel) => path.join(cwd, rel);
const tester = new RuleTester({ languageOptions: { ecmaVersion: 2023, sourceType: 'module' } });

tester.run('feature-boundaries', plugin.rules['feature-boundaries'], {
  valid: [
    {
      filename: file('src/features/auth/pages/Login.tsx'),
      code: "import { x } from '../components/Form';",
    },
    {
      filename: file('src/features/auth/pages/Login.tsx'),
      code: "import { theme } from '@/features/theme';",
    },
    {
      filename: file('src/features/auth/pages/Login.tsx'),
      code: "import { theme } from '@/features/theme/index';",
    },
    { filename: file('src/app/router.tsx'), code: "import { Login } from '@/features/auth';" },
    { filename: file('src/app/router.tsx'), code: "const m = import('@/features/auth');" },
    {
      filename: file('src/app/router.tsx'),
      code: "const m = import('@/features/auth/pages/LoginPage');",
    },
    { filename: file('src/features/auth/api/client.ts'), code: "import { z } from 'zod';" },
    {
      filename: file('app/features/hero/Hero.tsx'),
      code: "import { W } from '~/features/whatsapp';",
      options: [{ root: 'app', aliases: { '~/': 'app/' } }],
    },
  ],
  invalid: [
    {
      filename: file('src/features/auth/pages/Login.tsx'),
      code: "import { Toggle } from '@/features/theme/components/Toggle';",
      errors: [{ messageId: 'internal' }],
    },
    {
      filename: file('src/features/auth/pages/Login.tsx'),
      code: "import { Toggle } from '../../theme/components/Toggle';",
      errors: [{ messageId: 'internal' }],
    },
    {
      filename: file('src/app/router.tsx'),
      code: "const m = import('@/features/auth/api/client');",
      errors: [{ messageId: 'internal' }],
    },
    {
      filename: file('src/features/home/Home.tsx'),
      code: "import { LoginPage } from '@/features/auth/pages/LoginPage';",
      errors: [{ messageId: 'internal' }],
    },
    {
      filename: file('app/features/hero/Hero.tsx'),
      code: "import { build } from '~/features/whatsapp/lib/url';",
      options: [{ root: 'app', aliases: { '~/': 'app/' } }],
      errors: [{ messageId: 'internal' }],
    },
  ],
});
