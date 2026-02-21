# CEH v12 AI Practice Test — Local Setup

This app was created by my friend Scott Stuehrenberg  
[His Github Repository](https://github.com/stuecscott/CEH-Practice-Exam)

## Prerequisites

- Node.js 18+ installed → https://nodejs.org

## Setup (one time)

```bash
# 1. Unzip and enter the folder
cd ceh-app

# 2. Install dependencies
npm install

# 3. Add your API key
# Open src/App.jsx and replace:
#   const API_KEY = "YOUR_API_KEY_HERE";
# with your actual Anthropic API key from:
#   https://console.anthropic.com/settings/api-keys
```

## Run

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Notes

- The app calls the Anthropic API directly from the browser using `anthropic-dangerous-direct-browser-access: true`
- Your API key is only in your local file — never committed or shared
- Retry logic handles 529 overload errors automatically (4 attempts, 5s–20s backoff)
- Each session generates 25 fresh questions — unlimited unique batches
