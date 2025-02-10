let isEnabled = false;
let apiKey = '';

// Initialize the state from storage when the content script loads
chrome.storage.local.get(['enabled', 'openaiKey'], function(result) {
    isEnabled = result.enabled !== undefined ? result.enabled : false;
    apiKey = result.openaiKey;
    if (!apiKey) {
        console.log('No API key found. Please set it in extension options.');
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty('enabled')) {
        isEnabled = request.enabled;
        // Persist the state
        chrome.storage.local.set({ enabled: isEnabled });
    }
});

async function summarizeMessages(messages) {
    if (!apiKey) {
        const message = 'Please set your Gemini API key in the extension options (Right-click extension icon → Options)';
        console.log(message);
        return message;
    }
    
    try {
        const conversationText = messages
            .map(msg => `${msg.author} (${msg.timestamp}): ${msg.message}`)
            .join('\n');

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{
                        text: `You are a helpful assistant that provides concise TLDR summaries of conversations. Focus on the main points and action items, don't include any heading to the generated summary. Please provide a brief TLDR summary of this conversation:\n\n${conversationText}t`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                return 'Invalid API key. Please check your API key in the extension options.';
            }
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Unexpected response format from API');
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Error generating summary. Please check your API key and try again.';
    }
}

// Add debug logging for initial load
console.log('Content script starting initialization...');

// Function to initialize event listeners
function initializeEventListeners() {
    console.log('Attempting to initialize event listeners...');
    
    // Listen for focus events on any contenteditable textbox
    document.addEventListener('focusin', function(e) {
        console.log('Focus event triggered on:', e.target);
        
        if (e.target.matches('[contenteditable="true"][role="textbox"]')) {
            console.log('New WhatsApp input field focused:', e.target);
            
            // Remove existing input listeners from other fields
            document.querySelectorAll('[contenteditable="true"][role="textbox"]').forEach(field => {
                field.removeEventListener('input', handleInput);
            });
            
            // Add input listener to the newly focused field
            e.target.addEventListener('input', handleInput);
        }
    });

    console.log('Focus tracking initialized');
}

// Modify handleInput to only check for @tldr but not trigger summarization
function handleInput(e) {
    console.log('Input event triggered on WhatsApp field', e);
    if (!isEnabled) {
        console.log('Feature is disabled, skipping');
        return;
    }

    const text = e.target.textContent;
}

// Create MutationObserver to watch for input field
const observer = new MutationObserver((mutations, obs) => {
    console.log('DOM mutation detected');
    const inputField = document.querySelector('[contenteditable="true"][role="textbox"]');
    
    if (inputField) {
        console.log('Input field found after DOM mutation');
        initializeEventListeners();
        obs.disconnect(); // Stop observing once we've found and initialized the input field
        console.log('Observer disconnected');
    }
});

// Start observing with a delay to ensure WhatsApp Web has loaded
setTimeout(() => {
    console.log('Starting DOM observation...');
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Try initial initialization
    initializeEventListeners();
}, 2000);

