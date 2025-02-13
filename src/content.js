// Use dynamic imports
Promise.all([
    import(chrome.runtime.getURL('src/modules/storage.js')),
    import(chrome.runtime.getURL('src/modules/api.js')),
    import(chrome.runtime.getURL('src/modules/ui.js')),
    import(chrome.runtime.getURL('src/modules/messageHandler.js'))
]).then(([storage, api, ui, messageHandler]) => {
    const { initializeStorage, updateEnabled, getState } = storage;
    const { summarizeMessages } = api;
    const { createSummaryPopup } = ui;
    const { collectMessages, sendToWhatsApp } = messageHandler;

    // Initialize storage and state
    initializeStorage().then(() => {
        console.log('Content script initialized', getState().isEnabled);
    });

    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.hasOwnProperty('enabled')) {
            updateEnabled(request.enabled);
        }
    });

    // Handle TLDR command
    const handleTLDRCommand = async (activeElement) => {
        if (document.querySelector('.tldr-summary-popup')) return;

        const messages = collectMessages();
        if (messages.length === 0) return;

        const summary = await summarizeMessages(messages, getState().apiKey);
        
        const handleRegenerate = async () => {
            const regenerateButton = document.getElementById('regenerateSummary');
            regenerateButton.textContent = 'Loading...';
            regenerateButton.disabled = true;
            
            const newSummary = await summarizeMessages(messages, getState().apiKey);
            document.getElementById('summary-content').textContent = newSummary;
            
            regenerateButton.textContent = 'Regenerate';
            regenerateButton.disabled = false;
        };

        const handleSendToChat = () => {
            const summaryContent = document.getElementById('summary-content').textContent;
            if (sendToWhatsApp(summaryContent)) {
                setTimeout(() => {
                    const sendButton = document.querySelector('button[aria-label="Send"]');
                    if (sendButton) {
                        sendButton.click();
                        document.querySelector('.tldr-summary-popup').remove();
                    }
                }, 100);
            }
        };

        const popup = createSummaryPopup(summary, handleRegenerate, handleSendToChat);
        document.body.appendChild(popup);
    };

    // Event listeners
    document.addEventListener('keydown', (e) => {
        const { isEnabled } = getState();
        if (!isEnabled) return;

        if (e.key === 'Shift') {
            const activeElement = document.activeElement;
            if (activeElement.getAttribute('contenteditable') === 'true' && 
                activeElement.getAttribute('role') === 'textbox') {
                
                const text = activeElement.textContent;
                if (text.trim() === '@tldr') {
                    e.preventDefault();
                    activeElement.textContent = '';
                    handleTLDRCommand(activeElement);
                }
            }
        }
    });

    // Initialize with delay
    setTimeout(() => {
        const observer = new MutationObserver((mutations, obs) => {
            const inputField = document.querySelector('[contenteditable="true"][role="textbox"]');
            if (inputField) {
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 2000);
});
