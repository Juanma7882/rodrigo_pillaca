import path from 'node:path';

/**
 * Un feature solo puede importar la API pública (index) de otro feature.
 * La capa de rutas (fuera de features/) además puede importar `<feature>/pages/*`.
 * Opciones: { root: 'src', aliases: { '@/': 'src/' } } relativas al cwd del paquete.
 */
const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Impide importar archivos internos de otro feature' },
    schema: [
      {
        type: 'object',
        properties: {
          root: { type: 'string' },
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      internal:
        'El feature "{{from}}" no puede importar internals de "{{to}}". Importá desde su index.',
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const cwd = context.cwd;
    const featuresDir = path.resolve(cwd, options.root ?? 'src', 'features');
    const aliases = options.aliases ?? { '@/': 'src/' };

    const featureOf = (absPath) => {
      const rel = path.relative(featuresDir, absPath);
      if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
      const [name, ...rest] = rel.split(path.sep);
      return { name, rest };
    };

    const resolveTarget = (source, filename) => {
      if (source.startsWith('.')) return path.resolve(path.dirname(filename), source);
      for (const [prefix, target] of Object.entries(aliases)) {
        if (source.startsWith(prefix))
          return path.resolve(cwd, target, source.slice(prefix.length));
      }
      return null;
    };

    const check = (node) => {
      const source = node.source?.value;
      if (typeof source !== 'string') return;
      const target = resolveTarget(source, context.filename);
      if (!target) return;
      const to = featureOf(target);
      if (!to || to.rest.length === 0) return;
      const isIndex = to.rest.length === 1 && /^index(\.[jt]sx?)?$/.test(to.rest[0]);
      if (isIndex) return;
      const from = featureOf(context.filename);
      if (from?.name === to.name) return;
      // La capa de rutas (fuera de features/) puede cargar páginas de un feature de forma diferida.
      if (!from && to.rest[0] === 'pages') return;
      context.report({
        node: node.source,
        messageId: 'internal',
        data: { from: from?.name ?? 'app', to: to.name },
      });
    };

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: (node) => check({ source: node.source }),
    };
  },
};

export default { rules: { 'feature-boundaries': rule } };
