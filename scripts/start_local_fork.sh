#!/usr/bin/env bash
# FlowAgent OS - Avalanche Fuji Local Fork Starter (Bash)
set -e

PORT=8545
CHAIN_ID=43113
FORK_URL="https://api.avax-test.network/ext/bc/C/rpc"

# Ensure anvil is installed
if ! command -v anvil &> /dev/null; then
    if [ -f "$HOME/.foundry/bin/anvil" ]; then
        export PATH="$HOME/.foundry/bin:$PATH"
    else
        echo "Installing Foundry..."
        curl -L https://foundry.paradigm.xyz | bash
        export PATH="$HOME/.foundry/bin:$PATH"
        foundryup
    fi
fi

echo "Launching Anvil forking Avalanche Fuji on port $PORT..."
anvil --fork-url "$FORK_URL" --chain-id "$CHAIN_ID" --port "$PORT" --silent &
ANVIL_PID=$!

echo "Waiting for Anvil RPC to respond on port $PORT..."
for i in {1..15}; do
    if curl -s -X POST http://127.0.0.1:$PORT -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q "result"; then
        echo "Anvil local fork running on http://127.0.0.1:$PORT (PID: $ANVIL_PID)"
        break
    fi
    sleep 1
done

echo "Seeding test USDC to Account #0..."
node -e "
const { ethers } = require('ethers');
(async () => {
  const p = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  await p.send('anvil_impersonateAccount', ['0x000000000000000000000000000000000000dEaD']);
  await p.send('anvil_setBalance', ['0x000000000000000000000000000000000000dEaD', '0x1000000000000000000']);
  const s = await p.getSigner('0x000000000000000000000000000000000000dEaD');
  const u = new ethers.Contract('0x5425890298aed601595a70ab815c96711a31bc65', ['function transfer(address, uint256) returns (bool)'], s);
  await (await u.transfer('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 20000000n)).wait(1);
  console.log('Seeded 20 USDC to Account #0');
})();
"

echo "Avalanche Fuji Local Fork Ready!"
