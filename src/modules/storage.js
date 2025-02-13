let isEnabled = false;
let apiKey = '';

export const initializeStorage = async () => {
    const result = await chrome.storage.local.get(['enabled', 'openaiKey']);
    isEnabled = result.enabled !== undefined ? result.enabled : false;
    apiKey = result.openaiKey;
    
    if (!apiKey) {
        console.log('No API key found. Please set it in extension options.');
    }
    return { isEnabled, apiKey };
};

export const updateEnabled = (enabled) => {
    isEnabled = enabled;
    return chrome.storage.local.set({ enabled: isEnabled });
};

export const getState = () => ({
    isEnabled,
    apiKey
}); 