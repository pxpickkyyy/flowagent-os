# FlowAgent OS - Avalanche Fuji Local Fork Starter (PowerShell)
$ErrorActionPreference = 'Stop'

$port = 8545
$chainId = 43113
$forkUrl = 'https://api.avax-test.network/ext/bc/C/rpc'

# Locate anvil
$anvilPath = Join-Path $env:USERPROFILE '.foundry\bin\anvil.exe'
if (-not (Test-Path $anvilPath)) {
    $cmd = Get-Command anvil.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        $anvilPath = $cmd.Source
    } else {
        Write-Error "Anvil not found. Run scripts/install_foundry.ps1 first."
    }
}

Write-Host "Found Anvil executable: $anvilPath"

# Check if port 8545 is already running an Anvil fork
$alreadyRunning = $false
try {
    $check = Invoke-RestMethod -Uri "http://127.0.0.1:$port" -Method Post -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' -ContentType 'application/json' -TimeoutSec 2
    if ($check.result -eq '0xa869' -or $check.result -eq '43113') {
        $alreadyRunning = $true
        Write-Host "Anvil fork is already active on http://127.0.0.1:$port (Chain ID: 43113)"
    }
} catch {
    $alreadyRunning = $false
}

if (-not $alreadyRunning) {
    Write-Host "Starting Anvil forking Avalanche Fuji ($forkUrl) on port $port..."
    $proc = Start-Process -FilePath $anvilPath -ArgumentList "--fork-url", $forkUrl, "--chain-id", "$chainId", "--port", "$port", "--silent" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3

    # Wait for RPC
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        try {
            $res = Invoke-RestMethod -Uri "http://127.0.0.1:$port" -Method Post -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType 'application/json' -TimeoutSec 2
            if ($res.result) {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    if (-not $ready) {
        Write-Error "Failed to start Anvil on http://127.0.0.1:$port"
    }
    Write-Host "Anvil successfully spawned in background (PID: $($proc.Id))"
}

# Seed test USDC from dead address to Account #0
Write-Host "Seeding initial Circle USDC balance to Account #0..."
$seedScript = @"
const { ethers } = require('ethers');
(async () => {
  try {
    const p = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    await p.send('anvil_impersonateAccount', ['0x000000000000000000000000000000000000dEaD']);
    await p.send('anvil_setBalance', ['0x000000000000000000000000000000000000dEaD', '0x1000000000000000000']);
    const deadSigner = await p.getSigner('0x000000000000000000000000000000000000dEaD');
    const usdc = new ethers.Contract('0x5425890298aed601595a70ab815c96711a31bc65', ['function transfer(address, uint256) returns (bool)', 'function balanceOf(address) view returns (uint256)'], deadSigner);
    const deadBal = await usdc.balanceOf('0x000000000000000000000000000000000000dEaD');
    if (deadBal >= 10000000n) {
      const tx = await usdc.transfer('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 20000000n);
      await tx.wait(1);
    }
    const balAvax = await p.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    const balUsdc = await usdc.balanceOf('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log('AVAX Balance:', ethers.formatEther(balAvax), 'AVAX');
    console.log('USDC Balance:', ethers.formatUnits(balUsdc, 6), 'USDC');
  } catch (e) {
    console.log('Seeding status:', e.message);
  }
})();
"@

node -e "$seedScript"
Write-Host "Avalanche Fuji Local Fork is ready for FlowAgent OS!"
