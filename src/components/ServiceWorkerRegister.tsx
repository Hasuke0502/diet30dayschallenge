'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered:', registration);

          // 更新をチェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // 新しいバージョンが利用可能
                    console.log('New version available');
                    // ユーザーに更新を通知（任意）
                    if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
                      window.location.reload();
                    }
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}
