# CLIPRD

Plataforma de control para la agencia Origen Simple. Convierte visualizaciones en dinero: clips de TikTok y YouTube, tarifas por cada mil vistas y un libro de pagos.

## Stack
- Frontend: HTML + JS (index.html) + módulos (editor.js, dashboard-pro.js)
- Motor local: server.js (Express + ffmpeg + yt-dlp) en http://127.0.0.1:3847
- Base de datos: Postgres (Neon)

## Módulo Editor (nuevo)
Se abre al hacer click en un clip de la Biblioteca.
- Preview 9:16 (1080x1920)
- Marcar inicio/fin, presets de duración
- Filtros visuales
- Crop X
- Exportar (usa el endpoint /export del motor local y guarda en la carpeta clips/)

## Cómo correr el motor local
```bash
npm install
node server.js
```

## Despliegue en Vercel
1. Conecta el repositorio en Vercel
2. Cada push a main se despliega automáticamente
3. El frontend es estático; el motor local corre en tu PC

## Notas
- No se modificó ninguna función existente del Dashboard, Biblioteca, Auto Clip, Live Radar, etc.
- El Editor se inyecta de forma segura vía editor.js
