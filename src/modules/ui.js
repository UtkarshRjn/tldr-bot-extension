import { formatText } from '../utils/formatters.js';

export const createSummaryPopup = (summary, onRegenerate, onSendToChat) => {
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

    // Add close button and event listeners
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

    // Add event listeners
    summaryDiv.querySelector('#regenerateSummary').onclick = onRegenerate;
    summaryDiv.querySelector('#sendToChat').onclick = onSendToChat;

    return summaryDiv;
}; 