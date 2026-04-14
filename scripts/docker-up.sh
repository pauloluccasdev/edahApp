#!/usr/bin/env sh

set -eu

if docker compose up --build; then
  exit 0
fi

if command -v sudo >/dev/null 2>&1; then
  echo "Retrying with sudo because the Docker socket is not writable by the current user."
  sudo docker compose up --build
  exit 0
fi

exit 1
