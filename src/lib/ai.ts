import "server-only";

import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import type { z } from "zod";

const TIMEOUT_MS = 25_000;
const MAX_RETRIES = 0;

function getGeminiModel() {
  const model = process.env.GEMINI_MODEL;
  if (!model) throw new Error("GEMINI_MODEL is not configured");
  return google(model);
}

function getGroqModel() {
  const model = process.env.GROQ_MODEL;
  if (!model) throw new Error("GROQ_MODEL is not configured");
  return groq(model);
}

type ImageInput = {
  data: string | Uint8Array;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
};

function createPrompt(prompt: string, image?: ImageInput) {
  if (!image) return prompt;

  return [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: prompt },
        {
          type: "file" as const,
          data: image.data,
          mediaType: image.mediaType,
        },
      ],
    },
  ];
}

const AI_UNAVAILABLE = "AI service is temporarily unavailable. Please try again.";

export async function aiJson<T>(
  prompt: string,
  schema: z.ZodType<T>,
  image?: ImageInput
): Promise<T> {
  try {
    const result = await generateText({
      model: getGeminiModel(),
      output: Output.object({ schema }),
      prompt: createPrompt(prompt, image),
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });

    console.log("AI JSON: Gemini success");
    return result.output;
  } catch (geminiError) {
    console.error("GEMINI FAILED:", geminiError);

    // Groq cannot read photos, so with a photo we stop here.
    if (image) {
      throw new Error(AI_UNAVAILABLE);
    }

    console.error("Trying Groq fallback");
    try {
      const result = await generateText({
        model: getGroqModel(),
        output: Output.object({ schema }),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: MAX_RETRIES,
      });

      console.log("AI JSON: Groq text fallback success");
      return result.output;
    } catch (groqError) {
      console.error("GROQ FALLBACK FAILED:", groqError);
      throw new Error(AI_UNAVAILABLE);
    }
  }
}

export async function aiText(prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model: getGeminiModel(),
      prompt,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });

    console.log("AI TEXT: Gemini success");
    return result.text;
  } catch (geminiError) {
    console.error("GEMINI TEXT FAILED - Trying Groq:", geminiError);

    try {
      const result = await generateText({
        model: getGroqModel(),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: MAX_RETRIES,
      });

      console.log("AI TEXT: Groq fallback success");
      return result.text;
    } catch (groqError) {
      console.error("GROQ TEXT FAILED:", groqError);
      throw new Error(AI_UNAVAILABLE);
    }
  }
}
