import { useState, useEffect, useCallback, useRef } from 'react';

const DOMAINS = [
  'Log Analysis & Attack Identification (SQLi, XSS, Path Traversal, RCE, C2 Beaconing, Buffer Overflow)',
  'Reconnaissance & Footprinting (OSINT, passive/active recon, Shodan, DNS, Google hacking)',
  'Network Scanning & Enumeration (Nmap, Netcat, SMB, SNMP, LDAP, banner grabbing, Nessus)',
  'Cryptography & PKI (symmetric/asymmetric, hashing, digital signatures, certificates, attacks)',
  'Malware & Social Engineering (trojans, RATs, ransomware, phishing, vishing, pretexting, rootkits)',
  'Cloud, IoT & Mobile Security (AWS misconfig, OWASP Mobile Top 10, firmware attacks, container security)',
];

const SYSTEM_PROMPT = `You are an expert EC-Council CEH v12 (Certified Ethical Hacker) exam question writer with 10 years of experience creating certification exam content.

Generate exactly 25 multiple-choice practice questions for the specified CEH domain.

STRICT REQUIREMENTS:
1. LOG ANALYSIS DOMAIN ONLY: At least 15 of 25 questions MUST include a "log" field containing a realistic log snippet. Logs must include: real RFC1918 or public IP addresses, authentic timestamps, actual protocol flags, realistic payloads (SQLi strings, shellcode, base64, encoded commands). Log types: NIDS/Snort alerts, WAF logs, Windows Event Log (Event IDs), Linux syslog/auth.log, DNS query logs, Apache/Nginx access logs, firewall logs.
2. OTHER DOMAINS: "log" field should be null. Focus on scenario-based and knowledge questions.
3. Every question: exactly 4 options, 3 plausible distractors that test-takers commonly confuse with the correct answer.
4. Rationale MUST identify the specific "smoking gun" — the exact evidence that confirms the answer.
5. Match CEH v12 exam difficulty. Use real tool names (Nmap, Metasploit, Wireshark, Aircrack-ng, Maltego, etc.).
6. Vary question types: identify-the-attack, choose-the-tool, best-practice, fill-the-gap, scenario analysis.
7. Difficulty mix: 8 easy, 12 medium, 5 hard.

OUTPUT FORMAT: Respond with ONLY a raw JSON array. Zero markdown. Zero explanation. Zero code fences. Just the JSON starting with [ and ending with ].

Schema per question:
{
  "log": "realistic multi-line log text here" | null,
  "q": "Full question text ending with ?",
  "opts": ["A option text", "B option text", "C option text", "D option text"],
  "ans": <integer 0-3 representing correct option index>,
  "rat": "SMOKING GUN: [specific evidence]\\n\\n[2-3 sentence explanation of why this is correct]\\n\\nWhy the others are WRONG:\\n▸ [Wrong option]: [explanation]\\n▸ [Wrong option]: [explanation]\\n▸ [Wrong option]: [explanation]"
}`;

const LETTERS = ['A', 'B', 'C', 'D'];
const DOMAIN_ICONS = ['🔍', '🌐', '📡', '🔐', '🦠', '☁️', '🎯'];

