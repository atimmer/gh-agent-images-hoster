import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listMyCliTokens = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const tokens = await ctx.db
      .query("cliTokens")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return tokens.map((token) => ({
      _id: token._id,
      label: token.label,
      tokenPreview: token.tokenPreview,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt ?? null,
      revokedAt: token.revokedAt ?? null,
    }));
  },
});

export const revokeMyCliToken = mutation({
  args: {
    tokenId: v.id("cliTokens"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to revoke a CLI token.");
    }

    const token = await ctx.db.get(args.tokenId);
    if (!token) {
      throw new Error("Token was not found.");
    }

    if (token.userId !== identity.subject) {
      throw new Error("You can only revoke your own CLI tokens.");
    }

    await ctx.db.patch(args.tokenId, {
      revokedAt: Date.now(),
    });
  },
});

export const storeCliToken = internalMutation({
  args: {
    userId: v.string(),
    label: v.string(),
    tokenHash: v.string(),
    tokenPreview: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cliTokens", {
      userId: args.userId,
      label: args.label,
      tokenHash: args.tokenHash,
      tokenPreview: args.tokenPreview,
      createdAt: Date.now(),
    });
  },
});
