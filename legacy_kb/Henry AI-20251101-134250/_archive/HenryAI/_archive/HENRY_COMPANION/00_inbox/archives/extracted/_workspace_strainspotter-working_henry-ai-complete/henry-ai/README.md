# Henry AI - Your Personal AI Assistant

Henry AI is a comprehensive, friendly AI assistant that can help with research, writing, coding, learning, analysis, and creative projects. This implementation includes both desktop and mobile versions with standalone installers for all major platforms.

## 🎯 Features

### Desktop Application
- Runs independently in its own window (no browser required)
- System integration capabilities (file access, terminal commands)
- Cross-platform support (Windows, macOS, Linux)
- Offline capabilities after initial setup
- Professional UI with tabbed interface

### Mobile Application
- Native mobile experience (iOS and Android)
- Device integration (camera, file system)
- Responsive design for all screen sizes
- Offline capabilities
- Platform-specific optimizations

## 📁 Directory Structure

```
henry-ai/
├── desktop/                 # Electron desktop application
│   ├── index.html          # Main application interface
│   ├── main.js             # Electron main process
│   ├── preload.js          # Secure API bridge
│   ├── package.json        # Build configuration
│   └── build-all-platforms.sh  # Build script
├── mobile/                  # React Native mobile application
│   ├── App.js             # Main mobile interface
│   ├── app.json           # Mobile app configuration
│   ├── package.json       # Mobile dependencies
│   └── assets/            # Icon and splash images
└── installers/              # Standalone installers
    ├── HenryAI-Windows.exe
    ├── HenryAI-macOS.dmg
    ├── HenryAI-Linux.AppImage
    ├── HenryAI-Android.apk
    └── HenryAI-iOS.ipa
```

## 🚀 Quick Start

### Desktop Version
1. Download the appropriate installer from the `installers/` directory:
   - Windows: `HenryAI-Windows.exe`
   - macOS: `HenryAI-macOS.dmg`
   - Linux: `HenryAI-Linux.AppImage`

2. Run the installer and follow the instructions

3. Launch Henry AI from your desktop or applications folder

### Mobile Version
1. For Android, download `HenryAI-Android.apk` and install on your device

2. For iOS, the app needs to be built and installed through Xcode

## ⚙️ Setup

1. Open Henry AI and navigate to the Setup tab

2. Enter your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))

3. Choose your preferred AI model from the dropdown in the header:
   - GPT-4o (latest model)
   - o1-preview (reasoning model)
   - o1-mini (faster reasoning model)
   - GPT-4 Turbo (powerful legacy model)

4. Adjust the Depth slider to control response detail level:
   - Basic (Simple responses)
   - Intermediate (Detailed but concise)
   - Professional (Comprehensive and thorough)
   - Expert (Highly detailed with examples)
   - Academic (Extremely detailed with citations)

## 💬 Using Henry AI

### Home Tab
Start here to get an overview of Henry's capabilities and quick access to different features.

### Chat Tab
Use this for general conversations with Henry. Type your message and press Enter to send.

### Coding Tab
Get help with programming projects:
- Choose project type (web app, mobile app, script, etc.)
- Select technology stack (React, Python, Java, etc.)
- Specify task type (create, debug, optimize, etc.)
- Describe your coding task in detail

### Writing Tab
Get assistance with creative writing:
- Choose project type (novel, article, script, etc.)
- Select genre if fiction
- Specify current stage (brainstorming, draft, revision, etc.)
- Set target length
- Describe your writing project

## 🤖 Henry's Personality

Henry is designed to be your friendly AI companion:
- Encouraging and supportive in all interactions
- Adapts to your preferred level of detail
- Provides clear explanations without unnecessary jargon
- Helps you feel confident in tackling complex tasks
- Offers step-by-step guidance when needed

## 📋 Requirements

- OpenAI API key
- Node.js and npm (for development)

## 🛠️ Development

### Desktop App Development
1. Navigate to `desktop/` directory
2. Run `npm install` to install dependencies
3. Run `npm start` to launch in development mode
4. Run `npm run build` to create production builds

### Mobile App Development
1. Navigate to `mobile/` directory
2. Run `npm install` to install dependencies
3. Run `npm start` to launch in development mode
4. Use Expo tools to build for iOS or Android

## 📞 Support

Henry AI is ready to help you with any questions or tasks. Simply open the application and start chatting!

Enjoy your new AI assistant!