import { themeScript } from './src/theme/theme-script.js';

/**
 * Inyecta el script anti-parpadeo del tema en el <head> de index.html (apps SPA).
 * @returns {import('vite').Plugin}
 */
export function tamilaThemeScript() {
  return {
    name: 'tamila-theme-script',
    transformIndexHtml() {
      return [{ tag: 'script', children: themeScript, injectTo: 'head-prepend' }];
    },
  };
}
