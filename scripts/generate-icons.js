#!/usr/bin/env node

/**
 * Icon Generation Script for Noto
 *
 * Generates platform-specific icons from the base SVG icon.
 *
 * Requirements:
 * - Install imagemagick: brew install imagemagick (macOS) or apt install imagemagick (Linux)
 * - Install librsvg: brew install librsvg (macOS) or apt install librsvg2-bin (Linux)
 * - Install icnsutils: brew install libicns (macOS) or apt install icnsutils (Linux)
 * - Install icoutils: brew install icoutils (macOS) or apt install icoutils (Linux)
 *
 * Usage:
 *   npm run generate-icons
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const ICONS_DIR = path.join(RESOURCES_DIR, 'icons');
const SOURCE_SVG = path.join(RESOURCES_DIR, 'icon.svg');

// Icon sizes needed for different platforms
const ICON_SIZES = {
  macOS: [16, 32, 64, 128, 256, 512, 1024], // For .icns
  windows: [16, 24, 32, 48, 64, 128, 256], // For .ico
  linux: [16, 32, 48, 64, 128, 256, 512, 1024], // For .png
};

function exec(command, description) {
  try {
    console.log(`  ${description}...`);
    execSync(command, { stdio: 'ignore' });
    console.log(`  ✓ ${description}`);
  } catch (error) {
    console.error(`  ✗ Failed: ${description}`);
    throw error;
  }
}

function checkDependencies() {
  console.log('\n📋 Checking dependencies...\n');

  const commands = [
    { cmd: 'rsvg-convert --version', name: 'librsvg (rsvg-convert)' },
    { cmd: 'convert --version', name: 'ImageMagick (convert)' },
  ];

  let allInstalled = true;

  commands.forEach(({ cmd, name }) => {
    try {
      execSync(cmd, { stdio: 'ignore' });
      console.log(`  ✓ ${name} is installed`);
    } catch {
      console.error(`  ✗ ${name} is NOT installed`);
      allInstalled = false;
    }
  });

  if (!allInstalled) {
    console.error('\n❌ Missing dependencies. Please install them:');
    console.error('  macOS:   brew install librsvg imagemagick');
    console.error('  Ubuntu:  sudo apt install librsvg2-bin imagemagick icnsutils icoutils');
    console.error('  Fedora:  sudo dnf install librsvg2-tools ImageMagick libicns-utils icoutils\n');
    process.exit(1);
  }

  console.log('');
}

function ensureDirectories() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }
}

function generatePNGs() {
  console.log('🖼️  Generating PNG icons...\n');

  const allSizes = new Set([
    ...ICON_SIZES.macOS,
    ...ICON_SIZES.windows,
    ...ICON_SIZES.linux,
  ]);

  allSizes.forEach(size => {
    const output = path.join(ICONS_DIR, `icon_${size}x${size}.png`);
    exec(
      `rsvg-convert -w ${size} -h ${size} "${SOURCE_SVG}" -o "${output}"`,
      `PNG ${size}x${size}`
    );
  });

  console.log('');
}

function generateMacOSIcons() {
  console.log('🍎 Generating macOS .icns file...\n');

  // Create iconset directory
  const iconsetDir = path.join(ICONS_DIR, 'icon.iconset');
  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true });
  }
  fs.mkdirSync(iconsetDir);

  // Copy PNGs to iconset with proper naming
  const iconsetSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  iconsetSizes.forEach(({ size, name }) => {
    const src = path.join(ICONS_DIR, `icon_${size}x${size}.png`);
    const dest = path.join(iconsetDir, name);
    fs.copyFileSync(src, dest);
  });

  // Convert iconset to icns
  const icnsOutput = path.join(RESOURCES_DIR, 'icon.icns');

  // Try using iconutil (macOS) or png2icns (Linux)
  try {
    exec(
      `iconutil -c icns "${iconsetDir}" -o "${icnsOutput}"`,
      'Creating .icns with iconutil'
    );
  } catch {
    console.log('  iconutil not available, trying png2icns...');
    try {
      const pngFiles = iconsetSizes
        .map(({ size }) => path.join(ICONS_DIR, `icon_${size}x${size}.png`))
        .filter((file, index, self) => self.indexOf(file) === index)
        .join(' ');

      exec(
        `png2icns "${icnsOutput}" ${pngFiles}`,
        'Creating .icns with png2icns'
      );
    } catch {
      console.warn('  ⚠️  Could not create .icns file. This is only needed for macOS builds.');
      console.warn('      Run this script on macOS or install libicns-utils.');
    }
  }

  // Cleanup iconset directory
  fs.rmSync(iconsetDir, { recursive: true });

  console.log('');
}

function generateWindowsIcons() {
  console.log('🪟 Generating Windows .ico file...\n');

  const sizes = ICON_SIZES.windows;
  const pngFiles = sizes.map(size =>
    path.join(ICONS_DIR, `icon_${size}x${size}.png`)
  ).join(' ');

  const icoOutput = path.join(RESOURCES_DIR, 'icon.ico');

  try {
    exec(
      `convert ${pngFiles} "${icoOutput}"`,
      'Creating .ico with ImageMagick'
    );
  } catch {
    console.warn('  ⚠️  Could not create .ico file. Trying alternative method...');
    try {
      // Try using icotool if convert fails
      exec(
        `icotool -c -o "${icoOutput}" ${pngFiles}`,
        'Creating .ico with icotool'
      );
    } catch {
      console.warn('  ⚠️  Could not create .ico file. This is only needed for Windows builds.');
      console.warn('      Install icoutils: apt install icoutils (Linux) or brew install icoutils (macOS)');
    }
  }

  console.log('');
}

function generateLinuxIcons() {
  console.log('🐧 Generating Linux .png icons...\n');

  // Copy main icon
  const mainIcon = path.join(ICONS_DIR, 'icon_512x512.png');
  const output = path.join(RESOURCES_DIR, 'icon.png');
  fs.copyFileSync(mainIcon, output);
  console.log('  ✓ Copied 512x512 icon as main icon');

  console.log('');
}

function cleanup() {
  console.log('🧹 Cleaning up temporary files...\n');

  // Optionally remove individual PNG files if you only want the final icons
  // For now, we'll keep them for reference
  console.log('  ℹ️  Individual PNG files kept in resources/icons/');

  console.log('');
}

function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Noto Icon Generation Script          ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    checkDependencies();
    ensureDirectories();
    generatePNGs();
    generateMacOSIcons();
    generateWindowsIcons();
    generateLinuxIcons();
    cleanup();

    console.log('✅ Icon generation complete!\n');
    console.log('Generated files:');
    console.log('  📁 resources/icon.icns  (macOS)');
    console.log('  📁 resources/icon.ico   (Windows)');
    console.log('  📁 resources/icon.png   (Linux)');
    console.log('  📁 resources/icons/     (All sizes)\n');
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

main();
