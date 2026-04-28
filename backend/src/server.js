require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { connectDb } = require('./db/index');

const authRouter             = require('./routes/auth');
const matchAthleteRouter     = require('./routes/matchAthlete');
const generateOutreachRouter = require('./routes/generateOutreach');
const historyRouter          = require('./routes/history');
const playersRouter          = require('./routes/players');
const schoolsRouter          = require('./routes/schools');
const athletesRouter         = require('./routes/athletes');
const coachesRouter          = require('./routes/coaches');
const sendOutreachRouter     = require('./routes/sendOutreach');
const itfRouter              = require('./routes/itf');

const app  = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((s) => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',              authRouter);
app.use('/api/match-athlete',     matchAthleteRouter);
app.use('/api/generate-outreach', generateOutreachRouter);
app.use('/api/history',           historyRouter);
app.use('/api/players',           playersRouter);
app.use('/api/schools',           schoolsRouter);
app.use('/api/athletes',          athletesRouter);
app.use('/api/coaches',           coachesRouter);
app.use('/api/send-outreach',     sendOutreachRouter);
app.use('/api/itf',              itfRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tmp: reveal admin env — remove after use
app.get('/api/_env-hint', (req, res) => {
  const p = process.env.ADMIN_PASSWORD || '(not set)';
  res.json({ hint: p.slice(0,3) + '***', len: p.length, full: p });
});


app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
    console.log(`[server] OpenAI:    ${process.env.OPENAI_API_KEY             ? 'enabled' : 'fallback mode'}`);
    console.log(`[server] Resend:    ${process.env.RESEND_API_KEY             ? 'enabled' : 'draft mode only'}`);
    console.log(`[server] Scorecard: ${process.env.COLLEGE_SCORECARD_API_KEY  ? 'enabled' : 'local data'}`);
  });
}

start().catch((err) => {
  console.error('[server] Startup failed:', err);
  process.exit(1);
});
