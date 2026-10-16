import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Gamepad2,
  Heart,
  Search,
  X,
  Play,
  Sparkles,
  Joystick,
  Monitor,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Keyboard,
  Star,
  RotateCcw,
} from 'lucide-react';

type Game = {
  id: string;
  title: string;
  category: string;
  platform: string;
  year: string;
  emoji: string;
  colors: string;
  description: string;
  kind: 'snake' | 'pong' | 'breakout' | 'invaders' | 'external' | 'embedded';
  url?: string;
  featured?: boolean;
};
const games: Game[] = [
  {
    id: 'snake',
    title: 'Pixel Snake',
    category: 'Arcade',
    platform: 'Original',
    year: '2026',
    emoji: '🐍',
    colors: 'linear-gradient(135deg,#263c20,#526c2e)',
    description: 'Grow your tail, grab the pixels, and avoid yourself.',
    kind: 'snake',
    featured: true,
  },
  {
    id: 'pong',
    title: 'Neon Pong',
    category: 'Arcade',
    platform: 'Original',
    year: '2026',
    emoji: '🏓',
    colors: 'linear-gradient(135deg,#162b43,#285b6a)',
    description: 'A clean, fast retro paddle duel against the CPU.',
    kind: 'pong',
    featured: true,
  },
  {
    id: 'breakout',
    title: 'Brick Buster',
    category: 'Arcade',
    platform: 'Original',
    year: '2026',
    emoji: '🧱',
    colors: 'linear-gradient(135deg,#40223a,#8c405d)',
    description: 'Bounce the ball and clear every brick on screen.',
    kind: 'breakout',
    featured: true,
  },
  {
    id: 'invaders',
    title: 'Space Pixels',
    category: 'Shooter',
    platform: 'Original',
    year: '2026',
    emoji: '👾',
    colors: 'linear-gradient(135deg,#171a42,#383c87)',
    description: 'Defend the screen from waves of pixel invaders.',
    kind: 'invaders',
    featured: true,
  },
  {
    id: 'dos',
    title: 'DOS Game Library',
    category: 'Adventure',
    platform: 'DOS',
    year: '1980s–90s',
    emoji: '💾',
    colors: 'linear-gradient(135deg,#26302a,#52665a)',
    description: 'Explore classic DOS titles through a browser-based library.',
    kind: 'external',
    url: 'https://dos.zone/',
    featured: true,
  },
  {
    id: 'itch',
    title: 'Indie Retro Arcade',
    category: 'Arcade',
    platform: 'Browser',
    year: 'Today',
    emoji: '🕹️',
    colors: 'linear-gradient(135deg,#4b2532,#9a4d4d)',
    description: 'Discover indie pixel games that run right in your browser.',
    kind: 'external',
    url: 'https://itch.io/games/html5/tag-retro',
    featured: true,
  },
  {
    id: 'classicreload',
    title: 'Classic Reload',
    category: 'Adventure',
    platform: 'DOS',
    year: '1980s–90s',
    emoji: '📼',
    colors: 'linear-gradient(135deg,#3e3120,#8d7041)',
    description: 'Browse a community collection of classic computer games.',
    kind: 'external',
    url: 'https://classicreload.com/',
    featured: false,
  },
  {
    id: 'internetarchive',
    title: 'Software Library',
    category: 'Adventure',
    platform: 'Archive',
    year: 'Classic',
    emoji: '📚',
    colors: 'linear-gradient(135deg,#1f3440,#386b7c)',
    description: 'Explore historical software and games preserved online.',
    kind: 'external',
    url: 'https://archive.org/details/softwarelibrary_msdos_games',
    featured: false,
  },
  {
    id: 'jsdos',
    title: 'DOS in Browser',
    category: 'Adventure',
    platform: 'DOS',
    year: 'Classic',
    emoji: '⌨️',
    colors: 'linear-gradient(135deg,#202a38,#465f82)',
    description: 'Learn about running DOS games through browser emulation.',
    kind: 'external',
    url: 'https://js-dos.com/',
    featured: false,
  },
  {
    id: 'emulatorjs',
    title: 'Retro Emulator Guide',
    category: 'Handheld',
    platform: 'Emulator',
    year: 'Multi-system',
    emoji: '🎮',
    colors: 'linear-gradient(135deg,#2d253c,#67518c)',
    description: 'Explore browser emulator technology and supported systems.',
    kind: 'external',
    url: 'https://emulatorjs.org/',
    featured: false,
  },
  {
    id: 'gbstudio',
    title: 'Handheld Game Maker',
    category: 'Handheld',
    platform: 'Game Boy-style',
    year: 'Modern',
    emoji: '🟩',
    colors: 'linear-gradient(135deg,#263b2a,#64874c)',
    description: 'Make and play original games inspired by handheld classics.',
    kind: 'external',
    url: 'https://www.gbstudio.dev/',
    featured: false,
  },
  {
    id: 'pico8',
    title: 'Fantasy Console',
    category: 'Platformer',
    platform: 'Fantasy console',
    year: 'Modern retro',
    emoji: '🌈',
    colors: 'linear-gradient(135deg,#322a58,#7165ad)',
    description: 'A tiny fantasy console built around making and sharing pixel games.',
    kind: 'external',
    url: 'https://www.lexaloffle.com/pico-8.php',
    featured: false,
  },
  {
    id: 'neon-fist',
    title: 'Neon Fist: 1v1 Fighter',
    category: 'Fighting',
    platform: 'Open source',
    year: '2026',
    emoji: '🥊',
    colors: 'linear-gradient(135deg,#27144e,#7b2d8f)',
    description: 'MIT-licensed 2D fighting game with CPU battles and local two-player controls.',
    kind: 'embedded',
    url: './games/neon-fist/index.html',
    featured: true,
  },
  {
    id: 'gh-breakout',
    title: 'Neon Breakout',
    category: 'Arcade',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🧱',
    colors: 'linear-gradient(135deg,#3e1d51,#f04d8d)',
    description: 'Open-source brick breaker with levels, power-ups, and score chasing.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/breakout/',
    featured: true,
  },
  {
    id: 'gh-snake',
    title: 'Neon Snake',
    category: 'Arcade',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🐍',
    colors: 'linear-gradient(135deg,#193d3b,#2bd6a3)',
    description: 'Classic snake gameplay from an MIT-licensed browser arcade collection.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/snake/',
    featured: true,
  },
  {
    id: 'gh-pong',
    title: 'Neon Pong Versus',
    category: 'Fighting',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🏓',
    colors: 'linear-gradient(135deg,#142f55,#2878aa)',
    description: 'A quick versus-style paddle duel from the open-source arcade shelf.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/pong/',
    featured: true,
  },
  {
    id: 'gh-stack',
    title: 'Neon Stack',
    category: 'Puzzle',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🟪',
    colors: 'linear-gradient(135deg,#33215a,#8d5be2)',
    description: 'Stack blocks, manage timing, and chase a better score.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/stack/',
    featured: false,
  },
  {
    id: 'gh-astro',
    title: 'Astro Blaster',
    category: 'Shooter',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🚀',
    colors: 'linear-gradient(135deg,#101d4e,#4261b9)',
    description: 'A fast space-shooter entry in an open-source arcade collection.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/astro/',
    featured: true,
  },
  {
    id: 'gh-maze',
    title: 'Neon Maze',
    category: 'Puzzle',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🌀',
    colors: 'linear-gradient(135deg,#19384a,#328ca4)',
    description: 'Navigate a neon maze in this browser-playable arcade game.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/maze/',
    featured: false,
  },
  {
    id: 'gh-pinball',
    title: 'Neon Pinball',
    category: 'Arcade',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🎯',
    colors: 'linear-gradient(135deg,#4c2133,#bd5d61)',
    description: 'Keep the ball alive and build a high score in a retro pinball table.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/pinball/',
    featured: false,
  },
  {
    id: 'gh-runner',
    title: 'Neon Runner',
    category: 'Platformer',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🏃',
    colors: 'linear-gradient(135deg,#3d321a,#bc8e3d)',
    description: 'A quick reflex runner with a retro arcade presentation.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/runner/',
    featured: false,
  },
  {
    id: 'gh-siege',
    title: 'Star Siege',
    category: 'Shooter',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '👾',
    colors: 'linear-gradient(135deg,#18234b,#4358a2)',
    description: 'Space combat from a browser arcade collection, with co-op play.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/siege/',
    featured: true,
  },
  {
    id: 'gh-hop',
    title: 'Neon Hop',
    category: 'Platformer',
    platform: 'Open source',
    year: 'Modern retro',
    emoji: '🦘',
    colors: 'linear-gradient(135deg,#263b2a,#7ca64b)',
    description: 'Jump through a bright, fast-paced platforming challenge.',
    kind: 'embedded',
    url: 'https://tmhsdigital.github.io/GH-Arcade/games/hop/',
    featured: false,
  },
];
const categories = [
  'All games',
  'Arcade',
  'Shooter',
  'Platformer',
  'Adventure',
  'Handheld',
  'Fighting',
  'Puzzle',
];
const platforms = [
  'All platforms',
  'Original',
  'Browser',
  'DOS',
  'Archive',
  'Emulator',
  'Game Boy-style',
  'Fantasy console',
  'Open source',
];
const storageRead = (key: string): string[] => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

