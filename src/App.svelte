<script>
  import { onMount, onDestroy } from 'svelte';
  import { Game } from './game/engine.js';

  let canvas;
  let game;
  let gameState = 'menu';
  let score = 0;
  let lives = 3;
  let level = 1;
  let highScore = 0;
  let powerupFlash = '';

  onMount(() => {
    game = new Game(canvas, {
      onScore: (s) => score = s,
      onLives: (l) => lives = l,
      onLevel: (l) => level = l,
      onGameOver: (s) => {
        gameState = 'gameover';
        highScore = Math.max(highScore, s);
      },
      onPowerup: (type) => {
        const names = { weapon: '⚡ Waffen-Upgrade!', shield: '🛡️ Schild!', life: '❤️ +1 Leben!' };
        powerupFlash = names[type] || '';
        setTimeout(() => powerupFlash = '', 1500);
      }
    });
    game.run();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
  });

  function handleResize() {
    if (game) game.resize();
  }

  function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    game.start();
  }

  function preventScroll(e) {
    e.preventDefault();
  }
</script>

<svelte:window on:touchmove={preventScroll} />

<main class="game-container">
  <canvas bind:this={canvas}></canvas>

  {#if gameState !== 'playing'}
    <div class="overlay">
      {#if gameState === 'menu'}
        <div class="menu">
          <h1>🚀 SKY BLASTY</h1>
          <p class="subtitle">Top-Down Arcade Shooter</p>
          <button on:click={startGame}>SPIELEN</button>
          <div class="instructions">
            <p>👆 Finger bewegen = Fliegen</p>
            <p>🔥 Auto-Fire ist aktiv</p>
            <p>⭐ Sammle Power-ups ein!</p>
          </div>
          {#if highScore > 0}
            <p class="highscore">🏆 High Score: {highScore}</p>
          {/if}
        </div>
      {:else if gameState === 'gameover'}
        <div class="menu">
          <h1>💥 GAME OVER</h1>
          <p class="final-score">Score: {score}</p>
          {#if score >= highScore && score > 0}
            <p class="new-record">🏆 Neuer Rekord!</p>
          {/if}
          <button on:click={startGame}>NOCHMAL</button>
        </div>
      {/if}
    </div>
  {/if}

  {#if gameState === 'playing'}
    <div class="hud">
      <div class="hud-left">
        <span class="hud-score">⭐ {score}</span>
        <span class="hud-level">Lvl {level}</span>
      </div>
      <div class="hud-right">
        {#each Array(lives) as _, i}
          <span class="heart">❤️</span>
        {/each}
      </div>
    </div>

    {#if powerupFlash}
      <div class="powerup-flash">{powerupFlash}</div>
    {/if}
  {/if}
</main>

<style>
  .game-container {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  canvas {
    display: block;
    touch-action: none;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5, 5, 20, 0.85);
    z-index: 10;
  }

  .menu {
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: clamp(2rem, 8vw, 4rem);
    color: #4af;
    text-shadow: 0 0 20px rgba(68, 170, 255, 0.6);
    margin: 0 0 0.5rem 0;
    letter-spacing: 2px;
  }

  .subtitle {
    color: #8af;
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  button {
    font-family: 'Courier New', monospace;
    font-size: 1.4rem;
    font-weight: bold;
    padding: 1rem 3rem;
    background: linear-gradient(135deg, #4af, #28d);
    color: #fff;
    border: 2px solid #6cf;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 0 0 30px rgba(68, 170, 255, 0.4);
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  button:active {
    transform: scale(0.95);
    box-shadow: 0 0 15px rgba(68, 170, 255, 0.6);
  }

  .instructions {
    margin-top: 2rem;
    color: #88a;
    font-size: 0.95rem;
    line-height: 1.8;
  }

  .highscore {
    margin-top: 1.5rem;
    color: #fc0;
    font-size: 1.2rem;
  }

  .final-score {
    font-size: 2rem;
    color: #4af;
    margin: 1rem 0;
  }

  .new-record {
    color: #fc0;
    font-size: 1.3rem;
    animation: pulse 0.8s infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }

  .hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1.2rem;
    z-index: 5;
    pointer-events: none;
    box-sizing: border-box;
  }

  .hud-left, .hud-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hud-score {
    color: #ff0;
    font-size: 1.3rem;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(255, 255, 0, 0.5);
  }

  .hud-level {
    color: #8af;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
  }

  .heart {
    font-size: 1.2rem;
    filter: drop-shadow(0 0 4px rgba(255, 50, 50, 0.5));
  }

  .powerup-flash {
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-size: 1.5rem;
    font-weight: bold;
    text-shadow: 0 0 15px currentColor;
    z-index: 6;
    pointer-events: none;
    animation: flashIn 1.5s ease-out forwards;
  }

  @keyframes flashIn {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.5); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.2); }
    40% { transform: translateX(-50%) translateY(0) scale(1); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(1); }
  }
</style>
