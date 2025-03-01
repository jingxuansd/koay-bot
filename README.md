# Koay Bot

[中文文档](./README_zh.md)

A Chrome extension with an interactive AI assistant that supports multiple language models including DeepSeek-R1 and ChatGPT.

## Features

- 🤖 Support for multiple AI models (DeepSeek-R1, ChatGPT)
- 🔒 Secure API key management
- 🎨 Clean and intuitive user interface
- ⚡ Fast and responsive interactions
- 🌐 Works on any website
- 🔄 Smart Translation Features:
  - Quick Translation: Select text and instantly get translations
  - Full Page Translation: Translate entire documents with one click
  - Multi-language Support: Works with various language pairs
- 🔍 Advanced Search Capabilities:
  - Deep Search: Quickly find content with keywords
  - Advanced Filtering: Refine search results with precision
- 📝 Document Intelligence:
  - Document Summarization: Get concise summaries of long documents
  - Key Points Extraction: Automatically identify and highlight important information

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/koay-bot.git
cd koay-bot
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from this project

## Usage

1. Click the Koay Bot icon in your Chrome toolbar
2. Configure your settings:
   - Select your preferred AI model (DeepSeek-R1 or ChatGPT)
   - Enter your API key
3. Start chatting with the AI assistant on any webpage

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Tech Stack

- React
- TypeScript
- Vite
- Chrome Extensions API

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
