"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  Github,
  GitBranch,
  ExternalLink,
  Loader2,
  Plus,
  Search,
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
type Owner = { login: string; type: "user" | "org"; avatarUrl?: string };
type RepoItem = {
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
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

  // INSTALLED, NOT CONNECTED — one-click save (auto-provision).
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="btn-primary w-full sm:w-auto"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}
          Save to GitHub
        </Button>
        <AdvancedDrawer
          slug={slug}
          projectName={projectName}
          onConnected={applyConnected}
        />
      </div>
      {actionError && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </span>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

// Advanced drawer: create-with-options or connect an existing repo. Collapsed by
// default behind a small "Advanced" link.
function AdvancedDrawer({
  slug,
  projectName,
  onConnected,
}: {
  slug: string;
  projectName?: string;
  onConnected: (repoFullName: string, owner?: string, repo?: string) => void;
}) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [owner, setOwner] = useState("");

  // Create-new state.
  const [repoName, setRepoName] = useState(projectName ?? "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Connect-existing state.
  const [q, setQ] = useState("");
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setOwnersLoading(true);
      try {
        const o = await store.listGithubOwners();
        if (!active) return;
        setOwners(o);
        setOwner((prev) => prev || o[0]?.login || "");
      } catch {
        if (active) toast.error("Couldn't load your GitHub owners.");
      } finally {
        if (active) setOwnersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadRepos = async (ownerLogin: string, query: string) => {
    if (!ownerLogin) return;
    setReposLoading(true);
    try {
      setRepos(await store.listGithubRepos(ownerLogin, query));
    } catch {
      toast.error("Couldn't list repositories.");
    } finally {
      setReposLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = repoName.trim();
    if (!name || !owner) return;
    setCreating(true);
    try {
      const created = await store.createGithubRepo(owner, name, isPrivate);
      const res = await store.connectProjectGithub(slug, {
        mode: "existing",
        repoFullName: created.fullName,
      });
      onConnected(res.repoFullName, res.owner, res.repo);
      setOpen(false);
    } catch (e) {
      if (handle409Redirect(e)) return;
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ?? "Couldn't create the repository.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = async (r: RepoItem) => {
    setConnecting(true);
    try {
      const res = await store.connectProjectGithub(slug, {
        mode: "existing",
        repoFullName: r.fullName,
      });
      onConnected(res.repoFullName, res.owner, res.repo);
      setOpen(false);
    } catch (e) {
      if (handle409Redirect(e)) return;
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ?? "Couldn't connect that repository.",
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Advanced
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" /> Advanced GitHub options
          </SheetTitle>
          <SheetDescription>
            Choose an owner and create a repo with options, or connect an
            existing one.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="gh-owner"
              className="text-xs font-medium text-muted-foreground"
            >
              Owner
            </label>
            <select
              id="gh-owner"
              value={owner}
              disabled={ownersLoading}
              onChange={(e) => {
                setOwner(e.target.value);
                setRepos([]);
              }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            >
              {ownersLoading && <option>Loading…</option>}
              {owners.map((o) => (
                <option key={o.login} value={o.login}>
                  {o.login}
                  {o.type === "org" ? " (org)" : ""}
                </option>
              ))}
            </select>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create new</TabsTrigger>
              <TabsTrigger value="existing" onClick={() => loadRepos(owner, q)}>
                Connect existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 pt-4">
              <div>
                <label
                  htmlFor="gh-repo-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Repository name
                </label>
                <Input
                  id="gh-repo-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="repository-name"
                  className="mt-1"
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-muted-foreground">
                  Visibility
                </legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    aria-pressed={!isPrivate}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                      !isPrivate
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    aria-pressed={isPrivate}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                      isPrivate
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    Private
                  </button>
                </div>
              </fieldset>
              <Button
                className="btn-primary w-full"
                disabled={!repoName.trim() || !owner || creating}
                onClick={handleCreate}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create &amp; connect
              </Button>
            </TabsContent>

            <TabsContent value="existing" className="space-y-3 pt-4">
              <div className="flex items-center gap-2 rounded-lg border border-border px-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    loadRepos(owner, e.target.value);
                  }}
                  placeholder="Search repositories…"
                  aria-label="Search repositories"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <div className="max-h-[280px] space-y-1 overflow-y-auto">
                {reposLoading ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 animate-spin" />
                  </div>
                ) : repos.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No repositories found. Try &ldquo;Create new&rdquo;.
                  </p>
                ) : (
                  repos.map((r) => (
                    <button
                      key={r.fullName}
                      type="button"
                      onClick={() => handleSelect(r)}
                      disabled={connecting}
                      className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-muted/40 disabled:opacity-60"
                    >
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.private ? "private" : "public"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
