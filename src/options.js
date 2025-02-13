// Save options to chrome.storage
document.getElementById('save').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        document.getElementById('status').textContent = 'Error: API key cannot be empty';
        document.getElementById('status').style.color = 'red';
        return;
    }

    chrome.storage.local.set({
        deepseekKey: apiKey
    }, function() {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved successfully!';
        status.style.color = 'green';
        setTimeout(function() {
            status.textContent = '';
        }, 2000);
    });
});

// Load saved API key
chrome.storage.local.get(['deepseekKey'], function(result) {
    if (result.deepseekKey) {
        document.getElementById('apiKey').value = result.deepseekKey;
    }
}); 