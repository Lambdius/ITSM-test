#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_ROOT="$(git -C "$PROJECT_ROOT" rev-parse --show-toplevel)"

if [ "$GIT_ROOT" != "$PROJECT_ROOT" ]; then
    printf '%s\n' 'Initialize this directory as its own Git repository before installing hooks.' >&2
    exit 1
fi

git -C "$PROJECT_ROOT" config --local core.hooksPath .githooks
chmod +x "$PROJECT_ROOT"/.githooks/*
printf '%s\n' 'Git hooks enabled: .githooks'
