import dotenv from 'dotenv';

dotenv.config();

const LOCAL_AI_ENDPOINT = process.env.LOCAL_AI_ENDPOINT || 'http://localhost:1234/v1';

export async function askLocalAI(prompt: string, context: string = "") {
    try {
        const response = await fetch(`${LOCAL_AI_ENDPOINT}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "qwen/qwen3-4b-thinking-2507",
                messages: [
                    {
                        role: "system",
                        content: "You are the 'ShopTheBarber' AI Assistant. You help users with style recommendations, finding the right barber, and understanding grooming services. Keep responses professional, helpful, and concise. " + context
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Local AI Error Response:', errorText);
            throw new Error(`Local AI request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('Local AI Connection Error:', error);
        return "I'm currently offline. Please check if your local AI server (LM Studio/Grok) is running on port 1234.";
    }
}
