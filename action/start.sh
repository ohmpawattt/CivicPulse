#!/bin/bash

# SecretBallotBox 快速启动脚本
echo "🗳️  Starting SecretBallotBox - Privacy-Preserving Voting Platform"
echo "================================================================="

# 检查依赖
echo "📦 Checking dependencies..."

# 检查合约依赖
cd contracts
if [ ! -d "node_modules" ]; then
    echo "Installing contract dependencies..."
    npm install --legacy-peer-deps
fi

# 检查前端依赖
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

echo ""
echo "🚀 Starting services..."
echo ""

# 启动Hardhat节点
echo "1️⃣  Starting FHEVM Hardhat node..."
cd ../contracts
npx hardhat node > /tmp/secretballotbox-node.log 2>&1 &
NODE_PID=$!
echo "   Node PID: $NODE_PID"
echo "   Log file: /tmp/secretballotbox-node.log"

# 等待节点启动
echo "   Waiting for node to start..."
sleep 5

# 部署合约
echo ""
echo "2️⃣  Deploying SecretBallotBox contract..."
npx hardhat --network localhost deploy

if [ $? -eq 0 ]; then
    echo "   ✅ Contract deployed successfully!"
    
    # 生成ABI文件
    echo ""
    echo "3️⃣  Generating ABI files..."
    cd ../frontend
    npm run genabi
    
    if [ $? -eq 0 ]; then
        echo "   ✅ ABI files generated successfully!"
        
        # 启动前端
        echo ""
        echo "4️⃣  Starting frontend application..."
        echo "   Frontend will be available at: http://localhost:3000"
        echo ""
        echo "🎯 Setup Instructions:"
        echo "   1. Open MetaMask"
        echo "   2. Add network: http://localhost:8545 (Chain ID: 31337)"
        echo "   3. Import account with private key:"
        echo "      0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        echo "   4. Visit http://localhost:3000"
        echo ""
        echo "🛑 To stop all services:"
        echo "   kill $NODE_PID"
        echo "   (or run: pkill -f 'hardhat node')"
        echo ""
        
        npm run dev
    else
        echo "   ❌ Failed to generate ABI files"
        kill $NODE_PID
        exit 1
    fi
else
    echo "   ❌ Failed to deploy contract"
    kill $NODE_PID
    exit 1
fi


