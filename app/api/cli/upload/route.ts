import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { sha256Hex } from "@/lib/tokenHash";
import { getServerConvexClient } from "@/lib/convexServerClient";

export const runtime = "nodejs";

type UploadStorageResponse = {
  storageId?: string;
};

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, value] = authorizationHeader.trim().split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return value;
}

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;

  return `${proto}://${host}`;
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\[\]])/g, "\\$1");
}

export async function POST(request: Request) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      {
        error: "Missing bearer token. Use: Authorization: Bearer <token>",
      },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const agentName = formData.get("agentName");
    const markdownAlt = formData.get("alt");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Form field `file` is required.",
        },
        { status: 400 },
      );
    }

    if (typeof agentName !== "string" || !agentName.trim()) {
      return NextResponse.json(
        {
          error: "Form field `agentName` is required.",
        },
        { status: 400 },
      );
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Only image uploads are supported.",
        },
        { status: 400 },
      );
    }

    const convex = getServerConvexClient();
    const tokenHash = sha256Hex(token);

    const uploadIntent = await convex.mutation(api.images.issueUploadIntent, {
      tokenHash,
      agentName: agentName.trim(),
      originalFileName: file.name,
      contentType,
      byteSize: file.size,
      markdownAlt: typeof markdownAlt === "string" ? markdownAlt : undefined,
    });

    const uploadResponse = await fetch(uploadIntent.uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: Buffer.from(await file.arrayBuffer()),
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      return NextResponse.json(
        {
          error: `Storage upload failed with status ${uploadResponse.status}: ${responseText}`,
        },
        { status: 502 },
      );
    }

    const uploaded = (await uploadResponse.json()) as UploadStorageResponse;
    if (!uploaded.storageId) {
      return NextResponse.json(
        {
          error: "Storage upload did not return a storageId.",
        },
        { status: 502 },
      );
    }

    const finalized = await convex.mutation(api.images.finalizeUploadIntent, {
      tokenHash,
      intentId: uploadIntent.intentId,
      storageId: uploaded.storageId as Id<"_storage">,
    });

    const imageUrl = `${getOrigin(request)}/i/${finalized.imageId}`;
    const safeAlt = escapeMarkdownText(finalized.markdownAlt || file.name);

    return NextResponse.json({
      imageId: finalized.imageId,
      imageUrl,
      markdown: `![${safeAlt}](${imageUrl})`,
      agentName: agentName.trim(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload failure.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
