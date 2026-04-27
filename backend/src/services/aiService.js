/**
 * AI Service
 *
 * GPT-4o-mini for reasoning and outreach emails.
 * AI is NEVER used for scoring — only natural language output.
 * Full deterministic fallback when OPENAI_API_KEY is absent.
 */

const OpenAI = require('openai');

let openaiClient = null;
function getClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ── Deterministic fallbacks ──────────────────────────────────────────────────

function fallbackReasoning(athlete, school, subScores) {
  const utrDelta = (athlete.utr - school.tennis_utr_benchmark).toFixed(1);
  const aboveBenchmark = parseFloat(utrDelta) >= 0;

  const lines = [];

  // Athletic line — specific to gap
  if (aboveBenchmark) {
    lines.push(
      `With a UTR of ${athlete.utr} sitting ${utrDelta} points above ${school.name}'s benchmark of ${school.tennis_utr_benchmark}, ${athlete.name} would be a strong contributor and likely compete for starting lineup spots.`
    );
  } else {
    lines.push(
      `${athlete.name}'s UTR of ${athlete.utr} falls ${Math.abs(utrDelta)} points short of ${school.name}'s ${school.tennis_utr_benchmark} benchmark — significant development or a strong trajectory would be needed to earn a roster spot.`
    );
  }

  // Academic line — only if credentials present
  if (athlete.gpa != null) {
    const gapGpa = (athlete.gpa - school.gpa_min).toFixed(2);
    if (parseFloat(gapGpa) >= 0.2) {
      lines.push(`A GPA of ${athlete.gpa} exceeds the ${school.gpa_min} minimum comfortably, strengthening the overall application.`);
    } else if (parseFloat(gapGpa) < 0) {
      lines.push(`GPA of ${athlete.gpa} is below the stated ${school.gpa_min} floor — academic support or a strong upward trend will be important.`);
    }
  }

  // Division-specific scholarship context
  if (school.division === 'D1') {
    lines.push(`As a D1 program, ${school.name} offers athletic scholarships — aid likelihood is driven primarily by the coaching staff's roster needs.`);
  } else if (school.division === 'D2') {
    lines.push(`${school.name} (D2) offers partial athletic scholarships, making it a cost-effective path for players at this level.`);
  } else {
    lines.push(`${school.name} is D3 — no athletic scholarships exist, but strong academic merit aid is available given the player's profile.`);
  }

  return lines.join(' ');
}

function fallbackOutreach(athlete, school) {
  const statLines = [
    `UTR: ${athlete.utr}`,
    athlete.itf_rank ? `ITF Junior Ranking: #${athlete.itf_rank}` : null,
    athlete.atp_rank ? `ATP Ranking: #${athlete.atp_rank}` : null,
    athlete.gpa      ? `GPA: ${athlete.gpa}` : null,
    athlete.sat      ? `SAT: ${athlete.sat}` : null,
  ].filter(Boolean).map(l => `  ${l}`).join('\n');

  const subject = `Prospective Student-Athlete Inquiry — ${athlete.name} (${athlete.nationality}, UTR ${athlete.utr})`;
  const body = `Dear Coach,

I am writing to express my sincere interest in the ${school.name} tennis program. My name is ${athlete.name}, I am ${athlete.age} years old, and I am a competitive junior player representing ${athlete.nationality}.

Current competitive profile:
${statLines}

I have followed ${school.name}'s program closely and believe its competitive environment and academic standards align strongly with my goals as a student-athlete. I am confident I can contribute meaningfully to the team while maintaining high academic performance.

I would greatly appreciate the opportunity to connect with you regarding potential roster availability and scholarship opportunities for the upcoming recruiting cycle. Please let me know if you would like video footage, additional results, or a direct conversation.

Thank you for your time and consideration.

Best regards,
${athlete.name}`;

  return { subject, body };
}

function fallbackCoachOutreach(coach, athlete) {
  const statLines = [
    `UTR: ${athlete.utr}`,
    athlete.itf_rank ? `ITF Junior Ranking: #${athlete.itf_rank}` : null,
    athlete.atp_rank ? `ATP Ranking: #${athlete.atp_rank}` : null,
    athlete.gpa      ? `GPA: ${athlete.gpa}` : null,
  ].filter(Boolean).join(' | ');

  const coachName   = coach.name     ?? 'Coach';
  const coachSchool = coach.school   ?? 'our program';
  const coachRole   = coach.position ?? 'Tennis Coach';
  const division    = coach.division ?? '';

  const subject = `${coachSchool} Tennis — Recruiting Interest in ${athlete.name}`;
  const body = `Dear ${athlete.name},

My name is ${coachName}, and I serve as ${coachRole} at ${coachSchool}${division ? ` (${division})` : ''}. I came across your profile and wanted to reach out personally.

Your competitive profile caught my attention — ${statLines}. We believe you could be a strong fit for our program and contribute at a high level from day one.

${coachSchool} offers a competitive environment where student-athletes excel both on and off the court. We would love to tell you more about what our program can offer you academically and athletically.

I would welcome the chance to connect — whether that's a quick call, a campus visit, or attending one of your upcoming tournaments. Please don't hesitate to reach out at your convenience.

Looking forward to hearing from you.

Best regards,
${coachName}
${coachRole}, ${coachSchool}`;

  return { subject, body };
}

// ── AI-powered generation ────────────────────────────────────────────────────