// Add capture: true to intercept the event before WhatsApp handles it
document.addEventListener('keydown', function(e) {
    if (!isEnabled) {
        console.log('Feature is disabled, skipping');
        return;
    }

    if (e.key === 'Shift') {
        const activeElement = document.activeElement;
        if (activeElement.getAttribute('contenteditable') === 'true' && 
            activeElement.getAttribute('role') === 'textbox') {
            const text = activeElement.textContent;
            // Check if a summary popup already exists
            if (document.querySelector('.tldr-summary-popup')) {
                console.log('Summary popup already exists, skipping');
                return;
            }
            
            if (text.trim() === '@tldr') {
                console.log('TLDR command detected, proceeding with summary');
                
                e.preventDefault();
                activeElement.textContent = '';

                // Get all message containers
                const messages = [];
                const messageElements = document.querySelectorAll('[data-pre-plain-text]');
                
                messageElements.forEach(msgElement => {
                    try {
                        // Get author and timestamp from data-pre-plain-text attribute
                        const prePlainText = msgElement.getAttribute('data-pre-plain-text');
                        let author = 'You';
                        let timestamp = '';
                        
                        if (prePlainText) {
                            const match = prePlainText.match(/\[(.*?)\] (.*?):/);
                            if (match) {
                                timestamp = match[1];
                                author = match[2].trim();
                            }
                        }

                        const messageTextElement = msgElement.querySelector('span.selectable-text.copyable-text');
                        const messageText = messageTextElement ? messageTextElement.textContent : '';

                        if (messageText) {
                            messages.push({
                                author,
                                message: messageText,
                                timestamp
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                });

                if (messages.length > 0) {
                    summarizeMessages(messages).then(summary => {
                        console.log('Chat Summary (TLDR):', summary);
                        
                        const formatText = (text) => {
                            return text
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/^\* |(\n)\* /g, '$1• ')
                                .replace(/\r?\n|\r/g, '<br>');
                        };

                        const summaryDiv = document.createElement('div');
                        summaryDiv.className = 'tldr-summary-popup';
                        summaryDiv.style.cssText = `
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            background-color: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 15px;
                            border-radius: 8px;
                            max-width: 300px;
                            z-index: 9999;
                            font-size: 14px;
                            line-height: 1.4;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                        `;
                        const formattedSummary = formatText(summary);
                        summaryDiv.innerHTML = `
                            <span style="font-weight: bold; font-size: 16px;">TLDR Summary:</span>
                            <br>
                            <div id="summary-content">${formattedSummary}</div>
                            <div style="margin-top: 10px; text-align: right;">
                                <button id="regenerateSummary" style="
                                    background-color: #666666;
                                    color: white;
                                    border: none;
                                    padding: 5px 10px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    margin-right: 10px;
                                ">Regenerate</button>
                                <button id="sendToChat" style="
                                    background-color: #00a884;
                                    color: white;
                                    border: none;
                                    padding: 5px 10px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    margin-right: 10px;
                                ">Send to Chat</button>
                            </div>
                        `;
                        
                        // Add close button
                        const closeButton = document.createElement('button');
                        closeButton.innerHTML = '×';
                        closeButton.style.cssText = `
                            position: absolute;
                            top: 5px;
                            right: 5px;
                            border: none;
                            background: none;
                            cursor: pointer;
                            font-size: 18px;
                            color: #ffffff;
                        `;
                        closeButton.onclick = () => summaryDiv.remove();
                        summaryDiv.appendChild(closeButton);
                        
                        document.body.appendChild(summaryDiv);

                        // Add click handler for send to chat button
                        document.getElementById('sendToChat').onclick = () => {
                            console.log('Send to chat button clicked');
                            const inputField = document.querySelector('footer [contenteditable="true"][role="textbox"][data-lexical-editor="true"]');
                            if (inputField) {
                                const summaryText = document.getElementById('summary-content').textContent;
                                
                                // Focus and clear the input field
                                const originalText = inputField.textContent;
                                let textLength = originalText.length;
                                
                                // Set initial content to spaces matching original length
                               
                                inputField.focus();
                                inputField.textContent = '';

                                // Then simulate typing character by character
                                for (let i = 0; i < summaryText.length; i++) {
                                    const char = summaryText[i];
                                    
                                    const keydownEvent = new KeyboardEvent('keydown', {
                                        key: char,
                                        code: 'Key' + char.toUpperCase(),
                                        bubbles: true,
                                        cancelable: true,
                                        composed: true
                                    });
                                    
                                    const beforeInputEvent = new InputEvent('beforeinput', {
                                        inputType: 'insertText',
                                        data: char,
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    
                                    const inputEvent = new InputEvent('input', {
                                        inputType: 'insertText',
                                        data: char,
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    
                                    inputField.dispatchEvent(keydownEvent);
                                    inputField.dispatchEvent(beforeInputEvent);
                                    
                                    // Update the content
                                    const textNode = document.createTextNode(char);
                                    inputField.appendChild(textNode);
                                    
                                    inputField.dispatchEvent(inputEvent);
                                }


                                while (textLength--) {
                                    const deleteEvent = new KeyboardEvent('keydown', {
                                        key: 'Delete',
                                        code: 'Delete',
                                        bubbles: true,
                                        cancelable: true,
                                        composed: true
                                    });
                                    
                                    const beforeInputEvent = new InputEvent('beforeinput', {
                                        inputType: 'deleteContentForward',
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    
                                    const inputEvent = new InputEvent('input', {
                                        inputType: 'deleteContentForward',
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    
                                    inputField.dispatchEvent(deleteEvent);
                                    inputField.dispatchEvent(beforeInputEvent);
                                    inputField.dispatchEvent(inputEvent);
                                    console.log('inputEvent', inputField.textContent);
                                    console.log('textLength', textLength);
                                }
                                
                                // Click send button after text is inserted
                                setTimeout(() => {
                                    const sendButton = document.querySelector('button[aria-label="Send"]');
                                    if (sendButton) {
                                        sendButton.click();
                                        document.querySelector('.tldr-summary-popup').remove();
                                    }
                                }, 100);
                            }
                        };

                        // Update the regenerate click handler
                        document.getElementById('regenerateSummary').onclick = () => {
                            const regenerateButton = document.getElementById('regenerateSummary');
                            regenerateButton.textContent = 'Loading...';
                            regenerateButton.disabled = true;
                            
                            summarizeMessages(messages).then(newSummary => {
                                const formattedSummary = formatText(newSummary);
                                const summaryContent = document.getElementById('summary-content');
                                summaryContent.textContent = newSummary;

                                regenerateButton.textContent = 'Regenerate';
                                regenerateButton.disabled = false;
                            });
                        };

                    });
                }
            }
        }
    }
});

console.log('Content script loaded', isEnabled);
