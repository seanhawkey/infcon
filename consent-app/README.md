# Consent · Photo & Video

A simple, friendly PWA for recording informed consent from photography and video subjects.

---

## Features

- 📷 Camera capture to identify each subject
- ✍️ Finger/mouse drawn signature
- 🌍 English, Spanish, French, Arabic consent text
- 🖨 Print-to-PDF record with subject photo embedded
- 📴 Works offline (PWA)
- 🔒 No data sent anywhere — everything stays on device

---

## Quick start (local)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — **camera works on localhost without HTTPS**.

---

## Deploy to Netlify (recommended — free)

1. Push this folder to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Connect your repo — build settings are auto-detected via `netlify.toml`
4. Deploy — you get a free `.netlify.app` URL with HTTPS (camera works)

That's it. Your app is live.

---

## Deploy to Vercel (alternative)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com). The `vercel.json` handles everything.

---

## Generate icons (one-time)

Before deploying, generate the PNG icons from the SVG:

```bash
pip install cairosvg pillow
python generate_icons.py
```

Or use [svgtopng.com](https://svgtopng.com) to convert `public/icon.svg` to each size manually and save into `public/icons/`.

---

## Play Store submission (via PWABuilder)

Once your app is hosted on a public HTTPS URL:

1. Go to **[pwabuilder.com](https://pwabuilder.com)**
2. Paste your app URL (e.g. `https://consent.netlify.app`)
3. Click **Start** — it validates your PWA manifest and service worker
4. Click **Package for stores** → **Android**
5. Download the `.aab` file (Android App Bundle)
6. Go to **[play.google.com/console](https://play.google.com/console)**
   - One-time £20 developer account fee
   - Create app → Upload the `.aab`
   - Fill in store listing (name, description, screenshots)
   - Submit for review (usually 1–3 days)

PWABuilder also generates a signed APK for sideloading/testing.

---

## Customising the consent text

Edit `src/App.jsx` — find the `CONSENT` object near the top. Each language has:
- `title` — shown at the top of the consent step
- `body` — the main consent text (plain language, bullet points fine)
- `agree` — the checkbox declaration text

---

## Privacy & data

- No backend, no database, no analytics
- Subject photos and signatures exist only in browser memory during the session
- The downloaded/printed record is a local HTML file — store it securely
- Compliant with UK GDPR when used as part of a documented data handling policy

---

## Project structure

```
consent-app/
├── index.html              # Entry point
├── vite.config.js          # Build config
├── package.json
├── netlify.toml            # Netlify deploy config
├── vercel.json             # Vercel deploy config
├── generate_icons.py       # Icon generation helper
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker (offline)
│   ├── icon.svg            # Master app icon
│   └── icons/              # Generated PNG icons (run generate_icons.py)
└── src/
    ├── main.jsx            # React entry + SW registration
    └── App.jsx             # Main application
```
