
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

/**
 * Generates structured JSON using Gemini.
 * Falls back to Groq for text-only requests.
 * Images are never sent to Groq.
 */
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
              role: "user" as const,
              content: [
                { type: "text" as const, text: prompt },
                { type: "image" as const, image },
              ],
            },
          ]
        : prompt,
      timeout: TIMEOUT_MS,
      maxRetries: 0,
    });

    return result.output;
  } catch (geminiError) {
    // Groq is text-only. Never send images to Groq.
    if (image) {
      throw geminiError;
    }

    try {
      const result = await generateText({
        model: getGroqModel(),
        output: Output.object({ schema }),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: 0,
      });

      return result.output;
    } catch {
      throw new Error("AI service is unavailable. Please try again.");
    }
  }
}

/**
 * Generates plain text using Gemini.
 * Falls back to Groq if Gemini fails.
 */
export async function aiText(prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model: getGeminiModel(),
      prompt,
      timeout: TIMEOUT_MS,
      maxRetries: 0,
    });

    return result.text;
  } catch {
    try {
      const result = await generateText({
        model: getGroqModel(),
        prompt,
        timeout: TIMEOUT_MS,
        maxRetries: 0,
      });

      return result.text;
    } catch {
      throw new Error("AI service is unavailable. Please try again.");
    }
  }
}

