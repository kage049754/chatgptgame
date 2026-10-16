/**
 * Phase 15 — telemetry.
 *
 * Two hard constraints shaped this:
 *
 *  1. It must never cost frames. A fighting game is judged on 16.6ms budgets,
 *     so nothing here allocates or does I/O on the hot path. Events go into a
 *     pre-allocated ring buffer; flushing happens on a timer, off the sim.
 *
 *  2. It must never cost the rent (Phase 19). Raw events are the single
 *     highest-volume write in the system — a 3-minute match can emit hundreds.
 *     So the client batches, samples, and pre-aggregates: we send ONE
 *     match_summary with per-move counters rather than one row per punch.
 *     Raw per-event rows are sampled, not exhaustive.
 */

export const FUNNEL = {
  APP_OPEN: 10,
  ASSETS_LOADED: 20,
  MENU: 30,
  QUEUE_ENTER: 40,
  MATCH_FOUND: 50,
  CONNECTING: 60,
  MATCH_START: 70,
  ROUND_1_DONE: 80,
  MATCH_COMPLETE: 90,
  REMATCH: 100,
};
export const FUNNEL_NAMES = Object.fromEntries(
  Object.entries(FUNNEL).map(([k, v]) => [v, k])
);

const RING = 256;

export class Telemetry {
  /**
   * @param {object} o
   * @param {(batch:object)=>Promise<any>} o.transport  how a batch is delivered
   * @param {number} [o.flushMs]      timer interval
   * @param {number} [o.sampleRate]   0..1 for high-frequency raw events
   */
  constructor({ transport, flushMs = 15000, sampleRate = 0.1, now = () => Date.now() } = {}) {
    this.transport = transport;
    this.flushMs = flushMs;
    this.sampleRate = sampleRate;
    this.now = now;
    this.sessionId = 's' + Math.random().toString(36).slice(2, 11);
    this.playerId = null;
    this.appVersion = '1.0.0';
    this.configVersion = 'base';
    this.platform = typeof navigator !== 'undefined' && /Mobi/.test(navigator.userAgent || '')
      ? 'mobile' : 'desktop';

    // pre-allocated ring so recording an event never allocates
    this._ring = new Array(RING);
    for (let i = 0; i < RING; i++) this._ring[i] = { event: '', step: 0, payload: null, t: 0 };
    this._head = 0; this._count = 0; this._dropped = 0;

    // per-match aggregation — this is what actually drives balance
    this.match = null;
    this.funnelStep = 0;
    this.maxFunnelStep = 0;
    this._timer = null;
    this.sent = 0; this.failed = 0;
    this._rng = Math.random;
  }

  start() {
    if (this._timer || !this.flushMs) return this;
    this._timer = setInterval(() => { this.flush().catch(() => {}); }, this.flushMs);
    if (this._timer.unref) this._timer.unref();
    return this;
  }
  stop() { if (this._timer) clearInterval(this._timer); this._timer = null; }

  identify(playerId, { appVersion, configVersion } = {}) {
    this.playerId = playerId;
    if (appVersion) this.appVersion = appVersion;
    if (configVersion) this.configVersion = configVersion;
  }

  /** Record an event. Allocation-free on the hot path. */
  track(event, payload = null, step = 0) {
    const slot = this._ring[this._head];
    slot.event = event; slot.step = step; slot.payload = payload; slot.t = this.now();
    this._head = (this._head + 1) % RING;
    if (this._count < RING) this._count++; else this._dropped++;
  }

  /** Funnel progress. Records the furthest step reached this session. */
  step(stepValue, payload = null) {
    this.funnelStep = stepValue;
    if (stepValue > this.maxFunnelStep) this.maxFunnelStep = stepValue;
    this.track('funnel', payload, stepValue);
  }

  /* ------------------------- match aggregation ------------------------- */

  beginMatch({ matchId, localCharacter, remoteCharacter, mode = 'ranked', configVersion }) {
    this.match = {
      matchId, localCharacter, remoteCharacter, mode,
      configVersion: configVersion || this.configVersion,
      startedAt: this.now(),
      moves: Object.create(null),      // moveKey -> counters
      rounds: [], damageDealt: 0, damageTaken: 0,
      maxCombo: 0, rollbacks: 0, desyncs: 0,
      koBy: null, result: null,
    };
    this.step(FUNNEL.MATCH_START, { mode });
  }

  /** Called from the engine when a move becomes active. Zero I/O. */
  recordMove(moveKey, outcome, damage = 0) {
    const m = this.match; if (!m) return;
    let s = m.moves[moveKey];
    if (!s) s = m.moves[moveKey] = { uses: 0, hits: 0, blocked: 0, whiffs: 0, damage: 0, ko: 0 };
    if (outcome === 'use') s.uses++;
    else if (outcome === 'hit') { s.hits++; s.damage += damage; m.damageDealt += damage; }
    else if (outcome === 'block') s.blocked++;
    else if (outcome === 'whiff') s.whiffs++;
    else if (outcome === 'ko') { s.ko++; m.koBy = moveKey; }
  }

