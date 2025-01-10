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

const app = express();
app.use(express.json());
app.use(cors());

const anthropic = new Anthropic();
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
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

app.post("/chat", async (req, res) => {
  console.log("called chat");
  const messages = req.body.messages;
  const response = await anthropic.messages.create({
    messages: messages,
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8000,
    system: getSystemPrompt(),
  });

  res.json({
    response: (response.content[0] as TextBlock)?.text,
  });

  // Get the current response content
  const responseText = (response.content[0] as TextBlock)?.text;
  const filePath = path.join(__dirname, "responses.json"); // Use .json extension for valid JSON format

  // Check if the file exists
  fs.exists(filePath, (exists) => {
    if (exists) {
      // If file exists, read it and append the new response to the array
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
        }

        try {
          // Parse the existing responses and append the new one
          const responses = JSON.parse(data);
          responses.push(responseText);

          // Write the updated array back to the file
          fs.writeFile(filePath, JSON.stringify(responses, null, 2), (err) => {
            if (err) {
              console.error("Error writing to file:", err);
              return res.status(500).send("Error saving response");
            }

            console.log("Response added to responses.json");
          });
        } catch (parseError) {
          console.error("Error parsing file data:", parseError);
        }
      });
    } else {
      // If file doesn't exist, create it with the first response in an array
      const responses = [responseText];
      fs.writeFile(filePath, JSON.stringify(responses, null, 2), (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        }

        console.log("Response saved to responses.json");
      });
    }
  });
});

app.post("/template-openai", async (req, res) => {
  console.log("called template-openai");
  const prompt = req.body.prompt;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 10,
    });

    const answer =
      response.choices[0]?.message?.content?.trim().toLowerCase() || "";

    if (answer === "react") {
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

    res.status(403).json({ message: "Invalid response from OpenAI" });
  } catch (error) {
    console.error("Error in /template-openai:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/chat-openai", async (req, res) => {
  console.log("called chat-openai");
  const messages = req.body.messages;

  try {
    const openaiMessages = messages.map(
      (msg: { role: Text; content: Text }) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: openaiMessages,
      max_tokens: 8000,
    });

    res.json({
      id: response.data.id,
      type: "message",
      role: "assistant",
      model: "gpt-4",
      content: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in /chat-openai:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
