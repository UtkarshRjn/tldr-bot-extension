// Constants for DOM selectors and configuration
const SELECTORS = {
    POPUP: '.tldr-summary-popup',
    REGENERATE_BUTTON: '#regenerateSummary',
    SUMMARY_CONTENT: '#summary-content',
    SEND_BUTTON: 'button[aria-label="Send"]'
};

const DELAYS = {
    SEND_MESSAGE: 100
};

// Use dynamic imports
Promise.all([
    import(chrome.runtime.getURL('src/modules/storage.js')),
    import(chrome.runtime.getURL('src/modules/api.js')),
    import(chrome.runtime.getURL('src/modules/summary-popup.js')),
    import(chrome.runtime.getURL('src/modules/messageHandler.js'))
]).then(([{ storageManager }, api, ui, messageHandler]) => {
    const { summarizeMessages } = api;
    const { createSummaryPopup , updatePopupPosition } = ui;
    const { collectMessages, sendToWhatsApp } = messageHandler;

    // Initialize storage and state
    storageManager.initialize().then(() => {
        console.log('Content script initialized', storageManager.getState().isEnabled);
    });

    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.hasOwnProperty('enabled')) {
            storageManager.updateEnabled(request.enabled);
        }
    });

    /**
     * Creates a handler for regenerating summaries
     * @param {Array} messages - Collection of messages to summarize
     * @param {string} apiKey - API key for the summarization service
     * @returns {Function} Regenerate handler function
     */
    const createRegenerateHandler = (messages, apiKey) => async () => {
        const regenerateButton = document.querySelector(SELECTORS.REGENERATE_BUTTON);
        const summaryContent = document.querySelector(SELECTORS.SUMMARY_CONTENT);
        
        if (!regenerateButton || !summaryContent) {
            console.error('Required elements not found');
            return;
        }

        try {
            regenerateButton.textContent = 'Loading...';
            regenerateButton.disabled = true;

            const newSummary = await summarizeMessages(messages, apiKey);
            if (!newSummary) {
                throw new Error('Failed to regenerate summary');
            }

            summaryContent.textContent = newSummary;
        } catch (error) {
            console.error('Error regenerating summary:', error);
            // Here you might want to show an error message to the user
        } finally {
            regenerateButton.textContent = 'Regenerate';
            regenerateButton.disabled = false;
        }
    };

    /**
     * Creates a handler for sending the summary to WhatsApp
     * @returns {Function} Send handler function
     */
    const createSendHandler = () => () => {
        const summaryContent = document.querySelector(SELECTORS.SUMMARY_CONTENT);
        const popup = document.querySelector(SELECTORS.POPUP);
        
        if (!summaryContent || !popup) {
            console.error('Required elements not found');
            return;
        }

        if (sendToWhatsApp(summaryContent.textContent)) {
            setTimeout(() => {
                const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
                if (sendButton) {
                    sendButton.click();
                    popup.remove();
                }
            }, DELAYS.SEND_MESSAGE);
        }
    };

    /**
     * Handles the TLDR command to generate and display message summaries
     * @param {HTMLElement} activeElement - The currently active input element
     * @returns {Promise<void>}
     */
    const handleTLDRCommand = async (activeElement) => {

        // Prevent multiple popups
        if (document.querySelector(SELECTORS.POPUP)) {
            return;
        }

        const messages = collectMessages();
        if (!messages?.length) {
            console.warn('No messages found to summarize');
            return;
        }

        const apiKey = storageManager.getState()?.apiKey;


        const summary = await summarizeMessages(messages, apiKey);


        const popup = await createSummaryPopup(
            summary,
            createRegenerateHandler(messages, apiKey),
            createSendHandler()
        );
        
        document.body.appendChild(popup);
        updatePopupPosition();

    };

    // Event listeners
    document.addEventListener('keydown', (e) => {
        const { isEnabled } = storageManager.getState();
        if (!isEnabled) return;

        if (e.shiftKey) {
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
        
        if(e.shiftKey && e.ctrlKey && e.key === 'C'){
            const summaryContent = document.querySelector(SELECTORS.SUMMARY_CONTENT);
            const popup = document.querySelector(SELECTORS.POPUP);
            
            if (summaryContent && popup) {
                const copyButton = popup.querySelector('#copySummary');
                copyButton.onclick();
            }
        }
    });

    // Add event listeners
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition);

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
