# Henry AI Deployment Guide

This guide covers how to build, package, and distribute the Henry AI desktop application.

## Quick Start

### Development
```bash
# Clone and setup
git clone https://github.com/tophercook7-maker/henry-ai.git
cd henry-ai

# Start development
./dev.sh
```

### Production Build
```bash
# Build for production
./build.sh
```

## Platform-Specific Builds

### Windows
```bash
# Install Windows build tools (if on Windows)
npm run tauri:build -- --target x86_64-pc-windows-msvc

# Output: src-tauri/target/release/bundle/msi/Henry AI_1.0.0_x64_en-US.msi
```

### macOS
```bash
# Build for macOS (requires macOS)
npm run tauri:build -- --target x86_64-apple-darwin

# For Apple Silicon
npm run tauri:build -- --target aarch64-apple-darwin

# Output: src-tauri/target/release/bundle/dmg/Henry AI_1.0.0_x64.dmg
```

### Linux
```bash
# Build for Linux
npm run tauri:build -- --target x86_64-unknown-linux-gnu

# Output: 
# - src-tauri/target/release/bundle/deb/henry-ai_1.0.0_amd64.deb
# - src-tauri/target/release/bundle/appimage/henry-ai_1.0.0_amd64.AppImage
```

## Cross-Platform Building

### Using GitHub Actions (Recommended)

Create `.github/workflows/build.yml`:

```yaml
name: Build Henry AI

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-20.04, windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
          
      - name: Install npm dependencies
        run: npm install
        
      - name: Build application
        run: npm run tauri:build
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: henry-ai-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## Manual Distribution

### Creating Installers

#### Windows (MSI)
- The build process automatically creates an MSI installer
- Located at: `src-tauri/target/release/bundle/msi/`
- Users can double-click to install

#### macOS (DMG)
- The build process creates a DMG file
- Located at: `src-tauri/target/release/bundle/dmg/`
- Users drag the app to Applications folder

#### Linux (DEB/AppImage)
- DEB package: `src-tauri/target/release/bundle/deb/`
- AppImage: `src-tauri/target/release/bundle/appimage/`
- DEB can be installed with `sudo dpkg -i henry-ai_1.0.0_amd64.deb`
- AppImage is portable and can be run directly

### Code Signing (Production)

#### Windows
```toml
# In src-tauri/tauri.conf.json
"windows": {
  "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.sectigo.com"
}
```

#### macOS
```toml
# In src-tauri/tauri.conf.json
"macOS": {
  "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
  "providerShortName": "YOUR_PROVIDER_SHORT_NAME"
}
```

## Auto-Updates

### Setup Updater
1. Enable updater in `tauri.conf.json`:
```json
"updater": {
  "active": true,
  "endpoints": ["https://your-update-server.com/updates/{{target}}/{{current_version}}"],
  "dialog": true,
  "pubkey": "YOUR_PUBLIC_KEY"
}
```

2. Generate update keys:
```bash
cargo tauri signer generate -w ~/.tauri/henry-ai.key
```

3. Host update manifests on your server

## Distribution Channels

### Direct Download
- Host installers on your website
- Provide checksums for verification
- Include installation instructions

### Package Managers

#### Windows (Chocolatey)
```xml
<!-- henry-ai.nuspec -->
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>henry-ai</id>
    <version>1.0.0</version>
    <title>Henry AI</title>
    <authors>Henry AI Team</authors>
    <description>AI-powered desktop assistant</description>
  </metadata>
</package>
```

#### macOS (Homebrew)
```ruby
# henry-ai.rb
class HenryAi < Formula
  desc "AI-powered desktop assistant"
  homepage "https://github.com/tophercook7-maker/henry-ai"
  url "https://github.com/tophercook7-maker/henry-ai/releases/download/v1.0.0/henry-ai-macos.tar.gz"
  sha256 "SHA256_HASH"
  version "1.0.0"

  def install
    bin.install "henry-ai"
  end
end
```

#### Linux (Snap)
```yaml
# snapcraft.yaml
name: henry-ai
version: '1.0.0'
summary: AI-powered desktop assistant
description: |
  Henry AI is a powerful desktop assistant with file system access,
  terminal execution, and AI conversation capabilities.

grade: stable
confinement: strict

apps:
  henry-ai:
    command: henry-ai
    plugs: [home, network]

parts:
  henry-ai:
    plugin: dump
    source: src-tauri/target/release/bundle/appimage/
```

## Performance Optimization

### Build Optimization
```toml
# In src-tauri/Cargo.toml
[profile.release]
opt-level = "s"  # Optimize for size
lto = true       # Link-time optimization
codegen-units = 1
panic = "abort"
strip = true     # Remove debug symbols
```

### Bundle Size Reduction
- Use `cargo-bloat` to analyze binary size
- Remove unused dependencies
- Optimize assets and images
- Use compression for resources

## Troubleshooting

### Common Build Issues

1. **Missing system dependencies (Linux)**:
   ```bash
   sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf
   ```

2. **Code signing issues (macOS)**:
   - Ensure you have a valid Developer ID certificate
   - Check keychain access permissions

3. **Windows defender false positives**:
   - Submit binaries to Microsoft for analysis
   - Use established code signing certificates

### Build Environment

- Use consistent Node.js versions across environments
- Pin Rust toolchain version for reproducible builds
- Use Docker for consistent build environments

## Security Considerations

- Always sign releases with valid certificates
- Provide checksums for all downloads
- Use HTTPS for all distribution channels
- Implement secure auto-update mechanisms
- Regular security audits of dependencies

---

For more information, see the main [README.md](README.md) file.