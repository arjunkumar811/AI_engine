require("dotenv").config();
import express from 'express';
import cors from "cors"


import Anthropic from "@anthropic-ai/sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { TextBlock } from '@anthropic-ai/sdk/resources/messages';
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";

const anthropic = new Anthropic();
const app = express()
app.use(express.json())
app.use(cors());



app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    const response = await anthropic.messages.create({
        messages: [{
            role: 'user', content: prompt
        }],
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra"
    })

    const answer = (response.content[0] as TextBlock).text; // react or node
    if (answer == "react") {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }

    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }

    res.status(403).json({message: "You cant access this"})
    return;

})


app.post("/chat", async (req, res) => {
    const messages = req.body.messages
    const response = await anthropic.messages.create({
        messages: messages,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: getSystemPrompt()
    })
    
    console.log(response);

    res.json({});

})



app.listen(3000);

// async function main() {
//     anthropic.messages.stream({
//     messages: [{role: 'user', content: "Hello, i'am Arjun"}],
//     model: 'claude-opus-4-20250514',
//     max_tokens: 1024,
//     system: getSystemPrompt()
// }).on('text', (text) => {
//     console.log(text);
// });
// }

// main()

//console.log(process.env.CLAUDE_API_KEY)