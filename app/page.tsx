"use client";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import Image from "next/image";

type DashboardImage = {
  _id: Id<"images">;
  imageId: string;
  createdAt: number;
  agentName: string;
  originalFileName: string;
  contentType: string;
  byteSize: number;
  markdownAlt: string;
  imagePath: string;
  markdown: string;
};

type CliTokenSummary = {
  _id: Id<"cliTokens">;
  label: string;
  tokenPreview: string;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) {
    return "never";
  }

  return new Date(timestamp).toLocaleString();
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function generateCliToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const tokenBody = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `ghimg_${tokenBody}`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.cyan.500/.25),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-cyan-300">
              GitHub PR Assets
            </p>
            <h1 className="text-xl font-semibold text-slate-50">GH Agent Images Hoster</h1>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10">
        <SignedOut>
          <section className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-6 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-10 text-center shadow-2xl shadow-cyan-950/40">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-200">
              Immutable Image Hosting for Agents
            </p>
            <h2 className="text-4xl font-semibold leading-tight text-slate-50">
              Upload once, paste markdown into pull requests forever.
            </h2>
            <p className="text-base text-slate-300">
              Sign in to create CLI tokens, upload images with an agent name, and copy
              markdown links that render publicly.
            </p>
            <SignInButton mode="modal">
              <button className="rounded-lg border border-cyan-300 bg-cyan-400 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-300">
                Sign in to continue
              </button>
            </SignInButton>
          </section>
        </SignedOut>

        <SignedIn>
          <Dashboard />
        </SignedIn>
      </main>
    </div>
  );
}

function Dashboard() {
  const images = useQuery(api.images.listMyImages) as DashboardImage[] | undefined;
  const cliTokens = useQuery(
    api.cliTokens.listMyCliTokens,
  ) as CliTokenSummary[] | undefined;
  const createCliToken = useMutation(api.cliTokens.createMyCliToken);
  const revokeCliToken = useMutation(api.cliTokens.revokeMyCliToken);

  const [agentName, setAgentName] = useState("codex-agent");
  const [label, setLabel] = useState("Primary token");
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [appOrigin, setAppOrigin] = useState("");

  useEffect(() => {
    setAppOrigin(window.location.origin);
  }, []);

  const setupTokenPlaceholder = justCreatedToken ?? "<paste-token-here>";
  const setupAgent = agentName.trim() || "codex-agent";
  const setupOrigin = appOrigin || "https://your-host.example.com";
  const setupCommand = `gh-agent-images auth login --api ${setupOrigin} --token ${setupTokenPlaceholder} --agent ${setupAgent}`;

  const handleCreateToken = async () => {
    setIsCreatingToken(true);
    setCreateError(null);

    try {
      const token = generateCliToken();
      const tokenHash = await sha256Hex(token);
      const safeLabel = label.trim() || "CLI token";

      await createCliToken({
        label: safeLabel,
        tokenHash,
        tokenPreview: `${token.slice(0, 10)}...${token.slice(-4)}`,
      });
      setJustCreatedToken(token);
      setCopiedMessage(null);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Token creation failed unexpectedly.",
      );
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleRevokeToken = async (tokenId: Id<"cliTokens">) => {
    await revokeCliToken({ tokenId });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/80">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-50">Uploaded Images</h2>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-mono text-xs text-cyan-200">
            Public + Immutable
          </span>
        </div>

        {images === undefined ? (
          <p className="text-slate-300">Loading your images...</p>
        ) : images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-slate-300">
            No uploads yet. Use the CLI command in settings to upload your first image.
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image) => {
              const previewImageUrl = image.imagePath;
              const markdownImageUrl = `${setupOrigin}${image.imagePath}`;
              const markdown = `![${image.markdownAlt}](${markdownImageUrl})`;

              return (
                <article
                    key={image._id}
                    className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[160px_1fr]"
                >
                  <Image
                    alt={image.markdownAlt}
                    src={previewImageUrl}
                    width={640}
                    height={360}
                    className="h-28 w-full rounded-lg border border-slate-800 object-cover"
                  />
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-200">
                        Agent: {image.agentName}
                      </span>
                      <span>{formatBytes(image.byteSize)}</span>
                      <span>{formatDate(image.createdAt)}</span>
                    </div>

                    <p className="font-medium text-slate-100">{image.originalFileName}</p>

                    <div className="rounded-md bg-slate-900 p-2 font-mono text-xs text-cyan-200">
                      {markdown}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                        onClick={async () => {
                          const copied = await copyText(markdown);
                          setCopiedMessage(copied ? "Markdown copied" : "Clipboard copy failed");
                        }}
                      >
                        Copy markdown
                      </button>
                      <a
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                        href={previewImageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/80">
          <h2 className="text-2xl font-semibold text-slate-50">CLI Settings</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create a token, then run the setup command once on your machine.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-200">
              Default agent name
              <input
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-300"
              />
            </label>

            <label className="block text-sm text-slate-200">
              New token label
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition focus:border-cyan-300"
              />
            </label>

            <button
              type="button"
              className="rounded-md border border-cyan-300 bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleCreateToken}
              disabled={isCreatingToken}
            >
              {isCreatingToken ? "Creating token..." : "Create CLI token"}
            </button>

            {createError ? <p className="text-sm text-rose-300">{createError}</p> : null}

            {justCreatedToken ? (
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                <p className="font-semibold">New token (shown only once)</p>
                <p className="mt-1 break-all font-mono text-xs">{justCreatedToken}</p>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Setup command</p>
              <p className="mt-1 break-all font-mono text-xs text-cyan-200">{setupCommand}</p>
              <button
                type="button"
                className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
                onClick={async () => {
                  const copied = await copyText(setupCommand);
                  setCopiedMessage(copied ? "Setup command copied" : "Clipboard copy failed");
                }}
              >
                Copy setup command
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/80">
          <h3 className="text-lg font-semibold text-slate-50">Active CLI Tokens</h3>
          {cliTokens === undefined ? (
            <p className="mt-3 text-sm text-slate-300">Loading tokens...</p>
          ) : cliTokens.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No tokens yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {cliTokens.map((token) => (
                <div
                  key={token._id}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{token.label}</p>
                    {token.revokedAt ? (
                      <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200">
                        Revoked
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition hover:border-rose-300 hover:text-rose-200"
                        onClick={() => {
                          void handleRevokeToken(token._id);
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-cyan-200">{token.tokenPreview}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Created: {formatDate(token.createdAt)} | Last used: {formatDate(token.lastUsedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {copiedMessage ? <p className="mt-3 text-xs text-cyan-200">{copiedMessage}</p> : null}
        </div>
      </section>
    </div>
  );
}
