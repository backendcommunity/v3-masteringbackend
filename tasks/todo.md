# Project playground → GitHub connect + repo create/select (org support)

Replace the chain "connect" icon with a GitHub icon + dialog. States:
- Not connected (no githubInstallationId) → "Connect GitHub" (App install URL — works for user OR org).
- Connected, no repo → Create new repo (name, owner=user|org, public default) OR Connect existing (owner select + repo list/search).
- Connected + repo linked → show repo + "Change repository".
Org GitHub allowed throughout (owner = user or any org the App is installed on).

## Contract

### mb-executor (Octokit + GitHub App; auth via installationId in body/query like existing /api/project/*)
- `GET  /api/github/owners?installationId=`            → { owners: [{ login, type:"user"|"org", avatarUrl }] }
- `GET  /api/github/repos?installationId=&owner=&q=`   → { repos: [{ name, fullName, htmlUrl, private }] }
- `POST /api/github/repos` { installationId, owner, name, isPrivate=false } → { repo: { name, fullName, htmlUrl, cloneUrl } }
  - owner = user → repos.createForAuthenticatedUser; owner = org → repos.createInOrg.

### academy (proxies executor with req.user.githubInstallationId; persists on Solution)
- `GET  /api/v3/projects/:slug/github`  → { connected: boolean, installUrl, repo: {fullName, htmlUrl}|null }
- `GET  /api/v3/github/owners`          → proxy executor owners
- `GET  /api/v3/github/repos?owner=&q=` → proxy executor repos
- `POST /api/v3/github/repos` {owner,name,isPrivate} → proxy executor create
- `POST /api/v3/projects/:slug/github` { repository, owner } → upsert Solution{projectId,userId,repository} → { repo }
  installUrl = https://github.com/apps/masteringbackend/installations/new?state=<email>+<return>

## Frontend (v3 · this session)
- [ ] project-playground top bar: chain icon → lucide `Github` icon, ALWAYS shown, opens dialog.
- [ ] GithubConnectDialog component: 3 states above; owner select (user+orgs); create form (name + public default); existing list (search). On create/select → POST connect → update local repo state + toast.
- [ ] store methods: getProjectGithub(slug), listGithubOwners(), listGithubRepos(owner,q), createGithubRepo(owner,name,isPrivate), connectProjectRepo(slug,repository,owner).
- [ ] Repo connection flows to the executor push/pull (already uses installationId + repository).

## Verify
- [ ] Not-connected → install; after install → create/select works; org repos listed; linked repo persists + shows on reopen. Builds green.
