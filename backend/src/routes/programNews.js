const express = require('express');
const https   = require('https');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { school } = req.query;
    if (!school) return res.status(400).json({ error: 'school param required' });

    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'SerpAPI not configured' });

    const params = new URLSearchParams({
      q:       `"${school}" tennis`,
      tbm:     'nws',          // Google News tab
      api_key: apiKey,
      num:     4,
      hl:      'en',
      gl:      'us',
    });

    const data = await new Promise((resolve, reject) => {
      https.get(`https://serpapi.com/search.json?${params}`, (serpRes) => {
        let raw = '';
        serpRes.on('data', (c) => (raw += c));
        serpRes.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error('Invalid JSON from SerpAPI')); }
        });
      }).on('error', reject);
    });

    const articles = (data.news_results ?? []).slice(0, 4).map((r) => ({
      title:  r.title,
      link:   r.link,
      source: r.source,
      date:   r.date,
    }));

    res.json({ school, articles, fetched_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
