#!/bin/bash
set -e

# Script to verify the monorepo setup is working correctly

echo "🔍 Verifying @open-game-system/app-bridge setup..."

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Step 1: Check that pnpm is installed
echo "📦 Checking if pnpm is installed..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it with 'npm install -g pnpm'"
    exit 1
else
    echo "✅ pnpm is installed"
    pnpm --version
fi

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Step 3: Lint the codebase
echo "🧹 Linting codebase..."
pnpm lint || { echo "❌ Linting failed"; exit 1; }
echo "✅ Linting passed"

# Step 4: Build all packages
echo "🏗️ Building all packages..."
pnpm build || { echo "❌ Build failed"; exit 1; }
echo "✅ All packages built successfully"

# Step 5: Run tests
echo "🧪 Running tests..."
pnpm test || { echo "❌ Tests failed"; exit 1; }
echo "✅ All tests passed"

# Step 6: Build example React app
echo "🏗️ Building React example app..."
cd examples/react-app
pnpm install
pnpm build || { echo "❌ React example app build failed"; exit 1; }
cd ../..
echo "✅ React example app built successfully"

echo "🎉 Success! The @open-game-system/app-bridge monorepo is set up correctly."
echo "Now you can start developing with the following commands:"
echo "  - 'pnpm dev' - Start development mode for all packages"
echo "  - 'cd examples/react-app && pnpm dev' - Run the React example app"
echo "  - 'pnpm test' - Run tests"
echo "  - 'pnpm lint' - Lint the codebase"
echo "  - 'pnpm build' - Build all packages" 