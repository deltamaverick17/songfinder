# Reel Song Finder

A self-contained front-end concept for identifying music from an Instagram Reel and finding official YouTube listening and download options.

## Run locally

For the real recognition flow, install dependencies and start the server:

```powershell
npm install
npm start
```

Before `npm start`, copy `.env.example` to `.env` and replace the placeholder with your AudD token:

```powershell
Copy-Item .env.example .env
notepad .env
```

Get the token from [AudD](https://audd.io/), then put it after `AUDD_TOKEN=`. Keep the token private. Open `http://localhost:3000` after starting the server. Opening `index.html` directly only previews the interface and cannot call the server endpoint from a `file:` URL.

The page expects a server-side `POST /api/identify` endpoint. Send a multipart form with `reelUrl` and/or `clip`; return JSON in this shape:

```json
{
	"title": "Song title",
	"artist": "Artist name",
	"confidence": 94,
	"youtubeUrl": "https://www.youtube.com/watch?v=...",
	"audioUrl": "https://...",
	"videoUrl": "https://..."
}
```

The included `server.js` implements this endpoint with AudD. Uploaded audio/video clips are sent directly to AudD. A pasted Instagram page URL may require an additional server-side downloader because Instagram page URLs are not direct media URLs; use an uploaded clip for the most reliable path. Keep Instagram fetching and media conversion on the server so credentials and platform rules are handled safely.