function ArcadeCanvas({ game, onClose }: { game: Game; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [round, setRound] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let last = 0;
    let tick = 0;
    let alive = true;
    let currentScore = 0;
    let over = false;
    const W = 640,
      H = 360;
    canvas.width = W;
    canvas.height = H;
    const lime = '#d8ff65',
      white = '#f5f0df',
      muted = '#5a6948';
    let snake = [
      { x: 10, y: 9 },
      { x: 9, y: 9 },
      { x: 8, y: 9 },
    ];
    let dir = { x: 1, y: 0 },
      nextDir = { x: 1, y: 0 };
    let food = { x: 17, y: 9 };
    let ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 };
    let paddle = { x: W / 2 - 45, y: H - 28, w: 90, h: 9 };
    let cpu = { x: W / 2 - 45, y: 20, w: 90, h: 9 };
    let bricks = Array.from({ length: 36 }, (_, i) => ({
      x: 42 + (i % 9) * 62,
      y: 54 + Math.floor(i / 9) * 25,
      w: 48,
      h: 13,
      on: true,
      color: ['#ff8269', '#e5bd64', '#9bc34b', '#7bbad1'][Math.floor(i / 9)],
    }));
    let ship = { x: W / 2, y: H - 36 };
    let bullets: { x: number; y: number }[] = [];
    let enemies = Array.from({ length: 24 }, (_, i) => ({
      x: 80 + (i % 8) * 65,
      y: 50 + Math.floor(i / 8) * 38,
      on: true,
    }));
    let move = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
    };
    let touchX: number | null = null;
    const randFood = () => ({
      x: Math.floor(Math.random() * 30) + 2,
      y: Math.floor(Math.random() * 15) + 2,
    });
    const keyDown = (e: KeyboardEvent) => {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          ' ',
          'w',
          'a',
          's',
          'd',
        ].includes(e.key)
      )
        e.preventDefault();
      if (game.kind === 'snake') {
        if ((e.key === 'ArrowUp' || e.key === 'w') && dir.y !== 1)
          nextDir = { x: 0, y: -1 };
        if ((e.key === 'ArrowDown' || e.key === 's') && dir.y !== -1)
          nextDir = { x: 0, y: 1 };
        if ((e.key === 'ArrowLeft' || e.key === 'a') && dir.x !== 1)
          nextDir = { x: -1, y: 0 };
        if ((e.key === 'ArrowRight' || e.key === 'd') && dir.x !== -1)
          nextDir = { x: 1, y: 0 };
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a') move.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') move.right = true;
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')
          move.fire = true;
      }
      if (e.key === 'Escape') onClose();
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') move.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') move.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')
        move.fire = false;
    };
    const pointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      touchX = x;
    };
    const pointerDown = () => {
      move.fire = true;
    };
    const pointerUp = () => {
      move.fire = false;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointerleave', pointerUp);
    const drawText = (
      text: string,
      x: number,
      y: number,
      size = 14,
      color = white
    ) => {
      ctx.fillStyle = color;
      ctx.font = 'bold ' + size + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, x, y);
    };
    const loop = (time: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (!running || over) {
        ctx.fillStyle = '#080b07';
        ctx.fillRect(0, 0, W, H);
        drawText(over ? 'GAME OVER' : 'PAUSED', W / 2, H / 2, 25, lime);
        drawText('Press restart to play again', W / 2, H / 2 + 28, 12, white);
        return;
      }
      if (time - last < 45) return;
      last = time;
      tick++;
      ctx.fillStyle = '#080b07';
      ctx.fillRect(0, 0, W, H);
      if (game.kind === 'snake') {
        if (tick % 3 === 0) {
          dir = nextDir;
          const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (
            head.x < 0 ||
            head.x >= 32 ||
            head.y < 0 ||
            head.y >= 18 ||
            snake.some(p => p.x === head.x && p.y === head.y)
          ) {
            over = true;
          } else {
            snake = [head, ...snake];
            if (head.x === food.x && head.y === food.y) {
              currentScore += 10;
              setScore(currentScore);
              food = randFood();
            } else snake.pop();
          }
        }
        ctx.strokeStyle = '#26351e';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        ctx.fillStyle = '#ff8269';
        ctx.fillRect(food.x * 20, food.y * 20, 16, 16);
        snake.forEach((p, i) => {
          ctx.fillStyle = i === 0 ? lime : '#7ea844';
          ctx.fillRect(p.x * 20 + 1, p.y * 20 + 1, 17, 17);
        });
      } else if (game.kind === 'pong') {
        if (move.left) paddle.x -= 7;
        if (move.right) paddle.x += 7;
        if (touchX !== null) paddle.x = touchX - paddle.w / 2;
        paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
        cpu.x += (ball.x - (cpu.x + cpu.w / 2)) * 0.055;
        ball.x += ball.vx;
        ball.y += ball.vy;
        if (ball.x < 8 || ball.x > W - 8) ball.vx *= -1;
        if (
          ball.y < cpu.y + cpu.h &&
          ball.x > cpu.x &&
          ball.x < cpu.x + cpu.w
        ) {
          ball.vy = Math.abs(ball.vy);
          currentScore += 1;
          setScore(currentScore);
        }
        if (
          ball.y > paddle.y - 4 &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.w
        ) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.05;
          currentScore += 1;
          setScore(currentScore);
        }
        if (ball.y > H + 10) {
          over = true;
        }
        if (ball.y < -10) {
          ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 };
        }
        ctx.setLineDash([7, 8]);
        ctx.strokeStyle = muted;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = white;
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = '#7bbad1';
        ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
        ctx.fillStyle = lime;
        ctx.fillRect(ball.x - 6, ball.y - 6, 12, 12);
      } else if (game.kind === 'breakout') {
        if (move.left) paddle.x -= 7;
        if (move.right) paddle.x += 7;
        if (touchX !== null) paddle.x = touchX - paddle.w / 2;
        paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
        ball.x += ball.vx;
        ball.y += ball.vy;
        if (ball.x < 7 || ball.x > W - 7) ball.vx *= -1;
        if (ball.y < 7) ball.vy = Math.abs(ball.vy);
        if (
          ball.y > paddle.y - 7 &&
          ball.y < paddle.y + paddle.h &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.w
        ) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.04;
        }
        bricks.forEach(b => {
          if (
            b.on &&
            ball.x > b.x &&
            ball.x < b.x + b.w &&
            ball.y > b.y &&
            ball.y < b.y + b.h
          ) {
            b.on = false;
            ball.vy *= -1;
            currentScore += 5;
            setScore(currentScore);
          }
        });
        if (ball.y > H + 10) over = true;
        bricks.forEach(b => {
          if (b.on) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
          }
        });
        ctx.fillStyle = lime;
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.fillStyle = white;
        ctx.fillRect(ball.x - 5, ball.y - 5, 10, 10);
        if (bricks.every(b => !b.on)) {
          drawText('LEVEL CLEAR!', W / 2, H / 2, 24, lime);
          over = true;
        }
      } else {
        if (move.left) ship.x -= 6;
        if (move.right) ship.x += 6;
        if (touchX !== null) ship.x = touchX;
        ship.x = Math.max(18, Math.min(W - 18, ship.x));
        if (move.fire && tick % 7 === 0)
          bullets.push({ x: ship.x, y: ship.y - 10 });
        bullets = bullets.filter(b => b.y > 0);
        bullets.forEach(b => (b.y -= 8));
        enemies.forEach((e, i) => {
          if (e.on) {
            e.x += Math.sin(tick / 25 + i) * 0.9;
            if (tick % 170 === 0) e.y += 12;
            bullets.forEach(b => {
              if (Math.abs(b.x - e.x) < 13 && Math.abs(b.y - e.y) < 13) {
                e.on = false;
                currentScore += 10;
                setScore(currentScore);
              }
            });
            ctx.fillStyle = ['#d8ff65', '#ff8269', '#7bbad1'][i % 3];
            ctx.fillRect(e.x - 9, e.y - 8, 18, 15);
            ctx.fillRect(e.x - 14, e.y - 3, 5, 6);
            ctx.fillRect(e.x + 9, e.y - 3, 5, 6);
          }
        });
        bullets.forEach(b => {
          ctx.fillStyle = lime;
          ctx.fillRect(b.x - 2, b.y - 6, 4, 9);
        });
        ctx.fillStyle = white;
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y - 12);
        ctx.lineTo(ship.x - 12, ship.y + 10);
        ctx.lineTo(ship.x + 12, ship.y + 10);
        ctx.closePath();
        ctx.fill();
        if (enemies.every(e => !e.on)) {
          drawText('WAVE CLEARED!', W / 2, H / 2, 24, lime);
          over = true;
        }
      }
      drawText('SCORE ' + currentScore, 72, 23, 12, lime);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointerleave', pointerUp);
    };
  }, [game.kind, running, round, onClose]);
  const restart = () => {
    setScore(0);
    setRound(n => n + 1);
    setRunning(true);
  };
  return (
    <div
      className="game-modal"
      role="dialog"
      aria-modal="true"
      aria-label={game.title}
    >
      <div className="modal-head">
        <div>
          <h2>{game.title}</h2>
          <p>Original browser game · Score {score}</p>
        </div>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close game"
        >
          <X size={18} />
        </button>
      </div>
      <div className="game-stage">
        <canvas ref={canvasRef} aria-label={game.title + ' play area'} />
      </div>
      <div className="game-controls">
        <div className="control-hint">
          {game.kind === 'snake'
            ? 'Move with arrow keys or WASD.'
            : game.kind === 'invaders'
              ? 'Move with arrows or A/D; fire with Space.'
              : 'Move with arrows or A/D, or drag/touch the playfield.'}
          <br />
          Escape closes the game.
        </div>
        <div className="mobile-controls">
          <button onClick={() => setRunning(v => !v)}>
            {running ? 'Pause' : 'Resume'}
          </button>
          <button onClick={restart}>
            <RotateCcw size={13} style={{ verticalAlign: 'middle' }} /> Restart
          </button>
        </div>
      </div>
    </div>
  );
}

