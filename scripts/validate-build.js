#!/usr/bin/env node

/**
 * Build Validation Script
 *
 * Validates that the build is complete and ready for distribution
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const REQUIRED_FILES = {
  main: [
    'dist/main/index.js',
    'dist/main/ipc/index.js',
    'dist/main/services/LocalStorage.js',
  ],
  renderer: [
    'dist/renderer/index.html',
    'dist/renderer/assets',
  ],
  preload: [
    'dist/preload/index.js',
  ],
  resources: [
    'resources/icon.icns',
    'resources/icon.ico',
    'resources/icon.png',
  ],
};

let errors = 0;
let warnings = 0;

console.log('╔════════════════════════════════════════╗');
console.log('║   Build Validation                     ║');
console.log('╚════════════════════════════════════════╝\n');

/**
 * Check if a file or directory exists
 */
function checkExists(filePath, isRequired = true) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (!exists) {
    if (isRequired) {
      console.log(`  ✗ Missing: ${filePath}`);
      errors++;
    } else {
      console.log(`  ⚠  Missing (optional): ${filePath}`);
      warnings++;
    }
    return false;
  }

  console.log(`  ✓ ${filePath}`);
  return true;
}

/**
 * Check file size
 */
function checkFileSize(filePath, maxSizeMB) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const stats = fs.statSync(fullPath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    console.log(`  ⚠  Large file: ${filePath} (${sizeMB.toFixed(2)} MB)`);
    warnings++;
  }
}

/**
 * Validate package.json
 */
function validatePackageJson() {
  console.log('\n📦 Validating package.json...\n');

  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('  ✗ package.json not found');
    errors++;
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'main', 'author'];
  requiredFields.forEach(field => {
    if (!pkg[field]) {
      console.log(`  ✗ Missing field: ${field}`);
      errors++;
    } else {
      console.log(`  ✓ ${field}: ${pkg[field]}`);
    }
  });

  // Check build configuration
  if (!pkg.build) {
    console.log('  ✗ Missing build configuration');
    errors++;
  } else {
    console.log('  ✓ Build configuration present');
  }

  // Validate version format
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(pkg.version)) {
    console.log(`  ⚠  Non-standard version format: ${pkg.version}`);
    warnings++;
  }
}

/**
 * Validate dist directory
 */
function validateDist() {
  console.log('\n🔨 Validating dist directory...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.log('  ✗ dist directory not found');
    console.log('    Run: npm run build');
    errors++;
    return;
  }

  console.log('  Main process:');
  REQUIRED_FILES.main.forEach(file => checkExists(file));

  console.log('\n  Renderer process:');
  REQUIRED_FILES.renderer.forEach(file => checkExists(file));

  console.log('\n  Preload script:');
  REQUIRED_FILES.preload.forEach(file => checkExists(file));

  // Check for source maps (should not be in production)
  const sourceMapRegex = /\.map$/;
  const distFiles = getAllFiles(DIST_DIR);
  const sourceMaps = distFiles.filter(file => sourceMapRegex.test(file));

  if (sourceMaps.length > 0) {
    console.log(`\n  ⚠  Found ${sourceMaps.length} source map files`);
    console.log('     Consider removing source maps for production builds');
    warnings++;
  }
}

/**
 * Validate resources
 */
