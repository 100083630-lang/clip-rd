# CLIPRD 5.0

Aplicacion local para Windows. El motor LIVE se ejecuta en la computadora del usuario; no requiere Render ni un servicio de hosting.

## Requisitos locales

- Windows 10/11
- Node.js 22 LTS (incluye npm)
- Python 3.10 o superior
- FFmpeg y FFprobe disponibles en PATH
- Conexion a Internet para acceder a YouTube
- yt-dlp (el instalador local intenta instalarlo con pip)

## Preparar por primera vez (Windows PowerShell)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-local.ps1
```

Si el instalador indica que falta Node.js, Python o FFmpeg, instala ese requisito, cierra y vuelve a abrir PowerShell y ejecuta el instalador otra vez.

## Iniciar CLIPRD localmente

```powershell
.\start-local.ps1
```

Abre http://localhost:3847

Para iniciar manualmente en otros sistemas:
```bash
npm install
npm start
``

Asegura que `python`, `ffmpeg`, `ffprobe` y `yt-dlp` esten en PATH y que las dependencias de `requirements-live.txt` esten instaladas.

## Datos y privacidad local

El lanzador configura `CLIPRD_DATA_DIR` en la carpeta `data` del proyecto. Descargas, clips, miniaturas y grabaciones LIVE se guardan en esa computadora. Mantén suficiente espacio libre en el disco; los directos consumen almacenamiento mientras se capturan.

Si YouTube requiere autenticacion para un directo, configura las cookies localmente en la ubicacion que utiliza yt-dlp; no compartas ese archivo ni lo subas al repositorio.

## Componentes

- Auto Clip
- Biblioteca local
- Monitor de trabajos
- Live Monitor
- Motor LIVE con captura segmentada, transcripcion y deteccion contextual
- API health en /health

## Verificacion

`npm run build` comprueba sintaxis de Node. GitHub Actions construye la imagen local Docker y hace una prueba de arranque del contenedor y sus rutas HTTP. Esa prueba automatica no sustituye una prueba con un YouTube LIVE real en la computadora del usuario.
