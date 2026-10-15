# FlowAgent OS - Stop Anvil Local Fork
$ErrorActionPreference = 'SilentlyContinue'

$conn = Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Write-Host "Stopping process PID $p on port 8545..."
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Anvil fork stopped."
} else {
    Write-Host "No process listening on port 8545."
}
