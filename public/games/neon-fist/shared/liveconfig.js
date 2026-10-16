/**
 * Phase 16 — OTA balance patches, A/B testing, kill switch.
 *
 * The netcode constraint drives the whole design: this game is deterministic
 * lockstep with rollback. If two peers run even slightly different frame data,
 * they desync instantly. So OTA config is NOT "apply whenever it arrives":
 *
 *   - a config is fetched at boot and pinned for the whole session
 *   - the version+fingerprint is exchanged during matchmaking, and peers
 *     running different versions are never matched into a ranked game
 *   - a patch applied mid-match would be a desync bug, so it is queued and
 *     applied at the next safe point (menu), never live
 *
 * Bucketing is deterministic from playerId+experimentId, so a player sees a
 * stable variant across devices and reconnects without the server storing
 * anything on the hot path.
 */
import { fnv1a } from './integrity.js';

export const SAFE_POINTS = ['boot', 'menu', 'post_match'];

/** Stable 0..99 bucket for a (player, salt) pair. */
export function bucketOf(playerId, salt = '') {
  return fnv1a(String(playerId) + '|' + salt) % 100;
}

/**
 * Pick a variant from [{id, pct}] deterministically.
 * Percentages need not sum to 100; the remainder falls through to null.
 */
export function assignVariant(playerId, experimentId, variants) {
  const b = bucketOf(playerId, experimentId);
  let acc = 0;
  for (const v of variants) {
    acc += v.pct;
    if (b < acc) return v.id;
  }
  return null;
}

/** Should this player receive a channel rolled out to `pct`% of users? */
export function inRollout(playerId, channel, pct) {
  if (pct >= 100) return true;
  if (pct <= 0) return false;
  return bucketOf(playerId, 'rollout:' + channel) < pct;
}

/**
 * Merge a sparse patch over a base config. Patches are deliberately sparse
 * ("make punch startup 5") so a hotfix is a few hundred bytes, not the whole
 * fighter file — and so a patch authored against one base cleanly describes
 * intent rather than snapshotting unrelated values.
 */