  recordCombo(len) {
    if (this.match && len > this.match.maxCombo) this.match.maxCombo = len;
  }
  recordRollback(n = 1) { if (this.match) this.match.rollbacks += n; }
  recordDesync() { if (this.match) this.match.desyncs++; }
  recordRound(winner, durationMs) {
    if (this.match) this.match.rounds.push({ winner, durationMs });
  }

  /** Produce the single aggregated row that the balance team reads. */
  endMatch(result, { quit = false } = {}) {
    const m = this.match; if (!m) return null;
    m.result = result;
    m.durationMs = this.now() - m.startedAt;
    m.quit = quit;
    const summary = {
      type: 'match_summary',
      matchId: m.matchId, mode: m.mode,
      configVersion: m.configVersion,
      localCharacter: m.localCharacter, remoteCharacter: m.remoteCharacter,
      result, quit,
      durationMs: m.durationMs,
      rounds: m.rounds.length,
      roundsWon: m.rounds.filter(r => r.winner === 'local').length,
      damageDealt: m.damageDealt,
      maxCombo: m.maxCombo,
      rollbacks: m.rollbacks, desyncs: m.desyncs,
      koBy: m.koBy,
      moves: m.moves,
    };
    this.track('match_summary', summary, FUNNEL.MATCH_COMPLETE);
    this.match = null;
    return summary;
  }

  /**
   * Session end — the drop-off signal. Called on pagehide/visibilitychange,
   * which is the only reliable "player left" hook a browser gives you.
   */
  endSession(reason = 'unload') {
    this.track('session_end', {
      reason,
      lastStep: this.funnelStep,
      maxStep: this.maxFunnelStep,
      stepName: FUNNEL_NAMES[this.maxFunnelStep] || 'UNKNOWN',
      // rage-quit heuristic: left mid-match right after taking a big combo
      ragequit: reason === 'unload' && this.funnelStep === FUNNEL.MATCH_START,
    }, this.maxFunnelStep);
    return this.flush({ beacon: true });
  }

  _drain() {
    const out = [];
    const start = (this._head - this._count + RING) % RING;
    for (let i = 0; i < this._count; i++) {
      const s = this._ring[(start + i) % RING];
      // sample high-frequency raw events; always keep funnel/summary events
      const critical = s.event === 'funnel' || s.event === 'match_summary' ||
                       s.event === 'session_end' || s.event === 'error';
      if (!critical && this._rng() > this.sampleRate) continue;
      out.push({
        event: s.event, funnel_step: s.step || null,
        payload: s.payload ?? {}, t: s.t,
      });
    }
    this._count = 0;
    return out;
  }

  async flush({ beacon = false } = {}) {
    if (this._count === 0) return { sent: 0 };
    const events = this._drain();
    if (!events.length) return { sent: 0 };
    const batch = {
      sessionId: this.sessionId, playerId: this.playerId,
      appVersion: this.appVersion, configVersion: this.configVersion,
      platform: this.platform, dropped: this._dropped, events,
    };
    try {
      await this.transport(batch, { beacon });
      this.sent += events.length;
      return { sent: events.length };
    } catch (e) {
      this.failed += events.length;
      return { sent: 0, error: e.message };
    }
  }
}

/* -------------------------------------------------------------------- */
/* Server-side aggregation                                              */
/* -------------------------------------------------------------------- */

/**
 * Fold a batch of match summaries into the rollup shapes the DB stores.
 * Pure function so it is trivially testable and can run in a worker.
 */
export function aggregateSummaries(summaries, day = new Date().toISOString().slice(0, 10)) {
  const moveStats = new Map();     // char|move|cfg
  const charStats = new Map();     // char|cfg

  for (const s of summaries) {
    const cfg = s.configVersion || 'base';
    const ck = `${s.localCharacter}|${cfg}`;
    let c = charStats.get(ck);
    if (!c) {
      c = { day, character_id: s.localCharacter, config_version: cfg,
            wins: 0, losses: 0, mirrors: 0, rounds_won: 0, rounds_lost: 0,
            total_match_ms: 0, match_count: 0 };
      charStats.set(ck, c);
    }
    c.match_count++;
    c.total_match_ms += s.durationMs || 0;
    c.rounds_won += s.roundsWon || 0;
    c.rounds_lost += (s.rounds || 0) - (s.roundsWon || 0);
    if (s.localCharacter === s.remoteCharacter) c.mirrors++;
    if (s.result === 'win') c.wins++;
    else if (s.result === 'loss') c.losses++;

    for (const [move, m] of Object.entries(s.moves || {})) {
      const mk = `${s.localCharacter}|${move}|${cfg}`;
      let r = moveStats.get(mk);
      if (!r) {
        r = { day, character_id: s.localCharacter, move_key: move, config_version: cfg,
              uses: 0, hits: 0, blocked: 0, whiffs: 0, damage_dealt: 0, ko_blows: 0 };
        moveStats.set(mk, r);
      }
      r.uses += m.uses || 0; r.hits += m.hits || 0;
      r.blocked += m.blocked || 0; r.whiffs += m.whiffs || 0;
      r.damage_dealt += m.damage || 0; r.ko_blows += m.ko || 0;
    }
  }
  return { moveStats: [...moveStats.values()], charStats: [...charStats.values()] };
}

