document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('enableTLDR');
    
    // Get initial state from storage and update UI
    chrome.storage.local.get(['enabled'], function(result) {
        toggle.checked = result.enabled !== undefined ? result.enabled : false;
    });

    toggle.addEventListener('change', function() {
        const isEnabled = toggle.checked;
        // Save state to storage
        chrome.storage.local.set({ enabled: isEnabled });
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {enabled: isEnabled});
        });
    });
});