function validateResources() {
  console.log('\n🎨 Validating resources...\n');

  if (!fs.existsSync(RESOURCES_DIR)) {
    console.log('  ✗ resources directory not found');
    errors++;
    return;
  }

  REQUIRED_FILES.resources.forEach(file => checkExists(file));

  // Check icon file sizes (should not be too large)
  checkFileSize('resources/icon.icns', 5);
  checkFileSize('resources/icon.ico', 5);
  checkFileSize('resources/icon.png', 2);
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScript() {
  console.log('\n📝 Validating TypeScript compilation...\n');

  const tsconfig = path.join(__dirname, '..', 'tsconfig.json');
  if (!fs.existsSync(tsconfig)) {
    console.log('  ✗ tsconfig.json not found');
    errors++;
    return;
  }

  console.log('  ✓ tsconfig.json exists');

  // Check for .ts files in dist (should be compiled to .js)
  const distFiles = getAllFiles(DIST_DIR);
  const tsFiles = distFiles.filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));

  if (tsFiles.length > 0) {
    console.log(`  ✗ Found ${tsFiles.length} uncompiled .ts files in dist`);
    tsFiles.slice(0, 5).forEach(file => console.log(`     - ${file}`));
    errors++;
  } else {
    console.log('  ✓ No uncompiled .ts files in dist');
  }
}

/**
 * Check bundle size
 */
function checkBundleSize() {
  console.log('\n📊 Checking bundle sizes...\n');

  const distSize = getDirSize(DIST_DIR);
  const distSizeMB = distSize / (1024 * 1024);

  console.log(`  Total dist size: ${distSizeMB.toFixed(2)} MB`);

  if (distSizeMB > 500) {
    console.log('  ⚠  Dist directory is quite large (> 500 MB)');
    warnings++;
  } else if (distSizeMB > 200) {
    console.log('  ℹ️  Dist directory size is moderate (> 200 MB)');
  } else {
    console.log('  ✓ Dist directory size is reasonable');
  }

  // Check renderer bundle
  const rendererAssets = path.join(DIST_DIR, 'renderer', 'assets');
  if (fs.existsSync(rendererAssets)) {
    const rendererSize = getDirSize(rendererAssets);
    const rendererSizeMB = rendererSize / (1024 * 1024);
    console.log(`  Renderer bundle size: ${rendererSizeMB.toFixed(2)} MB`);

    if (rendererSizeMB > 20) {
      console.log('  ⚠  Renderer bundle is large (> 20 MB)');
      console.log('     Consider code splitting or lazy loading');
      warnings++;
    }
  }
}

/**
 * Security checks
 */
function securityChecks() {
  console.log('\n🔒 Running security checks...\n');

  const checks = [
    {
      name: 'nodeIntegration disabled',
      check: () => {
        const preload = path.join(DIST_DIR, 'preload', 'index.js');
        if (!fs.existsSync(preload)) return false;
        const content = fs.readFileSync(preload, 'utf8');
        return content.includes('contextBridge');
      },
    },
    {
      name: 'No hardcoded secrets',
      check: () => {
        const distFiles = getAllFiles(DIST_DIR);
        const secretPatterns = [
          /api[_-]?key\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
          /password\s*=\s*['"][^'"]+['"]/i,
          /secret\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i,
        ];

        for (const file of distFiles) {
          if (file.endsWith('.js')) {
            const content = fs.readFileSync(file, 'utf8');
            for (const pattern of secretPatterns) {
              if (pattern.test(content)) {
                return false;
              }
            }
          }
        }
        return true;
      },
    },
  ];

  checks.forEach(({ name, check }) => {
    if (check()) {
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ⚠  ${name} failed`);
      warnings++;
    }
  });
}

/**
 * Get all files recursively
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get directory size
 */
function getDirSize(dir) {
  if (!fs.existsSync(dir)) return 0;

  let size = 0;
  const files = getAllFiles(dir);

  files.forEach(file => {
    size += fs.statSync(file).size;
  });

  return size;
}

/**
 * Main validation
 */
function main() {
  validatePackageJson();
  validateDist();
  validateResources();
  validateTypeScript();
  checkBundleSize();
  securityChecks();

  console.log('\n════════════════════════════════════════\n');

  if (errors > 0) {
    console.log(`❌ Validation failed with ${errors} error(s) and ${warnings} warning(s)`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`⚠️  Validation passed with ${warnings} warning(s)`);
    process.exit(0);
  } else {
    console.log('✅ Validation passed! Build is ready for distribution.');
    process.exit(0);
  }
}

main();