/** Balance report: the numbers a designer actually acts on. */
export function balanceReport({ charStats = [], moveStats = [] }) {
  const chars = charStats.map(c => {
    const games = c.wins + c.losses;
    return {
      character: c.character_id,
      configVersion: c.config_version,
      games,
      winRate: games ? +(c.wins / games * 100).toFixed(1) : 0,
      avgMatchSec: c.match_count ? +(c.total_match_ms / c.match_count / 1000).toFixed(1) : 0,
    };
  }).sort((a, b) => b.winRate - a.winRate);

  /* Usage share is computed PER CHARACTER, not globally. A global share makes
     a move look "dead" purely because another character was played more that
     week, which is noise, not signal. What a designer needs is: of everything
     THIS character throws, how much is this move? */
  const perChar = new Map();
  for (const m of moveStats) {
    perChar.set(m.character_id, (perChar.get(m.character_id) || 0) + m.uses);
  }
  const totalUses = moveStats.reduce((s, m) => s + m.uses, 0) || 1;
  const moves = moveStats.map(m => {
    const charTotal = perChar.get(m.character_id) || 1;
    return {
      character: m.character_id, move: m.move_key,
      uses: m.uses,
      usageShare: +(m.uses / charTotal * 100).toFixed(1),   // share of this character's attacks
      charTotalUses: charTotal,
      hitRate: m.uses ? +(m.hits / m.uses * 100).toFixed(1) : 0,
      blockRate: m.uses ? +(m.blocked / m.uses * 100).toFixed(1) : 0,
      dmgPerUse: m.uses ? +(m.damage_dealt / m.uses).toFixed(2) : 0,
    };
  }).sort((a, b) => b.uses - a.uses);

  // flags: what a human should look at
  const flags = [];
  for (const c of chars) {
    if (c.games >= 30 && c.winRate >= 57) flags.push(`${c.character} win rate ${c.winRate}% — likely overtuned`);
    if (c.games >= 30 && c.winRate <= 43) flags.push(`${c.character} win rate ${c.winRate}% — likely undertuned`);
  }
  for (const m of moves) {
    // Only judge a move once its character has a usable sample.
    if (m.charTotalUses < 100) continue;
    if (m.usageShare >= 35 && m.uses >= 50) {
      flags.push(`${m.character}.${m.move} is ${m.usageShare}% of that character's attacks — spam candidate`);
    }
    if (m.uses >= 100 && m.hitRate >= 70) {
      flags.push(`${m.character}.${m.move} hits ${m.hitRate}% of the time — too safe`);
    }
    // A dead move has a LOW share of its own character's usage. Gating on the
    // move's own count would be self-defeating: unused moves have few uses.
    if (m.usageShare <= 5) {
      flags.push(`${m.character}.${m.move} is nearly unused (${m.usageShare}% of ${m.character}) — dead move`);
    }
  }
  return { characters: chars, moves, flags };
}

/* --------------------------- retention ------------------------------ */

/**
 * Classic DN retention: of the players who first appeared on day D,
 * what fraction were active on D+N.
 */
export function computeRetention(activity, cohortDate, offsets = [1, 7, 30]) {
  const cohort = new Set(
    activity.filter(a => a.first_seen === cohortDate).map(a => a.player_id)
  );
  const size = cohort.size;
  const base = new Date(cohortDate + 'T00:00:00Z').getTime();
  const out = { cohortDate, size, retention: {} };
  for (const n of offsets) {
    const target = new Date(base + n * 86400000).toISOString().slice(0, 10);
    const active = new Set(
      activity.filter(a => a.day === target && cohort.has(a.player_id)).map(a => a.player_id)
    );
    out.retention[`d${n}`] = size ? +(active.size / size * 100).toFixed(1) : 0;
  }
  return out;
}

/**
 * Funnel drop-off: how many players reached each step, and where they died.
 * Input: array of {maxStep}. Steps must be ascending.
 */
export function funnelDropoff(sessions, steps = Object.values(FUNNEL).sort((a, b) => a - b)) {
  const reached = new Map(steps.map(s => [s, 0]));
  const stalled = new Map(steps.map(s => [s, 0]));
  for (const s of sessions) {
    for (const step of steps) if (s.maxStep >= step) reached.set(step, reached.get(step) + 1);
    // the step they stalled at = highest step reached
    let top = steps[0];
    for (const step of steps) if (s.maxStep >= step) top = step;
    stalled.set(top, stalled.get(top) + 1);
  }
  const total = sessions.length || 1;
  let prev = null;
  return steps.map(step => {
    const r = reached.get(step);
    const row = {
      step, name: FUNNEL_NAMES[step] || String(step),
      reached: r,
      pctOfAll: +(r / total * 100).toFixed(1),
      droppedHere: stalled.get(step),
      stepConversion: prev === null ? 100 : (prev ? +(r / prev * 100).toFixed(1) : 0),
    };
    prev = r;
    return row;
  });
}
