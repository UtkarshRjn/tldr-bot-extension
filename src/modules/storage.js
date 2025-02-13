// Create a class to manage the storage state
class StorageManager {
    #isEnabled = true;
    #apiKey = '';

    async initialize() {
        const result = await chrome.storage.local.get(['enabled', 'openaiKey']);
        this.#isEnabled = result.enabled !== undefined ? result.enabled : true;
        this.#apiKey = result.openaiKey;
        
        if (!this.#apiKey) {
            console.log('No API key found. Please set it in extension options.');
        }
        return this.getState();
    }

    async updateEnabled(enabled) {
        this.#isEnabled = enabled;
        return chrome.storage.local.set({ enabled: this.#isEnabled });
    }

    getState() {
        return {
            isEnabled: this.#isEnabled,
            apiKey: this.#apiKey
        };
    }
}

// Export a single instance
export const storageManager = new StorageManager(); 