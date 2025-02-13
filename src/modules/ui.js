import { formatText } from '../utils/formatters.js';
import { SELECTORS } from '../config/constants.js';

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

    // Add event listeners
    summaryDiv.querySelector('.close-button').onclick = () => summaryDiv.remove();
    summaryDiv.querySelector(SELECTORS.REGENERATE_BUTTON).onclick = onRegenerate;
    summaryDiv.querySelector(SELECTORS.SEND_BUTTON).onclick = onSendToChat;

    return summaryDiv;
}; 