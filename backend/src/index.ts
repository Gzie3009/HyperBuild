require("dotenv").config();
import Anthropic from "@anthropic-ai/sdk";
import { TextBlock } from "@anthropic-ai/sdk/resources";
import express, { response } from "express";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());
app.use(cors());

const anthropic = new Anthropic();
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}
const gemini = new GoogleGenerativeAI(geminiApiKey);
const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

app.post("/template", async (req, res) => {
  console.log("called template");
  const prompt = req.body.prompt;
  // const response = await anthropic.messages.create({
  //   messages: [
  //     {
  //       role: "user",
  //       content: prompt,
  //     },
  //   ],
  //   model: "claude-3-5-sonnet-20241022",
  //   max_tokens: 200,
  //   system:
  //     "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
  // });

  // const answer = (response.content[0] as TextBlock).text;
  const answer = "react";
  if (answer == "react") {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [reactBasePrompt],
    });
    return;
  }

  if (answer === "node") {
    res.json({
      prompts: [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [nodeBasePrompt],
    });
    return;
  }

  res.status(403).json({ message: "You cant access this" });
  return;
});

app.post("/chat/anthropic", async (req, res) => {
  const messages = req.body.messages;
  try {
    const response = await anthropic.messages.create({
      messages: messages,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      system: getSystemPrompt(),
    });

    const responseText = (response.content[0] as TextBlock)?.text;
    saveResponse(responseText);

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.post("/chat/openai", async (req, res) => {
  const messages = req.body.messages;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      max_tokens: 8000,
    });

    const responseText = response.choices[0].message.content;
    responseText && saveResponse(responseText);

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.post("/chat/gemini", async (req, res) => {
  const messages = req.body.messages;
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: messages.slice(0, -1), // Exclude the last message which is the current prompt
    });

    const response = await chat.sendMessage(
      messages[messages.length - 1].content
    );
    const responseText = response.response.text();
    saveResponse(responseText);

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.post("/chat/deepseek", async (req, res) => {
  const messages = req.body.messages;
  try {
    const response = await deepseek.chat.completions.create({
      messages: messages,
      model: "deepseek-chat",
      max_tokens: 8000,
    });

    const responseText = response.choices[0].message.content;
    responseText && saveResponse(responseText);

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Utility function to save responses
function saveResponse(responseText: string) {
  const filePath = path.join(__dirname, "responses.json");

  fs.exists(filePath, (exists) => {
    if (exists) {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }

        try {
          const responses = JSON.parse(data);
          responses.push(responseText);

          fs.writeFile(filePath, JSON.stringify(responses, null, 2), (err) => {
            if (err) console.error("Error writing to file:", err);
          });
        } catch (parseError) {
          console.error("Error parsing file data:", parseError);
        }
      });
    } else {
      const responses = [responseText];
      fs.writeFile(filePath, JSON.stringify(responses, null, 2), (err) => {
        if (err) console.error("Error writing to file:", err);
      });
    }
  });
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
