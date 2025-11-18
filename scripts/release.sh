#!/bin/bash

# Release script for Noto
# Creates a new release with git tags

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════╗"
echo "║       Noto Release Script              ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if version argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Version number required${NC}"
  echo "Usage: npm run release <version>"
  echo "Example: npm run release 1.0.0"
  exit 1
fi

VERSION=$1

# Validate version format (basic semver check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format${NC}"
  echo "Version must be in format: MAJOR.MINOR.PATCH (e.g., 1.0.0)"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Error: Uncommitted changes detected${NC}"
  echo "Please commit or stash your changes before releasing"
  exit 1
fi

# Confirm release
echo -e "${YELLOW}Creating release v$VERSION${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Release cancelled"
  exit 1
fi

# Update version in package.json
echo -e "${BLUE}→ Updating package.json...${NC}"
npm version $VERSION --no-git-tag-version

# Update version in package-lock.json
npm install --package-lock-only

# Create CHANGELOG entry (if CHANGELOG.md exists)
if [ -f "CHANGELOG.md" ]; then
  echo -e "${BLUE}→ Updating CHANGELOG.md...${NC}"
  TODAY=$(date +%Y-%m-%d)

  # Check if this version already exists in CHANGELOG
  if grep -q "## \[$VERSION\]" CHANGELOG.md; then
    echo "  ℹ️  Version $VERSION already in CHANGELOG.md"
  else
    # Create temp file with new entry
    echo -e "\n## [$VERSION] - $TODAY\n\n### Added\n- TODO: Add release notes\n" > /tmp/changelog-new.md
    cat CHANGELOG.md >> /tmp/changelog-new.md
    mv /tmp/changelog-new.md CHANGELOG.md
    echo "  ✓ Added version $VERSION to CHANGELOG.md"
    echo -e "${YELLOW}  ⚠️  Don't forget to update the CHANGELOG.md with release notes!${NC}"
  fi
fi

# Commit changes
echo -e "${BLUE}→ Committing version bump...${NC}"
git add package.json package-lock.json
[ -f "CHANGELOG.md" ] && git add CHANGELOG.md
git commit -m "chore: bump version to v$VERSION"

# Create git tag
echo -e "${BLUE}→ Creating git tag v$VERSION...${NC}"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo ""
echo -e "${GREEN}✓ Release v$VERSION prepared!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update CHANGELOG.md (if needed)"
echo "  2. Push changes and tags:"
echo "     git push origin main"
echo "     git push origin v$VERSION"
echo ""
echo "GitHub Actions will automatically:"
echo "  - Build for all platforms"
echo "  - Create GitHub release"
echo "  - Upload installers"
echo ""
