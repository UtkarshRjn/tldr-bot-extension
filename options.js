// Save options to chrome.storage
document.getElementById('save').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        document.getElementById('status').textContent = 'Error: API key cannot be empty';
        document.getElementById('status').style.color = 'red';
        return;
    }

    if (!apiKey.startsWith('sk-')) {
        document.getElementById('status').textContent = 'Error: Invalid API key format';
        document.getElementById('status').style.color = 'red';
        return;
    }

    chrome.storage.local.set({
        openaiKey: apiKey
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
chrome.storage.local.get(['openaiKey'], function(result) {
    if (result.openaiKey) {
        document.getElementById('apiKey').value = result.openaiKey;
    }
}); 