async function generateReasoning(athlete, school, subScores, fitScore) {
  const client = getClient();
  if (!client) return fallbackReasoning(athlete, school, subScores);

  const utrDelta = (athlete.utr - school.tennis_utr_benchmark).toFixed(1);
  const aboveBelow = parseFloat(utrDelta) >= 0 ? `${utrDelta} above` : `${Math.abs(utrDelta)} below`;

  const prompt = `You are a tennis recruitment analyst. Write 2–3 precise sentences explaining this player–school fit.

Rules:
- Reference the specific UTR gap (${athlete.utr} vs ${school.tennis_utr_benchmark} benchmark = ${aboveBelow})
- Mention ONE notable academic or financial insight (not just "aligns well")
- Tailor the tone to division: D1 = competitive/elite, D2 = developmental, D3 = academic prestige
- Be direct. No filler phrases like "positions them well." Say what actually matters.
- Do NOT start with the athlete's name.

Athlete: ${athlete.name}, ${athlete.age}, ${athlete.nationality}
Rankings: UTR ${athlete.utr}${athlete.itf_rank ? ` | ITF #${athlete.itf_rank}` : ''}${athlete.atp_rank ? ` | ATP #${athlete.atp_rank}` : ''}
Academic: GPA ${athlete.gpa ?? 'N/A'} | SAT ${athlete.sat ?? 'N/A'}

School: ${school.name} (${school.division}, ${school.location})
Benchmark: UTR ${school.tennis_utr_benchmark} | GPA min ${school.gpa_min} | Tuition $${school.tuition.toLocaleString()} | Acceptance ${Math.round(school.acceptance_rate * 100)}%

Sub-scores: Athletic ${Math.round(subScores.athleticMatch * 100)}/100 | Academic ${Math.round(subScores.academicMatch * 100)}/100 | Affordability ${Math.round(subScores.affordability * 100)}/100 | Overall ${fitScore}/100`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 160,
      temperature: 0.45,
    });
    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error('[aiService] reasoning failed:', err.message);
    return fallbackReasoning(athlete, school, subScores);
  }
}

async function generateOutreachEmail(athlete, school) {
  const client = getClient();
  if (!client) return fallbackOutreach(athlete, school);

  const statLines = [
    `UTR: ${athlete.utr}`,
    athlete.itf_rank ? `ITF Junior Ranking: #${athlete.itf_rank}` : null,
    athlete.atp_rank ? `ATP Ranking: #${athlete.atp_rank}` : null,
    athlete.gpa      ? `GPA: ${athlete.gpa}` : null,
    athlete.sat      ? `SAT: ${athlete.sat}` : null,
  ].filter(Boolean).join(', ');

  const prompt = `Write a professional outreach email from a junior tennis player to a college coach.

Tone: confident, concise, respectful. Not generic — reference specific things about the program.
Format: Subject line first (prefix "Subject: "), then a blank line, then 3–4 short paragraphs.
Paragraphs: (1) brief intro + nationality, (2) key stats, (3) why this specific school/program, (4) call to action asking for a call or visit.

Athlete: ${athlete.name}, age ${athlete.age}, from ${athlete.nationality}
Stats: ${statLines}
School: ${school.name} (${school.division}, ${school.location})`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });
    const raw = res.choices[0].message.content.trim();
    const subjectMatch = raw.match(/^Subject:\s*(.+)/im);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Student-Athlete Inquiry — ${athlete.name}`;
    const body = raw.replace(/^Subject:.*\n?/im, '').trim();
    return { subject, body };
  } catch (err) {
    console.error('[aiService] outreach failed:', err.message);
    return fallbackOutreach(athlete, school);
  }
}

async function generateCoachOutreachEmail(coach, athlete) {
  const client = getClient();
  if (!client) return fallbackCoachOutreach(coach, athlete);

  const statLines = [
    `UTR: ${athlete.utr}`,
    athlete.itf_rank ? `ITF Junior Ranking: #${athlete.itf_rank}` : null,
    athlete.atp_rank ? `ATP Ranking: #${athlete.atp_rank}` : null,
    athlete.gpa      ? `GPA: ${athlete.gpa}` : null,
  ].filter(Boolean).join(', ');

  const coachName   = coach.name     ?? 'Coach';
  const coachSchool = coach.school   ?? 'our program';
  const coachRole   = coach.position ?? 'Tennis Coach';
  const division    = coach.division ?? '';

  const prompt = `Write a professional recruiting email from a college tennis coach to a prospective student-athlete.

Tone: warm, direct, genuine. Show real interest in this specific athlete — not a form letter.
Format: Subject line first (prefix "Subject: "), then a blank line, then 3–4 short paragraphs.
Paragraphs: (1) who the coach is and their school, (2) why this athlete stands out (reference their stats), (3) what the program offers, (4) call to action — invite a call, visit, or reply.

Coach: ${coachName}, ${coachRole} at ${coachSchool}${division ? ` (${division})` : ''}
Athlete: ${athlete.name}, age ${athlete.age ?? 'N/A'}, from ${athlete.nationality ?? 'N/A'}
Athlete stats: ${statLines}`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });
    const raw = res.choices[0].message.content.trim();
    const subjectMatch = raw.match(/^Subject:\s*(.+)/im);
    const subject = subjectMatch ? subjectMatch[1].trim() : `${coachSchool} Tennis — Recruiting Interest in ${athlete.name}`;
    const body = raw.replace(/^Subject:.*\n?/im, '').trim();
    return { subject, body };
  } catch (err) {
    console.error('[aiService] coach outreach failed:', err.message);
    return fallbackCoachOutreach(coach, athlete);
  }
}

module.exports = { generateReasoning, generateOutreachEmail, generateCoachOutreachEmail };