// ── Paste your Anthropic API key here ──────────────────────────────────────
const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
// ───────────────────────────────────────────────────────────────────────────
console.log(API_KEY);
const S = {
  page: {
    minHeight: '100vh',
    background: '#060b18',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '28px 16px 80px',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  card: {
    background: '#0e1524',
    borderRadius: 18,
    padding: '26px 28px',
    maxWidth: 840,
    width: '100%',
    border: '1px solid #1e293b',
    boxShadow: '0 0 80px rgba(124,58,237,0.08), 0 24px 64px rgba(0,0,0,0.6)',
  },
  chip: {
    background: 'linear-gradient(90deg,#7c3aed,#1d4ed8)',
    color: '#fff',
    padding: '4px 14px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    display: 'inline-block',
  },
  sub: { color: '#475569', fontSize: 12, fontFamily: 'monospace' },
  track: {
    height: 6,
    background: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg,#7c3aed,#06b6d4)',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  logBox: {
    background: '#060b18',
    border: '1px solid #1e293b',
    borderLeft: '3px solid #7c3aed',
    borderRadius: 10,
    padding: '13px 16px',
    marginBottom: 18,
  },
  logTag: {
    color: '#7c3aed',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.2em',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  pre: {
    color: '#34d399',
    fontSize: 11,
    fontFamily: "'Courier New', monospace",
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.7,
    margin: 0,
  },
  question: {
    color: '#f1f5f9',
    fontSize: 15.5,
    fontWeight: 700,
    lineHeight: 1.65,
    marginBottom: 18,
  },
  opt: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    padding: '13px 15px',
    marginBottom: 8,
    borderRadius: 10,
    border: '2px solid #1e293b',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: 13.5,
    transition: 'all 0.15s',
    userSelect: 'none',
    lineHeight: 1.4,
  },
  letter: {
    background: '#1e293b',
    color: '#475569',
    width: 30,
    height: 30,
    minWidth: 30,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'monospace',
    transition: 'all 0.15s',
  },
  ratBox: {
    background: '#060b18',
    border: '1px solid #1e293b',
    borderLeft: '3px solid #10b981',
    borderRadius: 10,
    padding: '14px 16px',
    marginTop: 4,
  },
  ratTag: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.2em',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  btnPrimary: {
    background: 'linear-gradient(90deg,#7c3aed,#1d4ed8)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '13px 28px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'Georgia,serif',
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
  },
  btnDis: {
    background: '#1e293b',
    color: '#2d3748',
    border: 'none',
    borderRadius: 10,
    padding: '13px 28px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'not-allowed',
    fontFamily: 'Georgia,serif',
  },
  btnGhost: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid #1e293b',
    borderRadius: 10,
    padding: '13px 20px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'Georgia,serif',
  },
};

function LoadingScreen({ domainLabel, batch, attempt }) {
  const [frame, setFrame] = useState(0);
  const msgs = [
    'Generating exam scenarios…',
    'Writing log snippets…',
    'Crafting distractors…',
    'Adding smoking guns…',
    'Finalizing 25 questions…',
  ];
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % msgs.length), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign: 'center', padding: '64px 28px' }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🔐</div>
        <div style={{ ...S.chip, marginBottom: 18 }}>CEH PRACTICE TEST</div>
        <div
          style={{
            color: '#f1f5f9',
            fontSize: 19,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Batch {batch} — Generating 25 Questions
        </div>
        <div
          style={{
            color: '#7c3aed',
            fontSize: 13,
            marginBottom: 6,
            fontFamily: 'monospace',
          }}
        >
          {domainLabel}
        </div>
        <div
          style={{
            color: '#475569',
            fontSize: 12,
            marginBottom: 4,
            minHeight: 20,
          }}
        >
          {msgs[frame]}
        </div>
        {attempt > 1 && (
          <div
            style={{
              color: '#f59e0b',
              fontSize: 11,
              marginBottom: 16,
              fontFamily: 'monospace',
            }}
          >
            API busy — retry attempt {attempt} of 4…
          </div>
        )}
        <div style={{ marginBottom: 32 }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i === frame % 5 ? '#7c3aed' : '#1e293b',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DomainSelector({ onStart, totalBatches }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ ...S.chip, marginBottom: 14 }}>EC-COUNCIL CEH v12</div>
          <div
            style={{
              color: '#f1f5f9',
              fontSize: 24,
              fontWeight: 900,
              marginBottom: 6,
              letterSpacing: -0.5,
            }}
          >
            AI-Powered Practice Bank
          </div>
          <div style={{ color: '#475569', fontSize: 13 }}>
            25 questions per session · AI-generated · Unlimited attempts
          </div>
          {totalBatches > 0 && (
            <div
              style={{
                marginTop: 10,
                display: 'inline-block',
                background: '#0f1e38',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: '6px 14px',
                color: '#38bdf8',
                fontSize: 11,
                fontFamily: 'monospace',
              }}
            >
              {totalBatches * 25}+ questions completed this session
            </div>
          )}
        </div>
        <div
          style={{
            color: '#334155',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            marginBottom: 12,
            fontFamily: 'monospace',
          }}
        >
          ▸ SELECT A DOMAIN
        </div>
        {DOMAINS.map((d, i) => (
          <div
            key={i}
            onClick={() => setSel(i)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '14px 16px',
              marginBottom: 8,
              borderRadius: 12,
              border: sel === i ? '2px solid #7c3aed' : '2px solid #1e293b',
              background:
                sel === i ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>
              {DOMAIN_ICONS[i]}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: sel === i ? '#e2e8f0' : '#94a3b8',
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                {d.split('(')[0].trim()}
              </div>
              <div style={{ color: '#334155', fontSize: 11, marginTop: 3 }}>
                {d.match(/\((.+)\)/)?.[1]}
              </div>
            </div>
            {sel === i && (
              <span style={{ color: '#7c3aed', fontSize: 18, marginTop: 2 }}>
                ●
              </span>
            )}
          </div>
        ))}
        <div
          style={{
            color: '#334155',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            margin: '16px 0 12px',
            fontFamily: 'monospace',
          }}
        >
          ▸ OR SIMULATE THE FULL EXAM
        </div>
        <div
          onClick={() => setSel(6)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 12,
            border: sel === 6 ? '2px solid #06b6d4' : '2px solid #1e293b',
            background:
              sel === 6 ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.01)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 20 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: sel === 6 ? '#e2e8f0' : '#94a3b8',
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              All Domains Mixed
            </div>
            <div style={{ color: '#334155', fontSize: 11, marginTop: 3 }}>
              Mirrors the real CEH exam — all 6 domains randomized
            </div>
          </div>
          {sel === 6 && (
            <span style={{ color: '#06b6d4', fontSize: 18 }}>●</span>
          )}
        </div>
        <div style={{ marginTop: 22 }}>
          <button
            style={sel !== null ? S.btnPrimary : S.btnDis}
            disabled={sel === null}
            onClick={() => onStart(sel)}
          >
            Start 25-Question Session →
          </button>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            background: '#060b18',
            borderRadius: 10,
            border: '1px solid #1e293b',
          }}
        >
          <div style={{ color: '#475569', fontSize: 11, lineHeight: 1.8 }}>
            💡 Each session generates entirely fresh questions using Claude AI —
            realistic log snippets, CEH v12 tool references, and detailed
            smoking-gun rationales. The question bank is effectively unlimited.
          </div>
        </div>
      </div>
    </div>
  );
}

