"use client";

import { useEffect, useState } from "react";
import {
  Github,
  Plus,
  GitBranch,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";

type Status = {
  connected: boolean;
  installUrl: string;
  repo: { fullName: string; htmlUrl: string } | null;
};
type Owner = { login: string; type: "user" | "org"; avatarUrl?: string };
type Repo = { name: string; fullName: string; htmlUrl: string; private: boolean };

// GitHub connect + repo create/select for a project playground. Self-contained
// (renders its own GitHub-icon trigger + dialog). States: not-connected →
// install (user or org); connected → create new repo OR connect existing; shows
// the linked repo when already connected.
export function GithubConnectDialog({
  slug,
  triggerClassName,
  onConnected,
}: {
  slug: string;
  triggerClassName?: string;
  onConnected?: (repo: { fullName: string; htmlUrl: string }) => void;
}) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [owner, setOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const s = await store.getProjectGithub(slug);
        if (!active) return;
        setStatus({
          connected: s.connected,
          installUrl: s.installUrl,
          repo: s.repoFullName
            ? {
                fullName: s.repoFullName,
                htmlUrl: `https://github.com/${s.repoFullName}`,
              }
            : null,
        });
        if (s.connected) {
          const o = await store.listGithubOwners();
          if (!active) return;
          setOwners(o);
          setOwner((prev) => prev || o[0]?.login || "");
        }
      } catch {
        if (active) toast.error("Couldn't load GitHub status.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slug]);

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

  const finishConnect = (repo: { fullName: string; htmlUrl: string }) => {
    setStatus((s) => (s ? { ...s, repo } : s));
    onConnected?.(repo);
    toast.success(`Connected ${repo.fullName}`);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!repoName.trim() || !owner) return;
    setCreating(true);
    try {
      const created = await store.createGithubRepo(owner, repoName.trim(), false);
      const repo = await store.connectProjectRepo(slug, created.htmlUrl, owner);
      finishConnect(repo);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Couldn't create the repository.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = async (r: Repo) => {
    setConnecting(true);
    try {
      finishConnect(await store.connectProjectRepo(slug, r.htmlUrl, owner));
    } catch {
      toast.error("Couldn't connect that repository.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName ?? "h-8 w-8"}
          title="Connect GitHub"
        >
          <Github className="h-4 w-4" />
          <span className="sr-only">Connect GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" /> GitHub
          </DialogTitle>
          <DialogDescription>
            Connect a repository to push and sync your project.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !status?.connected ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account — personal or organization — to create
              and link repositories for this project.
            </p>
            <Button
              className="btn-primary w-full"
              onClick={() => {
                if (!status?.installUrl) return;
                // academy returns the install URL ending at `state=<email>+`;
                // append where to come back to after the GitHub App install.
                const ret = encodeURIComponent(
                  window.location.origin + window.location.pathname,
                );
                window.location.href = status.installUrl + ret;
              }}
            >
              <Github className="mr-2 h-4 w-4" /> Connect GitHub
            </Button>
            <p className="text-xs text-muted-foreground">
              You can install on your account or any organization you administer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {status.repo && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <GitBranch className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">
                    {status.repo.fullName}
                  </span>
                </span>
                <a
                  href={status.repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Open on GitHub"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Owner
              </label>
              <select
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setRepos([]);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
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

              <TabsContent value="create" className="space-y-3 pt-3">
                <Input
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="repository-name"
                />
                <p className="text-xs text-muted-foreground">
                  Created <b>public</b> under <b>{owner}</b>.
                </p>
                <Button
                  className="btn-primary w-full"
                  disabled={!repoName.trim() || creating}
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

              <TabsContent value="existing" className="space-y-3 pt-3">
                <div className="flex items-center gap-2 rounded-lg border border-border px-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      loadRepos(owner, e.target.value);
                    }}
                    placeholder="Search repositories…"
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                  />
                </div>
                <div className="max-h-[240px] space-y-1 overflow-y-auto">
                  {reposLoading ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <Loader2 className="inline h-4 w-4 animate-spin" />
                    </div>
                  ) : repos.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No repositories found. Try “Create new”.
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
      </DialogContent>
    </Dialog>
  );
}
