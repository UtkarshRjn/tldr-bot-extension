import { extractMessageInfo } from '../utils/formatters.js';

export const collectMessages = () => {
    const messages = [];
    const messageElements = document.querySelectorAll('[data-pre-plain-text]');
    
    messageElements.forEach(msgElement => {
        const messageInfo = extractMessageInfo(msgElement);
        if (messageInfo) {
            messages.push(messageInfo);
        }
    });

    return messages;
};

export const sendToWhatsApp = (text) => {
    const inputField = document.querySelector('footer [contenteditable="true"][role="textbox"][data-lexical-editor="true"]');
    if (!inputField) return false;

    inputField.focus();
    inputField.textContent = '';

    // Simulate typing
    for (let char of text) {
        const events = [
            new KeyboardEvent('keydown', {
                key: char,
                code: 'Key' + char.toUpperCase(),
                bubbles: true,
                cancelable: true,
                composed: true
            }),
            new InputEvent('beforeinput', {
                inputType: 'insertText',
                data: char,
                bubbles: true,
                cancelable: true
            }),
            new InputEvent('input', {
                inputType: 'insertText',
                data: char,
                bubbles: true,
                cancelable: true
            })
        ];

        events.forEach(event => inputField.dispatchEvent(event));
    }

    return true;
}; 