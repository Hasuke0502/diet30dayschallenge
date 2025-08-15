import { useCallback, useRef, useState, useEffect } from 'react';

export const useSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // ローカルストレージから音声設定を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSetting = localStorage.getItem('soundEnabled');
      if (savedSetting !== null) {
        setIsSoundEnabled(savedSetting === 'true');
      }
    }
  }, []);

  // 音声設定を保存
  const toggleSound = useCallback(() => {
    const newSetting = !isSoundEnabled;
    setIsSoundEnabled(newSetting);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', newSetting.toString());
    }
  }, [isSoundEnabled]);

  const playClickSound = useCallback(() => {
    if (!isSoundEnabled) return;
    
    try {
      // 音声ファイルが存在する場合のみ再生
      if (typeof window !== 'undefined') {
        if (!audioRef.current) {
          audioRef.current = new Audio('/sounds/click.mp3');
          audioRef.current.volume = 0.3; // 音量を30%に設定
          audioRef.current.preload = 'auto';
        }
        
        // 音声を再生
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log('音声再生に失敗しました:', error);
        });
      }
    } catch (error) {
      console.log('音声再生エラー:', error);
    }
  }, [isSoundEnabled]);

  const playSuccessSound = useCallback(() => {
    if (!isSoundEnabled) return;
    
    try {
      if (typeof window !== 'undefined') {
        if (!audioRef.current) {
          audioRef.current = new Audio('/sounds/click.mp3');
          audioRef.current.volume = 0.4;
          audioRef.current.preload = 'auto';
        }
        
        // 成功音として少し高めの音量で再生
        audioRef.current.volume = 0.4;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log('成功音再生に失敗しました:', error);
        });
      }
    } catch (error) {
      console.log('成功音再生エラー:', error);
    }
  }, [isSoundEnabled]);

  return {
    playClickSound,
    playSuccessSound,
    isSoundEnabled,
    toggleSound,
  };
};
