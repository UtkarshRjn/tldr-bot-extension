export const formatText = (text) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\* |(\n)\* /g, '$1• ')
        .replace(/\r?\n|\r/g, '<br>');
};

export const extractMessageInfo = (messageElement) => {
    try {
        const prePlainText = messageElement.getAttribute('data-pre-plain-text');
        let author = 'You';
        let timestamp = '';
        
        if (prePlainText) {
            const match = prePlainText.match(/\[(.*?)\] (.*?):/);
            if (match) {
                timestamp = match[1];
                author = match[2].trim();
            }
        }

        const messageTextElement = messageElement.querySelector('span.selectable-text.copyable-text');
        const messageText = messageTextElement ? messageTextElement.textContent : '';

        return messageText ? { author, message: messageText, timestamp } : null;
    } catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
}; 