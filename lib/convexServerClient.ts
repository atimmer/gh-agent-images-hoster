import { ConvexHttpClient } from "convex/browser";

export function getServerConvexClient(): ConvexHttpClient {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is required. Set it in your environment before calling server APIs.",
    );
  }

  return new ConvexHttpClient(convexUrl);
}
