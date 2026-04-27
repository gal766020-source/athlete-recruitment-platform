/**
 * Mock player database — 80 junior tennis prospects.
 * Covers Elite / High / Emerging tiers across diverse nationalities.
 * PSS (Player Strength Score) tiers: Elite ≥ 0.80, High 0.55–0.79, Emerging < 0.55
 */

const players = [
  // ── Elite Tier ────────────────────────────────────────────────────────────
  {
    id: 'p001', name: 'Marco Rossi', age: 18, nationality: 'Italy',
    utr: 14.2, itf_rank: 12, atp_rank: null, gpa: 3.6, sat: 1380,
    bio: 'Former ITF junior top-20. Strong baseline game with exceptional clay court pedigree.',
  },
  {
    id: 'p002', name: 'Alexei Volkov', age: 17, nationality: 'Russia',
    utr: 13.8, itf_rank: 28, atp_rank: null, gpa: 3.4, sat: 1290,
    bio: 'Hard-court specialist with elite serve. National U18 champion.',
  },
  {
    id: 'p003', name: 'Carlos Mendez', age: 18, nationality: 'Spain',
    utr: 14.5, itf_rank: 8, atp_rank: null, gpa: 3.7, sat: null,
    bio: 'Top-10 ITF junior. Tactical clay court player targeting D1 elite programs.',
  },
  {
    id: 'p004', name: 'Luca Bianchi', age: 19, nationality: 'Italy',
    utr: 13.5, itf_rank: 45, atp_rank: 820, gpa: null, sat: null,
    bio: 'ATP-ranked junior with professional experience. Strong all-court game.',
  },
  {
    id: 'p005', name: 'Sebastien Moreau', age: 18, nationality: 'France',
    utr: 14.0, itf_rank: 18, atp_rank: null, gpa: 3.8, sat: 1420,
    bio: 'French national academy graduate. Elite baseline consistency.',
  },
  {
    id: 'p006', name: 'Jan Kolar', age: 17, nationality: 'Czech Republic',
    utr: 13.6, itf_rank: 35, atp_rank: null, gpa: 3.5, sat: 1310,
    bio: 'Czech junior champion. Heavy forehand and strong net game.',
  },
  {
    id: 'p007', name: 'Diego Herrera', age: 18, nationality: 'Argentina',
    utr: 14.3, itf_rank: 15, atp_rank: null, gpa: 3.2, sat: null,
    bio: 'South American clay court prodigy. Natural two-handed backhand.',
  },
  {
    id: 'p008', name: 'Lukas Weber', age: 19, nationality: 'Germany',
    utr: 13.2, itf_rank: 62, atp_rank: 950, gpa: 3.9, sat: 1490,
    bio: 'High academic achiever with ATP ranking. Targeting elite D3 or D1.',
  },
  {
    id: 'p009', name: 'Andrei Popescu', age: 18, nationality: 'Romania',
    utr: 13.9, itf_rank: 22, atp_rank: null, gpa: 3.6, sat: 1350,
    bio: 'Romanian champion. Aggressive returner with excellent movement.',
  },
  {
    id: 'p010', name: 'Takumi Nakamura', age: 17, nationality: 'Japan',
    utr: 13.4, itf_rank: 48, atp_rank: null, gpa: 3.8, sat: 1460,
    bio: 'Japanese junior sensation. Exceptional footwork and shot-making.',
  },
  {
    id: 'p011', name: 'Henri Laaksonen', age: 18, nationality: 'Finland',
    utr: 13.7, itf_rank: 31, atp_rank: null, gpa: 3.7, sat: 1410,
    bio: 'Nordic indoor specialist with a big serve. ITF top-35.',
  },
  {
    id: 'p012', name: 'Pablo Ortiz', age: 19, nationality: 'Mexico',
    utr: 14.1, itf_rank: 20, atp_rank: null, gpa: 3.3, sat: 1260,
    bio: 'Mexican national champion three years running. Big-hitting baseline style.',
  },
  {
    id: 'p013', name: 'Mikhail Kazakov', age: 17, nationality: 'Kazakhstan',
    utr: 13.5, itf_rank: 40, atp_rank: null, gpa: 3.5, sat: null,
    bio: 'Asian Games junior medalist. Powerful serve and forehand combination.',
  },
  {
    id: 'p014', name: 'Ethan Clarke', age: 18, nationality: 'Australia',
    utr: 14.0, itf_rank: 17, atp_rank: null, gpa: 3.6, sat: 1340,
    bio: 'Australian Open junior quarterfinalist. Serve-and-volley specialist.',
  },
  {
    id: 'p015', name: 'Oliver Braun', age: 18, nationality: 'Switzerland',
    utr: 13.3, itf_rank: 55, atp_rank: null, gpa: 4.0, sat: 1530,
    bio: 'Near-perfect academic record. Consistent baseliner with elite test scores.',
  },

  // ── High Tier ─────────────────────────────────────────────────────────────
  {
    id: 'p016', name: 'Lucas Fontaine', age: 17, nationality: 'France',
    utr: 12.8, itf_rank: 88, atp_rank: null, gpa: 3.5, sat: 1310,
    bio: 'French regional champion. Solid topspin baseline game.',
  },
  {
    id: 'p017', name: 'Kenji Watanabe', age: 18, nationality: 'Japan',
    utr: 12.5, itf_rank: 120, atp_rank: null, gpa: 3.8, sat: 1470,
    bio: 'Strong academic profile. Consistent all-court player.',
  },
  {
    id: 'p018', name: 'Nicolás Alvarez', age: 19, nationality: 'Colombia',
    utr: 12.9, itf_rank: 95, atp_rank: null, gpa: 3.3, sat: null,
    bio: 'Colombian federation prospect. Aggressive net rusher.',
  },
  {
    id: 'p019', name: 'Finn Eriksen', age: 17, nationality: 'Denmark',
    utr: 11.8, itf_rank: 180, atp_rank: null, gpa: 3.9, sat: 1500,
    bio: 'Danish prodigy with outstanding academic credentials.',
  },
  {
    id: 'p020', name: 'Soren Lindqvist', age: 18, nationality: 'Sweden',
    utr: 12.2, itf_rank: 140, atp_rank: null, gpa: 3.6, sat: 1380,
    bio: 'Swedish federation player. Athletic and mentally tough.',
  },
  {
    id: 'p021', name: 'Ravi Sharma', age: 18, nationality: 'India',
    utr: 11.5, itf_rank: 210, atp_rank: null, gpa: 3.9, sat: 1520,
    bio: 'Top Indian junior with elite SAT score. Technically sound.',
  },
  {
    id: 'p022', name: 'Timur Askarov', age: 17, nationality: 'Uzbekistan',
    utr: 12.6, itf_rank: 105, atp_rank: null, gpa: 3.4, sat: null,
    bio: 'Central Asian circuit winner. Heavy forehand and excellent defense.',
  },
  {
    id: 'p023', name: 'Mateus Costa', age: 18, nationality: 'Brazil',
    utr: 12.0, itf_rank: 155, atp_rank: null, gpa: 3.2, sat: null,
    bio: 'Brazilian junior champion. Excellent athletic pedigree.',
  },
  {
    id: 'p024', name: 'Patrick O\'Brien', age: 19, nationality: 'Ireland',
    utr: 11.9, itf_rank: 168, atp_rank: null, gpa: 3.7, sat: 1430,
    bio: 'Irish national champion. Left-hander with a tricky serve.',
  },
  {
    id: 'p025', name: 'Yuki Tanaka', age: 17, nationality: 'Japan',
    utr: 12.4, itf_rank: 115, atp_rank: null, gpa: 3.8, sat: 1450,
    bio: 'Exceptional speed and retrieval ability. Strong counter-puncher.',
  },
  {
    id: 'p026', name: 'Ben Ashworth', age: 18, nationality: 'United Kingdom',
    utr: 12.1, itf_rank: 148, atp_rank: null, gpa: 3.6, sat: 1360,
    bio: 'LTA funded player. Good all-around game with excellent court craft.',
  },
  {
    id: 'p027', name: 'Stefan Ivanovic', age: 18, nationality: 'Serbia',
    utr: 12.7, itf_rank: 100, atp_rank: null, gpa: 3.1, sat: null,
    bio: 'Serbian academy product. Hard baseline hitter.',
  },
  {
    id: 'p028', name: 'Tomas Blazek', age: 19, nationality: 'Czech Republic',
    utr: 11.6, itf_rank: 195, atp_rank: null, gpa: 3.8, sat: 1420,
    bio: 'Czech second-tier junior. Solid fundamentals and fitness.',
  },
  {
    id: 'p029', name: 'Guillermo Vega', age: 17, nationality: 'Chile',
    utr: 12.3, itf_rank: 130, atp_rank: null, gpa: 3.3, sat: null,
    bio: 'South American clay circuit regular. Strong topspin looper.',
  },
  {
    id: 'p030', name: 'Antoine Bernard', age: 18, nationality: 'Belgium',
    utr: 11.7, itf_rank: 185, atp_rank: null, gpa: 3.7, sat: 1410,
    bio: 'Belgian federation junior. European hard-court specialist.',
  },
  {
    id: 'p031', name: 'Maxim Petrov', age: 18, nationality: 'Bulgaria',
    utr: 12.0, itf_rank: 162, atp_rank: null, gpa: 3.4, sat: 1300,
    bio: 'Balkan circuit standout. Physically imposing with a big game.',
  },
  {
    id: 'p032', name: 'James Harrington', age: 19, nationality: 'Canada',
    utr: 11.4, itf_rank: 220, atp_rank: null, gpa: 3.8, sat: 1480,
    bio: 'Tennis Canada development player. Disciplined grinder.',
  },
  {
    id: 'p033', name: 'Nico Becker', age: 17, nationality: 'Germany',
    utr: 12.9, itf_rank: 80, atp_rank: null, gpa: 3.5, sat: null,
    bio: 'German U18 finalist. Powerful serve-and-baseline combination.',
  },
  {
    id: 'p034', name: 'Ivan Marchetti', age: 18, nationality: 'Italy',
    utr: 11.8, itf_rank: 178, atp_rank: null, gpa: 3.6, sat: 1360,
    bio: 'Italian Tennis Federation junior. Solid two-handed backhand.',
  },
  {
    id: 'p035', name: 'Viktor Szabo', age: 19, nationality: 'Hungary',
    utr: 11.5, itf_rank: 208, atp_rank: null, gpa: 3.7, sat: 1390,
    bio: 'Hungarian national champion. Excellent defensive skills.',
  },
  {
    id: 'p036', name: 'Arjun Mehta', age: 17, nationality: 'India',
    utr: 11.2, itf_rank: 245, atp_rank: null, gpa: 4.0, sat: 1560,
    bio: 'Near-perfect academics. Strong IQ tennis with excellent placement.',
  },
  {
    id: 'p037', name: 'Roberto Fuentes', age: 18, nationality: 'Venezuela',
    utr: 12.5, itf_rank: 112, atp_rank: null, gpa: 3.1, sat: null,
    bio: 'Venezuelan champion. Natural athleticism and great hands at net.',
  },
  {
    id: 'p038', name: 'Kasper Andersen', age: 18, nationality: 'Denmark',
    utr: 11.9, itf_rank: 170, atp_rank: null, gpa: 3.8, sat: 1440,
    bio: 'Danish national team member. Excellent fitness and work ethic.',
  },
  {
    id: 'p039', name: 'George Papadopoulos', age: 19, nationality: 'Greece',
    utr: 12.2, itf_rank: 142, atp_rank: null, gpa: 3.5, sat: 1320,
    bio: 'Greek federation player. Mediterranean clay court pedigree.',
  },
  {
    id: 'p040', name: 'Hamid Nazari', age: 17, nationality: 'Iran',
    utr: 11.6, itf_rank: 200, atp_rank: null, gpa: 3.9, sat: 1510,
    bio: 'Outstanding test scores. Developing power game with strong work ethic.',
  },
  {
    id: 'p041', name: 'Wei Chen', age: 18, nationality: 'China',
    utr: 12.1, itf_rank: 150, atp_rank: null, gpa: 3.8, sat: 1490,
    bio: 'Chinese national team prospect. Consistent from both wings.',
  },
  {
    id: 'p042', name: 'Eduardo Lima', age: 18, nationality: 'Brazil',
    utr: 11.3, itf_rank: 232, atp_rank: null, gpa: 3.2, sat: null,
    bio: 'Brazilian-style clay court grinder. High fitness levels.',
  },
  {
    id: 'p043', name: 'Dominic Walsh', age: 17, nationality: 'United States',
    utr: 12.8, itf_rank: 92, atp_rank: null, gpa: 3.6, sat: 1400,
    bio: 'USTA academy product. Power hitter with rising trajectory.',
  },
  {
    id: 'p044', name: 'Kyle Johnson', age: 18, nationality: 'United States',
    utr: 11.7, itf_rank: 188, atp_rank: null, gpa: 3.9, sat: 1530,
    bio: 'Strong academics with a balanced game. D1-capable student-athlete.',
  },
  {
    id: 'p045', name: 'Nathan Park', age: 17, nationality: 'South Korea',
    utr: 12.4, itf_rank: 118, atp_rank: null, gpa: 3.7, sat: 1460,
    bio: 'Korean-American with strong technical foundation. Quick mover.',
  },
  {
    id: 'p046', name: 'Florian Müller', age: 19, nationality: 'Austria',
    utr: 11.4, itf_rank: 222, atp_rank: null, gpa: 3.6, sat: 1370,
    bio: 'Austrian national squad. Excellent serve and net approaches.',
  },
  {
    id: 'p047', name: 'Emre Yilmaz', age: 18, nationality: 'Turkey',
    utr: 12.0, itf_rank: 158, atp_rank: null, gpa: 3.3, sat: null,
    bio: 'Turkish federation member. Athletic with a flat, powerful game.',
  },
  {
    id: 'p048', name: 'Cristian Duca', age: 18, nationality: 'Romania',
    utr: 11.6, itf_rank: 197, atp_rank: null, gpa: 3.5, sat: 1340,
    bio: 'Romanian juniors specialist. Mentally strong with great consistency.',
  },
  {
    id: 'p049', name: 'Alejandro Ruiz', age: 17, nationality: 'Peru',
    utr: 12.3, itf_rank: 128, atp_rank: null, gpa: 3.4, sat: null,
    bio: 'South American circuit regular. Heavy topspin from the back court.',
  },
  {
    id: 'p050', name: 'Julien Girard', age: 18, nationality: 'France',
    utr: 11.9, itf_rank: 172, atp_rank: null, gpa: 3.7, sat: 1420,
    bio: 'FFT development program. Tactical awareness above average.',
  },

  // ── Emerging Tier ─────────────────────────────────────────────────────────
  {
    id: 'p051', name: 'Oscar Nilsson', age: 16, nationality: 'Sweden',
    utr: 10.8, itf_rank: 310, atp_rank: null, gpa: 3.7, sat: null,
    bio: 'Developing Swedish junior. Big physical upside and improving rapidly.',
  },
  {
    id: 'p052', name: 'Adam Kowalski', age: 17, nationality: 'Poland',
    utr: 10.5, itf_rank: 380, atp_rank: null, gpa: 3.6, sat: 1350,
    bio: 'Polish national U17. Emerging clay-court baseline game.',
  },
  {
    id: 'p053', name: 'Dario Conti', age: 17, nationality: 'Italy',
    utr: 10.2, itf_rank: 420, atp_rank: null, gpa: 3.8, sat: 1430,
    bio: 'Strong academic profile. Developing serve and physique.',
  },
  {
    id: 'p054', name: 'Nikolai Smirnov', age: 16, nationality: 'Belarus',
    utr: 9.8, itf_rank: 480, atp_rank: null, gpa: 3.5, sat: null,
    bio: 'Belarusian prodigy. Raw but explosive with exceptional upside.',
  },
  {
    id: 'p055', name: 'Jake Williams', age: 17, nationality: 'United States',
    utr: 10.5, itf_rank: null, atp_rank: null, gpa: 3.9, sat: 1510,
    bio: 'High-GPA scholar-athlete. D3 target with strong academics.',
  },
  {
    id: 'p056', name: 'Ryan O\'Connor', age: 18, nationality: 'United States',
    utr: 10.1, itf_rank: null, atp_rank: null, gpa: 3.7, sat: 1440,
    bio: 'Domestic USTA player. Consistent serve and steady groundstrokes.',
  },
  {
    id: 'p057', name: 'Jordan Lee', age: 17, nationality: 'United States',
    utr: 9.5, itf_rank: null, atp_rank: null, gpa: 4.0, sat: 1570,
    bio: 'Perfect GPA. Elite D3 academic-athletic prospect.',
  },
  {
    id: 'p058', name: 'Connor Sullivan', age: 18, nationality: 'United States',
    utr: 10.8, itf_rank: null, atp_rank: null, gpa: 3.5, sat: 1330,
    bio: 'High-level national junior circuit performer.',
  },
  {
    id: 'p059', name: 'Hiroshi Kimura', age: 16, nationality: 'Japan',
    utr: 9.6, itf_rank: 510, atp_rank: null, gpa: 3.9, sat: null,
    bio: 'Very young prospect with exceptional potential. Technically precise.',
  },
  {
    id: 'p060', name: 'Marco Silva', age: 17, nationality: 'Portugal',
    utr: 10.3, itf_rank: 400, atp_rank: null, gpa: 3.4, sat: null,
    bio: 'Portuguese national team junior. Strong clay game.',
  },
  {
    id: 'p061', name: 'Bogdan Lungu', age: 18, nationality: 'Moldova',
    utr: 9.9, itf_rank: 460, atp_rank: null, gpa: 3.6, sat: 1310,
    bio: 'Moldovan federation player. Compact game with heavy topspin.',
  },
  {
    id: 'p062', name: 'Hassan Al-Rashid', age: 17, nationality: 'UAE',
    utr: 10.0, itf_rank: 440, atp_rank: null, gpa: 3.8, sat: 1440,
    bio: 'UAE national team. Strong academic record and improving rankings.',
  },
  {
    id: 'p063', name: 'Samuel Okafor', age: 18, nationality: 'Nigeria',
    utr: 9.4, itf_rank: null, atp_rank: null, gpa: 3.7, sat: 1400,
    bio: 'Athletic prospect from Nigeria. Explosive mover with natural talent.',
  },
  {
    id: 'p064', name: 'Jonas Vogel', age: 16, nationality: 'Germany',
    utr: 10.6, itf_rank: 355, atp_rank: null, gpa: 3.5, sat: null,
    bio: 'DTB U16 squad. Solid technical foundation with growing power.',
  },
  {
    id: 'p065', name: 'Felipe Rocha', age: 17, nationality: 'Brazil',
    utr: 9.7, itf_rank: 495, atp_rank: null, gpa: 3.2, sat: null,
    bio: 'Brazilian national U17. Fast legs and big top-spin forehand.',
  },
  {
    id: 'p066', name: 'Cian Murphy', age: 18, nationality: 'Ireland',
    utr: 10.2, itf_rank: 415, atp_rank: null, gpa: 3.8, sat: 1450,
    bio: 'Irish junior. Technical precision and strong mental game.',
  },
  {
    id: 'p067', name: 'Piotr Kaminski', age: 17, nationality: 'Poland',
    utr: 9.5, itf_rank: 500, atp_rank: null, gpa: 3.6, sat: 1360,
    bio: 'Polish developing prospect. Good footwork and improving serve.',
  },
  {
    id: 'p068', name: 'Ivan Petric', age: 17, nationality: 'Croatia',
    utr: 10.4, itf_rank: 390, atp_rank: null, gpa: 3.3, sat: null,
    bio: 'Croatian federation junior. Strong ball-striking from the baseline.',
  },
  {
    id: 'p069', name: 'Yusuf Demirci', age: 18, nationality: 'Turkey',
    utr: 9.8, itf_rank: 475, atp_rank: null, gpa: 3.5, sat: 1290,
    bio: 'Turkish U18. Athletic with a big serve developing rapidly.',
  },
  {
    id: 'p070', name: 'David Pham', age: 17, nationality: 'Vietnam',
    utr: 9.2, itf_rank: null, atp_rank: null, gpa: 4.0, sat: 1540,
    bio: 'Perfect academics. Strong D3 candidate with elite test scores.',
  },
  {
    id: 'p071', name: 'Stefan Georgescu', age: 18, nationality: 'Romania',
    utr: 10.1, itf_rank: 430, atp_rank: null, gpa: 3.4, sat: 1280,
    bio: 'Romanian circuit player. Mentally resilient with clay expertise.',
  },
  {
    id: 'p072', name: 'Hugo Lecomte', age: 16, nationality: 'France',
    utr: 10.7, itf_rank: 335, atp_rank: null, gpa: 3.6, sat: null,
    bio: 'French academy youth. Fast-improving junior with excellent upside.',
  },
  {
    id: 'p073', name: 'Kemal Ozturk', age: 17, nationality: 'Turkey',
    utr: 9.6, itf_rank: 505, atp_rank: null, gpa: 3.7, sat: null,
    bio: 'Turkish federation emerging player. Powerful groundstrokes.',
  },
  {
    id: 'p074', name: 'Aleksa Nikolic', age: 17, nationality: 'Serbia',
    utr: 10.3, itf_rank: 405, atp_rank: null, gpa: 3.2, sat: null,
    bio: 'Serbian junior academy. Big baseline game with aggressive mentality.',
  },
  {
    id: 'p075', name: 'Tobias Richter', age: 18, nationality: 'Germany',
    utr: 9.9, itf_rank: 455, atp_rank: null, gpa: 3.7, sat: 1390,
    bio: 'German club player with strong academic focus. D3 target.',
  },
  {
    id: 'p076', name: 'Emilio Vargas', age: 17, nationality: 'Ecuador',
    utr: 10.0, itf_rank: 445, atp_rank: null, gpa: 3.3, sat: null,
    bio: 'Ecuadorian national team junior. Smooth, compact ball-striking.',
  },
  {
    id: 'p077', name: 'Simon Haas', age: 18, nationality: 'Luxembourg',
    utr: 9.3, itf_rank: null, atp_rank: null, gpa: 3.9, sat: 1490,
    bio: 'Luxembourg national champion. High academic achiever targeting D3.',
  },
  {
    id: 'p078', name: 'Enzo Ferreira', age: 16, nationality: 'Brazil',
    utr: 10.6, itf_rank: 345, atp_rank: null, gpa: 3.1, sat: null,
    bio: 'Young Brazilian with elite physical tools and clay-court instincts.',
  },
  {
    id: 'p079', name: 'Tae-Yang Kim', age: 17, nationality: 'South Korea',
    utr: 9.7, itf_rank: 490, atp_rank: null, gpa: 3.9, sat: 1500,
    bio: 'Korean junior with great academics and improving UTR.',
  },
  {
    id: 'p080', name: 'Miguel Fonseca', age: 18, nationality: 'Portugal',
    utr: 9.1, itf_rank: null, atp_rank: null, gpa: 3.8, sat: 1460,
    bio: 'Academic-athletic balance. Patient counter-puncher with high IQ tennis.',
  },
];

module.exports = players;
