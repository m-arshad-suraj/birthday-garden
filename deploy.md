# Start a local HTTP server on port 8000
python -m http.server 8000

# Open the progress helper at http://localhost:8000/progress.html

# Expose your local app running on port 8000 using Cloudflare Tunnel
cloudflared tunnel --url http://localhost:8000
