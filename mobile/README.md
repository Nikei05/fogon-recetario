# Fogón — versión Android (APK)

Proyecto [Capacitor](https://capacitorjs.com/) que empaqueta **la misma web de la raíz** en una app Android. La web original no se modifica: `mobile/` copia sus archivos al compilar y aplica solo ajustes móviles.

## Estructura

| Ruta | Para qué sirve |
| --- | --- |
| `../index.html`, `../recetas.js`, `../*.webp`, `../*.png` | Fuente única de la app (web y APK). |
| `scripts/copy-web.js` | Genera `www/` desde la raíz y aplica los overrides. |
| `overrides/mobile.css` + `overrides/fonts/` | Poppins local, sin Google Fonts (offline). |
| `overrides/mobile.js` | Enlaces externos al navegador y botón atrás de Android. |
| `android/` | Proyecto nativo generado por Capacitor (versionado). |
| `assets/logo.png` | Fuente para iconos y splash. |
| `.github/workflows/android.yml` | Compila el APK en GitHub Actions. |

`www/`, `node_modules/`, el keystore y las carpetas de build están en `.gitignore`.

## Requisitos

- Node 22 o superior.
- Para compilar en tu PC: JDK 21 + Android SDK 36 (o Android Studio).
- Si no tienes Java/SDK instalado, compila en GitHub Actions (recomendado).

## Comandos

```bash
npm ci
npm run build:www          # copia la web a mobile/www
npx cap sync android       # copia www al proyecto nativo
npm run assets             # regenera iconos y splash
cd android && ./gradlew assembleDebug
```

Atajos:

- `npm run apk:debug` → build debug.
- `npm run apk:release` → build release (requiere keystore configurado).
- `npm run sync` → `build:www` + `cap sync android`.

## Generar el APK en GitHub Actions

1. Sube el repositorio a GitHub.
2. Ve a **Actions → Android APK → Run workflow**.
3. Al terminar, descarga el artifact **`fogon-apk`**.

- **Sin secrets**: se genera un APK *debug* firmado con la clave de debug. Es instalable y sirve para probar, pero **no lo distribuyas como producto final**: cada ejecución de CI puede usar una clave distinta y los usuarios no podrán actualizar sin desinstalar. Configura la firma release antes de vender.
- **Con secrets**: se genera un APK *release* firmado con tu keystore.

## Firma de release (recomendado antes de vender)

1. Crea el keystore **una sola vez** y guárdalo en un lugar seguro:

   ```bash
   keytool -genkeypair -v -keystore fogon-release.jks -alias fogon -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Convierte el keystore a base64:

   - Windows (PowerShell):
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("fogon-release.jks")) | Set-Clipboard
     ```
   - Linux / macOS:
     ```bash
     base64 -w0 fogon-release.jks
     ```

3. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, agrega:

   | Secret | Valor |
   | --- | --- |
   | `ANDROID_KEYSTORE_BASE64` | El texto base64 del keystore. |
   | `ANDROID_KEYSTORE_PASSWORD` | La contraseña del keystore. |
   | `ANDROID_KEY_ALIAS` | El alias usado al crearlo (`fogon`). |
   | `ANDROID_KEY_PASSWORD` | La contraseña de la clave. |

4. Ejecuta el workflow de nuevo: ahora compilará `assembleRelease` y publicará el APK firmado.

> ⚠️ Guarda el `.jks` y sus contraseñas. Sin ellos no podrás publicar actualizaciones con la misma firma.

## Actualizar la app

1. Edita la web en la raíz (`index.html`, `recetas.js`, imágenes).
2. Sube `versionCode` en `android/app/build.gradle` para cada entrega (1, 2, 3…).
3. Haz push (el workflow se dispara solo) o ejecuta `npm run apk:release`.
4. En Hotmart, reemplaza el APK del producto.

El enlace de compra sigue abriendo el navegador del sistema (`window.open(url, '_system')`), no dentro de la app.

## Comportamiento móvil

- Funciona **100% offline** (fuente Poppins incluida, sin llamadas a Google Fonts).
- Los enlaces externos (Hotmart) se abren en el navegador del sistema.
- Botón atrás: cierra modales, retrocede dentro de la app y sale desde el inicio.
- Mismo PIN de acceso que la web (**4821**) y las 9 recetas desbloqueadas.

## Notas

- `android/` se versiona para que el build sea reproducible. Si se borra:
  ```bash
  npx cap add android
  npm run assets
  npx cap sync android
  ```
- La distribución es por **Hotmart**, no por Google Play: no hay dependencia de Google Play Billing.
- El `appId` es `com.fogon.recetario`. No lo cambies entre versiones.
