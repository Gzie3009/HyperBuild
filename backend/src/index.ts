require("dotenv").config();
import Anthropic from "@anthropic-ai/sdk";
import { TextBlock } from "@anthropic-ai/sdk/resources";
import express, { response } from "express";
import { Request, Response } from "express";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendMail } from "./sendMail";

const app = express();
app.use(express.json());
app.use(cors());

const anthropic = new Anthropic();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}
const gemini = new GoogleGenerativeAI(geminiApiKey);
const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});
const openrouterDeepseek = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

//@ts-ignore
app.post("/template", async (req, res) => {
  console.log("called template with Gemini");
  await sendMail();
  const prompt = req.body.prompt;
  try {
    const systemPrompt =
      "Return either 'node' or 'react' based on what you think this project should be. Only return a single word: either 'node' or 'react'. Do not return anything extra.";

    const messages = [
      { role: "user", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    //@ts-ignore
    const geminiMessages = messages.map((msg) => ({
      role: "user",
      parts: [{ text: msg.content }],
    }));

    const chat = gemini
      .getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      .startChat({
        history: geminiMessages.slice(0, -1),
      });

    const lastMessage = geminiMessages[geminiMessages.length - 1];

    if (!lastMessage?.parts?.[0]?.text) {
      console.error("Invalid last message format:", lastMessage);
      return res.status(400).json({ error: "Invalid message format" });
    }

    const response = await chat.sendMessage(lastMessage.parts[0].text);
    const answer = await response.response.text();

    console.log("Gemini classification:", answer);

    if (answer.trim().toLowerCase() === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer.trim().toLowerCase() === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(403).json({ message: "You can't access this" });
  } catch (error) {
    console.error("Error in /template route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/chat/anthropic", async (req, res) => {
  console.log("called anthropic");
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
  console.log("called openai");
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
//@ts-ignore
app.post("/chat/gemini", async (req, res) => {
  console.log("called gemini");
  try {
    const systemPrompt = getSystemPrompt();
    let messages = req.body.messages;

    if (systemPrompt) {
      messages = [{ role: "user", content: systemPrompt }, ...messages];
    }
    //@ts-ignore
    const geminiMessages = messages.map((msg) => ({
      role: "user",
      parts: [{ text: msg.content }],
    }));

    const chat = gemini
      .getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      .startChat({
        history: geminiMessages.slice(0, -1),
      });

    const lastMessage = geminiMessages[geminiMessages.length - 1];

    if (!lastMessage?.parts?.[0]?.text) {
      console.error("Invalid last message format:", lastMessage);
      return res.status(400).json({ error: "Invalid message format" });
    }

    const response = await chat.sendMessage(lastMessage.parts[0].text);
    const responseText = await response.response.text();
    saveResponse(responseText);

    res.json({ response: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error || "An error occurred" });
  }
});

app.post("/chat/deepseek", async (req, res) => {
  console.log("called deeepseek");
  const systemPrompt = getSystemPrompt();
  let messages = req.body.messages;
  if (systemPrompt) {
    messages = [{ role: "user", content: systemPrompt }, ...messages];
  }
  // modelnames from openrouter.ai
  // meta-llama/llama-3.3-70b-instruct:free //not tested
  // nvidia/llama-3.1-nemotron-70b-instruct:free // max errors
  // qwen/qwen2.5-vl-72b-instruct:free  //workinggg
  // deepseek/deepseek-chat:free //not works sometimes
  // deepseek/deepseek-r1:free // works most of the times
  //@ts-ignore
  try {
    const response = await openrouterDeepseek.chat.completions.create({
      messages,
      model: "deepseek/deepseek-r1:free ",
      max_completion_tokens: 16000,
      temperature: 1,
    });
    const responseText = response.choices[0].message.content
      ?.replace("```", "")
      .replace("```tsx", "")
      .replace("```css", "");
    res.json({ response: responseText });
    responseText && saveResponse(responseText);
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

app.get("/api/shutdown/300903", (req, res) => {
  console.log("Shutdown API called. Stopping server...");
  res.status(200).json({ message: "Server is shutting down..." });

  setTimeout(() => {
    process.exit(0);
  }, 3000); // Gives time for response before shutting down
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
