#!/usr/bin/env node

/**
 * Creates minimal placeholder icon files for development
 * These should be replaced with proper icons using generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const RESOURCES_DIR = path.join(__dirname, '..', 'resources');

// Minimal 1x1 transparent PNG (base64)
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal ICO file (16x16 transparent)
const MINIMAL_ICO = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
  0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
  0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
  0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00,
]);

function createPlaceholderIcons() {
  console.log('Creating placeholder icon files...\n');

  // Ensure resources directory exists
  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  }

  // Create PNG
  const pngPath = path.join(RESOURCES_DIR, 'icon.png');
  if (!fs.existsSync(pngPath)) {
    fs.writeFileSync(pngPath, MINIMAL_PNG);
    console.log('✓ Created icon.png (placeholder)');
  } else {
    console.log('ℹ icon.png already exists');
  }

  // Create ICO
  const icoPath = path.join(RESOURCES_DIR, 'icon.ico');
  if (!fs.existsSync(icoPath)) {
    fs.writeFileSync(icoPath, MINIMAL_ICO);
    console.log('✓ Created icon.ico (placeholder)');
  } else {
    console.log('ℹ icon.ico already exists');
  }

  // Create ICNS (macOS) - just use PNG as placeholder
  const icnsPath = path.join(RESOURCES_DIR, 'icon.icns');
  if (!fs.existsSync(icnsPath)) {
    fs.writeFileSync(icnsPath, MINIMAL_PNG);
    console.log('✓ Created icon.icns (placeholder)');
  } else {
    console.log('ℹ icon.icns already exists');
  }

  console.log('\n⚠️  These are PLACEHOLDER icons!');
  console.log('   Run "npm run generate-icons" to create proper icons.\n');
}

createPlaceholderIcons();