function RetroArcade() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All games');
  const [platform, setPlatform] = useState('All platforms');
  const [section, setSection] = useState('Discover');
  const [favorites, setFavorites] = useState<string[]>(() =>
    storageRead('retro-arcade-favorites')
  );
  const [recent, setRecent] = useState<string[]>(() =>
    storageRead('retro-arcade-recent')
  );
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem('retro-arcade-favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  useEffect(() => {
    try {
      localStorage.setItem('retro-arcade-recent', JSON.stringify(recent));
    } catch {}
  }, [recent]);
  const openGame = (game: Game) => {
    if (game.kind === 'external') {
      window.open(game.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveGame(game);
    setRecent(old =>
      [game.id, ...old.filter(id => id !== game.id)].slice(0, 8)
    );
  };
  const toggleFavorite = (id: string) =>
    setFavorites(old =>
      old.includes(id) ? old.filter(v => v !== id) : [...old, id]
    );
  const visible = games.filter(
    g =>
      (section === 'Favorites'
        ? favorites.includes(g.id)
        : section === 'Recently played'
          ? recent.includes(g.id)
          : true) &&
      (category === 'All games' || g.category === category) &&
      (platform === 'All platforms' || g.platform === platform) &&
      [g.title, g.category, g.platform, g.description]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const jumpToLibrary = () =>
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="site-shell">
      <header className="topbar">
        <a
          href="#"
          className="brand"
          onClick={() => {
            setSection('Discover');
            setCategory('All games');
            setPlatform('All platforms');
          }}
        >
          <span className="brand-mark">
            <Gamepad2 size={21} />
          </span>{' '}
          retro<span style={{ color: '#d8ff65' }}>arcade</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          {['Discover', 'Favorites', 'Recently played'].map(item => (
            <button
              key={item}
              className={'nav-button ' + (section === item ? 'active' : '')}
              onClick={() => {
                setSection(item);
                jumpToLibrary();
              }}
            >
              {item === 'Favorites' ? (
                <Heart size={14} />
              ) : item === 'Recently played' ? (
                <RotateCcw size={14} />
              ) : (
                <Sparkles size={14} />
              )}{' '}
              {item}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <span className="status-pill">NO ACCOUNT · FREE TO PLAY</span>
          <button
            className="icon-button"
            onClick={() => {
              setCategory('All games');
              setPlatform('All platforms');
              setQuery('');
              setSection('Discover');
            }}
            aria-label="Reset filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">INSERT COIN · START PLAYING</div>
          <h1>
            Old-school games.
            <br />
            <span>One new home.</span>
          </h1>
          <p className="hero-copy">
            A growing corner of the internet for pixel-era fun. Play original
            arcade games right here, discover browser-playable classics, and
            explore retro gaming across generations.
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={jumpToLibrary}>
              <Play size={15} fill="currentColor" /> Browse the library{' '}
              <ArrowRight size={15} />
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setCategory('Arcade');
                setPlatform('All platforms');
                setSection('Discover');
                jumpToLibrary();
              }}
            >
              Try arcade games <ArrowDownRight size={15} />
            </button>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of a retro handheld game console"
        >
          <div className="pixel-console">
            <div className="console-screen">
              <Gamepad2 size={45} />
            </div>
            <div className="console-controls">
              <span className="dpad" />
              <span className="console-buttons">
                <i />
                <i />
              </span>
            </div>
          </div>
          <span className="art-label">8-BIT SPIRIT / 100% NOSTALGIA</span>
        </div>
      </section>
      <div className="stats-row">
        <div className="stat">
          <Gamepad2 size={19} color="#d8ff65" />
          <strong>4</strong>
          <span>original games to play</span>
        </div>
        <div className="stat">
          <Monitor size={19} color="#d8ff65" />
          <strong>8-bit → beyond</strong>
          <span>multiple retro eras</span>
        </div>
        <div className="stat">
          <ShieldCheck size={19} color="#d8ff65" />
          <strong>Zero sign-up</strong>
          <span>favorites saved on this device</span>
        </div>
      </div>
      <section id="library">
        <div className="library-head">
          <div>
            <div className="section-kicker">THE GAME SHELF / 001</div>
            <h2>
              {section === 'Discover' ? 'Find your next classic' : section}
            </h2>
            <p>Pick a game, jump in, and keep the high score chase going.</p>
          </div>
          <label className="search-wrap">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search titles, genres, platforms…"
              aria-label="Search games"
            />
          </label>
        </div>
        <div className="filters" aria-label="Game categories">
          {categories.map(c => (
            <button
              key={c}
              className={'filter-button ' + (category === c ? 'selected' : '')}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="filters" aria-label="Game platforms">
          <select
            aria-label="Filter by platform"
            className="filter-button"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
          >
            {platforms.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span style={{ color: '#7d8572', fontSize: 12, alignSelf: 'center' }}>
            {visible.length} {visible.length === 1 ? 'game' : 'games'} found
          </span>
        </div>
        <div className="game-grid">
          {visible.length ? (
            visible.map(game => (
              <article className="game-card" key={game.id}>
                <div className="game-cover" style={{ background: game.colors }}>
                  <span className="cover-tag">
                    {game.kind === 'external' ? 'EXPLORE' : game.kind === 'embedded' ? 'OPEN IN ARCADE' : 'PLAY NOW'}
                  </span>
                  <span className="cover-emoji" aria-hidden="true">
                    {game.emoji}
                  </span>
                  <button
                    className={
                      'favorite-button ' +
                      (favorites.includes(game.id) ? 'is-favorite' : '')
                    }
                    onClick={() => toggleFavorite(game.id)}
                    aria-label={
                      (favorites.includes(game.id) ? 'Remove from' : 'Add to') +
                      ' favorites: ' +
                      game.title
                    }
                  >
                    <Heart
                      size={15}
                      fill={
                        favorites.includes(game.id) ? 'currentColor' : 'none'
                      }
                    />
                  </button>
                </div>
                <div className="game-card-body">
                  <div className="game-title-row">
                    <h3 className="game-title">{game.title}</h3>
                    <span className="game-year">{game.year}</span>
                  </div>
                  <p className="game-description">{game.description}</p>
                  <div className="game-card-footer">
                    <span className="platform-label">
                      {game.platform.toUpperCase()}
                    </span>
                    <button
                      className="play-link"
                      onClick={() => openGame(game)}
                    >
                      {game.kind === 'external' ? 'Explore' : game.kind === 'embedded' ? 'Play in site' : 'Play game'}{' '}
                      {game.kind === 'external' ? (
                        <ExternalLink size={13} />
                      ) : (
                        <Play size={13} fill="currentColor" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <Search size={24} style={{ marginBottom: 10 }} />
              <div>No games match those filters.</div>
              <button
                className="play-link"
                style={{ margin: '12px auto 0' }}
                onClick={() => {
                  setQuery('');
                  setCategory('All games');
                  setPlatform('All platforms');
                  setSection('Discover');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="section-kicker">PICK YOUR ERA / 002</div>
            <h2>Explore by collection</h2>
            <p>Find your kind of nostalgia.</p>
          </div>
        </div>
        <div className="collections-grid">
          <button
            className="collection-card"
            onClick={() => {
              setCategory('Arcade');
              setPlatform('All platforms');
              setSection('Discover');
              jumpToLibrary();
            }}
          >
            <div
              className="collection-icon"
              style={{ background: '#303c20', color: '#d8ff65' }}
            >
              <Joystick size={24} />
            </div>
            <div>
              <strong>Arcade cabinet</strong>
              <span>Quick rounds, high scores, instant fun.</span>
            </div>
          </button>
          <button
            className="collection-card"
            onClick={() => {
              setCategory('Handheld');
              setPlatform('All platforms');
              setSection('Discover');
              jumpToLibrary();
            }}
          >
            <div
              className="collection-icon"
              style={{ background: '#20363a', color: '#7bbad1' }}
            >
              <Smartphone size={24} />
            </div>
            <div>
              <strong>Handheld era</strong>
              <span>Portable gaming and pocket-sized worlds.</span>
            </div>
          </button>
          <button
            className="collection-card"
            onClick={() => {
              setCategory('Adventure');
              setPlatform('All platforms');
              setSection('Discover');
              jumpToLibrary();
            }}
          >
            <div
              className="collection-icon"
              style={{ background: '#382c20', color: '#e5bd64' }}
            >
              <Star size={24} />
            </div>
            <div>
              <strong>Classic computer</strong>
              <span>DOS libraries and software preservation.</span>
            </div>
          </button>
        </div>
      </section>
      <section className="info-banner">
        <div>
          <h3>Bring your own legally obtained game files</h3>
          <p>
            Classic console ROMs and BIOS files are not bundled here. Emulator
            tools can support many systems, but game files remain subject to
            their own rights and licenses. Explore emulator documentation to
            learn more.
          </p>
        </div>
        <a href="https://emulatorjs.org/" target="_blank" rel="noreferrer">
          Explore emulator tools{' '}
          <ExternalLink size={13} style={{ verticalAlign: 'middle' }} />
        </a>
      </section>
      <footer className="footer">
        <span>© 2026 Retro Arcade · Made for the love of play.</span>
        <span>
          <Keyboard
            size={12}
            style={{ verticalAlign: 'middle', marginRight: 5 }}
          />{' '}
          Keyboard + touch friendly · No account needed
        </span>
        <a
          href="https://github.com/kage049754/chatgptgame"
          target="_blank"
          rel="noreferrer"
        >
          Open-source project{' '}
          <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
        </a>
      </footer>
      {activeGame && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setActiveGame(null);
          }}
        >
          {activeGame.kind === 'embedded' ? (
            <div className="game-modal embedded-modal" role="dialog" aria-modal="true" aria-label={activeGame.title}>
              <div className="modal-head">
                <div><h2>{activeGame.title}</h2><p>Open-source browser game · No account required</p></div>
                <button className="close-button" onClick={() => setActiveGame(null)} aria-label="Close game"><X size={18} /></button>
              </div>
              <iframe className="embedded-game-frame" src={activeGame.url} title={activeGame.title} allow="autoplay; fullscreen; gamepad" allowFullScreen />
              <div className="game-controls"><div className="control-hint">If a game does not load inside the frame, open its source-hosted version in a new tab.</div><a className="play-link" href={activeGame.url} target="_blank" rel="noreferrer">Open separately <ExternalLink size={13} /></a></div>
            </div>
          ) : (
            <ArcadeCanvas game={activeGame} onClose={() => setActiveGame(null)} />
          )}
        </div>
      )}
    </div>
  );
}
function App() {
  return <RetroArcade />;
}
export default App;
