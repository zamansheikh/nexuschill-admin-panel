#!/usr/bin/env bash
# =============================================================================
# server-bootstrap.sh — one-time setup on a fresh Debian/Ubuntu server.
# Run this MANUALLY the very first time you stand up the deploy host.
# Idempotent — re-running on an already-set-up box is a no-op.
#
# Usage (on the server, as root):
#   curl -sSL https://raw.githubusercontent.com/zamansheikh/nexuschill-admin-panel/main/scripts/server-bootstrap.sh | bash -s -- https://github.com/zamansheikh/nexuschill-admin-panel.git
# OR (after a manual git clone):
#   bash scripts/server-bootstrap.sh https://github.com/zamansheikh/nexuschill-admin-panel.git
#
# After this finishes, follow the post-install steps it prints to:
#   1. drop in .env (copy from .env.example, fill secrets)
#   2. push to main from your laptop — CI takes over from there
# =============================================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/nexuschill-admin-panel}"
REPO_URL="${1:-}"

if [ -z "$REPO_URL" ] && [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "Usage: $0 <git-repo-url>"
  echo "  e.g. $0 https://github.com/zamansheikh/nexuschill-admin-panel.git"
  exit 1
fi

c_green()  { printf '\033[32m%s\033[0m\n' "$*"; }
c_yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
c_bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

step() { echo; c_bold "→ $*"; }
ok()   { c_green "  ✓ $*"; }

# --- 1. Apt + base tools ---------------------------------------------------

step "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg git ufw
ok "Base packages installed"

# --- 2. Docker (official repo, gives us `docker compose` plugin) -----------

if command -v docker >/dev/null 2>&1; then
  ok "Docker already installed ($(docker --version))"
else
  step "Installing Docker Engine + Compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  ok "Docker installed: $(docker --version)"
fi

# --- 3. Repo --------------------------------------------------------------

if [ -d "$DEPLOY_DIR/.git" ]; then
  ok "Repo already cloned at $DEPLOY_DIR"
else
  step "Cloning repo to $DEPLOY_DIR"
  mkdir -p "$(dirname "$DEPLOY_DIR")"
  git clone "$REPO_URL" "$DEPLOY_DIR"
  ok "Repo cloned"
fi

# --- 4. Firewall (UFW) ----------------------------------------------------

step "Configuring firewall"
# We're additive here — don't reset, since the backend bootstrap may
# have already opened ssh + 3000 on the same host. Just ensure 3001
# (the panel port) is open.
if ! ufw status | grep -q "Status: active"; then
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw allow ssh           >/dev/null
  ufw --force enable      >/dev/null
fi
ufw allow 3001/tcp >/dev/null   # admin panel
ok "UFW: 3001 open (panel)"

# --- 5. Helpful symlink so `deploy` is on PATH ----------------------------

if [ ! -L /usr/local/bin/nexuschill-panel-deploy ]; then
  ln -sf "$DEPLOY_DIR/scripts/deploy.sh" /usr/local/bin/nexuschill-panel-deploy
  ok "Linked /usr/local/bin/nexuschill-panel-deploy → scripts/deploy.sh"
fi

# --- 6. Print next steps --------------------------------------------------

cat <<EOF

$(c_green '✓ Bootstrap complete.')

$(c_bold 'Manual steps still required before the first deploy:')

  1. Drop in the env file:
       cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env
       \$EDITOR $DEPLOY_DIR/.env
     Fill in: NEXT_PUBLIC_API_BASE_URL (e.g. https://api.your-domain.com/api/v1)

  2. Add the GitHub Actions secrets in your repo settings
     (Settings → Secrets and variables → Actions):
       SSH_HOST          = $(hostname -I | awk '{print $1}')
       SSH_USER          = root
       SSH_PRIVATE_KEY   = (entire content of your SSH private key)
       SSH_PORT          = 22 (optional — only if you use a non-22 port)

  3. Push to main. CI runs scripts/deploy.sh automatically.

  $(c_bold 'Manual deploy (without CI):')
       nexuschill-panel-deploy
EOF
