const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// POST /api/send-outreach
// Sends a coach outreach email via Resend (if configured) or returns draft
router.post('/', requireAuth, async (req, res) => {
  const { to, subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: 'subject and body are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;

  // No API key — return draft for manual sending
  if (!apiKey) {
    return res.json({
      sent:    false,
      message: 'Email draft ready. Configure RESEND_API_KEY to enable direct sending.',
      draft:   { to, subject, body },
    });
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    const fromAddress = process.env.RESEND_FROM || 'outreach@resend.dev';

    const { data, error } = await resend.emails.send({
      from:    fromAddress,
      to:      to || 'coach@example.com',
      subject,
      text:    body,
    });

    if (error) throw new Error(error.message);

    res.json({ sent: true, message: 'Email sent successfully', id: data?.id });
  } catch (err) {
    res.status(500).json({ error: `Email send failed: ${err.message}` });
  }
});

module.exports = router;
