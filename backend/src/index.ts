require("dotenv").config();


import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function main() {
    anthropic.messages.stream({
    messages: [{role: 'user', content: "Hello, i'am Arjun"}],
    model: 'claude-opus-4-20250514',
    max_tokens: 1024,
    system:
}).on('text', (text) => {
    console.log(text);
});
}

main()

//console.log(process.env.CLAUDE_API_KEY)