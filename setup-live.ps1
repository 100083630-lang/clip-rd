$ErrorActionPreference = "Stop"
Write-Host "Preparando el motor de transcripción LIVE de CLIPRD..." -ForegroundColor Cyan
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  throw "Python 3.10+ no está instalado o no está en PATH. Instálalo y vuelve a ejecutar este archivo."
}
python -m pip install --upgrade pip
python -m pip install -r requirements-live.txt
Write-Host "Dependencias LIVE instaladas. FFmpeg y yt-dlp también deben estar disponibles en PATH." -ForegroundColor Green
