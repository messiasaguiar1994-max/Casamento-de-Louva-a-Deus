// Carrega um .glb embutido na página (data: URI) sem usar fetch:
// decodifica o base64 e entrega direto ao GLTFLoader. As texturas
// saem como <img> com blob: (funciona em páginas com regras de
// segurança rígidas, como a prévia hospedada).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadGLB(url, loader = new GLTFLoader()) {
  if (!url.startsWith('data:')) return loader.loadAsync(url);
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const cib = window.createImageBitmap;
  try { window.createImageBitmap = undefined; } catch (e) { /* ignora */ }
  const p = loader.parseAsync(buf.buffer, '');
  try { window.createImageBitmap = cib; } catch (e) { /* ignora */ }
  return p;
}
