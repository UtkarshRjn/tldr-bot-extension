export async function summarizeMessages(messages, apiKey) {
    if (!apiKey) {
        return 'Please set your Gemini API key in the extension options (Right-click extension icon → Options)';
    }
    
    try {
        const conversationText = messages
            .map(msg => `${msg.author} (${msg.timestamp}): ${msg.message}`)
            .join('\n');

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{
                        text: `You are a helpful assistant that provides concise TLDR summaries of conversations. Focus on the main points and action items, don't include any heading to the generated summary. Please provide a brief TLDR summary of this conversation:\n\n${conversationText}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                return 'Invalid API key. Please check your API key in the extension options.';
            }
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts[0]?.text || 'No summary generated';
    } catch (error) {
        console.error('Error:', error);
        return 'Error generating summary. Please check your API key and try again.';
    }
} 