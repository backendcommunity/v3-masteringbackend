"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Github, Loader2, Plus, Search } from "lucide-react";

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
  /**
   * Surface an actionable error to a parent (e.g. the top banner). Called with
   * the message + a retry handler while an error is live, and `null` once it
   * clears. The icon/slide-in stay silent; the banner only appears on error.
   * `actionLabel` overrides the banner button text (e.g. "Reconnect").
   */
  onError?: (
    err: { message: string; retry: () => void; actionLabel?: string } | null,
  ) => void;
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

// A reconnect-required 409 (stale/expired/wrong-app GitHub installation). Unlike
// other 409s we do NOT auto-redirect — a sudden bounce to GitHub during passive
// auto-provisioning is jarring. The caller instead surfaces a reconnect banner
// whose button takes the user through the install flow on an explicit click.
function getReconnectUrl(err: any): string | null {
  const d = err?.response?.status === 409 ? err.response.data : null;
  if (d?.reason === "reconnect_required" && typeof d?.installUrl === "string") {
    return d.installUrl;
  }
  return null;
}

// A single ghost icon button for the playground top nav. Clicking it toggles the
// options slide-in (`AdvancedDrawer`), which holds every state: not-installed →
// install CTA; installed → create/connect a repo. Repo provisioning is automatic
// (the effect below), so the icon's only job is to open the panel. Actionable
// errors are reported up via `onError` (the parent renders the only banner).
export function GithubConnect({
  slug,
  projectName,
  onConnected,
  onError,
}: GithubConnectProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reconnectUrl, setReconnectUrl] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    setReconnectUrl(null);
    try {
      const res = await store.connectProjectGithub(slug, { mode: "auto" });
      applyConnected(res.repoFullName, res.owner, res.repo);
    } catch (e) {
      // Stale/expired GitHub installation → show a reconnect banner (no silent
      // bounce); the button takes the user through the install flow on click.
      const reconnect = getReconnectUrl(e);
      if (reconnect) {
        setReconnectUrl(reconnect);
        return;
      }
      // Other 409s (re-authorize personal account) — redirect immediately.
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

  // Report actionable errors up to the parent (the top banner) and clear them
  // when resolved. The icon + slide-in stay silent in every healthy state; the
  // banner is the *only* place an error surfaces.
  useEffect(() => {
    if (!onError) return;
    if (reconnectUrl) {
      // Highest priority: the GitHub connection is dead and only a reconnect
      // fixes it. The button sends the user through the install flow; GitHub's
      // callback saves the new installationId and redirects back here, where
      // auto-provision resumes.
      onError({
        message: "Your GitHub connection expired. Reconnect to continue.",
        actionLabel: "Reconnect",
        retry: () => {
          window.location.href = withReturn(reconnectUrl);
        },
      });
    } else if (loadError) {
      onError({ message: "Couldn't load GitHub status.", retry: refresh });
    } else if (actionError) {
      onError({
        message: actionError,
        retry: () => {
          autoTriggeredRef.current = true;
          void handleSave();
        },
      });
    } else {
      onError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectUrl, loadError, actionError]);

  return (
    <>
      <button
        className="btn ghost"
        onClick={() => setSheetOpen((o) => !o)}
        title="GitHub"
        aria-label="GitHub"
        disabled={loading}
      >
        {saving ? <Loader2 className="i animate-spin" /> : <Github className="i" />}
      </button>
      {status && (
        <AdvancedDrawer
          slug={slug}
          projectName={projectName}
          onConnected={applyConnected}
          installed={status.installed}
          installUrl={status.installUrl}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  );
}

// Options slide-in: install the App (not-installed), or create-with-options /
// connect an existing repo (installed). Controlled by the parent via open/onOpenChange.
function AdvancedDrawer({
  slug,
  projectName,
  onConnected,
  installed,
  installUrl,
  open,
  onOpenChange,
}: {
  slug: string;
  projectName?: string;
  onConnected: (repoFullName: string, owner?: string, repo?: string) => void;
  installed: boolean;
  installUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
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
    if (!open || !installed) return;
    let active = true;
    (async () => {
      setOwnersLoading(true);
      try {
        const o = await store.listGithubOwners();
        if (!active) return;
        setOwners(o);
        setOwner((prev) => prev || o[0]?.login || "");
      } catch (e) {
        // A 409 means the GitHub connection is no longer usable — redirect to
        // reconnect (re-install/re-authorize) instead of a dead error toast.
        if (handle409Redirect(e)) return;
        if (active) toast.error("Couldn't load your GitHub owners.");
      } finally {
        if (active) setOwnersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, installed]);

  const loadRepos = async (ownerLogin: string, query: string) => {
    if (!ownerLogin) return;
    setReposLoading(true);
    try {
      setRepos(await store.listGithubRepos(ownerLogin, query));
    } catch (e) {
      if (handle409Redirect(e)) return;
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
      onOpenChange(false);
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
      onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" /> GitHub options
          </SheetTitle>
          <SheetDescription>
            {installed
              ? "Choose an owner and create a repo with options, or connect an existing one."
              : "Connect GitHub to save your work to a repository."}
          </SheetDescription>
        </SheetHeader>

        {/* NOT INSTALLED — the only action is to install the GitHub App. Once
            installed, a repo is provisioned automatically and this panel switches
            to the owner/create/connect options below. */}
        {!installed ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Install the GitHub App on your account or any organization you
              administer. We&apos;ll create a repository and sync your work
              automatically.
            </p>
            <Button
              className="btn-primary w-full"
              disabled={!installUrl}
              onClick={() => {
                if (installUrl) window.location.href = withReturn(installUrl);
              }}
            >
              <Github className="mr-2 h-4 w-4" /> Connect GitHub
            </Button>
          </div>
        ) : (
        <div className="mt-6 space-y-5">
          {/* Owner is auto-selected (the install account / first owner). Only
              surface the picker when there's more than one account to choose
              between — otherwise it's a single-option dropdown that adds noise. */}
          {owners.length > 1 && (
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
          )}

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
        )}
      </SheetContent>
    </Sheet>
  );
}
