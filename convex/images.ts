import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const UPLOAD_INTENT_TTL_MS = 30 * 60 * 1000;

function requireNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function defaultAltFromFilename(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "Uploaded image";
}

function createImageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  const seed = Math.random().toString(16).slice(2, 18);
  const now = Date.now().toString(16);
  return `${now}-${seed}`;
}

export const listMyImages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const records = await ctx.db
      .query("images")
      .withIndex("by_uploader_created_at", (q) =>
        q.eq("uploaderUserId", identity.subject),
      )
      .order("desc")
      .take(200);

    return records.map((record) => ({
      _id: record._id,
      imageId: record.imageId,
      createdAt: record.createdAt,
      agentName: record.agentName,
      originalFileName: record.originalFileName,
      contentType: record.contentType,
      byteSize: record.byteSize,
      markdownAlt: record.markdownAlt,
      imagePath: `/i/${record.imageId}`,
      markdown: `![${record.markdownAlt}](/i/${record.imageId})`,
    }));
  },
});

export const issueUploadIntent = mutation({
  args: {
    tokenHash: v.string(),
    agentName: v.string(),
    originalFileName: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
    markdownAlt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activeToken = await ctx.db
      .query("cliTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!activeToken || activeToken.revokedAt) {
      throw new Error("Invalid or revoked CLI token.");
    }

    if (!args.contentType.startsWith("image/")) {
      throw new Error("Only image uploads are supported.");
    }

    if (args.byteSize <= 0 || args.byteSize > MAX_IMAGE_BYTES) {
      throw new Error(`Image size must be between 1 byte and ${MAX_IMAGE_BYTES} bytes.`);
    }

    const agentName = requireNonEmpty(args.agentName, "Agent name");
    const originalFileName = requireNonEmpty(
      args.originalFileName,
      "Original file name",
    );

    const markdownAlt =
      args.markdownAlt?.trim() || defaultAltFromFilename(originalFileName);

    const uploadUrl = await ctx.storage.generateUploadUrl();

    const now = Date.now();
    const intentId = await ctx.db.insert("uploadIntents", {
      tokenId: activeToken._id,
      userId: activeToken.userId,
      agentName,
      originalFileName,
      contentType: args.contentType,
      byteSize: args.byteSize,
      markdownAlt,
      createdAt: now,
    });

    await ctx.db.patch(activeToken._id, {
      lastUsedAt: now,
    });

    return {
      intentId,
      uploadUrl,
    };
  },
});

export const finalizeUploadIntent = mutation({
  args: {
    tokenHash: v.string(),
    intentId: v.id("uploadIntents"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const activeToken = await ctx.db
      .query("cliTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!activeToken || activeToken.revokedAt) {
      throw new Error("Invalid or revoked CLI token.");
    }

    const uploadIntent = await ctx.db.get(args.intentId);
    if (!uploadIntent) {
      throw new Error("Upload intent was not found.");
    }

    if (uploadIntent.tokenId !== activeToken._id) {
      throw new Error("Upload intent does not match this token.");
    }

    if (uploadIntent.consumedAt) {
      throw new Error("Upload intent has already been finalized.");
    }

    if (Date.now() - uploadIntent.createdAt > UPLOAD_INTENT_TTL_MS) {
      throw new Error("Upload intent expired. Please upload again.");
    }

    const storageMetadata = await ctx.storage.getMetadata(args.storageId);
    if (!storageMetadata) {
      throw new Error("Uploaded file could not be located in storage.");
    }

    const now = Date.now();
    const imageId = createImageId();

    await ctx.db.insert("images", {
      imageId,
      storageId: args.storageId,
      uploaderUserId: uploadIntent.userId,
      agentName: uploadIntent.agentName,
      originalFileName: uploadIntent.originalFileName,
      contentType: uploadIntent.contentType,
      byteSize: uploadIntent.byteSize,
      markdownAlt: uploadIntent.markdownAlt,
      createdAt: now,
    });

    await ctx.db.patch(uploadIntent._id, {
      consumedAt: now,
    });

    await ctx.db.patch(activeToken._id, {
      lastUsedAt: now,
    });

    return {
      imageId,
      contentType: storageMetadata.contentType ?? uploadIntent.contentType,
      byteSize: storageMetadata.size,
      markdownAlt: uploadIntent.markdownAlt,
    };
  },
});

export const getPublicImageById = query({
  args: {
    imageId: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db
      .query("images")
      .withIndex("by_image_id", (q) => q.eq("imageId", args.imageId))
      .unique();

    if (!image) {
      return null;
    }

    const downloadUrl = await ctx.storage.getUrl(image.storageId);
    if (!downloadUrl) {
      return null;
    }

    return {
      imageId: image.imageId,
      downloadUrl,
      originalFileName: image.originalFileName,
      contentType: image.contentType,
      byteSize: image.byteSize,
    };
  },
});
