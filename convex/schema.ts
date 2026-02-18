import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  images: defineTable({
    imageId: v.string(),
    storageId: v.id("_storage"),
    uploaderUserId: v.string(),
    agentName: v.string(),
    originalFileName: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
    markdownAlt: v.string(),
    createdAt: v.number(),
  })
    .index("by_image_id", ["imageId"])
    .index("by_uploader_created_at", ["uploaderUserId", "createdAt"]),

  cliTokens: defineTable({
    userId: v.string(),
    label: v.string(),
    tokenHash: v.string(),
    tokenPreview: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_token_hash", ["tokenHash"]),

  uploadIntents: defineTable({
    tokenId: v.id("cliTokens"),
    userId: v.string(),
    agentName: v.string(),
    originalFileName: v.string(),
    contentType: v.string(),
    byteSize: v.number(),
    markdownAlt: v.string(),
    createdAt: v.number(),
    consumedAt: v.optional(v.number()),
  }).index("by_user_created_at", ["userId", "createdAt"]),
});
