const express = require('express');
const https   = require('https');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { school } = req.query;
    if (!school) return res.status(400).json({ error: 'school query param is required' });

    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Coach search not configured — add SERP_API_KEY to .env' });

    const query = `${school} men's tennis head coach contact email site:${encodeURIComponent(school.toLowerCase().replace(/\s+/g, ''))}.edu OR site:linkedin.com`;

    const params = new URLSearchParams({
      q:       `${school} men's tennis head coach contact`,
      api_key: apiKey,
      num:     5,
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

    const results = (data.organic_results ?? []).slice(0, 5).map((r) => ({
      title:   r.title,
      link:    r.link,
      snippet: r.snippet,
    }));

    res.json({
      school,
      query:      `${school} men's tennis head coach contact`,
      results,
      fetched_at: new Date().toISOString(),
      source:     'Google Search via SerpAPI',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