export function applyPatch(base, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = Array.isArray(base) ? base.slice() : { ...(base || {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object') {
      out[k] = applyPatch(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Invert a patch against a base, so every rollout has a precomputed undo. */
export function invertPatch(base, patch) {
  const undo = {};
  for (const [k, v] of Object.entries(patch)) {
    const cur = base ? base[k] : undefined;
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object') {
      undo[k] = invertPatch(cur, v);
    } else {
      undo[k] = cur === undefined ? null : cur;
    }
  }
  return undo;
}

export class LiveConfig {
  /**
   * @param {object} o
   * @param {(url:string)=>Promise<any>} o.fetchJSON
   * @param {object} o.baseConfig    the config bundled with the build
   * @param {string} [o.endpoint]
   */
  constructor({ fetchJSON, baseConfig, endpoint = '/api/config', validate = null,
                audit = null, fingerprint = null, storage = null } = {}) {
    this.fetchJSON = fetchJSON;
    this.base = baseConfig;
    this.endpoint = endpoint;
    this.validate = validate;
    this.audit = audit;
    this.fingerprintFn = fingerprint;
    this.storage = storage;             // optional localStorage-like cache

    this.active = baseConfig;
    this.version = 'base';
    this.channel = 'stable';
    this.fingerprint = null;
    this.pending = null;                // fetched but not yet safe to apply
    this.experiments = {};
    this.killed = false;
    this.lastError = null;
    this.source = 'bundled';
  }

  /**
   * Boot-time fetch. Any failure is non-fatal: we fall back to the last good
   * cached config, then to the bundled one. A balance server being down must
   * never stop someone playing.
   */
  async bootstrap(playerId) {
    try {
      const res = await this.fetchJSON(
        `${this.endpoint}?player=${encodeURIComponent(playerId ?? 'anon')}`
      );
      const applied = this._accept(res, playerId);
      if (applied) {
        this.source = 'server';
        this._cache(res);
        return { ok: true, version: this.version, channel: this.channel, source: 'server' };
      }
      throw new Error(this.lastError || 'config rejected');
    } catch (e) {
      this.lastError = e.message;
      const cached = this._readCache();
      if (cached && this._accept(cached, playerId, { fromCache: true })) {
        this.source = 'cache';
        return { ok: true, version: this.version, channel: this.channel,
                 source: 'cache', warning: e.message };
      }
      this.active = this.base; this.version = 'base'; this.channel = 'stable';
      this.source = 'bundled';
      return { ok: false, version: 'base', source: 'bundled', error: e.message };
    }
  }

  /** Validate + install a server response. Returns true if adopted. */
  _accept(res, playerId, { fromCache = false } = {}) {
    if (!res || typeof res !== 'object') { this.lastError = 'malformed response'; return false; }

    // Kill switch: server orders everyone back to the bundled build.
    if (res.killed) {
      this.killed = true;
      this.active = this.base;
      this.version = 'base:killswitch';
      this.channel = 'rollback';
      return true;
    }

    let cfg = res.full ? res.config : applyPatch(this.base, res.patch || {});

    // An OTA patch is remote code for the simulation — validate it like one.
    if (this.validate) {
      try { this.validate(cfg); }
      catch (e) { this.lastError = 'validation failed: ' + e.message; return false; }
    }
    if (this.audit) {
      const a = this.audit(cfg);
      if (!a.ok) { this.lastError = 'audit failed: ' + a.violations.join('; '); return false; }
    }
    if (this.fingerprintFn && res.fingerprint) {
      const got = this.fingerprintFn(cfg);
      if (got !== res.fingerprint) {
        this.lastError = `fingerprint mismatch: computed ${got}, server said ${res.fingerprint}`;
        return false;
      }
      this.fingerprint = got;
    } else if (this.fingerprintFn) {
      this.fingerprint = this.fingerprintFn(cfg);
    }

    this.active = cfg;
    this.version = res.version || (fromCache ? 'cached' : 'unknown');
    this.channel = res.channel || 'stable';
    this.experiments = res.experiments || {};
    this.killed = false;
    return true;
  }

  /**
   * A patch that arrives mid-session is NEVER applied live — that would
   * desync an in-progress match. It waits for a safe point.
   */
  stage(res) { this.pending = res; return this; }
  canApply(point) { return SAFE_POINTS.includes(point) && !!this.pending; }
  applyPending(point, playerId) {
    if (!this.canApply(point)) return { applied: false, reason: 'not at a safe point' };
    const res = this.pending;
    const ok = this._accept(res, playerId);
    this.pending = null;
    return ok
      ? { applied: true, version: this.version }
      : { applied: false, reason: this.lastError };
  }

  variant(experimentId) { return this.experiments[experimentId] ?? null; }

  _cache(res) {
    if (!this.storage) return;
    try { this.storage.setItem('neon.config', JSON.stringify(res)); } catch {}
  }
  _readCache() {
    if (!this.storage) return null;
    try { return JSON.parse(this.storage.getItem('neon.config')); } catch { return null; }
  }
}

/* -------------------------------------------------------------------- */
/* Server side: resolve which config a given player should receive.      */
/* -------------------------------------------------------------------- */
export function resolveConfigFor(playerId, { channels, versions, experiments = [] }) {
  const stable = channels.find(c => c.channel === 'stable');
  if (!stable) throw new Error('no stable channel configured');

  // A killed channel forces everyone to the bundled build immediately.
  const killed = channels.find(c => c.killed);
  if (killed) {
    return { killed: true, version: 'base:killswitch', channel: 'rollback',
             reason: `channel "${killed.channel}" kill switch active` };
  }

  let chosen = stable;
  for (const c of channels) {
    if (c.channel === 'stable' || c.killed) continue;
    if (inRollout(playerId, c.channel, c.rollout_pct)) { chosen = c; break; }
  }
  const version = versions.find(v => v.version === chosen.version);
  if (!version) throw new Error(`channel ${chosen.channel} points at missing version ${chosen.version}`);

  const assigned = {};
  for (const e of experiments) {
    if (!e.active) continue;
    const v = assignVariant(playerId, e.id, e.variants);
    if (v) assigned[e.id] = v;
  }
  return {
    killed: false,
    version: version.version,
    channel: chosen.channel,
    fingerprint: version.fingerprint,
    full: !version.parent,
    config: version.parent ? undefined : version.payload,
    patch: version.parent ? version.payload : undefined,
    experiments: assigned,
  };
}
