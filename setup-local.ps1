# Preparacion local de CLIPRD para Windows
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Require-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name no esta instalado o no esta en PATH. $InstallHint"
  }
}

Require-Command "node" "Instala Node.js 22 LTS y vuelve a abrir PowerShell."
Require-Command "npm" "Reinstala Node.js 22 LTS incluyendo npm."
Require-Command "python" "Instala Python 3.10 o superior y marca Add Python to PATH."
Require-Command "ffmpeg" "Instala FFmpeg y agrega la carpeta bin al PATH; luego reinicia PowerShell."
Require-Command "ffprobe" "FFprobe debe venir junto con FFmpeg y estar en PATH."

$PyVersion = python -c "import sys; print('%d.%d' % sys.version_info[:2])"
if ($LASTEXITCODE -ne 0) { throw "No se pudo ejecutar Python." }
$Parts = $PyVersion.Split('.')
if ([int]$Parts[0] -lt 3 -or ([int]$Parts[0] -eq 3 -and [int]$Parts[1] -lt 10)) {
  throw "Se requiere Python 3.10 o superior. Version detectada: $PyVersion"
}

Write-Host "Instalando dependencias Node..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw "Fallo npm install." }

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
  Write-Host "Creando entorno Python aislado (.venv)..." -ForegroundColor Cyan
  python -m venv (Join-Path $Root ".venv")
  if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el entorno virtual Python." }
}

Write-Host "Instalando Whisper y yt-dlp dentro de .venv..." -ForegroundColor Cyan
& $VenvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Fallo la actualizacion de pip." }
& $VenvPython -m pip install -r requirements-live.txt yt-dlp
if ($LASTEXITCODE -ne 0) { throw "Fallo la instalacion de Whisper/yt-dlp." }

$ScriptsPath = Join-Path $Root ".venv\Scripts"
$env:PATH = "$ScriptsPath;$env:PATH"
if (-not (Get-Command "yt-dlp" -ErrorAction SilentlyContinue)) {
  throw "No se encontro yt-dlp dentro de .venv. Revisa la instalacion."
}

New-Item -ItemType Directory -Force -Path (Join-Path $Root "data\clips"),(Join-Path $Root "data\downloads"),(Join-Path $Root "data\thumbs"),(Join-Path $Root "data\live-recordings") | Out-Null
Write-Host ""
Write-Host "CLIPRD esta preparado para ejecutarse LOCALMENTE." -ForegroundColor Green
Write-Host "Entorno Python: $VenvPython"
Write-Host "Inicia el sistema con: .\start-local.ps1"
