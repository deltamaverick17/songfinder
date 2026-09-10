const urlInput = document.querySelector('#reelUrl');
const fileInput = document.querySelector('#audioFile');
const findButton = document.querySelector('#findButton');
const clearButton = document.querySelector('#clearButton');
const newSearch = document.querySelector('#newSearch');
const result = document.querySelector('#result');
const status = document.querySelector('#status');
const copyButton = document.querySelector('#copyButton');
const recognitionEndpoint = window.RECOGNITION_ENDPOINT || '/api/identify';

function renderResult(match) {
  const title = match.title || 'Unknown title';
  const artist = match.artist || 'Unknown artist';
  const confidence = Math.round(Number(match.confidence) || 0);
  const query = encodeURIComponent(`${title} ${artist}`);
  const resultHeading = result.querySelector('.result-top h2');
  const resultKicker = result.querySelector('.result-top .kicker');
  const titleElement = result.querySelector('.track-info h3');
  const artistElement = result.querySelector('.artist');
  const confidenceElement = result.querySelector('.signal-ring span');
  const youtubeLinks = result.querySelectorAll('a[href*="youtube.com"]');

  resultKicker.textContent = `MATCH FOUND · ${confidence}% CONFIDENCE`;
  resultHeading.textContent = 'Your track is waiting.';
  titleElement.textContent = title;
  artistElement.textContent = artist;
  confidenceElement.textContent = confidence;
  youtubeLinks[0].href = match.youtubeUrl || `https://www.youtube.com/results?search_query=${query}`;
  youtubeLinks[1].href = match.audioUrl || `https://www.youtube.com/results?search_query=${query}+audio`;
  youtubeLinks[2].href = match.videoUrl || `https://www.youtube.com/results?search_query=${query}+official+video`;
  copyButton.dataset.track = `${title} — ${artist}`;
  result.classList.remove('is-hidden');
}

function resetSearch() {
  urlInput.value = '';
  fileInput.value = '';
  result.classList.add('is-hidden');
  status.textContent = '';
  urlInput.focus();
}

findButton.addEventListener('click', async () => {
  if (!urlInput.value.trim() && !fileInput.files.length) {
    status.textContent = 'Add a Reel URL or upload a clip to begin.';
    urlInput.focus();
    return;
  }
  findButton.classList.add('loading');
  findButton.innerHTML = 'Listening <span>…</span>';
  status.textContent = 'Scanning the audio fingerprint...';
  const formData = new FormData();
  if (urlInput.value.trim()) formData.append('reelUrl', urlInput.value.trim());
  if (fileInput.files.length) formData.append('clip', fileInput.files[0]);

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    const response = await fetch(recognitionEndpoint, { method: 'POST', body: formData, signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.error || `Recognition request failed: ${response.status}`);
    }
    renderResult(await response.json());
    status.textContent = '';
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    status.textContent = error.name === 'AbortError'
      ? 'Recognition timed out. Check the server and try again.'
      : error instanceof TypeError
        ? 'Cannot reach the recognition server. Start it with: node server.js'
        : error.message || 'Song recognition failed. Try a clearer clip.';
  } finally {
    findButton.classList.remove('loading');
    findButton.innerHTML = 'Identify song <span>→</span>';
  }
});

clearButton.addEventListener('click', resetSearch);
newSearch.addEventListener('click', resetSearch);

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    urlInput.value = fileInput.files[0].name;
    status.textContent = 'Clip ready. Press Identify song when you are set.';
  }
});

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(copyButton.dataset.track || '');
  copyButton.textContent = 'Copied ✓';
  window.setTimeout(() => { copyButton.textContent = 'Copy track info'; }, 1800);
});

document.querySelector('#themeButton').addEventListener('click', () => {
  document.body.classList.toggle('warm');
});

document.querySelector('#clearHistory').addEventListener('click', (event) => {
  event.currentTarget.closest('.history').querySelector('.history-list').innerHTML = '<p style="color:var(--muted);font:12px var(--mono);padding:20px 0">No recent searches yet.</p>';
});