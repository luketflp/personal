import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { tracks } from "@/utils/constants/playlist";

export default function PlayBar() {
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const playerRef = useRef<ReactPlayer | null>(null);
  const dragControls = useDragControls();
  const playbarRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

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

  const handlePlay = useCallback(() => {
    setAutoplayBlocked(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Player error:', error);
    if (error?.type === 'not-allowed') {
      setAutoplayBlocked(true);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted(muted => !muted);
    setVolume(volume === 0 ? 0.2 : volume);
  }, [isMuted, volume]);

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

  const { title, artist, url, thumbnail } = tracks[currentTrack || 0];

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

  useEffect(() => {
  if (currentTrack === null) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    setCurrentTrack(randomIndex);
  }
}, [currentTrack]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[9999]">
          <motion.div
            ref={playbarRef}
            className="fixed bottom-4 flex z-[9999] pointer-events-auto touch-pan-y"
            style={{ left: '50%', translateX: '-50%' }}
            drag={!isVolumeHovered}
            dragConstraints={{ left: dragConstraints.left, right: dragConstraints.right }}
            dragControls={dragControls}
            dragElastic={0.1}
            dragMomentum={false}
            dragListener={!isVolumeHovered }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileTap={{ cursor: isVolumeHovered ? 'default' : 'grabbing' }}
            onPointerDown={(e) => {
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
            <div className="absolute -top-6 pb-7 z-1 z-50 left-0 rounded-b-none rounded-t-lg bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-70 backdrop-blur-md text-black dark:text-white text-xs font-semibold px-3 py-1.5 shadow-none">
              Minha playlist 😛
            </div>
            <div className="relative w-[300px] sm:w-[480px] bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-70 backdrop-blur-md rounded-xl sm:rounded-2xl text-black dark:text-white px-3 z-50 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between shadow-lg sm:shadow-2xl">
              <button
                onClick={() => setIsVisible(false)}
                className="absolute -top-1.5 -right-1.5 bg-gray-200 dark:bg-gray-700 rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Close player"
              >
                <X size={12} className="sm:w-4 sm:h-4" />
              </button>

              <div className="hidden">
                <ReactPlayer
                  ref={playerRef}
                  url={url}
                  playing={isPlaying}
                  volume={volume}
                  muted={isMuted}
                  playsinline
                  onPlay={handlePlay}
                  onError={handleError}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                />
              </div>

              {autoplayBlocked && (
                <div className="absolute inset-0 bg-black bg-opacity-70 rounded-xl flex items-center justify-center p-4">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <Play size={16} />
                    <span>Tap to Play</span>
                  </button>
                </div>
              )}

              <div className="w-full sm:w-[180px] flex items-center gap-2 mb-1 sm:mb-0 overflow-hidden">
                <div className="relative flex-shrink-0">
                  <img
                    src={thumbnail}
                    alt="Album cover"
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded sm:rounded-lg object-cover shadow-sm sm:shadow-md"
                  />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                    {title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                    {artist}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-center gap-2 w-[200px]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevTrack(); }} 
                    className="p-2 sm:p-3 hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Previous track"
                  >
                    <SkipBack size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                    className="p-2 sm:p-3 bg-green-500 text-white rounded-full hover:scale-105 active:scale-95 transition-transform"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={18} className="sm:w-6 sm:h-6" />
                    ) : (
                      <Play size={18} className="sm:w-6 sm:h-6" />
                    )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextTrack(); }} 
                    className="p-2 sm:p-3 hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Next track"
                  >
                    <SkipForward size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="w-full flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 min-w-[2rem] sm:min-w-[2.5rem]">
                    {formatTime(progress.playedSeconds)}
                  </span>
                  <div className="flex-1 bg-gray-300 dark:bg-gray-700 h-1 sm:h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-green-500 h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.played * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 min-w-[2rem] sm:min-w-[2.5rem]">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="w-full sm:hidden flex items-center justify-between mt-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevTrack(); }} 
                  className="p-2 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Previous track"
                >
                  <SkipBack size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                  className="p-2 bg-green-500 text-white rounded-full hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button 
                  onClick={toggleMute}
                  className="p-2 hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextTrack(); }} 
                  className="p-2 hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Next track"
                >
                  <SkipForward size={16} />
                </button>
              </div>
              
              <div className="w-full sm:hidden mt-1 flex items-center gap-1">
                <span className="text-[10px] text-gray-600 dark:text-gray-400 min-w-[2rem]">
                  {formatTime(progress.playedSeconds)}
                </span>
                <div className="flex-1 bg-gray-300 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-green-500 h-full rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.played * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 min-w-[2rem]">
                  {formatTime(duration)}
                </span>
              </div>

              <div 
                ref={volumeRef}
                className="hidden sm:flex items-center gap-2 w-[70px] sm:w-[80px]"
                onMouseEnter={() => setIsVolumeHovered(true)}
                onMouseLeave={() => setIsVolumeHovered(false)}
              >
                <button onClick={toggleMute} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  {isMuted ? <VolumeX size={16} className="sm:w-5 sm:h-5" /> : <Volume2 size={16} className="sm:w-5 sm:h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                  }}
                  className="w-full accent-green-500 h-1 sm:h-1.5"
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