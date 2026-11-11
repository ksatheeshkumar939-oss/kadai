

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { db } from "@/lib/supabase";
import { aiJson } from "@/lib/ai";
import { listingPrompt } from "@/lib/prompts";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const listingSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  suggested_price_usd: z.number().nonnegative(),
  details: z.string(),
});

function isValidImageSignature(
  buffer: Buffer,
  mimeType: string
): boolean {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const note = formData.get("note");

    // Validate uploaded file
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Product image is required." },
        { status: 400 }
      );
    }

    if (typeof note !== "string" || !note.trim()) {
      return NextResponse.json(
        { error: "Product note is required." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 4 MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type as keyof typeof ALLOWED_TYPES;

    if (!(mimeType in ALLOWED_TYPES)) {
      return NextResponse.json(
        { error: "Only JPG, PNG and WEBP images are allowed." },
        { status: 400 }
      );
    }

    // Read uploaded image once
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isValidImageSignature(buffer, mimeType)) {
      return NextResponse.json(
        { error: "Invalid image file. File content does not match its type." },
        { status: 400 }
      );
    }

    // Upload image to Supabase Storage
    const extension = ALLOWED_TYPES[mimeType];
    const filePath = `listings/${randomUUID()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("SUPABASE UPLOAD ERROR:", uploadError);

      return NextResponse.json(
        { error: "Failed to upload product image." },
        { status: 500 }
      );
    }

    // Get public image URL
    const { data: publicData } = db.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl = publicData.publicUrl;

    // Generate AI listing
    try {
      const listing = await aiJson(
        listingPrompt(note.trim()),
        listingSchema,
        {
          data: buffer,
          mediaType: mimeType,
        }
      );

      return NextResponse.json({
        image_url: imageUrl,
        ai_failed: false,
        ...listing,
      });
    } catch (aiError) {
      console.error("Listing AI failed:", aiError);

      // Preserve uploaded image even if AI fails
      return NextResponse.json({
        image_url: imageUrl,
        ai_failed: true,
      });
    }
  } catch (error) {
    console.error("LISTING API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating the listing." },
      { status: 500 }
    );
  }
}
