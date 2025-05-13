import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react";

interface Track {
  title: string;
  artist: string;
  url: string;
  thumbnail: string;
}

const tracks: Track[] = [
  {
    title: "Tudo no Olhar/ Sem me Controlar/ Perdoa Amor",
    artist: "Marcos & Belutti",
    url: "https://www.youtube.com/watch?v=KTcZq6HbGpg",
    thumbnail: "https://i.ytimg.com/vi/KTcZq6HbGpg/hq720.jpg",
  },
  {
    title: "Um Sonhador / Não Aprendi a Dizer Adeus / Rumo a Goiânia",
    artist: "Leonardo",
    url: "https://www.youtube.com/watch?v=apT5ix3D-G0",
    thumbnail: "https://i.ytimg.com/vi/apT5ix3D-G0/hq720.jpg",
  },
  {
    title: "Aonde Quer Que Eu Vá",
    artist: "Os Paralamas do Sucesso",
    url: "https://www.youtube.com/watch?v=dIuK5nOZb2o",
    thumbnail: "https://i.ytimg.com/vi/dIuK5nOZb2o/hq720.jpg",
  },
  {
    title: "Sem Radar",
    artist: "Marcos & Belutti",
    url: "https://www.youtube.com/watch?v=8bgiaNT1Jnw",
    thumbnail: "https://i.ytimg.com/vi/8bgiaNT1Jnw/hq720.jpg",
  },
];

export default function PlayBar() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  
  const playerRef = useRef<ReactPlayer | null>(null);
  const dragControls = useDragControls();
  const playbarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateConstraints = () => {
      if (playbarRef.current) {
        const playbarWidth = playbarRef.current.offsetWidth;
        const viewportWidth = window.innerWidth;
        const left = -viewportWidth / 2 + playbarWidth / 2;
        const right = viewportWidth / 2 - playbarWidth / 2;
        setDragConstraints({ left, right });
      }
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    setIsPlaying(true);
  }, []);

  const handleProgress = useCallback((state: { played: number; playedSeconds: number; loadedSeconds: number }) => {
    setProgress(state);
  }, []);

  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  const handleSwipeStart = (e: React.TouchEvent) => {
    if (!isDragging) {
      setSwipeStartX(e.touches[0].clientX);
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (isDragging) return;
    
    const deltaX = e.changedTouches[0].clientX - swipeStartX;
    const swipeThreshold = 50;

    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        prevTrack();
      } else {
        nextTrack();
      }
    }
  };

  const { title, artist, url, thumbnail } = tracks[currentTrack];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[9999]">
      <motion.div
        ref={playbarRef}
        className="fixed bottom-4 flex z-[9999] pointer-events-auto touch-pan-y"
        style={{
          left: '50%',
          translateX: '-50%'
        }}
        drag
        dragConstraints={{ left: dragConstraints.left, right: dragConstraints.right }}
        dragControls={dragControls}
        dragElastic={0.1}
        dragMomentum={false}
        dragListener={true}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ cursor: 'grab' }}
        whileTap={{ cursor: 'grabbing' }}
        onPointerDown={(e) => {
          if (!(e.target instanceof HTMLButtonElement) && 
              !(e.target instanceof HTMLInputElement)) {
            e.stopPropagation();
            dragControls.start(e);
          }
        }}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        <div className="absolute -top-6 z-50 left-0 rounded-b-none rounded-t-xl bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-70 backdrop-blur-md text-black dark:text-white text-sm font-semibold px-4 py-1">
            Minha playlist 😛
        </div>
        <div 
          className="relative w-[95vw] sm:w-full max-w-4xl bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-70 backdrop-blur-md rounded-2xl sm:rounded-t-none sm:rounded-bl-2xl sm:rounded-br-2xl text-black dark:text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between shadow-2xl transition-all cursor-grab active:cursor-grabbing"
        >
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full p-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Close player"
          >
            <X size={16} />
          </button>

          <div className="hidden">
            <ReactPlayer
                ref={playerRef}
                url={url}
                playing={isPlaying}
                volume={volume}
                onProgress={handleProgress}
                onDuration={handleDuration}
            />
          </div>

          <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-start gap-4 mb-2 sm:mb-0">
            <img
              src={thumbnail}
              alt="Album cover"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-md"
            />
            <div className="overflow-hidden flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                {title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{artist}</p>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }} 
              className="sm:hidden hover:scale-110 transition-transform p-2"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>

          <div className="hidden sm:flex flex-col items-center gap-1 w-1/3">
            <div className="flex items-center gap-5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  prevTrack();
                }}
                className="p-2 hover:scale-105 transition-transform"
                aria-label="Previous track"
              >
                <SkipBack size={20} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="p-2 hover:scale-110 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  nextTrack();
                }}
                className="p-2 hover:scale-105 transition-transform"
                aria-label="Next track"
              >
                <SkipForward size={20} />
              </button>
            </div>
            {isHovered && (
              <div className="w-full flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatTime(progress.playedSeconds)}
                </span>
                <div className="w-full bg-gray-300 dark:bg-gray-700 h-1 rounded overflow-hidden">
                  <div
                    className="bg-green-500 h-1"
                    style={{ width: `${progress.played * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatTime(duration)}
                </span>
              </div>
            )}
          </div>

          <div className="w-full sm:hidden flex items-center justify-between mt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                prevTrack();
              }}
              className="p-2 hover:scale-105 transition-transform"
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>
            
            <div className="flex-1 mx-2 flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-right">
                {formatTime(progress.playedSeconds)}
              </span>
              <div className="flex-1 bg-gray-300 dark:bg-gray-700 h-1 rounded overflow-hidden">
                <div
                  className="bg-green-500 h-1"
                  style={{ width: `${progress.played * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem]">
                {formatTime(duration)}
              </span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="p-2 hover:scale-105 transition-transform"
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 w-24">
            <Volume2 size={20} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-green-500"
              aria-label="Volume control"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}