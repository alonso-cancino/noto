#!/bin/bash

# Build script for Noto
# Builds the application for the current platform

set -e

echo "╔════════════════════════════════════════╗"
echo "║        Noto Build Script               ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${RED}✗ node_modules not found${NC}"
  echo "  Running npm install..."
  npm install
fi

# Clean previous builds
echo -e "${BLUE}→ Cleaning previous builds...${NC}"
npm run clean

# Generate icons (if possible)
echo -e "${BLUE}→ Generating icons...${NC}"
npm run generate-icons || echo "  ⚠️  Icon generation skipped"

# Run linter
echo -e "${BLUE}→ Running linter...${NC}"
npm run lint || {
  echo -e "${RED}✗ Linting failed${NC}"
  exit 1
}

# Run tests
echo -e "${BLUE}→ Running tests...${NC}"
npm test || {
  echo -e "${RED}✗ Tests failed${NC}"
  exit 1
}

# Build renderer
echo -e "${BLUE}→ Building renderer (React)...${NC}"
npm run build:renderer || {
  echo -e "${RED}✗ Renderer build failed${NC}"
  exit 1
}

# Build main
echo -e "${BLUE}→ Building main (Electron)...${NC}"
npm run build:main || {
  echo -e "${RED}✗ Main build failed${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""
echo "To package the application:"
echo "  npm run package    (unpackaged directory)"
echo "  npm run make       (installers)"
echo ""
