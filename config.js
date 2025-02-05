const config = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
};

// Store API key in Chrome's local storage when extension loads
chrome.storage.local.set({ openaiKey: config.OPENAI_API_KEY }); 