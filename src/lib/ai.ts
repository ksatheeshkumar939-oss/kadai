
import "server-only";

import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import type { z } from "zod";

const TIMEOUT_MS = 20_000;

function getGeminiModel() {
  const model = process.env.GEMINI_MODEL;

  if (!model) {
    throw new Error("GEMINI_MODEL is not configured");
  }

  return google(model);
}

function getGroqModel() {
  const model = process.env.GROQ_MODEL;

  if (!model) {
    throw new Error("GROQ_MODEL is not configured");
  }

  return groq(model);
}

type ImageInput = string | Uint8Array;

// Structured JSON generation
export async function aiJson<T>(
  prompt: string,
  schema: z.ZodType<T>,
  image?: ImageInput
): Promise<T> {
  try {
    const result = await generateText({
      model: getGeminiModel(),
      output: Output.object({ schema }),
      prompt: image
        ? [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image", image },
              ],
            },
          ]
        : prompt,
      timeout: TIMEOUT_MS,
      maxRetries: 0,
    });

    console.log("AI JSON: Gemini success");
    return result.output;
  } catch (geminiError) {
    console.error("GEMINI ERROR:", geminiError);

    // Groq cannot process images.
    if (image) {
      throw new Error("Gemini image processing failed.");
    }

    try {
      const result = await generateText({
        model: getGroqModel(),
        output: Output.object({ schema }),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: 0,
      });

      console.log("AI JSON: Groq fallback success");
      return result.output;
    } catch (groqError) {
      console.error("GROQ ERROR:", groqError);
      throw new Error("AI service is unavailable. Please try again.");
    }
  }
}

// Plain text generation
export async function aiText(prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model: getGeminiModel(),
      prompt,
      timeout: TIMEOUT_MS,
      maxRetries: 0,
    });

    console.log("AI TEXT: Gemini success");
    return result.text;
  } catch (geminiError) {
    console.error("GEMINI TEXT ERROR:", geminiError);

    try {
      const result = await generateText({
        model: getGroqModel(),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: 0,
      });

      console.log("AI TEXT: Groq fallback success");
      return result.text;
    } catch (groqError) {
      console.error("GROQ TEXT ERROR:", groqError);
      throw new Error("AI service is unavailable. Please try again.");
    }
  }
}

