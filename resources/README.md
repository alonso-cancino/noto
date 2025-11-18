# Noto Resources

This directory contains application resources including icons and assets.

## Icons

### Source
- `icon.svg` - Source SVG icon (512x512)

### Generated Icons
Run `npm run generate-icons` to generate platform-specific icons:

- `icon.icns` - macOS application icon
- `icon.ico` - Windows application icon
- `icon.png` - Linux application icon (512x512)
- `icons/` - Individual PNG files at various sizes

### Icon Sizes

**macOS (.icns):**
- 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Includes @2x retina variants

**Windows (.ico):**
- 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256

**Linux (.png):**
- Main: 512x512
- Additional: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 1024x1024

## Regenerating Icons

### Prerequisites

**macOS:**
```bash
brew install librsvg imagemagick
```

**Ubuntu/Debian:**
```bash
sudo apt install librsvg2-bin imagemagick icnsutils icoutils
```

**Fedora/RHEL:**
```bash
sudo dnf install librsvg2-tools ImageMagick libicns-utils icoutils
```

### Generate

```bash
npm run generate-icons
```

This will:
1. Generate PNG files at all required sizes from `icon.svg`
2. Create `icon.icns` for macOS
3. Create `icon.ico` for Windows
4. Copy main `icon.png` for Linux

## Customizing the Icon

To customize the application icon:

1. Edit `icon.svg` with your design
2. Ensure the SVG is 512x512 viewBox
3. Run `npm run generate-icons`
4. Rebuild the application

The icon should be recognizable at small sizes (16x16) and look good at large sizes (1024x1024).

## Design Guidelines

- **Simplicity**: Icon should be recognizable at 16x16
- **Contrast**: Use high contrast for visibility
- **Consistency**: Match your app's brand colors
- **No text**: Avoid text in icons (doesn't scale well)
- **Testing**: Test on light and dark backgrounds
