/**
 * WreckBall.io — Swing. Smash. Grow.
 * Dead-simple 1-control physics wrecking ball .io prototype
 * Works on Desktop (Mouse + Click/Space) and Mobile (Touch Joystick + Whip Button)
 */

(() => {
  'use strict';

  // ═══ DOM REFS ═══
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const mctx = minimapCanvas.getContext('2d');

  const lobbyOverlay = document.getElementById('lobbyOverlay');
  const deathOverlay = document.getElementById('deathOverlay');
  const hud = document.getElementById('hud');

  const skinPicker = document.getElementById('skinPicker');
  const skinNameLabel = document.getElementById('skinNameLabel');
  const nicknameInput = document.getElementById('nicknameInput');
  const playBtn = document.getElementById('playBtn');
  const respawnBtn = document.getElementById('respawnBtn');
  const backLobbyBtn = document.getElementById('backLobbyBtn');
  const muteBtn = document.getElementById('muteBtn');
  const mobileControls = document.getElementById('mobileControls');
  const mobileBoostBtn = document.getElementById('mobileBoostBtn');
  const mobileCcwBtn = document.getElementById('mobileCcwBtn');
  const mobileCwBtn = document.getElementById('mobileCwBtn');
  const spinCcwPill = document.getElementById('spinCcwPill');
  const spinCwPill = document.getElementById('spinCwPill');

  const hudScore = document.getElementById('hudScore');
  const hudBallSize = document.getElementById('hudBallSize');
  const hudKills = document.getElementById('hudKills');
  const leaderboardList = document.getElementById('leaderboardList');
  const boostFill = document.getElementById('boostFill');
  const killFeed = document.getElementById('killFeed');

  const deathReason = document.getElementById('deathReason');
  const deathScore = document.getElementById('deathScore');
  const deathKills = document.getElementById('deathKills');
  const deathPeak = document.getElementById('deathPeak');

  // ═══ WORLD CONFIG ═══
  const WORLD_RADIUS = 2400;
  const BOT_COUNT = 20;
  const TARGET_SHARDS = 260;

  // ═══ SKINS (PURE COSMETIC FLEX) ═══
  const SKINS = [
    {
      id: 'iron',
      name: 'IRON SPIKER',
      style: 'spiked',
      coreColor: '#38bdf8',
      coreDark: '#0369a1',
      ballColor: '#64748b',
      ballHighlight: '#cbd5e1',
      ballDark: '#1e293b',
      spikeColor: '#e2e8f0',
      trailColor: '#fb923c',
      chainColor: '#94a3b8'
    },
    {
      id: 'magma',
      name: 'MAGMA METEOR',
      style: 'magma',
      coreColor: '#fb923c',
      coreDark: '#9a3412',
      ballColor: '#dc2626',
      ballHighlight: '#fde047',
      ballDark: '#450a0a',
      spikeColor: '#f97316',
      trailColor: '#ef4444',
      chainColor: '#f97316'
    },
    {
      id: 'saw',
      name: 'CYBER SAW',
      style: 'saw',
      coreColor: '#22d3ee',
      coreDark: '#155e75',
      ballColor: '#0f172a',
      ballHighlight: '#67e8f9',
      ballDark: '#020617',
      spikeColor: '#22d3ee',
      trailColor: '#06b6d4',
      chainColor: '#38bdf8'
    },
    {
      id: 'gold',
      name: 'GOLDEN CROWN',
      style: 'crown',
      coreColor: '#facc15',
      coreDark: '#a16207',
      ballColor: '#eab308',
      ballHighlight: '#fef9c3',
      ballDark: '#713f12',
      spikeColor: '#fef08a',
      trailColor: '#fde047',
      chainColor: '#facc15'
    },
    {
      id: 'plasma',
      name: 'PLASMA VOID',
      style: 'plasma',
      coreColor: '#e879f9',
      coreDark: '#701a75',
      ballColor: '#6b21a8',
      ballHighlight: '#f5d0fe',
      ballDark: '#2e1065',
      spikeColor: '#e879f9',
      trailColor: '#d946ef',
      chainColor: '#c084fc'
    },
    {
      id: 'toxic',
      name: 'TOXIC FLAIL',
      style: 'spiked',
      coreColor: '#4ade80',
      coreDark: '#166534',
      ballColor: '#16a34a',
      ballHighlight: '#bbf7d0',
      ballDark: '#052e16',
      spikeColor: '#a3e635',
      trailColor: '#4ade80',
      chainColor: '#86efac'
    }
  ];

  const BOT_NAME_POOL = [
    'IronKing', 'WhipMaster', 'CrushZone', 'MaceFace', 'SteelViper',
    'TitanSwing', 'ChainGang', 'MegaBonk', 'AnvilDrop', 'SpinDoctor',
    'HeavyMetal', 'SpikeLord', 'BoomBall', 'RuinMaker', 'ClangBoss',
    'MeteorX', 'SledgeKid', 'FlailFury', 'WreckIt', 'OrbitSmash',
    'Krunch', 'DoomSwing', 'RazorOrb', 'ScrapKing', 'HammerTime',
    'BoulderBro', 'ThorBall', 'Vortex99', 'Juggernaut', 'SmashCat'
  ];

  // ═══ PROCEDURAL SOUND ENGINE (ZERO EXTERNAL ASSETS) ═══
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    clang(intensity = 0.6) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const vol = Math.min(0.28, 0.08 + intensity * 0.2);

      // Two inharmonic metallic partials for authentic steel clang
      [520, 815, 1340].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i === 0 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq * (0.94 + Math.random() * 0.12), now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + 0.18);

        gain.gain.setValueAtTime(vol / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    }

    smash(isBig = false) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Deep sub impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isBig ? 150 : 190, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + (isBig ? 0.36 : 0.25));

      gain.gain.setValueAtTime(isBig ? 0.34 : 0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.38 : 0.26));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Crunch noise burst
      const len = Math.floor(this.ctx.sampleRate * 0.16);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.22, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      src.connect(filter);
      filter.connect(ng);
      ng.connect(this.ctx.destination);
      src.start(now);
    }

    pickup(pitch = 1) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const base = 480 + Math.min(400, pitch * 26);
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  const sfx = new SoundFX();

  // ═══ STATE ═══
  let width = 0;
  let height = 0;
  let selectedSkinIdx = 0;
  let mode = 'lobby'; // 'lobby' | 'playing' | 'dead'
  let nextId = 1;

  const entities = [];
  const shards = [];
  const particles = [];
  const shockwaves = [];
  const floatingTexts = [];

  let player = null;
  let kingId = null;

  // Camera & Juice
  const camera = { x: 0, y: 0, zoom: 0.92 };
  let shake = 0;
  let hitStopTimer = 0;
  let pickupCombo = 0;
  let pickupComboTimer = 0;
  let lbUpdateTimer = 0;

  // Input (Desktop + Mobile Virtual Joystick)
  // Left Click = Anticlockwise (-1), Right Click = Clockwise (+1), Space = Dodge Dash
  const input = {
    mouseX: 0,
    mouseY: 0,
    hasPointer: false,
    boosting: false,
    spinCcw: false,
    spinCw: false,
    lastSpinDir: 0,
    isTouch: false,
    joyActive: false,
    joyId: null,
    joyOriginX: 0,
    joyOriginY: 0,
    joyX: 0,
    joyY: 0
  };

  function getPlayerSpinCmd() {
    if (input.spinCcw && input.spinCw) return input.lastSpinDir || -1;
    if (input.spinCcw) return -1; // Anticlockwise (LMB / A / Q)
    if (input.spinCw) return 1;   // Clockwise (RMB / D / E)
    return 0;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  // ═══ UTILITY ═══
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function pickUniqueBotName() {
    const used = new Set(entities.filter(e => e.alive).map(e => e.name));
    const available = BOT_NAME_POOL.filter(n => !used.has(n));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return `Wrecker${Math.floor(10 + Math.random() * 89)}`;
  }

  function findSafeSpawn() {
    let bestX = 0;
    let bestY = 0;
    let bestMinDist = -1;

    for (let i = 0; i < 20; i++) {
      const r = Math.sqrt(Math.random()) * (WORLD_RADIUS - 320);
      const a = Math.random() * Math.PI * 2;
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a) * r;

      let minD = Infinity;
      for (const e of entities) {
        if (!e.alive) continue;
        const d1 = dist(cx, cy, e.x, e.y);
        const d2 = dist(cx, cy, e.bx, e.by);
        minD = Math.min(minD, d1, d2);
      }

      if (minD > bestMinDist) {
        bestMinDist = minD;
        bestX = cx;
        bestY = cy;
      }
    }
    return { x: bestX, y: bestY };
  }

  // ═══ WRECKER ENTITY (PLAYER OR BOT) ═══
  class Wrecker {
    constructor({ name, skin, isBot = false, initialScore = 0 }) {
      this.id = nextId++;
      this.name = name;
      this.skin = skin;
      this.isBot = isBot;

      const sp = findSafeSpawn();
      this.x = sp.x;
      this.y = sp.y;
      this.vx = 0;
      this.vy = 0;
      this.facing = Math.random() * Math.PI * 2;

      this.score = initialScore;
      this.kills = 0;
      this.peakMult = 1.0;
      this.alive = true;
      this.shieldTimer = isBot ? 1.4 : 2.4;

      // Boost & Instant Juke-Dodge
      this.boostEnergy = 100;
      this.boosting = false;
      this.wasBoosting = false;
      this.boostExhausted = false;
      this.jukeTimer = 0;
      this.closeCallCooldown = 0;

      // Core size
      this.coreRadius = 21;

      // Wrecking Ball State (Real tethered momentum physics!)
      this.ballRadius = this.calcBallRadius();
      this.chainLen = this.calcChainLen();
      const startAngle = this.facing + Math.PI;
      this.bx = this.x + Math.cos(startAngle) * this.chainLen;
      this.by = this.y + Math.sin(startAngle) * this.chainLen;
      this.bvx = -Math.sin(startAngle) * 140;
      this.bvy = Math.cos(startAngle) * 140;
      this.ballSpin = 0;
      this.ballSpeed = 0;
      this.spinCmd = 0;
      this.ballTrail = [];

      // Streak tracking
      this.streakCount = 0;
      this.streakTimer = 0;

      // Bot AI
      this.aiTimer = 0;
      this.aiAngle = Math.random() * Math.PI * 2;
      this.aiOrbitDir = Math.random() < 0.5 ? 1 : -1;
      this.aiAggro = 0.35 + Math.random() * 0.6;
    }

    calcBallRadius() {
      return 22 + Math.min(72, Math.sqrt(Math.max(0, this.score)) * 2.15);
    }

    calcChainLen() {
      return 98 + (this.ballRadius - 22) * 1.38;
    }

    getSizeMult() {
      return this.ballRadius / 22;
    }

    getBallMass() {
      return this.ballRadius * this.ballRadius;
    }

    addScore(amount) {
      this.score += amount;
      const mult = this.getSizeMult();
      if (mult > this.peakMult) this.peakMult = mult;
    }

    update(dt, desiredDirX, desiredDirY, wantsBoost, spinCmd = 0) {
      if (!this.alive) return;
      this.spinCmd = spinCmd;

      if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.jukeTimer > 0) this.jukeTimer = Math.max(0, this.jukeTimer - dt);
      if (this.closeCallCooldown > 0) this.closeCallCooldown = Math.max(0, this.closeCallCooldown - dt);
      if (this.streakTimer > 0) {
        this.streakTimer -= dt;
        if (this.streakTimer <= 0) this.streakCount = 0;
      }

      // Smoothly grow ball & chain
      const targetBallR = this.calcBallRadius();
      this.ballRadius = lerp(this.ballRadius, targetBallR, Math.min(1, dt * 6));
      this.chainLen = lerp(this.chainLen, this.calcChainLen(), Math.min(1, dt * 6));

      // Boost resource
      if (this.boostExhausted && this.boostEnergy > 18) {
        this.boostExhausted = false;
      }
      this.boosting = wantsBoost && !this.boostExhausted && this.boostEnergy > 1;

      const mag = Math.hypot(desiredDirX, desiredDirY);
      const nx = mag > 0.05 ? desiredDirX / mag : Math.cos(this.facing);
      const ny = mag > 0.05 ? desiredDirY / mag : Math.sin(this.facing);

      // Instant Juke-Dash on fresh boost tap (makes dodging feel razor-sharp!)
      if (this.boosting && !this.wasBoosting && this.boostEnergy >= 10) {
        this.jukeTimer = 0.14;
        this.vx = nx * 640;
        this.vy = ny * 640;
        this.boostEnergy = Math.max(0, this.boostEnergy - 7);
        if (!this.isBot) {
          spawnShockwave(this.x, this.y, 48, '#38bdf8');
        }
      }
      this.wasBoosting = this.boosting;

      if (this.boosting) {
        this.boostEnergy = Math.max(0, this.boostEnergy - dt * 32);
        if (this.boostEnergy <= 1) this.boostExhausted = true;
      } else {
        this.boostEnergy = Math.min(100, this.boostEnergy + dt * 28);
      }

      // 1. Snappy Core movement (high grip, zero ice-skating, tiny penalty when huge)
      const sizeSlowdown = 1 - Math.min(0.16, (this.ballRadius - 22) / 450);
      const jukeBonus = this.jukeTimer > 0 ? 150 : 0;
      const maxSpeed = ((this.boosting ? 520 : 355) + jukeBonus) * sizeSlowdown;
      const throttle = clamp(mag, 0.45, 1);

      const targetVx = nx * maxSpeed * throttle;
      const targetVy = ny * maxSpeed * throttle;
      const accel = this.boosting ? 24 : 18;
      this.vx = lerp(this.vx, targetVx, Math.min(1, dt * accel));
      this.vy = lerp(this.vy, targetVy, Math.min(1, dt * accel));

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (Math.hypot(this.vx, this.vy) > 15) {
        this.facing = Math.atan2(this.vy, this.vx);
      }

      // Arena boundary soft bounce for core
      const coreDist = Math.hypot(this.x, this.y);
      const maxCoreDist = WORLD_RADIUS - this.coreRadius - 8;
      if (coreDist > maxCoreDist) {
        const ang = Math.atan2(this.y, this.x);
        this.x = Math.cos(ang) * maxCoreDist;
        this.y = Math.sin(ang) * maxCoreDist;
        // Reflect outward velocity
        const dot = this.vx * Math.cos(ang) + this.vy * Math.sin(ang);
        if (dot > 0) {
          this.vx -= 1.5 * dot * Math.cos(ang);
          this.vy -= 1.5 * dot * Math.sin(ang);
        }
      }

      // Thruster particles while boosting
      if (this.boosting && Math.random() < 0.7) {
        particles.push({
          x: this.x - Math.cos(this.facing) * (this.coreRadius + 2) + (Math.random() - 0.5) * 8,
          y: this.y - Math.sin(this.facing) * (this.coreRadius + 2) + (Math.random() - 0.5) * 8,
          vx: -Math.cos(this.facing) * (120 + Math.random() * 90),
          vy: -Math.sin(this.facing) * (120 + Math.random() * 90),
          r: 4 + Math.random() * 4,
          color: this.skin.trailColor,
          life: 0.22,
          maxLife: 0.22
        });
      }

      // 2. WRECKING BALL MOTORIZED + PENDULUM PHYSICS
      // Light drag so ball coasts smoothly when released
      const drag = Math.pow(spinCmd !== 0 ? 0.995 : 0.986, dt * 60);
      this.bvx *= drag;
      this.bvy *= drag;

      const activeChainLen = this.chainLen;

      // Compute radial & tangent vectors from core -> ball
      // In screen coords (+x right, +y down):
      // (+tx, +ty) = (-uy, ux) is CLOCKWISE (RMB, spinCmd = +1)
      // (-tx, -ty) = (uy, -ux) is ANTICLOCKWISE (LMB, spinCmd = -1)
      let rx = this.bx - this.x;
      let ry = this.by - this.y;
      let rDist = Math.hypot(rx, ry) || 0.001;
      let ux = rx / rDist;
      let uy = ry / rDist;
      let tx = -uy;
      let ty = ux;

      // Relative velocity of ball vs core along tangent
      const relVx = this.bvx - this.vx;
      const relVy = this.bvy - this.vy;
      const tangVel = relVx * tx + relVy * ty;

      // Motorized LMB (Anticlockwise) / RMB (Clockwise) Spin Control!
      if (spinCmd !== 0) {
        const targetTangSpeed = this.boosting ? 880 : 760;
        const desiredTang = spinCmd * targetTangSpeed;
        const isReversing = tangVel * spinCmd < 0;

        // Extra snap-brake torque when reversing direction so fake-outs feel instant!
        const torque = (isReversing ? 2900 : 1850) * dt;
        const delta = desiredTang - tangVel;
        const step = clamp(delta, -torque, torque);
        this.bvx += tx * step;
        this.bvy += ty * step;

        // Gentle outward centrifugal push so spinning while standing still whips cleanly!
        if (rDist < activeChainLen * 0.96) {
          this.bvx += ux * 520 * dt;
          this.bvy += uy * 520 * dt;
        }
      } else if (Math.abs(tangVel) < 75) {
        // Gentle ambient sway when coasting freely
        const spinSign = tangVel >= 0 ? 1 : -1;
        this.bvx += tx * spinSign * 95 * dt;
        this.bvy += ty * spinSign * 95 * dt;
      }

      // Integrate ball position
      this.bx += this.bvx * dt;
      this.by += this.bvy * dt;

      // Enforce chain tether constraint (preserve tangential momentum!)
      rx = this.bx - this.x;
      ry = this.by - this.y;
      rDist = Math.hypot(rx, ry) || 0.001;
      ux = rx / rDist;
      uy = ry / rDist;

      if (rDist > activeChainLen) {
        // Snap ball back to chain radius
        this.bx = this.x + ux * activeChainLen;
        this.by = this.y + uy * activeChainLen;

        // Remove outward radial velocity relative to core (taut chain yank!)
        const newRelVx = this.bvx - this.vx;
        const newRelVy = this.bvy - this.vy;
        const radialVel = newRelVx * ux + newRelVy * uy;
        if (radialVel > 0) {
          this.bvx -= ux * radialVel * 1.04;
          this.bvy -= uy * radialVel * 1.04;
        }
      } else if (rDist < this.coreRadius + this.ballRadius + 10) {
        // Keep ball from sitting right on top of core
        const minR = this.coreRadius + this.ballRadius + 10;
        this.bx = this.x + ux * minR;
        this.by = this.y + uy * minR;
      }

      // Clamp insane ball speeds for crisp, dodgeable playability
      this.ballSpeed = Math.hypot(this.bvx, this.bvy);
      const maxBallSpeed = this.boosting ? 1020 : 820;
      if (this.ballSpeed > maxBallSpeed) {
        const sc = maxBallSpeed / this.ballSpeed;
        this.bvx *= sc;
        this.bvy *= sc;
        this.ballSpeed = maxBallSpeed;
      }

      // Keep ball inside arena wall with bouncy metallic ricochet
      const ballArenaDist = Math.hypot(this.bx, this.by);
      const maxBallArenaDist = WORLD_RADIUS - this.ballRadius;
      if (ballArenaDist > maxBallArenaDist) {
        const ang = Math.atan2(this.by, this.bx);
        this.bx = Math.cos(ang) * maxBallArenaDist;
        this.by = Math.sin(ang) * maxBallArenaDist;
        const dot = this.bvx * Math.cos(ang) + this.bvy * Math.sin(ang);
        if (dot > 0) {
          this.bvx -= 1.7 * dot * Math.cos(ang);
          this.bvy -= 1.7 * dot * Math.sin(ang);
        }
      }

      // Visual spin & blazing motion trail
      this.ballSpin += (0.012 * this.ballSpeed + 1.5) * dt * (tangVel >= 0 ? 1 : -1);

      this.ballTrail.unshift({ x: this.bx, y: this.by, r: this.ballRadius, speed: this.ballSpeed });
      if (this.ballTrail.length > 14) this.ballTrail.pop();
    }
  }

  // ═══ SHARDS / LOOT ═══
  function spawnAmbientShard() {
    const r = Math.sqrt(Math.random()) * (WORLD_RADIUS - 120);
    const a = Math.random() * Math.PI * 2;
    const isRare = Math.random() < 0.08;
    shards.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      vx: 0,
      vy: 0,
      value: isRare ? 12 : 4,
      r: isRare ? 11 : 7,
      color: isRare ? '#fde047' : ['#38bdf8', '#4ade80', '#fb923c', '#e879f9'][Math.floor(Math.random() * 4)],
      pulse: Math.random() * Math.PI * 2,
      isLoot: false
    });
  }

  function spawnKillLoot(victim) {
    const count = clamp(Math.floor(8 + Math.sqrt(victim.score) * 1.4), 8, 34);
    const totalValue = Math.max(40, Math.floor(victim.score * 0.72 + 45));
    const perShard = Math.max(8, Math.ceil(totalValue / count));

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 90 + Math.random() * 240;
      shards.push({
        x: victim.x + (Math.random() - 0.5) * 20,
        y: victim.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        value: perShard,
        r: clamp(9 + perShard * 0.14, 9, 16),
        color: i % 2 === 0 ? '#fde047' : victim.skin.trailColor,
        pulse: Math.random() * Math.PI * 2,
        isLoot: true
      });
    }
  }

  // ═══ VISUAL EFFECTS ═══
  function spawnSparks(x, y, count, colorA, colorB, speedMin = 120, speedMax = 420) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      const life = 0.25 + Math.random() * 0.35;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 2.5 + Math.random() * 4.5,
        color: Math.random() < 0.5 ? colorA : colorB,
        life,
        maxLife: life
      });
    }
  }

  function spawnShockwave(x, y, maxR, color) {
    shockwaves.push({ x, y, r: 10, maxR, color, life: 0.32, maxLife: 0.32 });
  }

  function addFloatingText(x, y, text, color = '#fde047', size = 24) {
    floatingTexts.push({ x, y, text, color, size, life: 1.05, maxLife: 1.05 });
  }

  function pushKillFeed(killerName, victimName, involvesMe) {
    const el = document.createElement('div');
    el.className = 'kill-item' + (involvesMe ? ' is-me' : '');
    el.innerHTML = `<span class="killer">${escapeHtml(killerName)}</span><span class="verb">SMASHED</span><span class="victim">${escapeHtml(victimName)}</span>`;
    killFeed.prepend(el);
    while (killFeed.children.length > 3) {
      killFeed.removeChild(killFeed.lastChild);
    }
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 3600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ═══ BOT AI (ACTUALLY WHIPS & HUNTS!) ═══
  function computeBotInput(bot, dt) {
    bot.aiTimer -= dt;

    // 1. Urgent arena wall avoidance
    const dCenter = Math.hypot(bot.x, bot.y);
    if (dCenter > WORLD_RADIUS - 260) {
      const inAng = Math.atan2(-bot.y, -bot.x);
      return { dx: Math.cos(inAng), dy: Math.sin(inAng), boost: false };
    }

    // 2. Dodge incoming enemy wrecking balls!
    let fleeX = 0;
    let fleeY = 0;
    let danger = 0;
    let nearestPrey = null;
    let nearestPreyDist = 520;

    for (const other of entities) {
      if (!other.alive || other.id === bot.id) continue;

      // Danger from enemy ball
      const db = dist(bot.x, bot.y, other.bx, other.by);
      const safeD = other.ballRadius + bot.coreRadius + 115;
      if (db < safeD) {
        const w = (1 - db / safeD) * 3.5;
        fleeX += ((bot.x - other.bx) / (db || 1)) * w;
        fleeY += ((bot.y - other.by) / (db || 1)) * w;
        danger += w;
      }

      // Potential prey core
      if (other.shieldTimer <= 0) {
        const dc = dist(bot.x, bot.y, other.x, other.y);
        if (dc < nearestPreyDist) {
          nearestPreyDist = dc;
          nearestPrey = other;
        }
      }
    }

    if (danger > 0.65) {
      return { dx: fleeX, dy: fleeY, boost: danger > 1.7 && bot.boostEnergy > 35 };
    }

    // 3. Hunt prey by orbiting at chain distance to whip ball into their core!
    if (nearestPrey && nearestPreyDist < bot.chainLen * 2.1 + 120 && bot.aiAggro > 0.42) {
      const toPreyAng = Math.atan2(nearestPrey.y - bot.y, nearestPrey.x - bot.x);
      // Orbit slightly tangentially so the wrecking ball whips straight through their core
      const idealDist = bot.chainLen * 0.92;
      const angleOffset = nearestPreyDist > idealDist ? 0.45 * bot.aiOrbitDir : 1.15 * bot.aiOrbitDir;
      const steerAng = toPreyAng + angleOffset;
      const shouldWhip = nearestPreyDist < bot.chainLen * 1.45 && bot.boostEnergy > 30;
      return { dx: Math.cos(steerAng), dy: Math.sin(steerAng), boost: shouldWhip };
    }

    // 4. Seek high-value loot or nearby shards
    let bestShard = null;
    let bestScore = 0;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const d = dist(bot.x, bot.y, s.x, s.y);
      if (d > 480) continue;
      const weight = (s.isLoot ? s.value * 4 : s.value) / (d + 30);
      if (weight > bestScore) {
        bestScore = weight;
        bestShard = s;
      }
    }

    if (bestShard) {
      const ang = Math.atan2(bestShard.y - bot.y, bestShard.x - bot.x);
      return {
        dx: Math.cos(ang),
        dy: Math.sin(ang),
        boost: bestShard.isLoot && bot.boostEnergy > 50
      };
    }

    // 5. Cruise smoothly
    if (bot.aiTimer <= 0) {
      bot.aiAngle += (Math.random() - 0.5) * 1.4;
      bot.aiTimer = 0.8 + Math.random() * 1.5;
    }
    return { dx: Math.cos(bot.aiAngle), dy: Math.sin(bot.aiAngle), boost: false };
  }

  // ═══ INITIALIZE WORLD ═══
  function seedArena() {
    entities.length = 0;
    shards.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    floatingTexts.length = 0;

    for (let i = 0; i < TARGET_SHARDS; i++) spawnAmbientShard();

    for (let i = 0; i < BOT_COUNT; i++) {
      // Varied starting mass so there are big Bosses & small targets immediately!
      const tier = Math.random();
      const startScore = tier < 0.12 ? 320 + Math.random() * 340
        : tier < 0.40 ? 90 + Math.random() * 170
        : Math.random() * 55;
      const bot = new Wrecker({
        name: pickUniqueBotName(),
        skin: SKINS[Math.floor(Math.random() * SKINS.length)],
        isBot: true,
        initialScore: Math.floor(startScore)
      });
      entities.push(bot);
    }
  }

  function maintainPopulation() {
    let botCount = 0;
    for (let i = entities.length - 1; i >= 0; i--) {
      if (!entities[i].alive) {
        entities.splice(i, 1);
      } else if (entities[i].isBot) {
        botCount++;
      }
    }

    while (botCount < BOT_COUNT) {
      const bot = new Wrecker({
        name: pickUniqueBotName(),
        skin: SKINS[Math.floor(Math.random() * SKINS.length)],
        isBot: true,
        initialScore: Math.floor(Math.random() * 45)
      });
      entities.push(bot);
      botCount++;
    }

    while (shards.length < TARGET_SHARDS) {
      spawnAmbientShard();
    }
  }

  // ═══ COMBAT & COLLISIONS ═══
  function resolveCollisions() {
    const alive = entities.filter(e => e.alive);

    // 1. Ball-vs-Ball METALLIC CLASH!
    for (let i = 0; i < alive.length; i++) {
      const a = alive[i];
      for (let j = i + 1; j < alive.length; j++) {
        const b = alive[j];
        const dx = b.bx - a.bx;
        const dy = b.by - a.by;
        const d = Math.hypot(dx, dy) || 0.001;
        const minD = a.ballRadius + b.ballRadius;

        if (d < minD) {
          const nx = dx / d;
          const ny = dy / d;
          const overlap = minD - d;

          const mA = a.getBallMass();
          const mB = b.getBallMass();
          const invSum = 1 / (mA + mB);

          // Separate balls weighted by mass
          a.bx -= nx * overlap * (mB * invSum);
          a.by -= ny * overlap * (mB * invSum);
          b.bx += nx * overlap * (mA * invSum);
          b.by += ny * overlap * (mA * invSum);

          // Elastic clang impulse
          const rvx = b.bvx - a.bvx;
          const rvy = b.bvy - a.bvy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const restitution = 1.05;
            const impulse = -(1 + restitution) * velAlongNormal / (1 / mA + 1 / mB);
            a.bvx -= (impulse / mA) * nx;
            a.bvy -= (impulse / mA) * ny;
            b.bvx += (impulse / mB) * nx;
            b.bvy += (impulse / mB) * ny;

            // Clash point sparks & metallic clang audio
            const cx = a.bx + nx * a.ballRadius;
            const cy = a.by + ny * a.ballRadius;
            const impact = Math.min(1, Math.abs(velAlongNormal) / 550);

            if (impact > 0.12) {
              spawnSparks(cx, cy, Math.floor(8 + impact * 14), '#ffffff', '#fbbf24', 140, 440);
              spawnShockwave(cx, cy, 40 + impact * 45, '#fde047');

              const nearCam = dist(cx, cy, camera.x, camera.y) < 900;
              if (nearCam && mode === 'playing') {
                sfx.clang(impact);
                if (a === player || b === player) {
                  shake = Math.max(shake, 4 + impact * 9);
                }
              }
            }
          }
        }
      }
    }

    // 2. Ball-vs-Core SMASH KILLS (Forgiving arcade hurtbox + Close Call reward!)
    for (let i = 0; i < alive.length; i++) {
      const attacker = alive[i];
      if (!attacker.alive) continue;

      for (let j = 0; j < alive.length; j++) {
        if (i === j) continue;
        const victim = alive[j];
        if (!victim.alive || victim.shieldTimer > 0) continue;

        const d = dist(attacker.bx, attacker.by, victim.x, victim.y);
        const killDist = attacker.ballRadius * 0.90 + victim.coreRadius * 0.65;

        if (d < killDist) {
          handleKill(attacker, victim);
        } else if (
          victim === player &&
          mode === 'playing' &&
          victim.closeCallCooldown <= 0 &&
          attacker.ballSpeed > 260 &&
          d < killDist + 34
        ) {
          // Thrilling Near-Miss Dodge Reward!
          victim.closeCallCooldown = 0.75;
          victim.boostEnergy = Math.min(100, victim.boostEnergy + 18);
          victim.addScore(5);
          spawnSparks(victim.x, victim.y, 10, '#38bdf8', '#ffffff', 120, 260);
          addFloatingText(victim.x, victim.y - 26, 'CLOSE CALL! +BOOST', '#38bdf8', 18);
          sfx.pickup(10);
        }
      }
    }

    // 3. Shard Collection (Both Core AND Wrecking Ball collect shards!)
    for (let sIdx = shards.length - 1; sIdx >= 0; sIdx--) {
      const s = shards[sIdx];
      let collected = false;

      for (const e of alive) {
        if (!e.alive) continue;
        const dCore = dist(e.x, e.y, s.x, s.y);
        const dBall = dist(e.bx, e.by, s.x, s.y);
        const corePull = e.coreRadius + s.r + 22;
        const ballPull = e.ballRadius + s.r + 12;

        // Magnetic pull into core when close
        if (dCore < corePull + 36) {
          s.x = lerp(s.x, e.x, 0.24);
          s.y = lerp(s.y, e.y, 0.24);
        }

        if (dCore < corePull || dBall < ballPull) {
          e.addScore(s.value);
          e.boostEnergy = Math.min(100, e.boostEnergy + (s.isLoot ? 10 : 3.5));

          if (e === player && mode === 'playing') {
            pickupCombo = Math.min(14, pickupCombo + 1);
            pickupComboTimer = 0.6;
            sfx.pickup(pickupCombo);
          }

          shards.splice(sIdx, 1);
          collected = true;
          break;
        }
      }

      if (collected) continue;
    }
  }

  function handleKill(attacker, victim) {
    victim.alive = false;
    attacker.kills++;
    attacker.streakCount++;
    attacker.streakTimer = 5.5;
    attacker.boostEnergy = Math.min(100, attacker.boostEnergy + 45);

    const isGiantSlayer = victim.ballRadius > attacker.ballRadius * 1.35;
    const bonus = isGiantSlayer ? 60 : 25;
    attacker.addScore(bonus);

    spawnKillLoot(victim);
    spawnSparks(victim.x, victim.y, 34, victim.skin.coreColor, '#fde047', 120, 520);
    spawnShockwave(victim.x, victim.y, 90 + victim.ballRadius, victim.skin.trailColor);

    const involvesMe = attacker === player || victim === player;
    pushKillFeed(attacker.name, victim.name, involvesMe);

    if (attacker === player && mode === 'playing') {
      hitStopTimer = 0.055; // Crunchy 55ms impact freeze!
      shake = Math.max(shake, isGiantSlayer ? 22 : 15);
      sfx.smash(isGiantSlayer || attacker.streakCount >= 2);

      let label = 'SMASH!';
      let col = '#fde047';
      if (isGiantSlayer) {
        label = 'GIANT SLAYER! +60';
        col = '#38bdf8';
      } else if (attacker.streakCount === 2) {
        label = 'DOUBLE SMASH!';
        col = '#fb923c';
      } else if (attacker.streakCount === 3) {
        label = 'TRIPLE WRECK!';
        col = '#f43f5e';
      } else if (attacker.streakCount >= 4) {
        label = `UNSTOPPABLE x${attacker.streakCount}!`;
        col = '#e879f9';
      }
      addFloatingText(victim.x, victim.y - 26, label, col, isGiantSlayer ? 30 : 26);
    } else if (victim === player && mode === 'playing') {
      shake = 24;
      sfx.smash(true);
      onPlayerDied(attacker.name);
    } else if (dist(victim.x, victim.y, camera.x, camera.y) < 750 && mode === 'playing') {
      sfx.smash(false);
    }
  }

  // ═══ GAME FLOW ═══
  function startGame() {
    sfx.init();
    const rawName = (nicknameInput.value || '').trim().slice(0, 14) || 'Wrecker';
    const skin = SKINS[selectedSkinIdx];

    // Remove previous dead player if any
    for (let i = entities.length - 1; i >= 0; i--) {
      if (!entities[i].isBot) entities.splice(i, 1);
    }

    player = new Wrecker({
      name: rawName,
      skin,
      isBot: false,
      initialScore: 0
    });
    entities.push(player);

    camera.x = player.x;
    camera.y = player.y;
    camera.zoom = 0.86;

    mode = 'playing';
    lobbyOverlay.classList.add('hidden');
    deathOverlay.classList.add('hidden');
    hud.classList.remove('hidden');
    killFeed.innerHTML = '';

    if (input.isTouch) {
      mobileControls.classList.remove('hidden');
    }
  }

  function onPlayerDied(killerName) {
    mode = 'dead';
    input.boosting = false;
    input.spinCcw = false;
    input.spinCw = false;
    hud.classList.add('hidden');
    deathOverlay.classList.remove('hidden');

    deathReason.textContent = `SMASHED BY ${killerName.toUpperCase()}`;
    deathScore.textContent = Math.floor(player.score);
    deathKills.textContent = player.kills;
    deathPeak.textContent = `${player.peakMult.toFixed(1)}x`;
  }

  // ═══ MAIN UPDATE STEP ═══
  function update(dt) {
    if (hitStopTimer > 0) {
      hitStopTimer -= dt;
      shake = Math.max(0, shake - dt * 28);
      return;
    }

    if (pickupComboTimer > 0) {
      pickupComboTimer -= dt;
      if (pickupComboTimer <= 0) pickupCombo = 0;
    }

    maintainPopulation();

    // Update entities
    for (const e of entities) {
      if (!e.alive) continue;

      if (e === player && mode === 'playing') {
        let dx = 0;
        let dy = 0;
        if (input.isTouch && input.joyActive) {
          dx = (input.joyX - input.joyOriginX) / 56;
          dy = (input.joyY - input.joyOriginY) / 56;
        } else if (input.hasPointer) {
          const worldMouseX = camera.x + (input.mouseX - width * 0.5) / camera.zoom;
          const worldMouseY = camera.y + (input.mouseY - height * 0.5) / camera.zoom;
          dx = (worldMouseX - e.x) / 42;
          dy = (worldMouseY - e.y) / 42;
        }
        const spinCmd = getPlayerSpinCmd();
        e.update(dt, dx, dy, input.boosting, spinCmd);
        if (spinCcwPill) spinCcwPill.classList.toggle('active', spinCmd === -1);
        if (spinCwPill) spinCwPill.classList.toggle('active', spinCmd === 1);
      } else if (e.isBot) {
        const ai = computeBotInput(e, dt);
        const botSpin = ai.boost ? e.aiOrbitDir : 0;
        e.update(dt, ai.dx, ai.dy, ai.boost, botSpin);
      }
    }

    // Drift loot shards
    for (const s of shards) {
      s.pulse += dt * 4.5;
      if (Math.abs(s.vx) > 1 || Math.abs(s.vy) > 1) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= Math.pow(0.92, dt * 60);
        s.vy *= Math.pow(0.92, dt * 60);

        const d = Math.hypot(s.x, s.y);
        if (d > WORLD_RADIUS - 40) {
          const ang = Math.atan2(s.y, s.x);
          s.x = Math.cos(ang) * (WORLD_RADIUS - 40);
          s.y = Math.sin(ang) * (WORLD_RADIUS - 40);
        }
      }
    }

    resolveCollisions();

    // Particles & FX
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.93, dt * 60);
      p.vy *= Math.pow(0.93, dt * 60);
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.life -= dt;
      sw.r = lerp(sw.maxR, 10, sw.life / sw.maxLife);
      if (sw.life <= 0) shockwaves.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 52 * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    shake = Math.max(0, shake - dt * 42);

    // Camera tracking (wider view so you spot incoming wrecking balls early!)
    if (mode === 'playing' && player && player.alive) {
      camera.x = lerp(camera.x, player.x, Math.min(1, dt * 10));
      camera.y = lerp(camera.y, player.y, Math.min(1, dt * 10));
      const desiredZoom = clamp(0.88 - (player.ballRadius - 22) * 0.0048, 0.56, 0.88);
      camera.zoom = lerp(camera.zoom, desiredZoom, Math.min(1, dt * 3));
    } else {
      // Spectate #1 King smoothly in lobby / death screen
      const king = entities.find(e => e.id === kingId && e.alive) || entities[0];
      if (king) {
        camera.x = lerp(camera.x, king.x, Math.min(1, dt * 2.5));
        camera.y = lerp(camera.y, king.y, Math.min(1, dt * 2.5));
        camera.zoom = lerp(camera.zoom, 0.78, Math.min(1, dt * 2));
      }
    }

    // Update HUD & Leaderboard (~6Hz)
    lbUpdateTimer -= dt;
    if (lbUpdateTimer <= 0) {
      lbUpdateTimer = 0.16;
      updateHud();
    }

    if (mode === 'playing' && player && player.alive) {
      boostFill.style.width = `${player.boostEnergy.toFixed(1)}%`;
      boostFill.style.opacity = player.boostExhausted ? '0.45' : '1';
    }
  }

  function updateHud() {
    const sorted = entities
      .filter(e => e.alive)
      .sort((a, b) => b.score - a.score);

    kingId = sorted.length > 0 ? sorted[0].id : null;

    if (mode !== 'playing' || !player) return;

    hudScore.textContent = Math.floor(player.score);
    hudBallSize.textContent = `BALL SIZE: ${player.getSizeMult().toFixed(1)}x`;
    hudKills.textContent = player.kills;

    const top = sorted.slice(0, 7);
    let html = '';
    for (let i = 0; i < top.length; i++) {
      const e = top[i];
      const cls = `lb-row${e === player ? ' me' : ''}${i === 0 ? ' king' : ''}`;
      const rankLabel = i === 0 ? '👑' : `${i + 1}.`;
      html += `<li class="${cls}">
        <span class="lb-left">
          <span class="lb-rank">${rankLabel}</span>
          <span class="lb-name">${escapeHtml(e.name)}</span>
        </span>
        <span class="lb-score">${Math.floor(e.score)}</span>
      </li>`;
    }
    leaderboardList.innerHTML = html;
  }

  // ═══ RENDERING ═══
  function drawBackground() {
    ctx.fillStyle = '#090e1a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    ctx.translate(width * 0.5 + sx, height * 0.5 + sy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Arena Floor Disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#111a2e';
    ctx.fill();
    ctx.clip();

    // Subtle hexagonal/square tactical grid
    const gridSize = 110;
    const viewW = width / camera.zoom;
    const viewH = height / camera.zoom;
    const startX = Math.floor((camera.x - viewW * 0.6) / gridSize) * gridSize;
    const endX = camera.x + viewW * 0.6;
    const startY = Math.floor((camera.y - viewH * 0.6) / gridSize) * gridSize;
    const endY = camera.y + viewH * 0.6;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.075)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Center Arena Ring Decal
    ctx.beginPath();
    ctx.arc(0, 0, 320, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();

    // Glowing Red-Orange Hazard Perimeter Wall
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Shards
    for (const s of shards) {
      if (Math.abs(s.x - camera.x) > viewW * 0.62 || Math.abs(s.y - camera.y) > viewH * 0.62) continue;
      const pr = s.r + Math.sin(s.pulse) * 1.4;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.pulse * 0.35);

      ctx.fillStyle = s.color;
      if (s.isLoot) {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 12;
      }
      // Crisp glowing diamond shard
      ctx.beginPath();
      ctx.moveTo(0, -pr);
      ctx.lineTo(pr * 0.85, 0);
      ctx.lineTo(0, pr);
      ctx.lineTo(-pr * 0.85, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.arc(-pr * 0.15, -pr * 0.2, pr * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shockwaves
    for (const sw of shockwaves) {
      const alpha = sw.life / sw.maxLife;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 5 * alpha;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw all Wreckers (Chains -> Trails -> Cores -> Wrecking Balls -> Names)
    for (const e of entities) {
      if (!e.alive) continue;
      if (Math.abs(e.x - camera.x) > viewW * 0.85 && Math.abs(e.bx - camera.x) > viewW * 0.85) continue;
      drawWrecker(e);
    }

    // Sparks / Particles
    for (const p of particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating Callouts
    for (const ft of floatingTexts) {
      const alpha = clamp(ft.life / ft.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${ft.size}px Fredoka, Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // Virtual Joystick overlay on touch screens
    if (mode === 'playing' && input.isTouch && input.joyActive) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(input.joyOriginX, input.joyOriginY, 56, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      const jdx = input.joyX - input.joyOriginX;
      const jdy = input.joyY - input.joyOriginY;
      const jd = Math.hypot(jdx, jdy);
      const maxJ = 48;
      const kx = input.joyOriginX + (jd > maxJ ? (jdx / jd) * maxJ : jdx);
      const ky = input.joyOriginY + (jd > maxJ ? (jdy / jd) * maxJ : jdy);

      ctx.beginPath();
      ctx.arc(kx, ky, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWrecker(e) {
    // 1. Blazing Ball Motion Trail
    if (e.ballTrail.length > 2 && e.ballSpeed > 180) {
      const hotFactor = clamp((e.ballSpeed - 180) / 550, 0, 1);
      for (let i = 1; i < e.ballTrail.length; i++) {
        const pt = e.ballTrail[i];
        const ratio = 1 - i / e.ballTrail.length;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * ratio * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = e.skin.trailColor;
        ctx.globalAlpha = ratio * hotFactor * 0.32;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 2. Linked Steel Chain from Core -> Ball
    const linkCount = Math.max(5, Math.floor(dist(e.x, e.y, e.bx, e.by) / 18));
    ctx.save();
    for (let i = 1; i < linkCount; i++) {
      const t = i / linkCount;
      const lx = lerp(e.x, e.bx, t);
      const ly = lerp(e.y, e.by, t);
      const ang = Math.atan2(e.by - e.y, e.bx - e.x);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(ang);
      ctx.strokeStyle = (e.boosting || e.spinCmd !== 0) ? e.skin.trailColor : e.skin.chainColor;
      ctx.lineWidth = i % 2 === 0 ? 4.2 : 3.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, i % 2 === 0 ? 4 : 2.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 3. Player/Bot Core Pod
    ctx.save();
    ctx.translate(e.x, e.y);

    // Spawn protection bubble
    if (e.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, e.coreRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }

    ctx.rotate(e.facing);

    // Core shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(3, 5, e.coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Thruster nozzle on back
    ctx.fillStyle = '#334155';
    ctx.fillRect(-e.coreRadius - 4, -8, 10, 16);

    // Armored Core sphere
    const coreGrad = ctx.createRadialGradient(-5, -5, 3, 0, 0, e.coreRadius);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.28, e.skin.coreColor);
    coreGrad.addColorStop(1, e.skin.coreDark);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, e.coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = e === player ? '#ffffff' : 'rgba(255,255,255,0.45)';
    ctx.stroke();

    // Expressive eyes looking forward (gives instant Slither/Blades personality!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -7, 5, 0, Math.PI * 2);
    ctx.arc(8, 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(10, -7, 2.4, 0, Math.PI * 2);
    ctx.arc(10, 7, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Crown above #1 King
    if (e.id === kingId) {
      ctx.save();
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', e.x, e.y - e.coreRadius - 24);
      ctx.restore();
    }

    // Crisp Nameplate
    ctx.save();
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(9, 14, 26, 0.85)';
    ctx.strokeText(e.name, e.x, e.y - e.coreRadius - 9);
    ctx.fillStyle = e === player ? '#fde047' : '#f1f5f9';
    ctx.fillText(e.name, e.x, e.y - e.coreRadius - 9);
    ctx.restore();

    // 4. THE WRECKING BALL!
    drawBallSprite(ctx, e.bx, e.by, e.ballRadius, e.ballSpin, e.skin, e.ballSpeed > 520);
  }

  function drawBallSprite(targetCtx, x, y, r, spin, skin, isHot = false) {
    targetCtx.save();
    targetCtx.translate(x, y);

    // Drop shadow
    targetCtx.fillStyle = 'rgba(0,0,0,0.38)';
    targetCtx.beginPath();
    targetCtx.arc(4, 6, r, 0, Math.PI * 2);
    targetCtx.fill();

    if (isHot) {
      targetCtx.shadowColor = skin.trailColor;
      targetCtx.shadowBlur = 22;
    }

    targetCtx.rotate(spin);

    // Outer Spikes / Saw Teeth
    const spikes = skin.style === 'saw' ? 12 : 8;
    const spikeLen = skin.style === 'saw' ? r * 0.34 : r * 0.28;
    targetCtx.fillStyle = skin.spikeColor;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      targetCtx.save();
      targetCtx.rotate(a);
      targetCtx.beginPath();
      if (skin.style === 'saw') {
        targetCtx.moveTo(r * 0.82, -r * 0.14);
        targetCtx.lineTo(r + spikeLen, r * 0.1);
        targetCtx.lineTo(r * 0.82, r * 0.24);
      } else {
        targetCtx.moveTo(r * 0.82, -r * 0.17);
        targetCtx.lineTo(r + spikeLen, 0);
        targetCtx.lineTo(r * 0.82, r * 0.17);
      }
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.restore();
    }

    // Metallic / Glowing Sphere Body
    const grad = targetCtx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.12, 0, 0, r);
    grad.addColorStop(0, skin.ballHighlight);
    grad.addColorStop(0.42, skin.ballColor);
    grad.addColorStop(1, skin.ballDark);
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.lineWidth = Math.max(2, r * 0.08);
    targetCtx.strokeStyle = isHot ? '#ffffff' : 'rgba(255,255,255,0.28)';
    targetCtx.stroke();

    // Inner Emblem / Core Glow
    if (skin.style === 'magma' || skin.style === 'plasma' || skin.style === 'saw') {
      targetCtx.beginPath();
      targetCtx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
      targetCtx.fillStyle = skin.trailColor;
      targetCtx.fill();
    } else if (skin.style === 'crown') {
      targetCtx.beginPath();
      targetCtx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      targetCtx.strokeStyle = '#fef9c3';
      targetCtx.lineWidth = Math.max(2, r * 0.09);
      targetCtx.stroke();
    } else {
      // Rivet ring
      targetCtx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        targetCtx.beginPath();
        targetCtx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, Math.max(2, r * 0.09), 0, Math.PI * 2);
        targetCtx.fill();
      }
    }

    targetCtx.restore();
  }

  function drawMinimap() {
    if (mode !== 'playing') return;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const rad = w * 0.46;

    mctx.clearRect(0, 0, w, h);

    // Crosshair
    mctx.strokeStyle = 'rgba(255,255,255,0.08)';
    mctx.lineWidth = 1;
    mctx.beginPath();
    mctx.moveTo(cx, 6);
    mctx.lineTo(cx, h - 6);
    mctx.moveTo(6, cy);
    mctx.lineTo(w - 6, cy);
    mctx.stroke();

    for (const e of entities) {
      if (!e.alive) continue;
      const mx = cx + (e.x / WORLD_RADIUS) * rad;
      const my = cy + (e.y / WORLD_RADIUS) * rad;

      mctx.beginPath();
      if (e === player) {
        mctx.fillStyle = '#ffffff';
        mctx.arc(mx, my, 4.5, 0, Math.PI * 2);
        mctx.fill();
      } else if (e.id === kingId) {
        mctx.fillStyle = '#facc15';
        mctx.arc(mx, my, 4.2, 0, Math.PI * 2);
        mctx.fill();
      } else {
        mctx.fillStyle = e.skin.trailColor;
        mctx.arc(mx, my, 2.3, 0, Math.PI * 2);
        mctx.fill();
      }
    }
  }

  // ═══ SKIN PICKER UI ═══
  function buildSkinPicker() {
    skinPicker.innerHTML = '';
    SKINS.forEach((skin, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-dot' + (idx === selectedSkinIdx ? ' selected' : '');
      btn.title = skin.name;

      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const sctx = c.getContext('2d');
      drawBallSprite(sctx, 32, 32, 18, 0.35, skin, false);
      btn.appendChild(c);

      btn.addEventListener('click', () => {
        selectedSkinIdx = idx;
        skinNameLabel.textContent = skin.name;
        document.querySelectorAll('.skin-dot').forEach((el, i) => {
          el.classList.toggle('selected', i === idx);
        });
      });

      skinPicker.appendChild(btn);
    });
    skinNameLabel.textContent = SKINS[selectedSkinIdx].name;
  }

  // ═══ INPUT LISTENERS ═══
  // Prevent browser right-click context menu so RMB cleanly spins Clockwise!
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    input.mouseX = e.clientX;
    input.mouseY = e.clientY;
    input.hasPointer = true;
  });

  window.addEventListener('mousedown', (e) => {
    if (mode !== 'playing') return;
    if (e.button === 0) {
      input.spinCcw = true;      // Left Click -> Anticlockwise
      input.lastSpinDir = -1;
    } else if (e.button === 2) {
      input.spinCw = true;       // Right Click -> Clockwise
      input.lastSpinDir = 1;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.spinCcw = false;
    else if (e.button === 2) input.spinCw = false;
  });

  window.addEventListener('blur', () => {
    input.boosting = false;
    input.spinCcw = false;
    input.spinCw = false;
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (mode === 'playing') {
        e.preventDefault();
        input.boosting = true;
      } else if (mode === 'dead' && e.code === 'Space') {
        e.preventDefault();
        startGame();
      }
    } else if (mode === 'playing' && (e.code === 'KeyA' || e.code === 'KeyQ' || e.code === 'ArrowLeft')) {
      input.spinCcw = true;
      input.lastSpinDir = -1;
    } else if (mode === 'playing' && (e.code === 'KeyD' || e.code === 'KeyE' || e.code === 'ArrowRight')) {
      input.spinCw = true;
      input.lastSpinDir = 1;
    } else if (e.code === 'Enter') {
      if (mode === 'dead') startGame();
      else if (mode === 'lobby' && document.activeElement === nicknameInput) startGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.boosting = false;
    else if (e.code === 'KeyA' || e.code === 'KeyQ' || e.code === 'ArrowLeft') input.spinCcw = false;
    else if (e.code === 'KeyD' || e.code === 'KeyE' || e.code === 'ArrowRight') input.spinCw = false;
  });

  // Mobile Touch Controls
  canvas.addEventListener('touchstart', (e) => {
    input.isTouch = true;
    if (mode === 'playing') {
      mobileControls.classList.remove('hidden');
      for (const t of e.changedTouches) {
        if (!input.joyActive && t.clientX < width * 0.65) {
          input.joyActive = true;
          input.joyId = t.identifier;
          input.joyOriginX = t.clientX;
          input.joyOriginY = t.clientY;
          input.joyX = t.clientX;
          input.joyY = t.clientY;
        }
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!input.joyActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier === input.joyId) {
        input.joyX = t.clientX;
        input.joyY = t.clientY;
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === input.joyId) {
        input.joyActive = false;
        input.joyId = null;
      }
    }
  }, { passive: true });

  mobileCcwBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.spinCcw = true;
    input.lastSpinDir = -1;
  }, { passive: false });
  mobileCcwBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.spinCcw = false;
  }, { passive: false });

  mobileCwBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.spinCw = true;
    input.lastSpinDir = 1;
  }, { passive: false });
  mobileCwBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.spinCw = false;
  }, { passive: false });

  mobileBoostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.boosting = true;
  }, { passive: false });

  mobileBoostBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.boosting = false;
  }, { passive: false });

  // Buttons
  playBtn.addEventListener('click', startGame);
  respawnBtn.addEventListener('click', startGame);
  backLobbyBtn.addEventListener('click', () => {
    mode = 'lobby';
    deathOverlay.classList.add('hidden');
    lobbyOverlay.classList.remove('hidden');
  });

  muteBtn.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
  });

  // ═══ BOOT & LOOP ═══
  buildSkinPicker();
  seedArena();

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    drawBackground();
    drawMinimap();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
