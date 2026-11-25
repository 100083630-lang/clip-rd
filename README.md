# CLIPRD 5.0

Aplicacion local para Windows. El motor LIVE se ejecuta en la computadora del usuario; no requiere Render ni un servicio de hosting.

## Requisitos locales

- Windows 10/11
- Node.js 22 LTS (incluye npm)
- Python 3.10 o superior
- FFmpeg y FFprobe disponibles en PATH
- Conexion a Internet para acceder a YouTube

El instalador crea un entorno Python aislado en `.venv` e instala ahi faster-whisper y yt-dlp. No necesita instalar esos paquetes en el Python global.

## Preparar por primera vez (Windows PowerShell)

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup-local.ps1
```

Si falta Node.js, Python o FFmpeg, instala ese requisito, cierra y vuelve a abrir PowerShell y ejecuta el instalador otra vez.

## Iniciar CLIPRD localmente

```powershell
.\start-local.ps1
```

Abre http://localhost:3847

Para iniciar manualmente:
```bash
npm install
npm start
```

Asegura que `python`, `ffmpeg` y `ffprobe` esten en PATH y que las dependencias de `requirements-live.txt` esten instaladas en el entorno Python que uses. El lanzador de Windows configura automaticamente `.venv`.

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

GitHub Actions valida sintaxis de Node y Python, construye la imagen Docker y hace pruebas de arranque y rutas HTTP. Esa prueba automatica no sustituye una prueba con un YouTube LIVE real en la computadora del usuario.
