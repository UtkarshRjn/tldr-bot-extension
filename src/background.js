// Add this to your background.js file
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "reload_extension") {
        chrome.runtime.reload();
    }
}); 