# Deploy scripts

Two-step deploy for the Next.js admin panel:

| Script | When to run | Where |
|---|---|---|
| [`server-bootstrap.sh`](server-bootstrap.sh) | Once, the very first time you stand up a host | Manually, on the server (as root) |
| [`deploy.sh`](deploy.sh) | Every code push | Automatically, via GitHub Actions |

The `appleboy/ssh-action` step in [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) SSHes into the server, pulls `origin/main`, and runs `deploy.sh`.

The panel runs on **port 3001** so it can co-exist with the NestJS backend on port 3000 on the same host.

## First-time setup

1. **On a fresh Debian/Ubuntu server**, run:
   ```bash
   curl -sSL https://raw.githubusercontent.com/zamansheikh/nexuschill-admin-panel/main/scripts/server-bootstrap.sh \
     | bash -s -- https://github.com/zamansheikh/nexuschill-admin-panel.git
   ```
   This installs Docker + Compose, clones the repo to `/opt/nexuschill-admin-panel`, opens UFW for port 3001, and prints the manual steps below.

2. **Drop in `.env`** — copy from `.env.example` and fill in the API base URL.

3. **Add GitHub Actions secrets** (Settings → Secrets and variables → Actions):
   - `SSH_HOST` — the server's IP
   - `SSH_USER` — `root`
   - `SSH_PRIVATE_KEY` — the **entire** content of the matching SSH private key (including the `-----BEGIN ... PRIVATE KEY-----` header). The corresponding public key must be in `~/.ssh/authorized_keys` on the server.
   - `SSH_PORT` — optional, only if you've changed sshd from 22.

4. **Push to `main`.** CI takes over from there.

## Generating an SSH key for CI

If you don't already have one dedicated to CI:

```bash
# On your laptop — DON'T reuse a personal key
ssh-keygen -t ed25519 -C "github-actions@nexuschill-admin-panel" -f ~/.ssh/nexuschill_panel_deploy

# Copy the public key to the server
ssh-copy-id -i ~/.ssh/nexuschill_panel_deploy.pub root@<server-ip>

# Print the private key (paste into GitHub secret SSH_PRIVATE_KEY)
cat ~/.ssh/nexuschill_panel_deploy
```

## What `deploy.sh` checks

Before touching containers, it validates:

1. `git`, `docker`, `docker compose`, `curl` are installed.
2. Repo at `/opt/nexuschill-admin-panel` exists with a working `.git`.
3. `.env` is present (operator-managed; never overwritten).
4. `.env` has `NEXT_PUBLIC_API_BASE_URL` set (warn-only — panel boots either way).
5. Docker daemon is reachable.
6. Disk has > 2 GB free; RAM has > 512 MB free (warn-only).

After validation:

7. Stops existing containers (`docker compose down`).
8. Rebuilds images (`docker compose build --pull`).
9. Starts containers (`docker compose up -d`).
10. Polls `http://localhost:3001/` (with `-L` to follow redirects, e.g. `/` → `/login`) for up to 60 seconds. On failure, dumps the last 80 log lines and exits 1.
11. Prunes dangling images.

## Manual deploy

If you ever want to redeploy without pushing a commit:

```bash
# On the server
nexuschill-panel-deploy
```

(`server-bootstrap.sh` symlinked `scripts/deploy.sh` → `/usr/local/bin/nexuschill-panel-deploy`.)

You can also re-trigger the GitHub Actions workflow from the repo's Actions tab → **Deploy admin panel** → **Run workflow**.

## Rolling back

CI deploys whatever is at `origin/main`. To roll back:

```bash
git revert <bad-sha>
git push                      # CI redeploys the revert commit
```

Or skip CI and roll back directly on the server:

```bash
ssh root@<server-ip>
cd /opt/nexuschill-admin-panel
git reset --hard <known-good-sha>
nexuschill-panel-deploy
```

## Sharing a host with the backend

If both repos live on the same VPS:

- Backend: cloned at `/opt/nexuschill-backend`, listens on **3000**, manual deploy alias `nexuschill-deploy`.
- Panel:   cloned at `/opt/nexuschill-admin-panel`, listens on **3001**, manual deploy alias `nexuschill-panel-deploy`.

Both bootstrap scripts are additive on UFW — running one doesn't undo the other's open ports. Use the **same** `SSH_HOST` / `SSH_PRIVATE_KEY` secret values in both GitHub repos so a single CI key works for both.
