# FixDesk AI

## Description

FixDesk AI is an intelligent help desk application built with AI Studio and powered by Google's Gemini AI. This modern desktop application provides automated support and assistance capabilities, leveraging advanced language models to deliver intelligent responses and solutions.

Built with React, TypeScript, and Electron, FixDesk AI combines the power of web technologies with native desktop performance to create a seamless user experience.

## Features

- 🤖 **AI-Powered Support**: Leverages Google Gemini AI for intelligent responses and automated ticketing.
- 💬 **Global AI Assistant**: A floating widget with **Multimodal Screen-Awareness**. Capture screenshots or videos of issues for instant AI analysis and troubleshooting.
- 🐚 **Secure IT Terminal**: A whitelisted, security-hardened terminal for admins to execute diagnostic commands (`ping`, `netstat`, `pkill`, `systemctl`, etc.).
- 🛡️ **Autonomous Self-Healing (AIOps)**: Real-time system monitoring that detects performance bottlenecks (CPU/Memory) and autonomously mitigates them using AI-driven diagnostics and whitelisted commands.
- 🔍 **Natural Language Search**: Filter and find tickets using plain English (e.g., "urgent vpn issues from today") via AI-powered query parsing.
- 📊 **Support Bundle Intelligence**: Generate and analyze deep support bundles using AI to identify workspace-wide patterns and strategic risks.
- 💻 **Cross-Platform Desktop App**: Built with Electron for Windows, macOS, and Linux
- ⚛️ **Modern Stack**: React + TypeScript for robust, type-safe development
- ⚡ **Fast Development**: Vite-powered build system for instant HMR
- 🎨 **Rich UI Components**: Pre-built components for consistent user experience
- 🔄 **Real-Time Interactions**: Responsive AI conversations and support workflows

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **npm** or **yarn** package manager
- **Gemini API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/lanryweezy/fixdesk-ai-.git
cd fixdesk-ai-
```

### 2. Install Dependencies

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### 3. Configure Environment Variables

Create or update the `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

**⚠️ Security Note**: 
- Never commit your `.env.local` file to version control
- Keep your API keys confidential
- Add `.env.local` to your `.gitignore` (already included)
- Rotate your API keys if accidentally exposed

### 4. Run the Application

#### Development Mode

```bash
npm run dev
```

This will start the development server with hot-module reloading.

#### Build for Production

```bash
npm run build
```

#### Run Electron Desktop App

```bash
npm run electron:dev
```

## Usage

1. **Launch the Application**: Start the app using `npm run dev` or the built Electron app
2. **AI Studio Integration**: Access your app through AI Studio at: [https://ai.studio/apps/drive/1XJ7hnLjKijLsWgInn1y-1ReX6jhUq4-a](https://ai.studio/apps/drive/1XJ7hnLjKijLsWgInn1y-1ReX6jhUq4-a)
3. **Interact with AI**: Use the interface to ask questions and receive AI-powered support
4. **Admin Tools**: Switch to "Admin Mode" in the sidebar to access the **Secure IT Terminal** on the Dashboard.
5. **Customize**: Modify components and services to fit your specific help desk needs

### Secure IT Terminal & AIOps
The terminal and autonomous healing engine are restricted to authorized admins and support a curated whitelist of commands:
- **Network**: `ping`, `netstat`, `ifconfig`, `ipconfig`
- **System**: `uptime`, `whoami`, `df`, `free`, `ps`, `top`
- **Service Management**: `pkill`, `systemctl`, `journalctl`

**AIOps Policy**:
Administrators can toggle between `Manual` and `Autonomous` modes in Settings.
- In **Autonomous** mode, FixDesk AI will automatically execute mitigation commands for detected issues and log the reasoning.
- In **Manual** mode, the AI suggests actions that require admin approval.

Security is enforced via character-based injection protection (blocking `;`, `&`, `|`, etc.) and strict command validation in the Electron main process.

## Project Structure

```
fixdesk-ai-/
├── components/          # React UI components
├── services/           # API and service integrations
├── electron/           # Electron main process files
├── dist-electron/      # Compiled Electron files
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Your Changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the Branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please ensure your code follows the existing style conventions and includes appropriate tests.

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

_(Note: Add a LICENSE file to the repository if not already present)_

## Contact

**Project Maintainer**: [@lanryweezy](https://github.com/lanryweezy)

**Project Repository**: [https://github.com/lanryweezy/fixdesk-ai-](https://github.com/lanryweezy/fixdesk-ai-)

**Issues & Support**: [GitHub Issues](https://github.com/lanryweezy/fixdesk-ai-/issues)

---

**Built with ❤️ using AI Studio, React, and Google Gemini AI**
