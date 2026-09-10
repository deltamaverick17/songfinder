require('dotenv').config();
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
const port = process.env.PORT || 3000;

app.use(express.static('.'));

app.post('/api/identify', upload.single('clip'), async (request, response) => {
  if (!process.env.AUDD_TOKEN) {
    return response.status(503).json({ error: 'AUDD_TOKEN is not configured.' });
  }

  if (!request.file && !request.body.reelUrl) {
    return response.status(400).json({ error: 'Send a Reel URL or an audio/video clip.' });
  }

  try {
    const form = new FormData();
    form.append('api_token', process.env.AUDD_TOKEN);
    form.append('return', 'spotify,apple_music');

    if (request.file) {
      form.append('file', new Blob([request.file.buffer], { type: request.file.mimetype }), request.file.originalname);
    } else {
      form.append('url', request.body.reelUrl);
    }

    const auddResponse = await fetch('https://api.audd.io/', { method: 'POST', body: form });
    const auddData = await auddResponse.json();
    if (!auddResponse.ok || auddData.status !== 'success') {
      return response.status(502).json({ error: auddData.error?.error_message || 'Audio recognition failed.' });
    }
    if (!auddData.result) {
      return response.status(404).json({ error: 'No confident song match was found.' });
    }

    const { title, artist } = auddData.result;
    const query = encodeURIComponent(`${title} ${artist}`);
    return response.json({
      title,
      artist,
      confidence: auddData.result.confidence || 0,
      youtubeUrl: `https://www.youtube.com/results?search_query=${query}`,
      audioUrl: auddData.result.song_link || `https://www.youtube.com/results?search_query=${query}+audio`,
      videoUrl: `https://www.youtube.com/results?search_query=${query}+official+video`
    });
  } catch (error) {
    return response.status(502).json({ error: 'Recognition provider could not be reached.' });
  }
});

app.listen(port, () => {
  console.log(`Reel Song Finder running at http://localhost:${port}`);
});