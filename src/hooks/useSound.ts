import { useCallback, useRef } from 'react';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio APIを使ってビープ音を生成
  const playBeepSound = useCallback((frequency: number = 800, duration: number = 150, volume: number = 0.1) => {
    if (typeof window === 'undefined') return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
      console.log(`🎵 ビープ音再生: ${frequency}Hz, ${duration}ms`);
    } catch (error) {
      console.error('❌ ビープ音生成エラー:', error);
    }
  }, []);

  const playClickSound = useCallback(() => {
    playBeepSound(800, 150, 0.1);
  }, [playBeepSound]);

  const playSuccessSound = useCallback(() => {
    // 成功音として少し高い音で再生
    playBeepSound(1000, 200, 0.15);
  }, [playBeepSound]);

  return {
    playClickSound,
    playSuccessSound,
  };
};
