import { AnimatePresence, motion } from 'motion/react';
import { Disc3, Pause, Play, Radio, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const TRACKS = [
  {
    id: 1,
    title: "Neon Protocol (Demo)",
    artist: "CyberAI",
    url: "https://actions.google.com/sounds/v1/science_fiction/sweep_and_bleep.ogg",
    coverColor: "from-cyan-500 to-blue-500",
  },
  {
    id: 2,
    title: "Sector 7 Groove (Demo)",
    artist: "Neural Network",
    url: "https://actions.google.com/sounds/v1/science_fiction/sci_fi_beef.ogg",
    coverColor: "from-fuchsia-500 to-pink-500",
  },
  {
    id: 3,
    title: "Digital Horizon (Demo)",
    artist: "Logic Core",
    url: "https://actions.google.com/sounds/v1/science_fiction/humming_and_rattling_spaceship.ogg",
    coverColor: "from-lime-400 to-emerald-500",
  },
];

const GRID_SIZE = 20;
const TICK_RATE = 150;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_FOOD = { x: 5, y: 5 };

const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-[3px] h-[40px] justify-center opacity-80">
    {[30, 60, 90, 40, 75, 55, 85, 25].map((h, i) => (
      <motion.div
        key={i}
        animate={isPlaying ? { height: ["20%", "100%", "30%", "80%", "50%"] } : { height: `${h}%` }}
        transition={{
          repeat: Infinity,
          duration: 0.5 + Math.random() * 0.5,
          ease: "easeInOut",
          delay: i * 0.1,
        }}
        className="w-[4px] bg-[#00f3ff] rounded-t-[2px] shadow-[0_0_8px_#00f3ff]"
      />
    ))}
  </div>
);

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Autoplay likely blocked:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const changeTrack = (dir: 1 | -1) => {
    let nextTrack = currentTrackIndex + dir;
    if (nextTrack < 0) nextTrack = TRACKS.length - 1;
    if (nextTrack >= TRACKS.length) nextTrack = 0;
    setCurrentTrackIndex(nextTrack);
  };

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Snake Game State ---
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [, setTick] = useState(0); // Force re-renders

  const snakeRef = useRef([...INITIAL_SNAKE]);
  const currDirRef = useRef({ ...INITIAL_DIRECTION });
  const nextDirRef = useRef({ ...INITIAL_DIRECTION });
  const foodRef = useRef({ ...INITIAL_FOOD });

  const resetGame = () => {
    if (score > highScore) setHighScore(score);
    snakeRef.current = [{ ...INITIAL_SNAKE[0] }, { ...INITIAL_SNAKE[1] }, { ...INITIAL_SNAKE[2] }];
    currDirRef.current = { ...INITIAL_DIRECTION };
    nextDirRef.current = { ...INITIAL_DIRECTION };
    
    // Create new random food position on reset
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    foodRef.current = newFood;
    
    setScore(0);
    setIsGameOver(false);
    setIsGamePaused(false);
    setGameStarted(true);
    setTick(t => t + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using arrow keys or space
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted && e.key === ' ') {
        resetGame();
        return;
      }

      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        if (currDirRef.current.y !== 1) nextDirRef.current = { x: 0, y: -1 };
      }
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        if (currDirRef.current.y !== -1) nextDirRef.current = { x: 0, y: 1 };
      }
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (currDirRef.current.x !== 1) nextDirRef.current = { x: -1, y: 0 };
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (currDirRef.current.x !== -1) nextDirRef.current = { x: 1, y: 0 };
      }
      if (e.key === ' ' && gameStarted && !isGameOver) {
        setIsGamePaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isGameOver]);

  useEffect(() => {
    if (!gameStarted || isGameOver || isGamePaused) return;

    const interval = setInterval(() => {
      const head = snakeRef.current[0];
      const nextDir = nextDirRef.current;
      const newHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

      currDirRef.current = { ...nextDir };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return;
      }

      // Self collision
      if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];

      // Food collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore(s => s + 10);
        let validFood = false;
        let newF = { x: 0, y: 0 };
        // prevent food from spawning on snake
        while (!validFood) {
          newF = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
          if (!newSnake.some(s => s.x === newF.x && s.y === newF.y)) {
            validFood = true;
          }
        }
        foodRef.current = newF;
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      snakeRef.current = newSnake;
      setTick(t => t + 1);
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [gameStarted, isGameOver, isGamePaused, score, highScore]);

  return (
    <div className="shake-container min-h-screen bg-[#050505] font-pixel text-[#ffffff] flex items-center justify-center p-4 lg:p-0 overflow-hidden box-border uppercase tracking-widest relative">
      <div className="scanlines" />
      <div className="bg-noise" />
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={() => changeTrack(1)}
        preload="auto"
        loop={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-4 gap-[20px] w-full max-w-[960px] lg:h-[700px]">
        
        {/* Card: Player */}
        <div className="bg-[#121212] border border-[#222222] rounded-[20px] p-[20px] flex flex-col relative overflow-hidden lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-2">
           <div className="text-[14px] uppercase tracking-[2px] text-[#888888] mb-2">NOW PLAYING</div>
           <div className="w-full aspect-square bg-[#1a1a1a] rounded-[12px] mb-[15px] flex items-center justify-center text-[#00f3ff] relative overflow-hidden group">
             <div className={`absolute inset-0 bg-gradient-to-br ${currentTrack.coverColor} opacity-20`} />
             <Disc3 className={`w-20 h-20 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
           </div>
           <div className="glitch text-[24px] font-bold mb-[4px] text-[#00f3ff] truncate" data-text={currentTrack.title}>{currentTrack.title}</div>
           <div className="text-[18px] text-[#888888] truncate mb-2">{currentTrack.artist}</div>
           <div className="h-[4px] w-full bg-[#333] rounded-[2px] mt-auto mb-[15px] relative">
             <div className="h-full w-[45%] bg-[#00f3ff] rounded-[2px] shadow-[0_0_8px_#00f3ff]" />
           </div>
           <div className="flex justify-between text-[14px] text-[#888888]">
             <span>0:00</span>
             <span>LIVE</span>
           </div>
        </div>

        {/* Card: Game */}
        <div className="bg-[#000] glitch-border border-2 rounded-[20px] p-[20px] flex items-center justify-center relative overflow-hidden lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-3">
           <div className="glitch text-[16px] uppercase tracking-[2px] text-[#888888] absolute top-[20px] left-[20px] z-30" data-text="NEURAL SNAKE V1.0.4">NEURAL SNAKE V1.0.4</div>
           
           <div className="relative w-full aspect-square max-w-[400px] border border-[#1a1a1a] mx-auto bg-transparent z-10 overflow-hidden">
             {/* Grid Style Map */}
             <div className="absolute inset-0 bg-[linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] bg-[size:5%_5%]" />
             
             {/* Snake Rendering */}
              {gameStarted && snakeRef.current.map((segment, i) => (
                <div
                  key={`${segment.x}-${segment.y}-${i}`}
                  className="absolute w-[5%] h-[5%] bg-[#39ff14] shadow-[0_0_10px_#39ff14] rounded-[4px] z-10"
                  style={{ left: `${segment.x * 5}%`, top: `${segment.y * 5}%` }}
                />
              ))}
              
              {/* Food Rendering */}
              {gameStarted && (
                <div
                  className="absolute w-[5%] h-[5%] bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] rounded-full z-10"
                  style={{ left: `${foodRef.current.x * 5}%`, top: `${foodRef.current.y * 5}%` }}
                />
              )}

              {/* Start Screen Layer */}
              {!gameStarted && (
                <div className="absolute inset-0 bg-[#000]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                   <h2 className="glitch text-4xl font-bold text-[#00f3ff] mb-6 uppercase tracking-[0.2em] text-center" data-text="NEURAL LINK STANDBY">NEURAL LINK<br/>STANDBY</h2>
                   <button 
                     onClick={resetGame} 
                     className="px-8 py-3 bg-[#ff00ff] text-black font-bold uppercase tracking-[2px] rounded-none shadow-[4px_4px_0px_#00f3ff] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_#00f3ff] transition-all"
                   >
                      INITIALIZE
                   </button>
                   <p className="mt-4 text-[16px] text-[#888888] uppercase tracking-[2px] animate-pulse">PRESS SPACE TO START</p>
                </div>
              )}

              {/* Game Over Layer */}
              {isGameOver && (
                <div className="absolute inset-0 bg-[#000]/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                   <h2 className="glitch text-4xl font-bold text-[#ff00ff] mb-2 uppercase tracking-[4px]" data-text="CRITICAL FAILURE">CRITICAL FAILURE</h2>
                   <p className="text-[#00f3ff] text-[16px] tracking-[3px] uppercase mb-6 animate-pulse">CONNECTION LOST</p>
                   <button 
                     onClick={resetGame} 
                     className="px-8 py-3 bg-transparent border-2 border-[#00f3ff] text-[#00f3ff] shadow-[4px_4px_0_#ff00ff] font-bold uppercase tracking-[2px] rounded-none hover:bg-[#00f3ff] hover:text-[#000] hover:shadow-[0_0_0_#ff00ff] hover:translate-x-1 hover:translate-y-1 transition-all"
                   >
                      REBOOT SEQUENCE
                   </button>
                </div>
              )}
              
              {/* Pause Layer */}
              <AnimatePresence>
                {isGamePaused && !isGameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#000]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                  >
                    <h2 className="glitch text-4xl font-bold text-[#00f3ff] mb-6 uppercase tracking-[4px]" data-text="SYSTEM PAUSED">SYSTEM PAUSED</h2>
                    <button 
                      onClick={() => setIsGamePaused(false)} 
                      className="px-8 py-3 bg-[#ff00ff] text-black font-bold uppercase tracking-[2px] rounded-none shadow-[4px_4px_0px_#00f3ff] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0_0_0_#00f3ff] transition-all"
                    >
                      RESUME CODE
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Card: Score */}
        <div className="bg-[#121212] border border-[#39ff14] rounded-[20px] p-[20px] flex flex-col relative overflow-hidden lg:col-start-4 lg:col-span-1 lg:row-start-1 lg:row-span-1">
           <div className="glitch text-[16px] uppercase tracking-[2px] text-[#888888] mb-2" data-text="CURRENT SCORE">CURRENT SCORE</div>
           <div className="font-pixel text-7xl tracking-widest text-center text-[#39ff14] drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] flex-1 flex items-center justify-center">
             {String(score).padStart(4, '0')}
           </div>
        </div>

        {/* Card: Stats */}
        <div className="bg-[#121212] border border-[#222222] rounded-[20px] p-[20px] flex flex-col relative overflow-hidden lg:col-start-4 lg:col-span-1 lg:row-start-2 lg:row-span-2">
           <div className="glitch text-[16px] uppercase tracking-[2px] text-[#888888] mb-4" data-text="PERFORMANCE METRICS">PERFORMANCE METRICS</div>
           <div className="flex justify-between mb-[15px] text-lg">
             <span>SPEED</span>
             <span className="font-pixel text-2xl text-[#39ff14]">1.2X</span>
           </div>
           <div className="flex justify-between mb-[15px] text-lg">
             <span>COMBO</span>
             <span className="font-pixel text-2xl text-[#39ff14]">X4</span>
           </div>
           <div className="flex justify-between mb-[15px] text-lg">
             <span>APPLES</span>
             <span className="font-pixel text-2xl text-[#39ff14]">{Math.floor(score / 10)}</span>
           </div>
           <div className="flex justify-between mb-[15px] text-lg">
             <span>HIGH</span>
             <span className="font-pixel text-2xl text-[#39ff14]">{String(highScore).padStart(4, '0')}</span>
           </div>
           <div className="mt-auto bg-[#00f3ff]/10 border border-[#00f3ff] p-[10px] rounded-none text-[14px] leading-[1.4] text-white">
             <span className="text-[#ff00ff] font-bold">SYSTEM ALERT:</span> NEURAL LINK SYNCHRONIZED. VELOCITY NOMINAL.
           </div>
        </div>

        {/* Card: Playlist */}
        <div className="bg-[#121212] border border-[#222222] rounded-[20px] p-[20px] flex flex-col relative overflow-hidden lg:col-start-1 lg:col-span-1 lg:row-start-3 lg:row-span-2">
           <div className="text-[14px] uppercase tracking-[2px] text-[#888888] mb-2">UP NEXT</div>
           <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
             {TRACKS.map((track, i) => (
                <div 
                  key={track.id} 
                  onClick={() => setCurrentTrackIndex(i)} 
                  className={`flex items-center py-[12px] border-b border-[#222222] last:border-0 cursor-pointer transition-colors ${currentTrackIndex === i ? 'text-[#ff00ff] glitch' : 'text-white hover:text-[#00f3ff]'}`}
                  data-text={currentTrackIndex === i ? `0${i + 1}. ${track.title}` : undefined}
                >
                   <div className="flex-1 truncate pr-2">
                      <div className="text-[18px]">{(i + 1).toString().padStart(2, '0')}. {track.title}</div>
                   </div>
                   <div className="text-[14px] text-[#888888]">{currentTrackIndex === i ? 'PLAYING' : 'READY'}</div>
                </div>
             ))}
           </div>
        </div>

        {/* Card: Controls */}
        <div className="bg-[#121212] border border-[#222222] rounded-[20px] p-[20px] flex flex-row items-center justify-between relative overflow-hidden lg:col-start-2 lg:col-span-3 lg:row-start-4 lg:row-span-1">
           <div className="flex items-center gap-[20px]">
              <button onClick={() => changeTrack(-1)} className="w-[45px] h-[45px] rounded-none border-2 border-[#222222] flex items-center justify-center text-white hover:border-[#00f3ff] hover:text-[#00f3ff] hover:shadow-[2px_2px_0_#00f3ff] hover:-translate-y-1 transition-all">
                <SkipBack size={24}/>
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="w-[70px] h-[70px] rounded-none bg-[#ff00ff] border-none text-black shadow-[4px_4px_0_#00f3ff] flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-[0_0_0_#00f3ff] transition-all"
              >
                {isPlaying ? <Pause className="fill-current w-8 h-8" /> : <Play className="fill-current w-8 h-8 ml-1" />}
              </button>
              <button onClick={() => changeTrack(1)} className="w-[45px] h-[45px] rounded-none border-2 border-[#222222] flex items-center justify-center text-white hover:border-[#00f3ff] hover:text-[#00f3ff] hover:shadow-[2px_2px_0_#00f3ff] hover:-translate-y-1 transition-all">
                <SkipForward size={24}/>
              </button>
           </div>
           
           <Visualizer isPlaying={isPlaying} />

           <div className="text-right flex flex-col justify-center">
              <div className="text-[14px] uppercase tracking-[2px] text-[#888888] m-0">AUDIO STREAM</div>
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="glitch text-[20px] font-bold text-[#39ff14] bg-transparent border-none p-0 cursor-pointer transition-all"
                data-text={isMuted ? 'MUTED' : 'HQ LOSSLESS'}
              >
                {isMuted ? 'MUTED' : 'HQ LOSSLESS'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
