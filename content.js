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
                        text: `You are a helpful assistant that provides concise TLDR summaries of conversations. Focus on the main points and action items. Please provide a brief TLDR summary of this conversation:\n\n${conversationText}`
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

// Add click event listener to the document
document.addEventListener('click', function(e) {
    if (!isEnabled) return; // Skip if feature is disabled
    
    if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.contentEditable === 'true' ||
        e.target.isContentEditable ||
        (e.target.classList.contains('selectable-text') && e.target.classList.contains('copyable-text'))
    ) {
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
                        // Format is typically "[HH:mm, DD/MM/YYYY] Author: "
                        const match = prePlainText.match(/\[(.*?)\] (.*?):/);
                        if (match) {
                            timestamp = match[1];
                            author = match[2].trim();
                        }
                    }

                    // Get message text
                    const messageTextElement = msgElement.querySelector('span.selectable-text.copyable-text');
                    const messageText = messageTextElement ? messageTextElement.textContent : '';

                    // Only add if we have a message
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

            // Generate and display summary
            if (messages.length > 0) {
                summarizeMessages(messages).then(summary => {
                    console.log('Chat Summary (TLDR):', summary);
                    
                    // Create a floating div to show the summary
                    const summaryDiv = document.createElement('div');
                    summaryDiv.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        max-width: 300px;
                        padding: 15px;
                        background: rgba(0, 0, 0, 0.8);
                        border: 1px solid #444;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        z-index: 9999;
                        font-size: 14px;
                        color: #ffffff;
                    `;
                    summaryDiv.innerHTML = `<strong style="color: #ffffff;">TLDR Summary:</strong><br>${summary}`;
                    
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
                    
                    // Auto-remove after 10 seconds
                    setTimeout(() => {
                        if (summaryDiv.parentNode) {
                            summaryDiv.remove();
                        }
                    }, 10000);
                });
        }

        e.preventDefault();
        }
});

console.log('Content script loaded', isEnabled);