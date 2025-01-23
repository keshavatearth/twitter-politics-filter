class ContentAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent?key=${this.apiKey}`;
    }

    async analyzeContent(text) {
        try {
            const system_instructions = await fetch(chrome.runtime.getURL('grading_instructions.txt'));
            const instructions = await system_instructions.text();
            const prompt = `${instructions}

Here's the tweet to analyze: "${text}"`;

            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: JSON.stringify({
                    contents: [{
                        parts:[{
                            text: prompt
                        }]
                    }]
                }),
            });

            const result = await response.json();
            console.log('Gemini API response:', result);  // Debug log

            // Check if we have a valid response
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('Unexpected API response format:', result);
                return false;
            }

            const decision = result.candidates[0].content.parts[0].text.trim().toLowerCase();
            console.log('Decision for content:', { text, decision });  // Debug log
            
            return decision === 'blocked';
        } catch (error) {
            console.error('Error analyzing content:', error);
            return false;  // Default to showing content if analysis fails
        }
    }
}

export default ContentAnalyzer;