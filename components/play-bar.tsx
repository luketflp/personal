import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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

const Bar = ({ delay }: { delay: number }) => (
  <motion.span
    className="w-[3px] bg-green-500 rounded-sm"
    style={{ height: "8px" }}
    animate={{
      scaleY: [1, 2, 1],
    }}
    transition={{
      repeat: Infinity,
      duration: 0.6,
      delay,
      ease: "easeInOut",
    }}
  />
);

export default function PlayBar() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  const playerRef = useRef<ReactPlayer | null>(null);
  const dragControls = useDragControls();
  const playbarRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

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
      // Visual feedback
      const playbar = playbarRef.current;
      if (playbar) {
        playbar.style.transform = `translateX(${deltaX > 0 ? 10 : -10}px)`;
        setTimeout(() => {
          playbar.style.transform = '';
        }, 200);
      }
      
      if (deltaX > 0) {
        prevTrack();
      } else {
        nextTrack();
      }
    }
  };

  const { title, artist, url, thumbnail } = tracks[currentTrack];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[9999]">
          <motion.div
            ref={playbarRef}
            className="fixed bottom-4 flex z-[9999] pointer-events-auto touch-pan-y"
            style={{ left: '50%', translateX: '-50%' }}
            drag={!isVolumeHovered} // Only allow dragging when not hovering volume
            dragConstraints={{ left: dragConstraints.left, right: dragConstraints.right }}
            dragControls={dragControls}
            dragElastic={0.1}
            dragMomentum={false}
            dragListener={!isVolumeHovered} // Only listen for drag when not on volume
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileTap={{ cursor: isVolumeHovered ? 'default' : 'grabbing' }}
            onPointerDown={(e) => {
              // Check if the target is the volume control or its children
              const isVolumeControl = volumeRef.current?.contains(e.target as Node);
              if (!isVolumeControl && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement)) {
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
            <div className="relative w-[360px] sm:w-[480px] bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-70 backdrop-blur-md rounded-2xl text-black dark:text-white px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between shadow-2xl">
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

              {/* Track Info - Fixed width container */}
              <div className="w-full sm:w-[180px] flex items-center gap-3 mb-2 sm:mb-0 overflow-hidden">
                <div className="relative flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt="Album cover"
                    className="w-12 h-12 rounded-lg object-cover shadow-md"
                  />
                  {/* {isPlaying && (
                    <div className="absolute -right-4 bottom-0 flex items-end gap-[2px] h-5">
                      <Bar delay={0} />
                      <Bar delay={0.2} />
                      <Bar delay={0.4} />
                    </div>
                  )} */}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                    {title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{artist}</p>
                </div>
              </div>

              {/* Desktop Controls - Fixed width */}
              <div className="hidden sm:flex flex-col items-center gap-2 w-[200px]">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevTrack(); }} 
                    className="p-3 hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Previous track"
                  >
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                    className="p-3 bg-green-500 text-white rounded-full hover:scale-105 active:scale-95 transition-transform"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextTrack(); }} 
                    className="p-3 hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Next track"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>
                <div className="w-full flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem]">{formatTime(progress.playedSeconds)}</span>
                  <div className="flex-1 bg-gray-300 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-green-500 h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.played * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem]">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Mobile Controls - Full width but fixed height */}
              <div className="w-full sm:hidden flex items-center justify-between mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevTrack(); }} 
                  className="p-3 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Previous track"
                >
                  <SkipBack size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                  className="p-3 bg-green-500 text-white rounded-full hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextTrack(); }} 
                  className="p-3 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Next track"
                >
                  <SkipForward size={20} />
                </button>
              </div>
              <div className="w-full sm:hidden mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem]">{formatTime(progress.playedSeconds)}</span>
                <div className="flex-1 bg-gray-300 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-green-500 h-full rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.played * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2.5rem]">{formatTime(duration)}</span>
              </div>

              {/* Volume Control - Desktop only */}
              <div 
                ref={volumeRef}
                className="hidden sm:flex items-center gap-2 w-[80px]"
                onMouseEnter={() => setIsVolumeHovered(true)}
                onMouseLeave={() => setIsVolumeHovered(false)}
              >
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
      )}
    </AnimatePresence>
  );
}