import Hls from 'hls.js';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { WiseUpItem } from '../types';

export type VideoPlayerHandle = {
  seekTo: (timeInSeconds: number) => void;
  skipBy: (seconds: number) => void;
  requestFullscreen: () => Promise<'entered' | 'exited' | 'unavailable' | 'failed'>;
  requestPictureInPicture: () => Promise<boolean>;
  getVideoElement: () => HTMLVideoElement | null;
};

interface VideoPlayerProps {
  item: WiseUpItem;
  fullscreenTargetRef?: React.RefObject<HTMLElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  captionsVisible: boolean;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onError: (message: string | null) => void;
}

function getReadableMediaError(videoError: MediaError | null | undefined, fallback?: string) {
  if (!videoError) {
    return fallback || 'Video playback failed.';
  }

  switch (videoError.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was interrupted before the video finished loading.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'The video could not load because of a network issue.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'This video could not be decoded by the browser.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'This media format or codec is not supported by this browser.';
    default:
      return fallback || 'Video playback failed.';
  }
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (
    {
      item,
      fullscreenTargetRef,
      isPlaying,
      isMuted,
      volume,
      playbackRate,
      captionsVisible,
      onPlaybackStateChange,
      onTimeUpdate,
      onLoadedMetadata,
      onEnded,
      onError,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const onErrorRef = useRef(onError);
    const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const src = item.media?.src || item.video;
    const sourceType =
      item.media?.sourceType ||
      (src.includes('.m3u8') ? 'hls' : src.includes('.webm') ? 'webm' : 'mp4');
    const hasCaptions = useMemo(
      () => Boolean(item.media?.captions?.length),
      [item.media?.captions]
    );

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useImperativeHandle(ref, () => ({
      seekTo: timeInSeconds => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, timeInSeconds);
      },
      skipBy: seconds => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
      },
      requestFullscreen: async () => {
        const fullscreenTarget = (fullscreenTargetRef?.current || frameRef.current) as
          | (HTMLElement & {
              webkitRequestFullscreen?: () => Promise<void> | void;
            })
          | null;
        const exitFullscreen = document.exitFullscreen?.bind(document);

        if (!fullscreenTarget) return 'unavailable';

        try {
          if (document.fullscreenElement) {
            if (!exitFullscreen) return 'unavailable';
            await exitFullscreen();
            return 'exited';
          }

          if (fullscreenTarget.requestFullscreen) {
            await fullscreenTarget.requestFullscreen();
            return 'entered';
          }

          if (fullscreenTarget.webkitRequestFullscreen) {
            await fullscreenTarget.webkitRequestFullscreen();
            return 'entered';
          }

          return 'unavailable';
        } catch (fullscreenError) {
          console.warn('Fullscreen request failed:', fullscreenError);
          return 'failed';
        }
      },
      requestPictureInPicture: async () => {
        const video = videoRef.current;
        if (!video || !document.pictureInPictureEnabled) return false;

        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            return true;
          }

          await video.requestPictureInPicture();
          return true;
        } catch (pictureError) {
          console.warn('Picture-in-Picture failed:', pictureError);
          return false;
        }
      },
      getVideoElement: () => videoRef.current,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      setError(null);
      onErrorRef.current(null);
      hlsRef.current?.destroy();
      hlsRef.current = null;

      if (sourceType === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              const message = 'This stream could not be loaded. Try another lesson.';
              setError(message);
              onErrorRef.current(message);
            }
          });
          hlsRef.current = hls;
        } else {
          const message = 'HLS playback is not supported in this browser.';
          setError(message);
          onErrorRef.current(message);
        }
      } else {
        video.src = src;
      }

      video.load();
      return () => {
        hlsRef.current?.destroy();
        hlsRef.current = null;
      };
    }, [item.id, sourceType, src]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      video.volume = Math.max(0, Math.min(1, volume));
      video.muted = isMuted || volume === 0;
    }, [isMuted, volume]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      video.playbackRate = playbackRate;
    }, [playbackRate]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      Array.from(video.textTracks).forEach(track => {
        track.mode = captionsVisible ? 'showing' : 'disabled';
      });
    }, [captionsVisible, hasCaptions]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      if (isPlaying) {
        video.play().catch(playError => {
          const message = playError instanceof Error ? playError.message : 'Playback failed.';
          const isInterruptedLoad =
            playError?.name === 'AbortError' || /interrupted by a new load request/i.test(message);
          if (isInterruptedLoad) {
            return;
          }

          onPlaybackStateChange(false);
          if (playError?.name !== 'NotAllowedError') {
            const readableMessage = getReadableMediaError(video.error, message);
            setError(readableMessage);
            onErrorRef.current(readableMessage);
          }
        });
        return;
      }

      video.pause();
    }, [isPlaying, onPlaybackStateChange, src]);

    useEffect(() => {
      if (!('mediaSession' in navigator)) return;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title,
        artist: item.type === 'content' ? item.creator.name : item.advertiser,
        artwork: item.media?.thumbnail
          ? [
              {
                src: item.media.thumbnail,
                sizes: '512x512',
                type: 'image/png',
              },
            ]
          : undefined,
      });

      navigator.mediaSession.setActionHandler('play', () => onPlaybackStateChange(true));
      navigator.mediaSession.setActionHandler('pause', () => onPlaybackStateChange(false));
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime += 10;
      });
    }, [item, onPlaybackStateChange]);

    useEffect(() => {
      const requestWakeLock = async () => {
        const wakeLock = (navigator as any).wakeLock;
        if (!wakeLock || !isPlaying) return;

        try {
          wakeLockRef.current = await wakeLock.request('screen');
        } catch (wakeError) {
          console.warn('Wake lock request failed:', wakeError);
        }
      };

      requestWakeLock();
      return () => {
        wakeLockRef.current?.release().catch(() => undefined);
        wakeLockRef.current = null;
      };
    }, [isPlaying]);

    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      onLoadedMetadata(video?.duration || item.media.durationSec || 0);
    };

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;
      onTimeUpdate(video.currentTime, video.duration || item.media.durationSec || 0);
    };

    const handleNativeError = () => {
      const videoError = videoRef.current?.error;
      const message = getReadableMediaError(videoError);
      setError(message);
      onErrorRef.current(message);
    };

    return (
      <div ref={frameRef} className="relative h-full w-full overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          poster={item.media?.poster || item.media?.thumbnail}
          playsInline
          preload="metadata"
          muted={isMuted || volume === 0}
          aria-label={item.title}
          onCanPlay={() => {
            setError(null);
            onErrorRef.current(null);
          }}
          onPlay={() => {
            setError(null);
            onErrorRef.current(null);
            onPlaybackStateChange(true);
          }}
          onPause={() => onPlaybackStateChange(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          onError={handleNativeError}
        >
          {item.media?.captions?.map(caption => (
            <track
              key={`${caption.srclang}-${caption.src}`}
              kind="captions"
              label={caption.label}
              srcLang={caption.srclang}
              src={caption.src}
              default={caption.default}
            />
          ))}
        </video>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-6 text-center text-white">
            <div className="max-w-md rounded-lg border border-red-300/40 bg-red-500/20 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-100">
                Playback issue
              </p>
              <p className="mt-2 text-sm text-red-50">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
