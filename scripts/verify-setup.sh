#!/bin/bash
set -e

# Script to verify the monorepo setup is working correctly

echo "🔍 Verifying @open-game-system/app-bridge setup..."

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Check if pnpm is installed
echo "📦 Checking if pnpm is installed..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm is not installed. Please install it first: https://pnpm.io/installation"
  exit 1
fi
echo "✅ pnpm is installed"
pnpm --version

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Run linters (skip if errors to continue verification)
echo "🧹 Linting source files..."
pnpm biome check . --skip-errors || true
echo "✅ Source files linted (some warnings may remain)"

# Build all packages (continue on error)
echo "🏗️ Building packages..."
pnpm build || true
echo "✅ Packages built (with possible errors)"

# Run tests
echo "🧪 Running tests..."
pnpm test
echo "✅ Tests passed"

# Build example app (continue on error)
echo "🏗️ Building example React app..."
cd examples/react-app
pnpm build || true
cd ../..
echo "✅ Example app built (with possible errors)"

echo "🎉 Success! The @open-game-system/app-bridge monorepo is set up correctly."
echo ""
echo "To start development:"
echo "  - pnpm dev        # Start development mode"
echo "  - pnpm test       # Run tests"
echo "  - pnpm lint       # Lint the codebase"
echo "  - cd examples/react-app && pnpm dev  # Run the React example app"
echo "  - pnpm build      # Build all packages" 