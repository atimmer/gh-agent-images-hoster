"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { createHash, randomBytes } from "node:crypto";
import { internal } from "./_generated/api";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateCliToken(): string {
  return `ghimg_${randomBytes(24).toString("hex")}`;
}

function createTokenPreview(token: string): string {
  return `${token.slice(0, 10)}...${token.slice(-4)}`;
}

export const createCliToken = action({
  args: {
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to create CLI tokens.");
    }

    const token = generateCliToken();
    const tokenHash = hashToken(token);
    const safeLabel = args.label?.trim() || `CLI token ${new Date().toISOString().slice(0, 10)}`;

    const tokenId = await ctx.runMutation(internal.cliTokens.storeCliToken, {
      userId: identity.subject,
      label: safeLabel,
      tokenHash,
      tokenPreview: createTokenPreview(token),
    });

    return {
      token,
      tokenId,
      label: safeLabel,
    };
  },
});
