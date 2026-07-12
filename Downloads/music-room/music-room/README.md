# Music Room — Deploy to Railway or Render

Real-time synced music listening rooms (Socket.io + Express).

---

# Option A: Deploy to Render

This repo includes a `render.yaml` (a "Blueprint"), so Render can pick up all the service settings automatically.

## 1. Push this to GitHub

```bash
git init
git add .
git commit -m "Music Room"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Deploy via Blueprint

1. Go to https://render.com and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select this repo. Render reads `render.yaml` and pre-fills the service (Node, `npm install`, `npm start`, free plan).
4. It'll prompt you to enter the `OWNER_PASSWORD` value (marked `sync: false` so it's not committed to git) — enter your secret password.
5. Click **Apply** — Render builds and deploys.

Once deployed, your URL is shown at the top of the service page, e.g. `https://music-room.onrender.com`.

**Alternative (no Blueprint, manual setup):** New + → Web Service → select repo → Build Command `npm install` → Start Command `npm start` → add `OWNER_PASSWORD` under Environment → Create Web Service.

**Free tier note:** the service spins down after 15 minutes idle and takes ~30–50s to wake on the next request. Upgrade to a paid instance if you need it always-on.

---

# Option B: Deploy to Railway

## 1. Push this to GitHub

```bash
git init
git add .
git commit -m "Music Room"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Deploy on Railway

1. Go to https://railway.app and sign in with GitHub.
2. **New Project → Deploy from GitHub repo** → select this repo.
3. Railway auto-detects Node.js from `package.json` and runs `npm start`. No build step needed.
4. Go to your service's **Variables** tab and add:
   - `OWNER_PASSWORD` = your secret owner password (don't leave the `surya123` default in production)
5. Go to **Settings → Networking → Generate Domain** to get a public URL (e.g. `music-room-production.up.railway.app`).

Railway keeps a persistent Node process running, so Socket.io and file uploads work exactly like they do locally.

---

## Notes (both platforms)

- **Uploaded songs** (`/uploads`) are saved to local disk on the Railway container. This works, but Railway's filesystem is **not persistent across redeploys** — uploaded files disappear on the next deploy. Since your code already auto-deletes files after they finish playing / when a room empties, this is fine for how the app is used (temporary local shares), just know a redeploy will also clear any leftover files.
- The Tamil/English song libraries are pulled live from your GitHub repo (`vsurya2011/Music-Room`) via the GitHub API, so those aren't affected by redeploys.
- If you ever outgrow the free Railway tier or want uploads to survive redeploys/scaling, move `/uploads` to S3-compatible storage (e.g. Cloudflare R2) — not required to launch.