function TestScreen({ questions, domainIdx, batch, onFinish, onChangeDomain }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const scoreRef = useRef(0);
  const historyRef = useRef([]);

  const q = questions[current];
  const total = questions.length;
  const pctDone = (history.length / total) * 100;
  const domainLabel =
    domainIdx === 6
      ? 'All Domains Mixed'
      : DOMAINS[domainIdx].split('(')[0].trim();

  const pick = (i) => {
    if (!revealed) setSelected(i);
  };

  const submit = () => {
    if (selected === null || revealed) return;
    const ok = selected === q.ans;
    const newScore = ok ? scoreRef.current + 1 : scoreRef.current;
    const newHistory = [...historyRef.current, { ok, selected }];
    scoreRef.current = newScore;
    historyRef.current = newHistory;
    setScore(newScore);
    setHistory(newHistory);
    setRevealed(true);
  };

  const next = () => {
    if (current + 1 >= total) {
      onFinish(scoreRef.current, historyRef.current);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (!q) return null;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={S.chip}>CEH BATCH {batch}</span>
            <span
              style={{
                color: '#334155',
                fontSize: 11,
                fontFamily: 'monospace',
              }}
            >
              {domainLabel.length > 24
                ? domainLabel.substring(0, 24) + '…'
                : domainLabel}
            </span>
          </div>
          <span style={S.sub}>
            Score:{' '}
            <span
              style={{
                color: score > 0 ? '#10b981' : '#475569',
                fontWeight: 700,
              }}
            >
              {score}
            </span>{' '}
            <span style={{ color: '#1e293b' }}>/</span>{' '}
            <span style={{ color: '#334155' }}>{history.length}</span>
          </span>
        </div>
        <div style={S.track}>
          <div style={{ ...S.fill, width: `${pctDone}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 22,
          }}
        >
          <span style={S.sub}>
            Question {current + 1} of {total}
          </span>
          <span
            style={{ ...S.sub, color: pctDone > 0 ? '#7c3aed' : '#334155' }}
          >
            {Math.round(pctDone)}% complete
          </span>
        </div>
        {q.log && (
          <div style={S.logBox}>
            <div style={S.logTag}>📋 LOG SNIPPET — ANALYZE THIS</div>
            <pre style={S.pre}>{q.log}</pre>
          </div>
        )}
        <div style={S.question}>{q.q}</div>
        <div style={{ marginBottom: 14 }}>
          {q.opts.map((opt, i) => {
            let extra = {},
              letterExtra = {};
            if (!revealed) {
              if (selected === i) {
                extra = {
                  border: '2px solid #7c3aed',
                  background: 'rgba(124,58,237,0.12)',
                  color: '#e2e8f0',
                };
                letterExtra = { background: '#7c3aed', color: '#fff' };
              }
            } else {
              if (i === q.ans) {
                extra = {
                  border: '2px solid #10b981',
                  background: 'rgba(16,185,129,0.09)',
                  color: '#a7f3d0',
                  cursor: 'default',
                };
                letterExtra = { background: '#10b981', color: '#fff' };
              } else if (i === selected) {
                extra = {
                  border: '2px solid #f43f5e',
                  background: 'rgba(244,63,94,0.09)',
                  color: '#fda4af',
                  cursor: 'default',
                };
                letterExtra = { background: '#f43f5e', color: '#fff' };
              } else {
                extra = {
                  opacity: 0.22,
                  cursor: 'default',
                  border: '2px solid #0f172a',
                };
              }
            }
            return (
              <div
                key={i}
                style={{ ...S.opt, ...extra }}
                onClick={() => pick(i)}
              >
                <span style={{ ...S.letter, ...letterExtra }}>
                  {LETTERS[i]}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {revealed && i === q.ans && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#10b981',
                      flexShrink: 0,
                      fontFamily: 'monospace',
                      marginLeft: 8,
                    }}
                  >
                    ✓ CORRECT
                  </span>
                )}
                {revealed && i === selected && i !== q.ans && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#f43f5e',
                      flexShrink: 0,
                      fontFamily: 'monospace',
                      marginLeft: 8,
                    }}
                  >
                    ✗ WRONG
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {revealed && (
          <div style={S.ratBox}>
            <div style={S.ratTag}>🔍 RATIONALE & SMOKING GUN</div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.85,
                fontSize: 13,
                color: '#94a3b8',
              }}
            >
              {q.rat}
            </div>
          </div>
        )}
        <div
          style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}
        >
          {!revealed ? (
            <button
              style={selected !== null ? S.btnPrimary : S.btnDis}
              onClick={submit}
              disabled={selected === null}
            >
              Submit Answer
            </button>
          ) : (
            <button style={S.btnPrimary} onClick={next}>
              {current + 1 >= total ? 'View Results →' : 'Next Question →'}
            </button>
          )}
          <button style={S.btnGhost} onClick={onChangeDomain}>
            ← Domains
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({
  score,
  total,
  history,
  questions,
  onNewBatch,
  onChangeDomain,
  batch,
}) {
  const pct = Math.round((score / total) * 100);
  const pass = pct >= 70;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? history : history.slice(0, 10);
  const correct = history.filter((h) => h.ok).length;
  const wrong = history.filter((h) => !h.ok).length;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ ...S.chip, marginBottom: 18 }}>
          CEH BATCH {batch} — RESULTS
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0 24px',
            borderBottom: '1px solid #1e293b',
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              lineHeight: 1,
              color: pass ? '#10b981' : '#f43f5e',
              letterSpacing: -3,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              marginTop: 10,
              color: pass ? '#10b981' : '#f59e0b',
            }}
          >
            {pass ? '✅  PASS' : '⚠️  KEEP STUDYING'}
          </div>
          <div
            style={{
              color: '#475569',
              fontSize: 12,
              marginTop: 6,
              fontFamily: 'monospace',
            }}
          >
            {score} / {total} correct &nbsp;·&nbsp; Passing threshold: 70%
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                padding: '6px 16px',
                color: '#10b981',
                fontSize: 13,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              ✓ {correct} correct
            </div>
            <div
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 8,
                padding: '6px 16px',
                color: '#f43f5e',
                fontSize: 13,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              ✗ {wrong} wrong
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              background: '#1e293b',
              borderRadius: 8,
              height: 10,
              overflow: 'hidden',
              maxWidth: 340,
              margin: '16px auto 0',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: pass
                  ? 'linear-gradient(90deg,#059669,#10b981)'
                  : 'linear-gradient(90deg,#dc2626,#f43f5e)',
                borderRadius: 8,
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>
        <div
          style={{
            color: '#334155',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            marginBottom: 10,
            fontFamily: 'monospace',
          }}
        >
          ▸ QUESTION BREAKDOWN
        </div>
        <div
          style={{
            background: '#060b18',
            borderRadius: 10,
            marginBottom: 12,
            overflow: 'hidden',
            border: '1px solid #1e293b',
          }}
        >
          {displayed.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderBottom:
                  i < displayed.length - 1 ? '1px solid #0e1524' : 'none',
              }}
            >
              <span
                style={{
                  color: r.ok ? '#10b981' : '#f43f5e',
                  fontWeight: 900,
                  fontSize: 14,
                  minWidth: 18,
                }}
              >
                {r.ok ? '✓' : '✗'}
              </span>
              <span
                style={{
                  color: '#1e3a5f',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  minWidth: 30,
                }}
              >
                Q{i + 1}
              </span>
              <span
                style={{
                  color: '#334155',
                  fontSize: 11.5,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {questions[i]?.q}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: r.ok ? '#059669' : '#dc2626',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {r.ok ? 'CORRECT' : 'WRONG'}
              </span>
            </div>
          ))}
        </div>
        {history.length > 10 && (
          <button
            style={{
              ...S.btnGhost,
              fontSize: 12,
              padding: '8px 16px',
              marginBottom: 16,
            }}
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? 'Show Less ↑' : `Show All ${history.length} Questions ↓`}
          </button>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={S.btnPrimary} onClick={onNewBatch}>
            ↺ New Batch of 25 Questions →
          </button>
          <button style={S.btnGhost} onClick={onChangeDomain}>
            ← Change Domain
          </button>
        </div>
        <div
          style={{
            marginTop: 14,
            color: '#1e3a5f',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          Each new batch uses AI to generate completely fresh questions — you
          will never repeat the same test.
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry, onBack }) {
  return (
    <div style={S.page}>
      <div style={{ ...S.card, textAlign: 'center', padding: '52px 28px' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
        <div
          style={{
            color: '#f43f5e',
            fontSize: 17,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          Question Generation Failed
        </div>
        <div
          style={{
            color: '#475569',
            fontSize: 13,
            maxWidth: 400,
            margin: '0 auto 20px',
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
        <div
          style={{
            color: '#334155',
            fontSize: 11,
            marginBottom: 24,
            fontFamily: 'monospace',
          }}
        >
          Please check your API key in src/App.jsx and try again.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button style={S.btnPrimary} onClick={onRetry}>
            ↺ Try Again
          </button>
          <button style={S.btnGhost} onClick={onBack}>
            ← Back to Domains
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('select');
  const [domainIdx, setDomainIdx] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [batch, setBatch] = useState(0);
  const [error, setError] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalHistory, setFinalHistory] = useState([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loadingAttempt, setLoadingAttempt] = useState(1);

  const generateQuestions = useCallback(async (dIdx, batchNum) => {
    setPhase('loading');
    setLoadingAttempt(1);
    setError(null);

    const domainStr =
      dIdx === 6
        ? 'ALL CEH v12 domains mixed equally: ' + DOMAINS.join(' | ')
        : DOMAINS[dIdx];

    const userPrompt = `Generate 25 CEH v12 practice exam questions for: ${domainStr}

Batch #${batchNum} — every question must be DIFFERENT from prior batches. Vary attack types, CVEs, tools, protocols, and scenarios.

${dIdx === 0 ? "CRITICAL: Log Analysis domain — at least 15 of 25 questions MUST have a realistic log snippet in the 'log' field." : ''}

Return ONLY the raw JSON array. No markdown fences. No preamble. Start with [ end with ].`;

    const MAX_RETRIES = 4;
    const RETRY_DELAY = 5000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        setLoadingAttempt(attempt);

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 16000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (res.status === 529 || res.status === 503 || res.status === 502) {
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt));
            continue;
          }
          throw new Error(
            `API overloaded (${res.status}). All ${MAX_RETRIES} retries exhausted. Please wait a minute and try again.`,
          );
        }

        if (!res.ok)
          throw new Error(`API error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        if (data.error)
          throw new Error(data.error.message || 'API returned error');

        const raw = data?.content?.[0]?.text || '';
        const start = raw.indexOf('[');
        if (start === -1)
          throw new Error('No JSON array found in response. Please retry.');

        let parsed;
        const endIdx = raw.lastIndexOf(']');
        try {
          parsed = JSON.parse(raw.slice(start, endIdx + 1));
        } catch {
          // Response was cut off — salvage complete questions before the truncation
          const partial = raw.slice(start);
          const lastComplete = partial.lastIndexOf('},');
          if (lastComplete === -1)
            throw new Error('Response too malformed to salvage. Please retry.');
          try {
            parsed = JSON.parse(partial.slice(0, lastComplete + 1) + ']');
          } catch {
            throw new Error('Could not parse questions. Please retry.');
          }
        }
        if (!Array.isArray(parsed))
          throw new Error('Response was not a valid JSON array.');

        const valid = parsed.filter(
          (q) =>
            typeof q.q === 'string' &&
            q.q.length > 10 &&
            Array.isArray(q.opts) &&
            q.opts.length === 4 &&
            typeof q.ans === 'number' &&
            q.ans >= 0 &&
            q.ans <= 3 &&
            typeof q.rat === 'string' &&
            q.rat.length > 20,
        );

        if (valid.length < 15)
          throw new Error(
            `Only ${valid.length} valid questions generated (minimum 15). Please retry.`,
          );

        setQuestions(valid);
        setTotalBatches((t) => t + 1);
        setPhase('test');
        return;
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          setError(err.message || 'Unknown error occurred.');
          setPhase('error');
        } else if (
          !err.message.includes('overloaded') &&
          !err.message.includes('529') &&
          !err.message.includes('503')
        ) {
          setError(err.message || 'Unknown error occurred.');
          setPhase('error');
          return;
        } else {
          await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt));
        }
      }
    }
  }, []);

  const handleStart = (dIdx) => {
    setDomainIdx(dIdx);
    const nb = batch + 1;
    setBatch(nb);
    generateQuestions(dIdx, nb);
  };

  const handleFinish = useCallback((sc, hist) => {
    setFinalScore(sc);
    setFinalHistory(hist);
    setPhase('results');
  }, []);

  const handleNewBatch = () => {
    const nb = batch + 1;
    setBatch(nb);
    generateQuestions(domainIdx, nb);
  };

  const handleChangeDomain = () => {
    setPhase('select');
    setQuestions([]);
  };

  const domainLabel =
    domainIdx === 6
      ? 'All Domains Mixed'
      : domainIdx !== null
        ? DOMAINS[domainIdx].split('(')[0].trim()
        : '';

  if (phase === 'select')
    return <DomainSelector onStart={handleStart} totalBatches={totalBatches} />;
  if (phase === 'loading')
    return (
      <LoadingScreen
        domainLabel={domainLabel}
        batch={batch}
        attempt={loadingAttempt}
      />
    );
  if (phase === 'error')
    return (
      <ErrorScreen
        error={error}
        onRetry={() => generateQuestions(domainIdx, batch)}
        onBack={handleChangeDomain}
      />
    );
  if (phase === 'test')
    return (
      <TestScreen
        questions={questions}
        domainIdx={domainIdx}
        batch={batch}
        onFinish={handleFinish}
        onChangeDomain={handleChangeDomain}
      />
    );
  if (phase === 'results')
    return (
      <ResultsScreen
        score={finalScore}
        total={questions.length}
        history={finalHistory}
        questions={questions}
        batch={batch}
        onNewBatch={handleNewBatch}
        onChangeDomain={handleChangeDomain}
      />
    );
  return null;
}
