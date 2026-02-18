import { api } from "@/convex/_generated/api";
import { getServerConvexClient } from "@/lib/convexServerClient";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const convex = getServerConvexClient();

  const image = await convex.query(api.images.getPublicImageById, { imageId });
  if (!image) {
    return new Response("Image not found", { status: 404 });
  }

  const upstreamResponse = await fetch(image.downloadUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Image is unavailable", { status: 502 });
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.byteSize),
      "Content-Disposition": `inline; filename="${sanitizeFileName(image.originalFileName)}"`,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
