// JS plano: lo importan tanto el paquete (TS) como el plugin de Vite, que corre en Node sin bundler.

export const THEME_STORAGE_KEY = 'tamila-theme';

/**
 * Script inline para el <head>: aplica la clase `dark` antes del primer render
 * (preferencia guardada o, si no hay, la del sistema) para evitar el parpadeo.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`;
