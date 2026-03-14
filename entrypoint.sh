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

# Start nginx in the background
nginx -g "daemon off;" &

# Start FastAPI server
cd /app
uv run fastapi run main.py --host 0.0.0.0 --port 8000
