'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Volume1, Maximize2 } from 'lucide-react';
import { tracks as ALL_TRACKS } from '@/utils/constants/playlist';
import type { Language } from '@/lib/i18n/dictionaries';

type Progress = { played: number; playedSeconds: number; loadedSeconds: number };

export default function PlayBar({ language }: { language: Language }) {
  // Core state
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Volume/mute (start muted @0 to satisfy autoplay policies)
  const [volume, setVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [prevVolume, setPrevVolume] = useState<number>(0.5);

  // Timing
  const [progress, setProgress] = useState<Progress>({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);

  // UI/UX
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);



  // Transition state
  const [fadeOpacity, setFadeOpacity] = useState<number>(1);
  const isTransitioning = useRef<boolean>(false);

  // Refs
  const playerRef = useRef<ReactPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tracks for current language
  const currTracks = useMemo(() => ALL_TRACKS[language] || ALL_TRACKS['pt'], [language]);

  // Derive current track data
  const { title = '', artist = '', url = '', thumbnail = '' } = useMemo(() => {
    return currTracks[currentTrack] ?? {
      title: '',
      artist: '',
      url: '',
      thumbnail: '',
    };
  }, [currTracks, currentTrack]);

  // Ensure currentTrack is valid
  useEffect(() => {
    if (currentTrack >= currTracks.length) {
      setCurrentTrack(0);
    }
  }, [currTracks, currentTrack]);

  // Handlers
  const resetProgress = useCallback(() => {
    setProgress({ played: 0, playedSeconds: 0, loadedSeconds: 0 });
    setDuration(0);
  }, []);

  // Smooth transition helper
  const performSmoothTransition = useCallback(async (nextIndexGetter: (prev: number) => number) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // Fade out
    const steps = 10;
    const duration = 500; // ms
    const stepTime = duration / steps;

    for (let i = steps; i >= 0; i--) {
      setFadeOpacity(i / steps);
      await new Promise(r => setTimeout(r, stepTime));
    }

    resetProgress();
    setCurrentTrack(nextIndexGetter);
    setIsPlaying(true);

    // Fade in
    for (let i = 0; i <= steps; i++) {
      setFadeOpacity(i / steps);
      await new Promise(r => setTimeout(r, stepTime));
    }
    
    isTransitioning.current = false;
  }, [resetProgress]);

  const nextTrack = useCallback(() => {
    performSmoothTransition((prev) => (prev + 1) % currTracks.length);
  }, [currTracks.length, performSmoothTransition]);

  const prevTrack = useCallback(() => {
    performSmoothTransition((prev) => {
      const len = Math.max(1, currTracks.length);
      return prev === 0 ? len - 1 : prev - 1;
    });
  }, [currTracks.length, performSmoothTransition]);

  const handlePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying((p) => !p);
  }, []);

  const handleProgress = useCallback((state: Progress) => {
    if (!isSeeking) {
      setProgress(state);
    }
  }, [isSeeking]);

  const handleDuration = useCallback((dur: number) => setDuration(dur || 0), []);

  const handleSeekStart = () => setIsSeeking(true);
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setProgress(prev => ({ ...prev, playedSeconds: newTime, played: newTime / duration }));
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    playerRef.current?.seekTo(newTime);
    setIsSeeking(false);
  };

  // Autoplay policy
  const handlePlay = useCallback(() => setAutoplayBlocked(false), []);
  const handleError = useCallback((error: any) => {
    if (error?.type === 'not-allowed') setAutoplayBlocked(true);
  }, []);

  // Volume
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 0.2);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  }, [isMuted, volume, prevVolume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (newVol > 0) setPrevVolume(newVol);
  };

  // Format time
  const formatTime = useCallback((seconds: number): string => {
    const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const mins = Math.floor(safe / 60);
    const secs = String(safe % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  return (
    <>
      {/* Persistent Player (Hidden) */}
      <div className="hidden">
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={isPlaying}
          volume={volume * fadeOpacity}
          muted={isMuted}
          playsinline
          onPlay={handlePlay}
          onError={handleError}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={nextTrack}
        />
      </div>

      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none pb-6 px-8 md:px-4">
            <motion.div
              ref={containerRef}
              initial={{ y: '100%' }}
              animate={{ y: isMinimized ? 'calc(100% + 16px)' : 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto relative w-full max-w-2xl"
            >
              {/* Tag */}
              <button 
                className="absolute -top-6 left-6 bg-black/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-black text-[10px] font-bold px-3 py-1.5 rounded-t-lg shadow-sm cursor-pointer flex items-center gap-2 hover:pb-2 transition-all"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <span>Minha playlist 😛</span>
                {isMinimized && isPlaying && (
                  <div className="flex gap-0.5 items-end h-3">
                     {[0.6, 1, 0.8].map((scale, i) => (
                        <motion.div
                          key={i}
                          className="w-0.5 bg-green-500 rounded-full"
                          initial={{ height: 4 }}
                          animate={{ height: [4, 4 * scale + 4, 4] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.1,
                            repeatType: "reverse"
                          }}
                        />
                     ))}
                  </div>
                )}
              </button>

              {/* Main Card */}
              <div 
                className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Progress Bar (Top Edge) */}


                <div className="flex flex-wrap md:flex-nowrap items-center p-3 md:p-4 gap-x-3 gap-y-1">
                  {/* Close Button (Absolute) */}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                  >
                    <X size={14} />
                  </button>

                  {/* Track Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 md:max-w-[40%]">
                    <div className="relative group/art shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnail}
                        alt={title}
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-lg object-cover shadow-md transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95 grayscale-[0.2]'}`}
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate pr-4">{title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist}</p>
                    </div>
                  </div>

                  {/* Controls (Center/Right on Mobile) */}
                  <div className="flex items-center gap-1 md:gap-4 md:absolute md:left-1/2 md:-translate-x-1/2">
                    <button 
                      onClick={prevTrack}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
                    >
                      <SkipBack size={20} />
                    </button>

                    <button 
                      onClick={handlePlayPause}
                      className="p-2 md:p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button 
                      onClick={nextTrack}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
                    >
                      <SkipForward size={20} />
                    </button>
                  </div>

                  {/* Right Section: Time & Volume */}
                  <div className="hidden md:flex items-center gap-4 w-full md:w-auto justify-end flex-1">
                    {/* Time Display */}
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatTime(progress.playedSeconds)} / {formatTime(duration)}
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 group/vol">
                      <button 
                        onClick={toggleMute}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                      </button>
                      <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gray-800 dark:bg-gray-200" 
                          style={{ width: `${volume * 100}%` }} 
                        />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Time (Bottom) */}
                  <div className="w-full md:hidden flex items-center justify-between mt-1 px-1 basis-full">
                    <span className="text-[10px] text-gray-500 font-medium tabular-nums">{formatTime(progress.playedSeconds)}</span>
                    <span className="text-[10px] text-gray-500 font-medium tabular-nums">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Universal Seek Bar (Overlay on bottom edge) */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 md:h-1 bg-transparent md:hover:h-2 transition-all group/seek cursor-pointer">
                   <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 opacity-100 md:opacity-0 md:group-hover/seek:opacity-100 transition-opacity" />
                   <div 
                      className="absolute inset-y-0 left-0 bg-green-500 transition-all" 
                      style={{ width: `${(progress.played || 0) * 100}%` }} 
                    />
                   <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="0.1"
                      value={progress.playedSeconds}
                      onMouseDown={handleSeekStart}
                      onTouchStart={handleSeekStart}
                      onChange={handleSeekChange}
                      onMouseUp={handleSeekEnd}
                      onTouchEnd={handleSeekEnd}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
              </div>

              {/* Autoplay Blocker */}
              {autoplayBlocked && (
                <div className="absolute inset-0 -top-12 flex items-center justify-center z-50 pointer-events-none">
                   <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => {
                        setIsPlaying(true);
                        setAutoplayBlocked(false);
                      }}
                      className="pointer-events-auto bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
                    >
                      <Play size={16} fill="currentColor" />
                      <span>Tap to Play</span>
                    </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
