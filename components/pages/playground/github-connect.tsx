"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  Github,
  GitBranch,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

type GithubStatus = {
  installed: boolean;
  connected: boolean;
  installUrl: string;
  repoFullName?: string;
  owner?: string;
  repo?: string;
};

interface GithubConnectProps {
  slug: string;
  projectName?: string;
  onConnected?: (repoFullName: string) => void;
  compact?: boolean;
  /** Render a single ghost icon button for the top nav (no labelled button). */
  iconOnly?: boolean;
}

// Append the current page as the return target. Academy hands back install URLs
// already ending at `state=<email>+`; for auth URLs we add the return as a
// `redirect_uri`-friendly suffix the same way (academy appends to `state`).
function withReturn(url: string): string {
  const path = window.location.pathname || "/";
  return url + encodeURIComponent(window.location.origin + path);
}

// Handles a 409 that carries an authUrl/installUrl by redirecting the user to
// authorize/install. Returns true if it redirected (caller should stop).
function handle409Redirect(err: any): boolean {
  const d = err?.response?.status === 409 ? err.response.data : null;
  const target = d?.authUrl || d?.installUrl;
  if (typeof target === "string" && target.length > 0) {
    window.location.href = withReturn(target);
    return true;
  }
  return false;
}

// One primary action that reflects connection state for a playground project:
//   not-installed  → "Connect GitHub" (redirect to install the GitHub App)
//   installed      → "Save to GitHub" (auto-provision a repo; handles 409s)
//   connected      → linked repo as a "Synced to GitHub" pill
// An "Advanced" disclosure opens a drawer to create-with-options or connect an
// existing repo, reusing the existing owners/repos store actions.
export function GithubConnect({
  slug,
  projectName,
  onConnected,
  compact = false,
  iconOnly = false,
}: GithubConnectProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const s = await store.getProjectGithub(slug);
      setStatus(s);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await store.getProjectGithub(slug);
        if (active) setStatus(s);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const applyConnected = (repoFullName: string, owner?: string, repo?: string) => {
    setStatus((prev) =>
      prev
        ? { ...prev, installed: true, connected: true, repoFullName, owner, repo }
        : prev,
    );
    setActionError(null);
    onConnected?.(repoFullName);
    toast.success(`Saved to ${repoFullName}`);
  };

  // installed-not-connected primary action: auto-provision and link a repo.
  const handleSave = async () => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await store.connectProjectGithub(slug, { mode: "auto" });
      applyConnected(res.repoFullName, res.owner, res.repo);
    } catch (e) {
      // A 409 with authUrl/installUrl means the user must (re)authorize or
      // install — redirect them rather than dead-ending on an error.
      if (handle409Redirect(e)) return;
      const err = e as { response?: { data?: { message?: string } } };
      setActionError(
        err?.response?.data?.message ??
          "Couldn't save to GitHub. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Auto-provision: as soon as the App is installed but no repo is linked, create
  // mb-<slug> and connect automatically — no manual "Save" click. (handleSave
  // redirects to authorize/install on a 409.)
  useEffect(() => {
    if (
      status?.installed &&
      !status.connected &&
      !saving &&
      !autoTriggeredRef.current
    ) {
      autoTriggeredRef.current = true;
      void handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, saving]);

  // Icon-only entry for the top nav: a single ghost icon button (matches the
  // other nav icons via the playground's `.btn.ghost`/`svg.i` styles). Clicking
  // does the state-appropriate action; the labelled flow + Advanced live in the
  // connect banner.
  if (iconOnly) {
    const onClick = () => {
      if (!status) return;
      if (!status.installed) {
        if (status.installUrl) window.location.href = withReturn(status.installUrl);
        return;
      }
      if (status.connected && status.repoFullName) {
        window.open(`https://github.com/${status.repoFullName}`, "_blank", "noreferrer");
        return;
      }
      void handleSave();
    };
    const title = !status
      ? "GitHub"
      : !status.installed
        ? "Connect GitHub"
        : status.connected && status.repoFullName
          ? `Synced to ${status.repoFullName}`
          : "Save to GitHub";
    return (
      <button
        className="btn ghost"
        onClick={onClick}
        title={title}
        aria-label={title}
        disabled={saving || loading}
      >
        {saving ? (
          <Loader2 className="i animate-spin" />
        ) : (
          <Github className="i" />
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading GitHub…</span>
      </div>
    );
  }

  if (loadError || !status) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Couldn&apos;t load GitHub status.
        </span>
        <Button variant="outline" size="sm" onClick={refresh}>
          Retry
        </Button>
      </div>
    );
  }

  // CONNECTED — show the linked repo.
  if (status.connected && status.repoFullName) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm",
          compact && "px-2.5 py-1.5",
        )}
      >
        <a
          href={`https://github.com/${status.repoFullName}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-2 text-foreground hover:text-primary"
        >
          <GitBranch className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-medium">{status.repoFullName}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
        {!compact && (
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            Synced to GitHub
          </span>
        )}
      </div>
    );
  }

  // NOT INSTALLED, but missing an install URL — nothing actionable to show, so
  // fall back to the load-error/retry state instead of a dead button.
  if (!status.installed && !status.installUrl) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Couldn&apos;t load GitHub status.
        </span>
        <Button variant="outline" size="sm" onClick={refresh}>
          Retry
        </Button>
      </div>
    );
  }

  // NOT INSTALLED — send to install the GitHub App.
  if (!status.installed) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          className="btn-primary w-full sm:w-auto"
          onClick={() => {
            window.location.href = withReturn(status.installUrl);
          }}
        >
          <Github className="mr-2 h-4 w-4" />
          Connect GitHub
        </Button>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            Install on your account or any organization you administer.
          </p>
        )}
      </div>
    );
  }

  // INSTALLED, NOT CONNECTED — auto-provision is in flight (the effect runs
  // handleSave: create mb-<slug> + push). No manual button.
  return (
    <div className="flex flex-col gap-2">
      {actionError ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              autoTriggeredRef.current = true;
              void handleSave();
            }}
            disabled={saving}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving to GitHub…</span>
        </div>
      )}
    </div>
  );
}
