# Inicia CLIPRD en esta computadora. No usa Render ni servicios externos de hosting.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

foreach ($Command in @("node","npm","ffmpeg","ffprobe")) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "Falta $Command en PATH. Revisa los requisitos y ejecuta .\setup-local.ps1."
  }
}

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
$VenvScripts = Join-Path $Root ".venv\Scripts"
if (-not (Test-Path $VenvPython)) {
  throw "No existe .venv. Ejecuta primero .\setup-local.ps1."
}
$env:PATH = "$VenvScripts;$env:PATH"
if (-not (Get-Command "yt-dlp" -ErrorAction SilentlyContinue)) {
  throw "No se encontro yt-dlp en .venv. Ejecuta .\setup-local.ps1 nuevamente."
}

$env:CLIPRD_DATA_DIR = Join-Path $Root "data"
$env:CLIPRD_PYTHON = $VenvPython
$env:PORT = "3847"

Write-Host "CLIPRD local iniciando en http://localhost:3847" -ForegroundColor Green
Write-Host "Python LIVE: $VenvPython"
Write-Host "Los archivos se guardaran en: $env:CLIPRD_DATA_DIR"
npm start
