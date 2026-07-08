#!/usr/bin/env bash

set -a
source .env_test
set +a

PYTHON_BIN="$(command -v python3 || command -v python)"
if [ -z "$PYTHON_BIN" ]; then
  echo "Neither python3 nor python is available in PATH"
  exit 127
fi

exec "$PYTHON_BIN" "$FLASK_APP"