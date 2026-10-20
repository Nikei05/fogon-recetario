/*
 * Configura la firma de release para el APK.
 * Se ejecuta en CI (GitHub Actions) cuando existen los secrets.
 * Sin keystore, no hace nada: el workflow compila un APK debug.
 */
const fs = require('fs');
const path = require('path');

const base64 = process.env.ANDROID_KEYSTORE_BASE64;
if (!base64) {
  console.log('Sin ANDROID_KEYSTORE_BASE64: se omitirá la firma de release.');
  process.exit(0);
}

const required = {
  ANDROID_KEYSTORE_PASSWORD: process.env.ANDROID_KEYSTORE_PASSWORD,
  ANDROID_KEY_ALIAS: process.env.ANDROID_KEY_ALIAS,
  ANDROID_KEY_PASSWORD: process.env.ANDROID_KEY_PASSWORD,
};

for (const [name, value] of Object.entries(required)) {
  if (!value) {
    console.error(`Falta el secret ${name}.`);
    process.exit(1);
  }
}

const androidDir = path.resolve(__dirname, '..', 'android');
const keystorePath = path.join(androidDir, 'app', 'fogon-release.jks');
const propertiesPath = path.join(androidDir, 'keystore.properties');

fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
fs.writeFileSync(keystorePath, Buffer.from(base64, 'base64'));

fs.writeFileSync(
  propertiesPath,
  [
    'storeFile=fogon-release.jks',
    `storePassword=${required.ANDROID_KEYSTORE_PASSWORD}`,
    `keyAlias=${required.ANDROID_KEY_ALIAS}`,
    `keyPassword=${required.ANDROID_KEY_PASSWORD}`,
    '',
  ].join('\n')
);

console.log('Keystore y keystore.properties configurados para release.');
