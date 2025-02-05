let isEnabled = false;

// Initialize the state from storage when the content script loads
chrome.storage.local.get(['enabled'], function(result) {
    isEnabled = result.enabled !== undefined ? result.enabled : false;
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hasOwnProperty('enabled')) {
        isEnabled = request.enabled;
        // Persist the state
        chrome.storage.local.set({ enabled: isEnabled });
    }
});

// Add click event listener to the document
document.addEventListener('click', function(e) {
    if (!isEnabled) return; // Skip if feature is disabled
    
    // Check if element is editable in any way
    const elementInfo = {
        tagName: e.target.tagName,
        nodeName: e.target.nodeName,
        id: e.target.id,
        className: e.target.className,
        value: e.target.value,
        type: e.target.type,
        isTextArea: e.target instanceof HTMLTextAreaElement,
        isInput: e.target instanceof HTMLInputElement
    };
    
    console.log('Element Properties:', elementInfo);
    
    // TODO: Improve text input detection and handling:
    // 1. Add support for dynamic/custom elements (e.g., rich text editors like CKEditor, TinyMCE)
    // 2. Handle Shadow DOM elements
    // 3. Support iframe content
    // 4. Add detection for role="textbox" and contenteditable divs
    // 5. Consider using MutationObserver for dynamically loaded inputs
    if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.contentEditable === 'true' ||
        e.target.isContentEditable
    ) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'P') {
            e.target.value = 'hello world';
        } else {
            // For contenteditable elements
            e.target.textContent = 'hello world';
        }
    }

    if (e.target.classList.contains('selectable-text') && e.target.classList.contains('copyable-text')) {
        // Create and dispatch an 'input' event
        e.target.textContent = 'hello world';
        
        // Trigger WhatsApp's input handling
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: 'hello world'
        });
        e.target.dispatchEvent(inputEvent);
    }
});

console.log('Content script loaded', isEnabled);