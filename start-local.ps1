# Inicia CLIPRD en esta computadora. No usa Render ni servicios externos de hosting.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

foreach ($Command in @("node","npm","python","ffmpeg","ffprobe","yt-dlp")) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "Falta $Command. Ejecuta primero .\setup-local.ps1 y revisa los requisitos."
  }
}

$ScriptsPath = python -c "import sysconfig; print(sysconfig.get_path('scripts'))"
if ($ScriptsPath -and (Test-Path $ScriptsPath)) { $env:PATH = "$ScriptsPath;$env:PATH" }
$env:CLIPRD_DATA_DIR = Join-Path $Root "data"
$env:CLIPRD_PYTHON = (Get-Command python).Source
$env:PORT = "3847"

Write-Host "CLIPRD local iniciando en http://localhost:3847" -ForegroundColor Green
Write-Host "Los archivos se guardaran en: $env:CLIPRD_DATA_DIR"
npm start
