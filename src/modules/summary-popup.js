import { formatText } from '../utils/formatters.js';
import { SELECTORS } from '../config/constants.js';

/**
 * Handles the copy functionality for copying summary text to clipboard
 * @param {HTMLElement} summaryContent - The element containing the summary text
 */
export const onCopy = (summaryContent, copyButton) => {
        
    const textToCopy = summaryContent.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {

        copyButton.innerHTML = '✔️ Copied'; 
        setTimeout(() => {
            copyButton.innerHTML = '📋 Copy'; 
        }, 2000);
    }).catch((err) => {
        console.error('Failed to copy text: ', err);
    });
};

export const updatePopupPosition = () => {

    const popup = document.querySelector('.tldr-summary-popup');
    const inputField = document.querySelector('footer [contenteditable="true"][role="textbox"][data-lexical-editor="true"]');

    if (!popup || !inputField) return;
    
    const inputRect = inputField.getBoundingClientRect();

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const bottomPosition = window.innerHeight - inputRect.top + 30;     
    const rightPosition = window.innerWidth - inputRect.right - 60; 


    popup.style.bottom = `${bottomPosition}px`;
    popup.style.right = `${rightPosition}px`;
}

/**
 * Creates and returns a summary popup element
 * @param {string} summary - The summary text to display
 * @param {Function} onRegenerate - Callback for regenerate button
 * @param {Function} onSendToChat - Callback for send to chat button
 * @returns {HTMLElement} The summary popup DOM node
 */
export const createSummaryPopup = async (summary, onRegenerate, onSendToChat) => {

    // Fetch the HTML template
    const response = await fetch(chrome.runtime.getURL('public/summary-popup.html'));
    const template = await response.text();

    // Create temporary container to hold the template
    const container = document.createElement('div');
    container.innerHTML = template;
    const summaryDiv = container.firstElementChild;

    // Set the formatted summary content
    const summaryContent = summaryDiv.querySelector('#summary-content');
    summaryContent.innerHTML = formatText(summary);

    // Add copy to clipboard functionality
    const copyButton = summaryDiv.querySelector('#copySummary');
    copyButton.onclick = () => onCopy(summaryContent, copyButton);

    // Add event listeners
    summaryDiv.querySelector('.close-button').onclick = () => summaryDiv.remove();
    summaryDiv.querySelector(SELECTORS.REGENERATE_BUTTON).onclick = onRegenerate;
    summaryDiv.querySelector(SELECTORS.SEND_BUTTON).onclick = onSendToChat;

    return summaryDiv;
}; 