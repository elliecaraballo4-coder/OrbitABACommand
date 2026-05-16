# OrbitCommand — Deployment Guide
## A product of Integriosync Labs LLC

## What's in this folder

```
orbitcommand/
├── index.html        ← The full OrbitCommand UI
├── api/
│   └── chat.js       ← Serverless proxy (holds your API key securely)
├── vercel.json       ← Routing config for Vercel
├── package.json      ← Project metadata
└── README.md         ← This file
```

## Deploy to Vercel in 5 minutes

### Step 1 — Upload to GitHub
1. Go to **github.com** → New repository → name it `orbitcommand` → Public
2. Upload all files in this folder (keep the folder structure)
3. Commit

### Step 2 — Deploy on Vercel
1. Go to **vercel.com** → Sign up free with your GitHub account
2. Click **Add New Project** → Import `orbitcommand` from GitHub
3. Click **Deploy** (don't change any settings yet)

### Step 3 — Add your Anthropic API key
1. In Vercel → your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from console.anthropic.com
   - **Environment:** Production, Preview, Development (check all 3)
3. Click **Save**
4. Go to **Deployments → Redeploy** (so it picks up the new env var)

### Step 4 — Done!
Your OrbitCommand is live at `yourproject.vercel.app`

## Optional: Connect to orbitabaapp.com subdomain
In Vercel → Settings → Domains → Add `command.orbitabaapp.com`
Then in Cloudflare DNS → add CNAME: `command` → `cname.vercel-dns.com`

## How it works
- Browser calls `/api/chat` (same domain — no CORS issues)
- `api/chat.js` adds your API key and forwards to Anthropic
- Anthropic calls your connected MCP servers (Gmail, Calendar, Drive, MS365)
- Response comes back to OrbitCommand

## Your API key
Get it at: https://console.anthropic.com/settings/keys
Keep it secret — never share it or put it in the HTML file.
