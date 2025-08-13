#!/bin/bash
set -e

echo "🚀 Setting up SubaGo development environment..."

# Clean up any existing Node.js installations
sudo apt-get remove -y nodejs npm || true
sudo rm -rf /usr/lib/node_modules || true

# Install Node.js 20.19.2 using NodeSource repository
echo "📦 Installing Node.js 20.19.2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs=20.19.2-1nodesource1

# Hold the nodejs package to prevent automatic updates
sudo apt-mark hold nodejs

# Verify Node.js version
node_version=$(node --version)
echo "✅ Node.js installed: $node_version"

# Install pnpm using sudo to avoid permission issues
echo "📦 Installing pnpm..."
sudo npm install -g pnpm@10.12.1

# Verify pnpm version
pnpm_version=$(pnpm --version)
echo "✅ pnpm installed: $pnpm_version"

# Navigate to workspace
cd /mnt/persist/workspace

# Install project dependencies
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# Repair Nx cache to fix any issues
echo "🔧 Repairing Nx cache..."
pnpm nx repair

# Clear any existing coverage directories that might be causing issues
rm -rf coverage/

echo "✅ Setup completed successfully!"