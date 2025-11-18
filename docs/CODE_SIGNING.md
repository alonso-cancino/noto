# Code Signing Guide for Noto

This guide explains how to set up code signing for Noto across different platforms.

## Overview

Code signing is essential for distributing desktop applications:

- **macOS**: Required for distribution outside the App Store (Gatekeeper)
- **Windows**: Required to avoid SmartScreen warnings
- **Linux**: Optional, but recommended for package repositories

## macOS Code Signing

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com

2. **Developer Certificate**
   - Log in to https://developer.apple.com/account
   - Go to Certificates, Identifiers & Profiles
   - Create a "Developer ID Application" certificate
   - Download and install in Keychain Access

### Configuration

The app is already configured for code signing in `package.json`:

```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  }
}
```

### Environment Variables

Set these environment variables before building:

```bash
# Your Developer ID Application certificate name
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# Path to certificate file (if not in Keychain)
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
```

### Building Signed App

```bash
npm run build
npm run make
```

The built DMG will be automatically signed.

### Notarization (Optional but Recommended)

For macOS 10.15+ (Catalina and later), notarization is required:

1. **Enable notarization** in `package.json`:
   ```json
   {
     "mac": {
       "notarize": {
         "teamId": "YOUR_TEAM_ID"
       }
     }
   }
   ```

2. **Set environment variables**:
   ```bash
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

3. **Build**:
   ```bash
   npm run make
   ```

electron-builder will automatically notarize the app.

### Troubleshooting macOS

**Check if app is signed:**
```bash
codesign -dv --verbose=4 release/mac/Noto.app
```

**Verify entitlements:**
```bash
codesign -d --entitlements - release/mac/Noto.app
```

**Test Gatekeeper:**
```bash
spctl --assess --verbose=4 release/mac/Noto.app
```

## Windows Code Signing

### Prerequisites

1. **Code Signing Certificate**
   - Purchase from a Certificate Authority (CA):
     - DigiCert, Sectigo, GlobalSign, etc.
   - Costs ~$100-$400/year
   - Requires business verification

2. **Certificate File**
   - Download as `.pfx` or `.p12` file
   - Keep secure with strong password

### Configuration

Already configured in `package.json`:

```json
{
  "win": {
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

### Environment Variables

```bash
# Path to certificate file
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"

# Or use certificate from Windows Certificate Store
export CSC_NAME="Your Company Name"
```

### Building Signed App

```bash
npm run build
npm run make
```

The installer (`.exe`) and portable version will be signed.

### Troubleshooting Windows

**Verify signature:**
```powershell
# Using signtool.exe (comes with Windows SDK)
signtool verify /pa /v release\Noto-Setup-1.0.0.exe
```

**Check certificate info:**
```powershell
Get-AuthenticodeSignature release\Noto-Setup-1.0.0.exe | Format-List
```

## Linux Code Signing

Linux doesn't require code signing like macOS/Windows, but you can sign packages for repository distribution.

### GPG Signing (for deb/rpm packages)

1. **Generate GPG key:**
   ```bash
   gpg --full-generate-key
   ```

2. **Export public key:**
   ```bash
   gpg --export -a "Your Name" > public-key.asc
   ```

3. **Sign packages manually:**
   ```bash
   # For .deb
   dpkg-sig --sign builder release/*.deb

   # For .rpm
   rpm --addsign release/*.rpm
   ```

### AppImage

AppImages can be signed using GPG:

```bash
gpg --detach-sign release/Noto-1.0.0.AppImage
```

This creates `Noto-1.0.0.AppImage.sig` which users can verify.

## CI/CD Code Signing

### GitHub Actions

Store certificates and passwords as GitHub Secrets:

1. Go to Settings → Secrets → Actions
2. Add secrets:
   - `MACOS_CERTIFICATE` (base64 encoded .p12 file)
   - `MACOS_CERTIFICATE_PASSWORD`
   - `WINDOWS_CERTIFICATE` (base64 encoded .pfx file)
   - `WINDOWS_CERTIFICATE_PASSWORD`
   - `APPLE_ID` (for notarization)
   - `APPLE_APP_PASSWORD` (app-specific password)
   - `APPLE_TEAM_ID`

3. Update `.github/workflows/build.yml`:

```yaml
- name: Import macOS Certificate
  if: matrix.os == 'macos-latest'
  run: |
    echo "${{ secrets.MACOS_CERTIFICATE }}" | base64 --decode > certificate.p12
    security create-keychain -p actions build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p actions build.keychain
    security import certificate.p12 -k build.keychain -P "${{ secrets.MACOS_CERTIFICATE_PASSWORD }}" -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple: -s -k actions build.keychain

- name: Build and Sign
  env:
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    WIN_CSC_LINK: ${{ secrets.WINDOWS_CERTIFICATE }}
    WIN_CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
  run: |
    npm run build
    npm run make
```

## Development Builds (Unsigned)

For development, you can skip code signing:

```bash
# Skip code signing
export CSC_IDENTITY_AUTO_DISCOVERY=false

npm run package
```

This creates unsigned packages for testing.

## Best Practices

1. **Protect Certificates**
   - Never commit certificates to git
   - Use environment variables or CI secrets
   - Rotate certificates before expiry

2. **Test Signed Builds**
   - Always test on a clean machine
   - Verify signatures before release
   - Check for SmartScreen/Gatekeeper warnings

3. **Automate Signing**
   - Sign as part of CI/CD pipeline
   - Validate signatures in automated tests
   - Keep signing logs for auditing

4. **Certificate Management**
   - Set calendar reminders for renewal
   - Keep backup copies (encrypted)
   - Document certificate details

## Costs Summary

| Platform | Cost | Renewal | Notes |
|----------|------|---------|-------|
| macOS | $99/year | Annual | Apple Developer Program |
| Windows | $100-$400/year | Annual | From Certificate Authority |
| Linux | Free | - | GPG signing (optional) |

## Resources

- [Electron Code Signing](https://www.electron.build/code-signing)
- [Apple Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [electron-builder Documentation](https://www.electron.build/configuration/configuration)

## Support

If you encounter issues with code signing:

1. Check the [electron-builder logs](https://www.electron.build/configuration/configuration#debugging)
2. Verify certificate validity
3. Review environment variables
4. Check platform-specific requirements
5. Consult the electron-builder documentation
