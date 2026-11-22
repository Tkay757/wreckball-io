/**
 * WreckBall.io — Swing. Smash. Grow.
 * Pure mouse dragging flail mechanics with high string momentum
 * Massive 8500px arena, ball shatter burst animation, grouped XP scattering,
 * single clean direction arrow, and squishy .io UI
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

  // Lobby 3-panel UI elements
  const skinPicker = document.getElementById('skinPicker');
  const skinNameLabel = document.getElementById('skinNameLabel');
  const skinRarityLabel = document.getElementById('skinRarityLabel');
  const prevSkinBtn = document.getElementById('prevSkinBtn');
  const nextSkinBtn = document.getElementById('nextSkinBtn');
  const avatarCanvas = document.getElementById('avatarCanvas');
  const nicknameInput = document.getElementById('nicknameInput');
  const randomNickBtn = document.getElementById('randomNickBtn');
  const playBtn = document.getElementById('playBtn');
  const privateRoomBtn = document.getElementById('privateRoomBtn');
  const skribblToast = document.getElementById('skribblToast');

  const respawnBtn = document.getElementById('respawnBtn');
  const backLobbyBtn = document.getElementById('backLobbyBtn');

  const muteBtn = document.getElementById('muteBtn');
  const mouseLockBtn = document.getElementById('mouseLockBtn');
  const fsBtn = document.getElementById('fsBtn');
  const topMuteBtn = document.getElementById('topMuteBtn');
  const topFsBtn = document.getElementById('topFsBtn');
  const topShareBtn = document.getElementById('topShareBtn');

  const mobileControls = document.getElementById('mobileControls');
  const mobileBoostBtn = document.getElementById('mobileBoostBtn');

  const hudScore = document.getElementById('hudScore');
  const hudBallSize = document.getElementById('hudBallSize');
  const hudKills = document.getElementById('hudKills');
  const hudShieldPill = document.getElementById('hudShieldPill');
  const hudShieldText = document.getElementById('hudShieldText');
  const leaderboardList = document.getElementById('leaderboardList');
  const boostFill = document.getElementById('boostFill');
  const killFeed = document.getElementById('killFeed');

  const deathReason = document.getElementById('deathReason');
  const deathScore = document.getElementById('deathScore');
  const deathKills = document.getElementById('deathKills');
  const deathPeak = document.getElementById('deathPeak');

  // ═══ WORLD CONFIG (MASSIVE ARENA WITH NATURAL BOT DISPERSION) ═══
  const WORLD_RADIUS = 8500;
  const BOT_COUNT = 40;
  const TARGET_SHARDS = 1400;

  // ═══ SKINS (PURE COSMETIC FLEX) ═══
  const SKINS = [
    {
      id: 'iron',
      name: 'IRON SPIKER',
      rarity: 'STARTER ⚙️',
      style: 'spiked',
      coreColor: '#38bdf8',
      coreDark: '#0369a1',
      ballColor: '#64748b',
      ballHighlight: '#cbd5e1',
      ballDark: '#1e293b',
      spikeColor: '#e2e8f0',
      trailColor: '#fb923c',
      chainColor: '#94a3b8',
      glowColor: 'rgba(56, 189, 248, 0.35)'
    },
    {
      id: 'magma',
      name: 'MAGMA METEOR',
      rarity: 'RARE 🔥',
      style: 'magma',
      coreColor: '#fb923c',
      coreDark: '#9a3412',
      ballColor: '#dc2626',
      ballHighlight: '#fde047',
      ballDark: '#450a0a',
      spikeColor: '#f97316',
      trailColor: '#ef4444',
      chainColor: '#f97316',
      glowColor: 'rgba(239, 68, 68, 0.35)'
    },
    {
      id: 'saw',
      name: 'CYBER SAW',
      rarity: 'EPIC ⚡',
      style: 'saw',
      coreColor: '#22d3ee',
      coreDark: '#155e75',
      ballColor: '#0f172a',
      ballHighlight: '#67e8f9',
      ballDark: '#020617',
      spikeColor: '#22d3ee',
      trailColor: '#06b6d4',
      chainColor: '#38bdf8',
      glowColor: 'rgba(34, 211, 238, 0.35)'
    },
    {
      id: 'gold',
      name: 'GOLDEN CROWN',
      rarity: 'LEGENDARY 👑',
      style: 'crown',
      coreColor: '#facc15',
      coreDark: '#a16207',
      ballColor: '#eab308',
      ballHighlight: '#fef9c3',
      ballDark: '#713f12',
      spikeColor: '#fef08a',
      trailColor: '#fde047',
      chainColor: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.35)'
    },
    {
      id: 'plasma',
      name: 'PLASMA VOID',
      rarity: 'MYTHIC 🔮',
      style: 'plasma',
      coreColor: '#e879f9',
      coreDark: '#701a75',
      ballColor: '#6b21a8',
      ballHighlight: '#f5d0fe',
      ballDark: '#2e1065',
      spikeColor: '#e879f9',
      trailColor: '#d946ef',
      chainColor: '#c084fc',
      glowColor: 'rgba(232, 121, 249, 0.35)'
    },
    {
      id: 'toxic',
      name: 'TOXIC FLAIL',
      rarity: 'TOXIC ☣️',
      style: 'spiked',
      coreColor: '#4ade80',
      coreDark: '#166534',
      ballColor: '#16a34a',
      ballHighlight: '#bbf7d0',
      ballDark: '#052e16',
      spikeColor: '#a3e635',
      trailColor: '#4ade80',
      chainColor: '#86efac',
      glowColor: 'rgba(74, 222, 128, 0.35)'
    }
  ];

  // ═══ BOT IQ TIERS (LOW -> MED -> HIGH -> EXTREME) ═══
  const BOT_IQ_TIERS = {
    LOW: {
      id: 'LOW',
      name: 'LOW',
      badge: '🟢 ROOKIE',
      color: '#4ade80',
      reactionMin: 0.36,
      reactionMax: 0.58,
      aimNoise: 0.55,       // +/- 31 degrees aim jitter
      visionCone: 85 * Math.PI / 180, // 85 deg vision cone
      visionRange: 420,
      dangerThreshold: 0.50,
      canJukeDash: false,
      whipProb: 0.35,
      orbitOffset: 0.70,
      lootDesire: 1.8,      // Easily distracted by tiny ambient food
      names: ['RustyBot', 'DerpWhip', 'ClumsyClang', 'SlowRoller', 'NoobMace', 'PebblePuff', 'ButterFingers', 'WobblyCore']
    },
    MED: {
      id: 'MED',
      name: 'MED',
      badge: '🟡 VETERAN',
      color: '#facc15',
      reactionMin: 0.22,
      reactionMax: 0.34,
      aimNoise: 0.26,       // +/- 15 degrees
      visionCone: 140 * Math.PI / 180,
      visionRange: 560,
      dangerThreshold: 0.65,
      canJukeDash: true,
      whipProb: 0.65,
      orbitOffset: 0.95,
      lootDesire: 1.0,
      names: ['IronKing', 'WhipMaster', 'SteelViper', 'HeavyMetal', 'SpikeLord', 'OrbitSmash', 'RazorOrb', 'HammerTime', 'BoomBall']
    },
    HIGH: {
      id: 'HIGH',
      name: 'HIGH',
      badge: '🔴 ELITE',
      color: '#fb923c',
      reactionMin: 0.12,
      reactionMax: 0.20,
      aimNoise: 0.10,       // +/- 6 degrees
      visionCone: 210 * Math.PI / 180,
      visionRange: 750,
      dangerThreshold: 0.90,
      canJukeDash: true,
      whipProb: 0.88,
      orbitOffset: 1.15,
      lootDesire: 0.6,      // Focuses on combat & kills
      names: ['ApexPredator', 'DoomSwing', 'TitanSwing', 'VortexKing', 'CrushZone', 'FlailFury', 'MeteorX', 'Juggernaut']
    },
    EXTREME: {
      id: 'EXTREME',
      name: 'EXTREME',
      badge: '⚡ TITAN BOSS',
      color: '#f43f5e',
      reactionMin: 0.06,
      reactionMax: 0.12,
      aimNoise: 0.03,       // Surgical precision (+/- 2 deg)
      visionCone: Math.PI * 2, // Full 360-degree omnidirectional radar
      visionRange: 980,
      dangerThreshold: 1.15,
      canJukeDash: true,
      whipProb: 0.98,
      orbitOffset: 1.30,
      lootDesire: 0.3,      // Pure predatory killer instinct
      names: ['ApexCrusher', 'VoidReaper', 'OmegaTitan', 'Executioner', 'CosmicHavoc', 'WorldEater']
    }
  };

  const BOT_NAME_POOL = [
    'IronKing', 'WhipMaster', 'CrushZone', 'MaceFace', 'SteelViper',
    'TitanSwing', 'ChainGang', 'MegaBonk', 'AnvilDrop', 'SpinDoctor',
    'HeavyMetal', 'SpikeLord', 'BoomBall', 'RuinMaker', 'ClangBoss',
    'MeteorX', 'SledgeKid', 'FlailFury', 'WreckIt', 'OrbitSmash',
    'Krunch', 'DoomSwing', 'RazorOrb', 'ScrapKing', 'HammerTime',
    'BoulderBro', 'ThorBall', 'Vortex99', 'Juggernaut', 'SmashCat',
    'ApexCrusher', 'VoidReaper', 'TitanClaw', 'NanoSmasher', 'ChainReaper'
  ];

  // ═══ SOUND SYNTHESIZER (PURE WEBAUDIO, ZERO EXTERNAL ASSETS) ═══
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

    shieldBreak() {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      [780, 1180, 1680, 2340].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.42, now + 0.22);
        gain.gain.setValueAtTime(0.20 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    }

    shieldRestore() {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      [520, 780, 1040].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + idx * 0.05 + 0.14);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.17);
      });
    }

    whipSnap() {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
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
  const ballFragments = []; // Ball burst shatter fragments
  const shockwaves = [];
  const floatingTexts = [];

  let player = null;
  let kingId = null;
  let globalPlayerHunterId = null;

  // Camera & Juice
  const camera = { x: 0, y: 0, zoom: 0.92 };
  let shake = 0;
  let hitStopTimer = 0;
  let pickupCombo = 0;
  let pickupComboTimer = 0;
  let lbUpdateTimer = 0;

  // Input (Pure mouse dragging + Space dash)
  const input = {
    mouseX: 0,
    mouseY: 0,
    pointerLocked: false,
    lockedAimX: 0,
    lockedAimY: -120,
    hasPointer: false,
    boosting: false,
    isTouch: false,
    joyActive: false,
    joyId: null,
    joyOriginX: 0,
    joyOriginY: 0,
    joyX: 0,
    joyY: 0
  };

  function updatePointerLockUI() {
    const isLocked = document.pointerLockElement === canvas;
    input.pointerLocked = isLocked;
    document.body.classList.toggle('pointer-locked', isLocked);
    if (mouseLockBtn) {
      mouseLockBtn.classList.toggle('locked', isLocked);
      mouseLockBtn.textContent = isLocked ? '🔒' : '🔓';
      mouseLockBtn.title = isLocked ? 'Mouse Locked (Click or ESC to unlock)' : 'Click to Lock Mouse to Game';
    }
  }

  function requestGamePointerLock() {
    if (mode !== 'playing') return;
    try {
      if (canvas && canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    } catch (_) {}
  }

  function exitGamePointerLock() {
    try {
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (_) {}
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

  function randomBotName(tier) {
    if (tier && tier.names && tier.names.length) {
      return tier.names[Math.floor(Math.random() * tier.names.length)];
    }
    const idx = Math.floor(Math.random() * BOT_NAME_POOL.length);
    return BOT_NAME_POOL[idx];
  }

  // Anti-congestion safe spawn spread across the vast 8500px arena
  function findSafeSpawn() {
    let bestX = 0;
    let bestY = 0;
    let bestMinDist = -1;

    for (let i = 0; i < 45; i++) {
      const r = (0.15 + 0.80 * Math.sqrt(Math.random())) * (WORLD_RADIUS - 800);
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

      if (minD > 1800) {
        return { x: cx, y: cy };
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
    constructor({ name, skin, isBot = false, initialScore = 0, iq = null }) {
      this.id = nextId++;
      this.name = name;
      this.skin = skin;
      this.isBot = isBot;
      this.iq = iq || (isBot ? BOT_IQ_TIERS.MED : null);

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

      // Energy Shield (1-Hit protection against lethal flails!)
      this.hasShield = true;
      this.shieldRechargeTimer = 0;
      this.shieldGraceTimer = 0;

      // Elastic Chain & Centrifugal Momentum Physics
      this.elasticChainFactor = 1.0;
      this.prevVx = 0;
      this.prevVy = 0;

      // Core size
      this.coreRadius = 21;

      // Wrecking Ball State
      this.ballRadius = this.calcBallRadius();
      this.chainLen = this.calcChainLen();
      const startAngle = this.facing + Math.PI;
      this.bx = this.x + Math.cos(startAngle) * this.chainLen;
      this.by = this.y + Math.sin(startAngle) * this.chainLen;
      this.bvx = -Math.sin(startAngle) * 160;
      this.bvy = Math.cos(startAngle) * 160;
      this.ballSpin = 0;
      this.ballSpeed = 0;
      this.ballTrail = [];

      // Streak tracking
      this.streakCount = 0;
      this.streakTimer = 0;

      // Bot Sector Roaming (anti-congestion patrol target)
      const roamR = 1400 + Math.random() * (WORLD_RADIUS - 2200);
      const roamA = Math.random() * Math.PI * 2;
      this.roamTargetX = Math.cos(roamA) * roamR;
      this.roamTargetY = Math.sin(roamA) * roamR;

      this.aiTimer = 0;
      this.aiReactionTimer = Math.random() * (this.iq ? this.iq.reactionMax : 0.25);
      this.aiLastResult = { dx: Math.cos(this.facing), dy: Math.sin(this.facing), boost: false };
      this.aiOrbitDir = Math.random() < 0.5 ? 1 : -1;
      this.aiAggro = this.iq ? (this.iq.id === 'EXTREME' ? 0.95 : this.iq.id === 'HIGH' ? 0.80 : this.iq.id === 'MED' ? 0.55 : 0.35) : 0.5;
    }

    // Slow, progressive, grindable power-curve scaling (like Slither.io)
    calcBallRadius() {
      const score = Math.max(0, this.score);
      return 22 + Math.min(270, Math.pow(score, 0.38) * 1.85);
    }

    calcChainLen() {
      return 115 + (this.ballRadius - 22) * 1.35;
    }

    calcCoreRadius() {
      return 21 + Math.min(24, (this.ballRadius - 22) * 0.09);
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

    // Pure mouse dragging flail update (no LMB/RMB spin)
    update(dt, desiredDirX, desiredDirY, wantsBoost) {
      if (!this.alive) return;

      if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldGraceTimer > 0) this.shieldGraceTimer = Math.max(0, this.shieldGraceTimer - dt);
      if (this.jukeTimer > 0) this.jukeTimer = Math.max(0, this.jukeTimer - dt);
      if (this.closeCallCooldown > 0) this.closeCallCooldown = Math.max(0, this.closeCallCooldown - dt);
      if (this.streakTimer > 0) {
        this.streakTimer -= dt;
        if (this.streakTimer <= 0) this.streakCount = 0;
      }

      // Energy shield auto-recharge (10 seconds without taking damage)
      if (!this.hasShield) {
        this.shieldRechargeTimer -= dt;
        if (this.shieldRechargeTimer <= 0) {
          this.hasShield = true;
          if (this === player && mode === 'playing') {
            sfx.shieldRestore();
            addFloatingText(this.x, this.y - 32, 'SHIELD RESTORED! 🛡️', '#38bdf8', 19);
          }
        }
      }

      // Smoothly grow ball & chain & core
      const targetBallR = this.calcBallRadius();
      this.ballRadius = lerp(this.ballRadius, targetBallR, Math.min(1, dt * 5));
      this.chainLen = lerp(this.chainLen, this.calcChainLen(), Math.min(1, dt * 5));
      this.coreRadius = lerp(this.coreRadius, this.calcCoreRadius(), Math.min(1, dt * 4));

      // Boost resource
      if (this.boostExhausted && this.boostEnergy > 18) {
        this.boostExhausted = false;
      }
      this.boosting = wantsBoost && !this.boostExhausted && this.boostEnergy > 1;

      const mag = Math.hypot(desiredDirX, desiredDirY);
      const nx = mag > 0.05 ? desiredDirX / mag : Math.cos(this.facing);
      const ny = mag > 0.05 ? desiredDirY / mag : Math.sin(this.facing);

      // Instant Juke-Dash on fresh boost tap
      if (this.boosting && !this.wasBoosting && this.boostEnergy >= 10) {
        this.jukeTimer = 0.24;
        this.vx = nx * 780;
        this.vy = ny * 780;
        this.boostEnergy = Math.max(0, this.boostEnergy - 9);
        spawnShockwave(this.x, this.y, 56, '#38bdf8');
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: this.x + (Math.random() - 0.5) * 14,
            y: this.y + (Math.random() - 0.5) * 14,
            vx: -nx * (180 + Math.random() * 120),
            vy: -ny * (180 + Math.random() * 120),
            r: 5 + Math.random() * 4,
            color: '#38bdf8',
            life: 0.26,
            maxLife: 0.26
          });
        }
      }
      this.wasBoosting = this.boosting;

      if (this.boosting) {
        this.boostEnergy = Math.max(0, this.boostEnergy - dt * 32);
        if (this.boostEnergy <= 1) this.boostExhausted = true;
      } else {
        this.boostEnergy = Math.min(100, this.boostEnergy + dt * 28);
      }

      // 1. Snappy Core movement (ultra-high grip, instant response)
      const sizeSlowdown = 1 - Math.min(0.20, (this.ballRadius - 22) / 800);
      const jukeBonus = this.jukeTimer > 0 ? 240 : 0;
      const maxSpeed = ((this.boosting ? 560 : 390) + jukeBonus) * sizeSlowdown;
      const throttle = clamp(mag, 0.45, 1);

      const targetVx = nx * maxSpeed * throttle;
      const targetVy = ny * maxSpeed * throttle;
      const accel = this.boosting ? 28 : 22;
      this.vx = lerp(this.vx, targetVx, Math.min(1, dt * accel));
      this.vy = lerp(this.vy, targetVy, Math.min(1, dt * accel));

      // Core acceleration transfer (whip momentum transfer directly onto the ball!)
      const coreAccX = (this.vx - this.prevVx) / Math.max(0.001, dt);
      const coreAccY = (this.vy - this.prevVy) / Math.max(0.001, dt);
      this.prevVx = this.vx;
      this.prevVy = this.vy;
      this.bvx += coreAccX * 0.52 * dt;
      this.bvy += coreAccY * 0.52 * dt;

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

      // 2. FAST STRING MOMENTUM & CENTRIFUGAL WHIP PHYSICS
      // Very light drag so the flail retains snappy rotational momentum on drags
      const drag = Math.pow(0.996, dt * 60);
      this.bvx *= drag;
      this.bvy *= drag;

      // Elastic chain stretch under centrifugal speed
      const currentBallSpd = Math.hypot(this.bvx, this.bvy);
      const stretchRatio = clamp(currentBallSpd / 950, 0, 1);
      const targetStretch = 1.0 + stretchRatio * 0.12;
      this.elasticChainFactor = lerp(this.elasticChainFactor, targetStretch, Math.min(1, dt * 8));
      const activeChainLen = this.chainLen * this.elasticChainFactor;

      // Vectors from core -> ball
      let rx = this.bx - this.x;
      let ry = this.by - this.y;
      let rDist = Math.hypot(rx, ry) || 0.001;
      let ux = rx / rDist;
      let uy = ry / rDist;
      let tx = -uy;
      let ty = ux;

      // Centrifugal whip pumping: core moving tangentially relative to the ball pumps angular momentum into the ball!
      const coreTangSpeed = (this.vx * tx + this.vy * ty);
      const whipPump = coreTangSpeed * 3.2 * dt;
      this.bvx += tx * whipPump;
      this.bvy += ty * whipPump;

      // Integrate ball position
      this.bx += this.bvx * dt;
      this.by += this.bvy * dt;

      // Enforce chain tether constraint with elastic sling
      rx = this.bx - this.x;
      ry = this.by - this.y;
      rDist = Math.hypot(rx, ry) || 0.001;
      ux = rx / rDist;
      uy = ry / rDist;
      tx = -uy;
      ty = ux;

      if (rDist > activeChainLen) {
        const overflow = rDist - activeChainLen;
        this.bx -= ux * overflow * 0.90;
        this.by -= uy * overflow * 0.90;

        const relVx = this.bvx - this.vx;
        const relVy = this.bvy - this.vy;
        const radialVel = relVx * ux + relVy * uy;
        if (radialVel > 0) {
          this.bvx -= ux * radialVel * 0.92;
          this.bvy -= uy * radialVel * 0.92;
          // Angular sling transfer on tension stretch
          const tangSpeed = relVx * tx + relVy * ty;
          this.bvx += tx * (tangSpeed * 0.08);
          this.bvy += ty * (tangSpeed * 0.08);
        }
      } else if (rDist < this.coreRadius + this.ballRadius + 8) {
        const minR = this.coreRadius + this.ballRadius + 8;
        this.bx = this.x + ux * minR;
        this.by = this.y + uy * minR;
      }

      // Ball speed cap (raised for fast high-momentum whip drags)
      this.ballSpeed = Math.hypot(this.bvx, this.bvy);
      const maxBallSpeed = this.boosting ? 1420 : 1180;
      if (this.ballSpeed > maxBallSpeed) {
        const sc = maxBallSpeed / this.ballSpeed;
        this.bvx *= sc;
        this.bvy *= sc;
        this.ballSpeed = maxBallSpeed;
      }

      // Arena wall bounce for ball
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
      const relBallAngSpeed = (this.bvx * tx + this.bvy * ty) / Math.max(1, rDist);
      this.ballSpin += relBallAngSpeed * dt * 1.4;

      if (this.ballTrail.length > 10) this.ballTrail.shift();
      this.ballTrail.push({ x: this.bx, y: this.by });
    }
  }

  // ═══ SHARDS & LOOT ═══
  function spawnAmbientShard(isMega = false) {
    const r = Math.sqrt(Math.random()) * (WORLD_RADIUS - 120);
    const a = Math.random() * Math.PI * 2;
    const colors = ['#fde047', '#38bdf8', '#4ade80', '#fb923c', '#e879f9', '#a78bfa'];
    shards.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      vx: 0,
      vy: 0,
      value: isMega ? 25 : 5,
      r: isMega ? 13 : 7.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      isLoot: isMega,
      isMega
    });
  }

  // Ball burst shattering animation: jagged pieces flying outward
  function spawnBallBurstFX(x, y, radius, skin) {
    const count = clamp(Math.floor(20 + radius * 0.22), 22, 38);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const spd = 160 + Math.random() * 420;
      const size = 6 + Math.random() * (radius * 0.16 + 6);
      const life = 0.9 + Math.random() * 0.6;
      ballFragments.push({
        x: x + Math.cos(ang) * (radius * 0.4),
        y: y + Math.sin(ang) * (radius * 0.4),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 12,
        size,
        color: i % 2 === 0 ? skin.ballColor : (skin.spikeColor || skin.ballHighlight),
        edgeColor: skin.ballHighlight || '#ffffff',
        life,
        maxLife: life
      });
    }
    spawnShockwave(x, y, radius * 1.8, skin.trailColor || '#fb923c');
    spawnSparks(x, y, 32, skin.ballHighlight, '#ffffff', 160, 480);
  }

  // Grouped XP scattering: victim's mass blooms into an organic cluster of radiant XP gems for slow grinding
  function spawnKillLoot(victim) {
    const count = clamp(Math.floor(28 + Math.sqrt(victim.score) * 2.6), 35, 65);
    const totalValue = Math.max(90, Math.floor(victim.score * 0.90 + 70));
    const perShard = Math.max(4, Math.ceil(totalValue / count));

    const colors = ['#fde047', '#38bdf8', '#4ade80', '#fb923c', '#e879f9', '#a78bfa'];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const spd = 70 + Math.random() * 260; // Initial dispersal velocity
      const originX = (i % 2 === 0) ? victim.bx : victim.x;
      const originY = (i % 2 === 0) ? victim.by : victim.y;
      const col = colors[i % colors.length];

      shards.push({
        x: originX + (Math.random() - 0.5) * 24,
        y: originY + (Math.random() - 0.5) * 24,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        value: perShard,
        r: clamp(7 + perShard * 0.12, 7, 16),
        color: col,
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

  function spawnShieldBreakFX(x, y) {
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 320;
      const life = 0.35 + Math.random() * 0.3;
      particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 3 + Math.random() * 5,
        color: Math.random() < 0.65 ? '#38bdf8' : '#ffffff',
        life,
        maxLife: life
      });
    }
    spawnShockwave(x, y, 75, '#38bdf8');
  }

  function spawnShockwave(x, y, maxR, color) {
    shockwaves.push({
      x,
      y,
      r: 10,
      maxR,
      color,
      life: 0.28,
      maxLife: 0.28
    });
  }

  function addFloatingText(x, y, text, color, size = 20) {
    floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      life: 0.85,
      maxLife: 0.85
    });
  }

  // ═══ BOT AI WITH SECTOR PATROLLING (ANTI-CONGESTION) ═══
  function computeBotInput(bot, dt) {
    bot.aiTimer -= dt;
    bot.aiReactionTimer -= dt;
    const iq = bot.iq || BOT_IQ_TIERS.MED;

    // 1. Arena perimeter boundary avoidance
    const dCenter = Math.hypot(bot.x, bot.y);
    if (dCenter > WORLD_RADIUS - 380) {
      const inAng = Math.atan2(-bot.y, -bot.x);
      bot.aiLastResult = { dx: Math.cos(inAng), dy: Math.sin(inAng), boost: false };
      return bot.aiLastResult;
    }

    // Human perception latency per IQ tier
    if (bot.aiReactionTimer > 0 && bot.aiLastResult) {
      return bot.aiLastResult;
    }
    bot.aiReactionTimer = iq.reactionMin + Math.random() * (iq.reactionMax - iq.reactionMin);

    // 2. Evaluate incoming ball threats
    let fleeX = 0;
    let fleeY = 0;
    let danger = 0;
    let nearestPrey = null;
    let nearestPreyDist = iq.visionRange;

    for (const other of entities) {
      if (!other.alive || other.id === bot.id) continue;

      const db = dist(bot.x, bot.y, other.bx, other.by);
      const safeD = other.ballRadius + bot.coreRadius + (iq.id === 'EXTREME' ? 140 : 105);
      if (db < safeD && other.ballSpeed > 180) {
        const dot = other.bvx * (bot.x - other.bx) + other.bvy * (bot.y - other.by);
        if (dot > 0) {
          const w = (1 - db / safeD) * (iq.id === 'LOW' ? 2.0 : 3.2);
          fleeX += ((bot.x - other.bx) / (db || 1)) * w;
          fleeY += ((bot.y - other.by) / (db || 1)) * w;
          danger += w;
        }
      }

      // Prey check
      if (other.shieldTimer <= 0) {
        const dc = dist(bot.x, bot.y, other.x, other.y);
        if (dc < iq.visionRange) {
          const toOtherAng = Math.atan2(other.y - bot.y, other.x - bot.x);
          let angDiff = Math.abs(toOtherAng - bot.facing);
          while (angDiff > Math.PI) angDiff = Math.abs(angDiff - Math.PI * 2);

          const inVision = dc < 170 || iq.visionCone >= Math.PI * 2 || angDiff < (iq.visionCone * 0.5);
          if (inVision) {
            if (other === player && globalPlayerHunterId && globalPlayerHunterId !== bot.id) {
              continue;
            }
            if (dc < nearestPreyDist) {
              nearestPreyDist = dc;
              nearestPrey = other;
            }
          }
        }
      }
    }

    if (nearestPrey === player) {
      globalPlayerHunterId = bot.id;
    } else if (globalPlayerHunterId === bot.id) {
      globalPlayerHunterId = null;
    }

    if (danger > iq.dangerThreshold) {
      const canJuke = iq.canJukeDash && danger > 1.6 && bot.boostEnergy > 35;
      bot.aiLastResult = { dx: fleeX, dy: fleeY, boost: canJuke };
      return bot.aiLastResult;
    }

    // 3. Hunt prey with predictive leading & body-drag whipping
    if (nearestPrey && nearestPreyDist < bot.chainLen * 2.1 + 100 && bot.aiAggro > 0.30) {
      let aimX = nearestPrey.x;
      let aimY = nearestPrey.y;
      if (iq.id === 'EXTREME' || iq.id === 'HIGH') {
        const leadFactor = clamp(nearestPreyDist / Math.max(220, bot.ballSpeed + 180), 0.08, 0.38);
        aimX += nearestPrey.vx * leadFactor;
        aimY += nearestPrey.vy * leadFactor;
      }

      const toPreyAng = Math.atan2(aimY - bot.y, aimX - bot.x);
      const idealDist = bot.chainLen * 0.95;
      const noise = (Math.random() - 0.5) * iq.aimNoise;
      const angleOffset = (nearestPreyDist > idealDist ? 0.38 : iq.orbitOffset) * bot.aiOrbitDir + noise;
      const steerAng = toPreyAng + angleOffset;

      const shouldWhip = nearestPreyDist < bot.chainLen * 1.40 && bot.boostEnergy > 30 && Math.random() < iq.whipProb;
      bot.aiLastResult = { dx: Math.cos(steerAng), dy: Math.sin(steerAng), boost: shouldWhip };
      return bot.aiLastResult;
    }

    // 4. Seek nearby loot shards or grouped XP
    let bestShard = null;
    let bestScore = 0;
    const searchRange = iq.id === 'LOW' ? 520 : 440;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const d = dist(bot.x, bot.y, s.x, s.y);
      if (d > searchRange) continue;
      const lootWeight = s.isLoot ? s.value * (iq.id === 'EXTREME' ? 5.0 : 3.5) : s.value * iq.lootDesire;
      const weight = lootWeight / (d + 25);
      if (weight > bestScore) {
        bestScore = weight;
        bestShard = s;
      }
    }

    if (bestShard) {
      const ang = Math.atan2(bestShard.y - bot.y, bestShard.x - bot.x);
      bot.aiLastResult = {
        dx: Math.cos(ang),
        dy: Math.sin(ang),
        boost: bestShard.isLoot && bot.boostEnergy > 50 && (iq.id === 'HIGH' || iq.id === 'EXTREME')
      };
      return bot.aiLastResult;
    }

    // 5. Anti-congestion Sector Roaming (Patrol distinct sectors across 8500px arena)
    const dRoam = dist(bot.x, bot.y, bot.roamTargetX, bot.roamTargetY);
    if (dRoam < 600 || bot.aiTimer <= 0) {
      const roamR = 1400 + Math.random() * (WORLD_RADIUS - 2200);
      const roamA = Math.random() * Math.PI * 2;
      bot.roamTargetX = Math.cos(roamA) * roamR;
      bot.roamTargetY = Math.sin(roamA) * roamR;
      bot.aiTimer = 8 + Math.random() * 8;
    }

    const roamAng = Math.atan2(bot.roamTargetY - bot.y, bot.roamTargetX - bot.x);
    bot.aiLastResult = { dx: Math.cos(roamAng), dy: Math.sin(roamAng), boost: false };
    return bot.aiLastResult;
  }

  function pickBotTier() {
    const roll = Math.random();
    if (roll < 0.13) return BOT_IQ_TIERS.EXTREME; // 13% Titan Bosses
    if (roll < 0.35) return BOT_IQ_TIERS.HIGH;    // 22% Elite Hunters
    if (roll < 0.72) return BOT_IQ_TIERS.MED;     // 37% Veterans
    return BOT_IQ_TIERS.LOW;                      // 28% Rookies
  }

  function getScoreForTier(tier) {
    switch (tier.id) {
      case 'EXTREME': return 750 + Math.floor(Math.random() * 850);
      case 'HIGH':    return 240 + Math.floor(Math.random() * 320);
      case 'MED':     return 60 + Math.floor(Math.random() * 140);
      case 'LOW':
      default:        return Math.floor(Math.random() * 45);
    }
  }

  // ═══ INITIALIZE WORLD ═══
  function seedArena() {
    entities.length = 0;
    shards.length = 0;
    particles.length = 0;
    ballFragments.length = 0;
    shockwaves.length = 0;
    floatingTexts.length = 0;

    // Populate food & ambient mass
    for (let i = 0; i < TARGET_SHARDS; i++) {
      spawnAmbientShard(Math.random() < 0.08);
    }

    // Spawn AI bots with IQ tiers
    for (let i = 0; i < BOT_COUNT; i++) {
      const tier = pickBotTier();
      const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
      const bot = new Wrecker({
        name: randomBotName(tier),
        skin,
        isBot: true,
        initialScore: getScoreForTier(tier),
        iq: tier
      });
      entities.push(bot);
    }
  }

  function maintainPopulation() {
    // Respawn dead bots if count dips
    let aliveBots = 0;
    for (const e of entities) {
      if (e.isBot && e.alive) aliveBots++;
    }
    if (aliveBots < BOT_COUNT) {
      const tier = pickBotTier();
      const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
      const bot = new Wrecker({
        name: randomBotName(tier),
        skin,
        isBot: true,
        initialScore: getScoreForTier(tier),
        iq: tier
      });
      entities.push(bot);
    }

    // Maintain shard count
    while (shards.length < TARGET_SHARDS) {
      spawnAmbientShard(Math.random() < 0.06);
    }
  }

  // ═══ COMBAT & COLLISIONS ═══
  function resolveCollisions() {
    const aliveEntities = entities.filter(e => e.alive);

    // 1. Ball vs Ball Ricochet
    for (let i = 0; i < aliveEntities.length; i++) {
      const a = aliveEntities[i];
      for (let j = i + 1; j < aliveEntities.length; j++) {
        const b = aliveEntities[j];
        const d = dist(a.bx, a.by, b.bx, b.by);
        const minDist = a.ballRadius + b.ballRadius;
        if (d < minDist && d > 0.001) {
          const overlap = minDist - d;
          const nx = (b.bx - a.bx) / d;
          const ny = (b.by - a.by) / d;

          a.bx -= nx * overlap * 0.5;
          a.by -= ny * overlap * 0.5;
          b.bx += nx * overlap * 0.5;
          b.by += ny * overlap * 0.5;

          const massA = a.getBallMass();
          const massB = b.getBallMass();
          const totalMass = massA + massB;

          const relVx = b.bvx - a.bvx;
          const relVy = b.bvy - a.bvy;
          const normVel = relVx * nx + relVy * ny;

          if (normVel < 0) {
            const restitution = 1.35;
            const impulse = -(1 + restitution) * normVel / (1 / massA + 1 / massB);
            a.bvx -= (impulse / massA) * nx;
            a.bvy -= (impulse / massA) * ny;
            b.bvx += (impulse / massB) * nx;
            b.bvy += (impulse / massB) * ny;

            const impactSpeed = Math.abs(normVel);
            if (impactSpeed > 160) {
              const cx = (a.bx + b.bx) * 0.5;
              const cy = (a.by + b.by) * 0.5;
              spawnSparks(cx, cy, Math.floor(clamp(impactSpeed / 40, 5, 18)), '#ffffff', '#fb923c', 140, 380);
              if (dist(cx, cy, camera.x, camera.y) < 700) {
                sfx.clang(clamp(impactSpeed / 800, 0.2, 1.0));
              }
            }
          }
        }
      }
    }

    // 2. Ball vs Enemy Core (Smash / 1-Hit Shield Protection)
    for (const attacker of aliveEntities) {
      for (const victim of aliveEntities) {
        if (attacker.id === victim.id) continue;
        if (victim.shieldTimer > 0) continue; // Spawn invulnerability

        const hitDist = attacker.ballRadius + victim.coreRadius;
        const d = dist(attacker.bx, attacker.by, victim.x, victim.y);

        // Near-Miss dodge detection
        if (victim === player && d > hitDist && d < hitDist + 48 && attacker.ballSpeed > 320) {
          if (victim.closeCallCooldown <= 0) {
            victim.closeCallCooldown = 0.8;
            victim.boostEnergy = Math.min(100, victim.boostEnergy + 22);
            sfx.pickup(4);
            addFloatingText(victim.x, victim.y - 28, 'CLOSE CALL! +22⚡', '#38bdf8', 18);
          }
        }

        if (d < hitDist) {
          if (victim.shieldGraceTimer > 0) continue;

          // 1-Hit Energy Shield Check!
          if (victim.hasShield) {
            victim.hasShield = false;
            victim.shieldRechargeTimer = 10.0;
            victim.shieldGraceTimer = 0.85; // 0.85s grace immunity after shield breaks

            spawnShieldBreakFX(victim.x, victim.y);
            sfx.shieldBreak();

            // Heavy kinetic repulsion knocks attacker's ball away
            const repelAng = Math.atan2(attacker.by - victim.y, attacker.bx - victim.x);
            attacker.bvx = Math.cos(repelAng) * 620;
            attacker.bvy = Math.sin(repelAng) * 620;

            if (victim === player && mode === 'playing') {
              shake = 16;
              addFloatingText(victim.x, victim.y - 36, 'SHIELD BROKEN! 🛡️💥', '#f87171', 22);
            } else {
              addFloatingText(victim.x, victim.y - 36, 'BLOCKED! 🛡️', '#38bdf8', 18);
            }
            continue;
          }

          // Unshielded core hit: LETHAL SMASH!
          handleKill(attacker, victim);
          return;
        }
      }
    }

    // 3. Shard Collection (both core & ball can collect mass)
    for (const e of aliveEntities) {
      for (let sIdx = shards.length - 1; sIdx >= 0; sIdx--) {
        const s = shards[sIdx];
        const dCore = dist(e.x, e.y, s.x, s.y);
        const dBall = dist(e.bx, e.by, s.x, s.y);

        if (dCore < e.coreRadius + s.r + 10 || dBall < e.ballRadius + s.r + 8) {
          e.addScore(s.value);
          if (e === player && mode === 'playing') {
            pickupCombo++;
            pickupComboTimer = 0.55;
            sfx.pickup(clamp(pickupCombo, 1, 14));
          }
          shards.splice(sIdx, 1);
        }
      }
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

    // Ball shatter burst animation & grouped XP loot dispersion
    spawnBallBurstFX(victim.bx, victim.by, victim.ballRadius, victim.skin);
    spawnKillLoot(victim);
    spawnSparks(victim.x, victim.y, 34, victim.skin.coreColor, '#fde047', 120, 520);
    spawnShockwave(victim.x, victim.y, 90 + victim.ballRadius, victim.skin.trailColor);

    const involvesMe = attacker === player || victim === player;
    pushKillFeed(attacker.name, victim.name, involvesMe);

    if (attacker === player && mode === 'playing') {
      hitStopTimer = 0.055;
      shake = Math.max(shake, isGiantSlayer ? 22 : 15);
      sfx.smash(isGiantSlayer || attacker.streakCount >= 2);

      let label = 'SMASH!';
      let col = '#fde047';
      if (victim.isBot && victim.iq && victim.iq.id === 'EXTREME') {
        label = '⚡ TITAN BOSS SLAYED! +100';
        col = '#f43f5e';
        attacker.addScore(75);
      } else if (victim.isBot && victim.iq && victim.iq.id === 'HIGH') {
        label = '★ ELITE HUNTER DOWN! +50';
        col = '#fb923c';
        attacker.addScore(35);
      } else if (isGiantSlayer) {
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
      const killerTitle = (attacker.isBot && attacker.iq) ? `[${attacker.iq.id}] ${attacker.name}` : attacker.name;
      onPlayerDied(killerTitle);
    } else if (dist(victim.x, victim.y, camera.x, camera.y) < 750 && mode === 'playing') {
      sfx.smash(false);
    }
  }

  // ═══ FULLSCREEN HELPERS ═══
  function requestGameFullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      }
    } catch (_) {}
  }

  function toggleGameFullscreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        requestGameFullscreen();
      }
    } catch (_) {}
  }

  function updateFullscreenButtons() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (fsBtn) fsBtn.textContent = '⛶';
    if (topFsBtn) topFsBtn.textContent = isFs ? '✓' : '⛶';
  }
  document.addEventListener('fullscreenchange', updateFullscreenButtons);

  // ═══ GAME FLOW ═══
  function startGame() {
    sfx.init();
    mode = 'playing';

    const nick = (nicknameInput.value.trim() || 'Wrecker').slice(0, 14);
    const skin = SKINS[selectedSkinIdx] || SKINS[0];

    document.body.classList.add('in-game');

    // Spawn player in clean location
    player = new Wrecker({
      name: nick,
      skin,
      isBot: false,
      initialScore: 0
    });

    const pIdx = entities.findIndex(e => e.id === player.id);
    if (pIdx >= 0) entities[pIdx] = player;
    else entities.push(player);

    camera.x = player.x;
    camera.y = player.y;
    camera.zoom = 0.86;

    input.mouseX = width * 0.5;
    input.mouseY = height * 0.5 - 140;
    input.hasPointer = true;
    requestGamePointerLock();

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
    document.body.classList.remove('in-game', 'pointer-locked');
    exitGamePointerLock();
    input.boosting = false;
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

    // Update entities (pure mouse dragging steering)
    for (const e of entities) {
      if (!e.alive) continue;

      if (e === player && mode === 'playing') {
        let dx = 0;
        let dy = 0;
        if (input.isTouch && input.joyActive) {
          dx = (input.joyX - input.joyOriginX) / 56;
          dy = (input.joyY - input.joyOriginY) / 56;
        } else if (input.hasPointer) {
          const screenPlayerX = width * 0.5 + (e.x - camera.x) * camera.zoom;
          const screenPlayerY = height * 0.5 + (e.y - camera.y) * camera.zoom;
          const aimDistX = input.mouseX - screenPlayerX;
          const aimDistY = input.mouseY - screenPlayerY;
          dx = aimDistX / (42 * camera.zoom);
          dy = aimDistY / (42 * camera.zoom);
        }
        e.update(dt, dx, dy, input.boosting);
      } else if (e.isBot) {
        const ai = computeBotInput(e, dt);
        e.update(dt, ai.dx, ai.dy, ai.boost);
      }
    }

    // Drift & decelerate grouped XP shards
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      s.pulse += dt * 4.5;
      if (s.vx || s.vy) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const decay = Math.pow(0.86, dt * 60);
        s.vx *= decay;
        s.vy *= decay;
        if (Math.hypot(s.vx, s.vy) < 4) {
          s.vx = 0;
          s.vy = 0;
        }
        const d = Math.hypot(s.x, s.y);
        if (d > WORLD_RADIUS - 40) {
          const ang = Math.atan2(s.y, s.x);
          s.x = Math.cos(ang) * (WORLD_RADIUS - 40);
          s.y = Math.sin(ang) * (WORLD_RADIUS - 40);
        }
      }
    }

    resolveCollisions();

    // Update ball burst shatter fragments
    for (let i = ballFragments.length - 1; i >= 0; i--) {
      const f = ballFragments[i];
      f.life -= dt;
      if (f.life <= 0) {
        ballFragments.splice(i, 1);
        continue;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= Math.pow(0.92, dt * 60);
      f.vy *= Math.pow(0.92, dt * 60);
      f.rot += f.rotSpeed * dt;
    }

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

    // Camera tracking
    if (mode === 'playing' && player && player.alive) {
      camera.x = lerp(camera.x, player.x, Math.min(1, dt * 10));
      camera.y = lerp(camera.y, player.y, Math.min(1, dt * 10));
      const desiredZoom = clamp(0.86 - (player.ballRadius - 22) * 0.0022, 0.42, 0.86);
      camera.zoom = lerp(camera.zoom, desiredZoom, Math.min(1, dt * 3));
    } else {
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
    if (mode !== 'playing' || !player) return;

    hudScore.textContent = Math.floor(player.score);
    hudBallSize.textContent = `BALL SIZE: ${player.getSizeMult().toFixed(1)}x`;
    hudKills.textContent = player.kills;

    // Shield HUD indicator
    if (hudShieldText && hudShieldPill) {
      if (player.hasShield) {
        hudShieldText.textContent = 'READY';
        hudShieldPill.style.borderColor = 'rgba(56, 189, 248, 0.45)';
        hudShieldPill.style.background = 'rgba(15, 23, 42, 0.72)';
      } else {
        const sec = Math.ceil(player.shieldRechargeTimer);
        hudShieldText.textContent = `${sec}s`;
        hudShieldPill.style.borderColor = 'rgba(239, 68, 68, 0.45)';
        hudShieldPill.style.background = 'rgba(69, 10, 10, 0.72)';
      }
    }

    // Sort leaderboard by score
    const sorted = [...entities].filter(e => e.alive).sort((a, b) => b.score - a.score);
    kingId = sorted.length ? sorted[0].id : null;

    leaderboardList.innerHTML = '';
    const top5 = sorted.slice(0, 8);
    let myRankFound = false;

    top5.forEach((e, idx) => {
      const isMe = e === player;
      if (isMe) myRankFound = true;
      const li = document.createElement('li');
      li.className = 'lb-row' + (isMe ? ' me' : '') + (idx === 0 ? ' king' : '');

      let botBadge = '';
      if (e.isBot && e.iq) {
        botBadge = `<span style="font-size: 9px; padding: 1px 4px; border-radius: 4px; background: rgba(255,255,255,0.1); color: ${e.iq.color}; margin-right: 3px;">${e.iq.name}</span>`;
      }

      li.innerHTML = `
        <div class="lb-left">
          <span class="lb-rank">${idx === 0 ? '👑' : idx + 1}</span>
          ${botBadge}
          <span class="lb-name">${e.name}</span>
        </div>
        <span class="lb-score">${Math.floor(e.score)}</span>
      `;
      leaderboardList.appendChild(li);
    });

    if (!myRankFound && player && player.alive) {
      const myRank = sorted.findIndex(e => e === player) + 1;
      if (myRank > 0) {
        const li = document.createElement('li');
        li.className = 'lb-row me';
        li.innerHTML = `
          <div class="lb-left">
            <span class="lb-rank">${myRank}</span>
            <span class="lb-name">${player.name}</span>
          </div>
          <span class="lb-score">${Math.floor(player.score)}</span>
        `;
        leaderboardList.appendChild(li);
      }
    }
  }

  function pushKillFeed(killer, victim, isMe) {
    const item = document.createElement('div');
    item.className = 'kill-item' + (isMe ? ' is-me' : '');
    item.innerHTML = `<span class="killer">${killer}</span><span class="verb">SMASHED</span><span class="victim">${victim}</span>`;
    killFeed.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 4200);
  }

  // ═══ DRAWING PIPELINE ═══
  function drawBackground() {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Screen Shake
    if (shake > 0) {
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.translate(sx, sy);
    }

    // World Camera Transform
    ctx.translate(width * 0.5, height * 0.5);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const viewW = width / camera.zoom;
    const viewH = height / camera.zoom;

    // Arena Floor
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Dark sleek hexagonal grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    const gridStep = 180;
    const startX = Math.floor((camera.x - viewW * 0.6) / gridStep) * gridStep;
    const endX = Math.ceil((camera.x + viewW * 0.6) / gridStep) * gridStep;
    const startY = Math.floor((camera.y - viewH * 0.6) / gridStep) * gridStep;
    const endY = Math.ceil((camera.y + viewH * 0.6) / gridStep) * gridStep;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridStep) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridStep) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Arena Perimeter Ring
    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Radiant grouped XP gems & ambient shards
    for (const s of shards) {
      if (Math.abs(s.x - camera.x) > viewW * 0.62 || Math.abs(s.y - camera.y) > viewH * 0.62) continue;
      const pr = s.r + Math.sin(s.pulse) * 1.4;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.pulse * 0.35);

      ctx.fillStyle = s.color;
      if (s.isLoot) {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 14;
      }

      // Crisp diamond gem polygon
      ctx.beginPath();
      ctx.moveTo(0, -pr);
      ctx.lineTo(pr * 0.85, 0);
      ctx.lineTo(0, pr);
      ctx.lineTo(-pr * 0.85, 0);
      ctx.closePath();
      ctx.fill();

      // Shiny inner facet reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
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

    // Ball Burst Shatter Pieces
    for (const f of ballFragments) {
      const alpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.strokeStyle = f.edgeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.size, 0);
      ctx.lineTo(-f.size * 0.6, -f.size * 0.6);
      ctx.lineTo(-f.size * 0.4, f.size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw all Wreckers
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
      ctx.font = `900 ${ft.size}px Fredoka, Lilita One, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Mouse pointer crosshair reticle when locked
    if (mode === 'playing' && player && player.alive && input.hasPointer) {
      const aimDistX = input.mouseX - (width * 0.5 + (player.x - camera.x) * camera.zoom);
      const aimDistY = input.mouseY - (height * 0.5 + (player.y - camera.y) * camera.zoom);
      const targetWorldX = player.x + aimDistX / camera.zoom;
      const targetWorldY = player.y + aimDistY / camera.zoom;

      ctx.save();
      ctx.translate(targetWorldX, targetWorldY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.moveTo(-14, 0);
      ctx.lineTo(-4, 0);
      ctx.moveTo(4, 0);
      ctx.lineTo(14, 0);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, -4);
      ctx.moveTo(0, 4);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawWrecker(e) {
    // 1. Steel Chain Tether
    ctx.save();
    ctx.strokeStyle = e.skin.chainColor;
    ctx.lineWidth = Math.max(3.5, 3.5 + (e.ballRadius - 22) * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.bx, e.by);
    ctx.stroke();

    // Chain links
    const linkD = dist(e.x, e.y, e.bx, e.by);
    const linkSteps = Math.max(3, Math.floor(linkD / 22));
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i < linkSteps; i++) {
      const t = i / linkSteps;
      const lx = lerp(e.x, e.bx, t);
      const ly = lerp(e.y, e.by, t);
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Ball Motion Blur Trail
    if (e.ballTrail.length > 2 && e.ballSpeed > 360) {
      ctx.save();
      for (let i = 0; i < e.ballTrail.length - 1; i++) {
        const pt = e.ballTrail[i];
        const alpha = (i / e.ballTrail.length) * 0.45;
        const trailR = e.ballRadius * (0.6 + 0.4 * (i / e.ballTrail.length));
        ctx.fillStyle = e.skin.trailColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, trailR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Player Vehicle Core
    ctx.save();
    ctx.translate(e.x, e.y);

    // Energy Shield Bubble FX (1-Hit protection)
    if (e.hasShield) {
      const shieldPulse = (Math.sin(Date.now() * 0.007) + 1) * 0.5;
      const shieldR = e.coreRadius + 8 + shieldPulse * 3;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.65 + shieldPulse * 0.35;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14 + shieldPulse * 8;
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.restore();
    } else if (e.shieldGraceTimer > 0) {
      // Flashing grace immunity
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, e.coreRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = (Math.sin(Date.now() * 0.03) + 1) * 0.4;
      ctx.stroke();
      ctx.restore();
    }

    // Spawn Invulnerability Shield (Gold)
    if (e.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, e.coreRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Outer core chassis
    ctx.fillStyle = e.skin.coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, e.coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Directional cockpit pointer
    ctx.rotate(e.facing);
    ctx.fillStyle = e.skin.coreDark;
    ctx.beginPath();
    ctx.arc(0, 0, e.coreRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(e.coreRadius * 0.75, 0);
    ctx.lineTo(e.coreRadius * 0.25, -e.coreRadius * 0.35);
    ctx.lineTo(e.coreRadius * 0.25, e.coreRadius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bot IQ Badge & Name Tag
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 13px Fredoka, Outfit, sans-serif';

    if (e.isBot && e.iq) {
      const badgeText = e.iq.badge;
      ctx.font = '800 11px Fredoka, sans-serif';
      ctx.fillStyle = e.iq.color;
      ctx.fillText(badgeText, e.x, e.y - e.coreRadius - 20);
      ctx.font = '700 13px Fredoka, Outfit, sans-serif';
    }

    ctx.fillStyle = e === player ? '#38bdf8' : '#ffffff';
    ctx.fillText(e.name, e.x, e.y - e.coreRadius - 6);
    ctx.restore();

    // 4. THE WRECKING BALL!
    drawBallSprite(ctx, e.bx, e.by, e.ballRadius, e.ballSpin, e.skin, e.ballSpeed > 520);

    // 5. SINGLE MINIMALIST BALL MOVEMENT DIRECTION ARROW
    drawBallDirectionArrow(ctx, e);
  }

  function drawBallSprite(targetCtx, x, y, r, spin, skin, isHot = false) {
    targetCtx.save();
    targetCtx.translate(x, y);

    // Titan Energy Aura when huge
    if (r > 75) {
      const auraPulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      const auraR = r * (1.30 + auraPulse * 0.10);
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(0, 0, auraR, 0, Math.PI * 2);
      targetCtx.strokeStyle = skin.trailColor;
      targetCtx.lineWidth = 3 + auraPulse * 4;
      targetCtx.globalAlpha = 0.45 + auraPulse * 0.4;
      targetCtx.shadowColor = skin.trailColor;
      targetCtx.shadowBlur = 18 + auraPulse * 16;
      targetCtx.stroke();
      targetCtx.restore();
    }

    // Drop shadow
    targetCtx.fillStyle = 'rgba(0,0,0,0.35)';
    targetCtx.beginPath();
    targetCtx.arc(4, 6, r, 0, Math.PI * 2);
    targetCtx.fill();

    // Blazing kinetic glow on high-speed whips
    if (isHot) {
      targetCtx.shadowColor = skin.trailColor;
      targetCtx.shadowBlur = 24;
    }

    // Outer Ball Body
    targetCtx.rotate(spin);
    targetCtx.fillStyle = skin.ballColor;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r, 0, Math.PI * 2);
    targetCtx.fill();

    // Lethal Perimeter Spikes
    const spikeCount = Math.max(8, Math.floor(r * 0.38));
    const spikeLen = Math.max(7, r * 0.32);
    const spikeBase = Math.max(4, r * 0.16);

    targetCtx.fillStyle = skin.spikeColor;
    for (let i = 0; i < spikeCount; i++) {
      const sa = (i / spikeCount) * Math.PI * 2;
      targetCtx.save();
      targetCtx.rotate(sa);
      targetCtx.beginPath();
      targetCtx.moveTo(r, -spikeBase * 0.5);
      targetCtx.lineTo(r + spikeLen, 0);
      targetCtx.lineTo(r, spikeBase * 0.5);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.restore();
    }

    // 3D Spherical Specular Highlight
    const grad = targetCtx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
    grad.addColorStop(0, skin.ballHighlight);
    grad.addColorStop(0.5, skin.ballColor);
    grad.addColorStop(1, skin.ballDark);
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r, 0, Math.PI * 2);
    targetCtx.fill();

    // Central steel bolt
    targetCtx.fillStyle = skin.ballDark;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.fillStyle = '#ffffff';
    targetCtx.beginPath();
    targetCtx.arc(-r * 0.08, -r * 0.08, r * 0.10, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
  }

  // ═══ SINGLE MINIMALIST DIRECTION ARROW INDICATOR ═══
  function drawBallDirectionArrow(targetCtx, e) {
    const spd = e.ballSpeed;
    if (spd < 35) return; // Only show when the ball is moving

    const ang = Math.atan2(e.bvy, e.bvx);
    const r = e.ballRadius;
    const isPlayer = (e === player);

    targetCtx.save();
    targetCtx.translate(e.bx, e.by);
    targetCtx.rotate(ang);

    // Single sleek minimalist arrow right outside the ball radius
    const tipDist = r + 18;
    const baseDist = r + 5;
    const wingWidth = 7;

    targetCtx.beginPath();
    targetCtx.moveTo(tipDist, 0);
    targetCtx.lineTo(baseDist, -wingWidth);
    targetCtx.lineTo(baseDist + 3, 0);
    targetCtx.lineTo(baseDist, wingWidth);
    targetCtx.closePath();

    targetCtx.fillStyle = isPlayer ? '#ffffff' : (e.skin.trailColor || '#fb923c');
    targetCtx.shadowColor = isPlayer ? '#38bdf8' : (e.skin.trailColor || '#fb923c');
    targetCtx.shadowBlur = isPlayer ? 10 : 6;
    targetCtx.globalAlpha = isPlayer ? 0.95 : 0.65;
    targetCtx.fill();

    targetCtx.strokeStyle = isPlayer ? '#38bdf8' : 'rgba(0,0,0,0.4)';
    targetCtx.lineWidth = 1.5;
    targetCtx.stroke();

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

    // Map bounds
    mctx.beginPath();
    mctx.arc(cx, cy, rad, 0, Math.PI * 2);
    mctx.strokeStyle = 'rgba(255,255,255,0.18)';
    mctx.lineWidth = 1.5;
    mctx.stroke();

    const scale = rad / WORLD_RADIUS;

    // Draw other entities
    for (const e of entities) {
      if (!e.alive || e === player) continue;
      const mx = cx + e.x * scale;
      const my = cy + e.y * scale;
      const isKing = e.id === kingId;

      mctx.fillStyle = isKing ? '#facc15' : '#ef4444';
      mctx.beginPath();
      mctx.arc(mx, my, isKing ? 3.5 : 2, 0, Math.PI * 2);
      mctx.fill();
    }

    // Player blip
    if (player && player.alive) {
      const px = cx + player.x * scale;
      const py = cy + player.y * scale;

      mctx.fillStyle = '#38bdf8';
      mctx.beginPath();
      mctx.arc(px, py, 3.8, 0, Math.PI * 2);
      mctx.fill();

      // Heading indicator
      mctx.strokeStyle = '#38bdf8';
      mctx.lineWidth = 1.5;
      mctx.beginPath();
      mctx.moveTo(px, py);
      mctx.lineTo(px + Math.cos(player.facing) * 9, py + Math.sin(player.facing) * 9);
      mctx.stroke();
    }
  }

  // ═══ SKIN CUSTOMIZER & PREVIEW ═══
  function selectSkin(idx) {
    selectedSkinIdx = idx;
    const skin = SKINS[idx];
    if (skinNameLabel) skinNameLabel.textContent = skin.name;
    if (skinRarityLabel) skinRarityLabel.textContent = skin.rarity || 'STARTER ⚙️';

    if (skinPicker) {
      const dots = skinPicker.querySelectorAll('.skin-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('selected', i === idx);
      });
    }
  }

  function buildSkinPicker() {
    if (!skinPicker) return;
    skinPicker.innerHTML = '';
    SKINS.forEach((skin, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-dot' + (idx === selectedSkinIdx ? ' selected' : '');
      btn.title = skin.name;

      const c = document.createElement('canvas');
      c.width = 38;
      c.height = 38;
      const sctx = c.getContext('2d');
      drawBallSprite(sctx, 19, 19, 9, 0, skin, false);
      btn.appendChild(c);

      btn.addEventListener('click', () => {
        selectSkin(idx);
      });

      skinPicker.appendChild(btn);
    });
    selectSkin(selectedSkinIdx);
  }

  let avatarAngle = 0;
  function renderAvatarPreview() {
    if (!avatarCanvas || mode !== 'lobby') return;
    const actx = avatarCanvas.getContext('2d');
    actx.clearRect(0, 0, 130, 130);

    const skin = SKINS[selectedSkinIdx] || SKINS[0];
    avatarAngle += 0.035;
    const cx = 65;
    const cy = 65;
    const orbitR = 38;
    const bx = cx + Math.cos(avatarAngle) * orbitR;
    const by = cy + Math.sin(avatarAngle) * orbitR;

    // Ambient radial glow
    const grad = actx.createRadialGradient(cx, cy, 10, cx, cy, 60);
    grad.addColorStop(0, skin.glowColor || 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    actx.fillStyle = grad;
    actx.beginPath();
    actx.arc(cx, cy, 60, 0, Math.PI * 2);
    actx.fill();

    // Steel chain link
    actx.strokeStyle = skin.chainColor || '#94a3b8';
    actx.lineWidth = 3.5;
    actx.lineCap = 'round';
    actx.beginPath();
    actx.moveTo(cx, cy);
    actx.lineTo(bx, by);
    actx.stroke();

    // Player core
    actx.fillStyle = skin.coreColor || '#38bdf8';
    actx.beginPath();
    actx.arc(cx, cy, 13, 0, Math.PI * 2);
    actx.fill();
    actx.strokeStyle = '#ffffff';
    actx.lineWidth = 2.5;
    actx.stroke();

    // Core center eye
    actx.fillStyle = '#0f172a';
    actx.beginPath();
    actx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    actx.fill();

    // Wrecking Ball with Spikes
    drawBallSprite(actx, bx, by, 16, avatarAngle * 2.2, skin, false);
  }

  // ═══ INPUT LISTENERS (PURE MOUSE DRAGGING) ═══
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    input.hasPointer = true;
    if (document.pointerLockElement === canvas) {
      input.mouseX = clamp(input.mouseX + e.movementX, 0, width);
      input.mouseY = clamp(input.mouseY + e.movementY, 0, height);
    } else {
      input.mouseX = e.clientX;
      input.mouseY = e.clientY;
    }
  });

  document.addEventListener('pointerlockchange', updatePointerLockUI);

  canvas.addEventListener('click', () => {
    if (mode === 'playing') {
      requestGamePointerLock();
    }
  });

  if (mouseLockBtn) {
    mouseLockBtn.addEventListener('click', () => {
      if (document.pointerLockElement === canvas) {
        exitGamePointerLock();
      } else {
        requestGamePointerLock();
      }
    });
  }

  // No LMB or RMB functions! Pure mouse dragging game.
  window.addEventListener('mousedown', () => {
    // Pure mouse dragging - clicks do not spin or trigger actions
  });

  window.addEventListener('mouseup', () => {
    // Pure mouse dragging
  });

  window.addEventListener('blur', () => {
    input.boosting = false;
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
    } else if (e.code === 'Enter') {
      if (mode === 'dead') startGame();
      else if (mode === 'lobby' && document.activeElement === nicknameInput) startGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      input.boosting = false;
    }
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

  mobileBoostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.boosting = true;
  }, { passive: false });

  mobileBoostBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.boosting = false;
  }, { passive: false });

  mobileBoostBtn.addEventListener('touchcancel', () => {
    input.boosting = false;
  });

  // Lobby Buttons & Navigation
  playBtn.addEventListener('click', startGame);
  respawnBtn.addEventListener('click', startGame);
  backLobbyBtn.addEventListener('click', () => {
    mode = 'lobby';
    document.body.classList.remove('in-game', 'pointer-locked');
    exitGamePointerLock();
    deathOverlay.classList.add('hidden');
    lobbyOverlay.classList.remove('hidden');
  });

  muteBtn.addEventListener('click', () => {
    sfx.muted = !sfx.muted;
    muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
  });

  if (topMuteBtn) {
    topMuteBtn.addEventListener('click', () => {
      sfx.muted = !sfx.muted;
      topMuteBtn.textContent = sfx.muted ? '🔇' : '🔊';
      muteBtn.textContent = sfx.muted ? '🔇' : '🔊';
    });
  }

  if (fsBtn) fsBtn.addEventListener('click', toggleGameFullscreen);
  if (topFsBtn) topFsBtn.addEventListener('click', toggleGameFullscreen);

  if (prevSkinBtn) {
    prevSkinBtn.addEventListener('click', () => {
      const nextIdx = (selectedSkinIdx - 1 + SKINS.length) % SKINS.length;
      selectSkin(nextIdx);
    });
  }

  if (nextSkinBtn) {
    nextSkinBtn.addEventListener('click', () => {
      const nextIdx = (selectedSkinIdx + 1) % SKINS.length;
      selectSkin(nextIdx);
    });
  }

  if (randomNickBtn) {
    randomNickBtn.addEventListener('click', () => {
      const sampleNames = ['ApexCrusher', 'VoidReaper', 'SteelViper', 'DoomWhip', 'TitanClaw', 'NanoSmasher', 'ChainKing', 'OrbitSmash', 'IronSpiker', 'MeteorFury'];
      nicknameInput.value = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    });
  }

  if (privateRoomBtn) {
    privateRoomBtn.addEventListener('click', () => {
      const roomLink = `${window.location.origin}/wreckball/?room=private_${Math.floor(1000 + Math.random() * 9000)}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(roomLink).catch(() => {});
      }
      if (skribblToast) {
        skribblToast.classList.remove('hidden');
        setTimeout(() => skribblToast.classList.add('hidden'), 3000);
      }
    });
  }

  if (topShareBtn) {
    topShareBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}/wreckball/`;
      if (navigator.share) {
        navigator.share({ title: 'WreckBall.io', url: shareUrl }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          if (skribblToast) {
            skribblToast.textContent = '✓ Game link copied!';
            skribblToast.classList.remove('hidden');
            setTimeout(() => skribblToast.classList.add('hidden'), 3000);
          }
        }).catch(() => {});
      }
    });
  }

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
    renderAvatarPreview();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
