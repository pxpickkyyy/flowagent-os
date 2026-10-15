$ErrorActionPreference = 'Stop'

$foundryDir = Join-Path $env:USERPROFILE '.foundry\bin'
if (-not (Test-Path $foundryDir)) {
    New-Item -ItemType Directory -Path $foundryDir -Force | Out-Null
}

$zipPath = Join-Path $env:TEMP 'foundry.zip'
$downloadUrl = 'https://github.com/foundry-rs/foundry/releases/download/v1.8.5/foundry_v1.8.5_win32_amd64.zip'

Write-Host "Downloading Foundry via curl from $downloadUrl..."
curl.exe -L --fail --show-error -o $zipPath $downloadUrl

Write-Host "Extracting binaries to $foundryDir..."
tar.exe -xf $zipPath -C $foundryDir

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$userPath = [Environment]::GetEnvironmentVariable('Path', [EnvironmentVariableTarget]::User)
if ($userPath -notlike "*$foundryDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$userPath;$foundryDir", [EnvironmentVariableTarget]::User)
    Write-Host "Added $foundryDir to User PATH."
}

Write-Host "Foundry installation complete. Installed executables:"
Get-ChildItem $foundryDir
