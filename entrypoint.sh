#!/bin/bash
#----------------------------------------------------------------
#      ------ PowerBeacon Image Entrypoint Script -------
#
# This script will start the FastAPI server, and the nginx 
# reverse proxy for serving the frontend and proxying API 
# requests to the backend.
#
# @author: Konstantinos Andreou
# @date: 14 Mar 2026
#----------------------------------------------------------------

set -e

cd /app

# Start FastAPI server in the background so this script can supervise both
# backend and nginx processes.
uv run fastapi run main.py --host 0.0.0.0 --port 8000 &
api_pid=$!

# Start nginx in the background too; we will wait on both processes below.
nginx -g "daemon off;" &
nginx_pid=$!

cleanup() {
	kill -TERM "$api_pid" "$nginx_pid" 2>/dev/null || true
	wait "$api_pid" "$nginx_pid" 2>/dev/null || true
}

trap cleanup INT TERM

# Exit the container if either process exits unexpectedly.
wait -n "$api_pid" "$nginx_pid"
exit_code=$?

cleanup
exit "$exit_code"

