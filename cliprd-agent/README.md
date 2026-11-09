# CLIPRD Local Agent

Motor local para procesar videos propios o autorizados desde tu computadora, evitando depender de una IP de datacenter para el procesamiento.

## Requisitos

- Node.js 20+
- FFmpeg instalado y disponible en PATH
- yt-dlp instalado y disponible en PATH

## Windows

Instala FFmpeg y yt-dlp y verifica:

```powershell
ffmpeg -version
yt-dlp --version
```

Luego:

```powershell
cd cliprd-agent
npm start
```

Debe aparecer:

```
CLIPRD Local Agent listo en http://127.0.0.1:3847
```

Prueba:

```
http://127.0.0.1:3847/health
```

## Uso con sesión local

Por defecto usa `YTDLP_BROWSER=chrome`. Puedes cambiarlo:

```powershell
$env:YTDLP_BROWSER="firefox"
npm start
```

El agente no sube tus cookies al servidor. Usa el entorno local del usuario. Solo procesa contenido propio o autorizado.

## Endpoint

POST `/render`

```json
{
  "sourceUrl": "https://...",
  "clips": [
    { "start": 120, "end": 165 }
  ]
}
```
