# Hydro Studio (Hidrocampo)

Herramienta de captura y visualización de datos hidrogeológicos de campo
(pozos, manantiales, calidad de agua, geología), con mapa, visualizador
3D y estadísticas. Proyecto personal, offline-first.

Este repositorio tiene dos partes independientes:

## 📁 `docs/` — la aplicación web (front-end)

Es la app en sí: un solo archivo `index.html` que funciona offline como
PWA. Se publica con **GitHub Pages**:

1. Ve a **Settings → Pages** en este repositorio.
2. En "Source", elige **Deploy from a branch**.
3. Branch: **main**, carpeta: **/docs**.
4. Guarda. En uno o dos minutos tu app estará en
   `https://castillogutierrezleslie-debug.github.io/hydro_studio/`.

Para actualizar la app más adelante, solo reemplaza los archivos dentro
de `docs/` (especialmente `index.html`) y GitHub Pages se actualiza solo.

## 📁 `server/` — el servidor (back-end)

Servidor Node.js + MySQL para sincronizar datos en la nube (pensado
para desplegarse en Hostinger, ver el `README.md` dentro de esa carpeta
para instrucciones detalladas paso a paso).

Si conectas este repositorio a Hostinger (Node.js Web Apps → GitHub),
indica la carpeta **`server`** como raíz de la aplicación al configurar
el despliegue (Hostinger suele preguntar el "directorio raíz" del
proyecto en un repositorio con varias carpetas).

---

⚠️ **Nota de seguridad:** nunca subas un archivo `.env` real a este
repositorio (solo `.env.example`, que no tiene claves de verdad). El
`.env` con tus contraseñas reales se configura directo en el panel de
Hostinger, no aquí.
