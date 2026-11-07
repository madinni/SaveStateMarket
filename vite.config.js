import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { API_URL } from './src/config.js';

// #33: CSP do front, só no build (em dev o Vite precisa de scripts/estilos inline e do
// websocket do HMR). Reduz o impacto de um XSS sobre o JWT guardado no localStorage.
// Origens realmente usadas pelo front:
// - connect-src: a API (src/config.js), IBGE (municípios), ViaCEP (CEP) e Nominatim (ruas);
// - style-src/font-src: Google Fonts (src/index.css); 'unsafe-inline' porque o
//   react-toastify injeta o próprio <style>;
// - img-src: fotos em https (Unsplash, capas) e data URL dos uploads.
// Se mudar a API_URL ou chamar outra API externa, atualize esta lista.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  `connect-src 'self' ${new URL(API_URL).origin} https://servicodados.ibge.gov.br https://viacep.com.br https://nominatim.openstreetmap.org`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https: data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const cspNoBuild = () => ({
  name: 'savestate-csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
});

export default defineConfig({
  plugins: [react(), cspNoBuild()]
});
