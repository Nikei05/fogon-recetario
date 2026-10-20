/*
 * Genera mobile/www a partir de la versión web de la raíz.
 * La web es la única fuente de verdad: aquí solo se copia y se aplican
 * pequeños overrides para Android (fuente local, enlaces externos, botón atrás).
 */
const fs = require('fs');
const path = require('path');

const mobileDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(mobileDir, '..');
const wwwDir = path.join(mobileDir, 'www');
const overridesDir = path.join(mobileDir, 'overrides');

const isWebAsset = (file) =>
  file === 'index.html' ||
  file === 'recetas.js' ||
  /\.(webp|png)$/i.test(file);

const webFiles = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && isWebAsset(entry.name))
  .map((entry) => entry.name);

if (!webFiles.includes('index.html') || !webFiles.includes('recetas.js')) {
  throw new Error('No se encontraron index.html / recetas.js en la raíz del repo');
}

fs.rmSync(wwwDir, { recursive: true, force: true });
fs.mkdirSync(wwwDir, { recursive: true });

for (const file of webFiles) {
  fs.copyFileSync(path.join(rootDir, file), path.join(wwwDir, file));
}

fs.cpSync(overridesDir, wwwDir, { recursive: true });

const indexPath = path.join(wwwDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html
  .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, '\n')
  .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, '\n')
  .replace(
    /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins[^"]*" rel="stylesheet">\s*/g,
    '\n    <link rel="stylesheet" href="mobile.css">\n'
  )
  .replace('</body>', '    <script src="mobile.js"></script>\n</body>');

if (html.includes('fonts.googleapis.com')) {
  throw new Error('La copia móvil todavía referencia Google Fonts');
}

fs.writeFileSync(indexPath, html);

console.log(`www generado: ${webFiles.length} archivos web + overrides móviles`);
