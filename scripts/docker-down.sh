#!/usr/bin/env sh

set -eu

if docker compose down; then
  exit 0
fi

if command -v sudo >/dev/null 2>&1; then
  echo "Retrying with sudo because the Docker socket is not writable by the current user."
  sudo docker compose down
  exit 0
fi

exit 1
