const CACHE_NAME = 'diet-challenge-pwa-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/record',
  '/settings',
  '/onboarding',
  '/auth/signin',
  '/auth/signup',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/site.webmanifest'
];

// PWA設定
const PWA_CONFIG = {
  name: 'ダイエット30日チャレンジ',
  badgeUrl: '/icon-192.png',
  notificationIcon: '/icon-192.png',
  vibrationPattern: [200, 100, 200],
  maxNotifications: 5 // 表示する最大通知数
};

// インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// アクティベート時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // PWA通知の初期化
      self.registration.navigationPreload?.enable(),
      // 通知のクリーンアップ（古い通知を削除）
      cleanupOldNotifications()
    ]).then(() => {
      console.log('[SW] Claiming clients and starting notification check');
      startNotificationCheck();
      return self.clients.claim();
    })
  );
});

// 古い通知をクリーンアップする関数
async function cleanupOldNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1時間前
    
    notifications.forEach(notification => {
      const notificationTime = notification.data?.timestamp || 0;
      if (notificationTime < oneHourAgo) {
        notification.close();
      }
    });
    
    console.log('[SW] Cleaned up old notifications');
  } catch (error) {
    console.error('[SW] Error cleaning up notifications:', error);
  }
}

// PWA強化版通知表示機能
async function showPWANotification(title, options = {}) {
  try {
    // 現在表示中の通知数をチェック
    const existingNotifications = await self.registration.getNotifications();
    if (existingNotifications.length >= PWA_CONFIG.maxNotifications) {
      // 古い通知を1つ閉じる
      existingNotifications[0].close();
    }

    // PWA強化オプション
    const pwaOptions = {
      body: options.body || '',
      icon: PWA_CONFIG.notificationIcon,
      badge: PWA_CONFIG.badgeUrl,
      tag: options.tag || `notification-${Date.now()}`,
      renotify: true, // 同じtagの通知を再通知する
      requireInteraction: options.persistent || false, // 永続的な通知
      vibrate: PWA_CONFIG.vibrationPattern,
      timestamp: options.timestamp || Date.now(),
      silent: false,
      data: {
        url: options.url || '/record',
        timestamp: options.timestamp || Date.now(),
        priority: options.priority || 'normal',
        appName: PWA_CONFIG.name
      },
      actions: [
        {
          action: 'record',
          title: '📝 記録する',
          icon: '/icon-192.png'
        },
        {
          action: 'view',
          title: '👀 確認する',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: '❌ 後で',
          icon: '/icon-192.png'
        }
      ],
      // PWA向けの拡張オプション
      image: options.image, // 大きな画像（任意）
      dir: 'ltr',
      lang: 'ja'
    };

    // 通知の表示
    await self.registration.showNotification(title, pwaOptions);
    
    // アプリバッジの更新（サポートされている場合）
    if ('setAppBadge' in navigator) {
      try {
        const unreadCount = existingNotifications.length + 1;
        await navigator.setAppBadge(unreadCount);
      } catch (error) {
        console.warn('[SW] App badge update failed:', error);
      }
    }

    console.log('[SW] PWA通知表示完了:', title);
  } catch (error) {
    console.error('[SW] PWA通知表示エラー:', error);
    
    // フォールバック: 基本的な通知
    try {
      await self.registration.showNotification(title, {
        body: options.body || '',
        icon: '/icon-192.png',
        tag: options.tag
      });
    } catch (fallbackError) {
      console.error('[SW] フォールバック通知も失敗:', fallbackError);
    }
  }
}

// フェッチ時（ネットワークファースト戦略）
self.addEventListener('fetch', (event) => {
  // 初回リクエスト時に通知チェックを確認
  if (!notificationCheckInterval) {
    startNotificationCheck();
  }

  // APIリクエストは常にネットワークを使用
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ネットワークからの応答をキャッシュに保存
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// プッシュ通知（将来的な拡張用）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// タイマーベースの通知チェック機能
let notificationCheckInterval;

// 通知スケジュールをチェックする関数
async function checkScheduledNotifications() {
  try {
    // IndexedDBから通知スケジュールを取得
    const schedules = await getNotificationSchedules();
    const now = new Date();
    
    console.log(`[SW] 通知チェック開始: ${now.toLocaleString()}`);
    console.log(`[SW] チェック対象スケジュール数: ${schedules.length}`);
    
    for (const schedule of schedules) {
      const scheduledTime = new Date(schedule.scheduledTime);
      
      // デバッグログ
      console.log(`[SW] スケジュール "${schedule.id}":`, {
        scheduledTime: scheduledTime.toLocaleString(),
        now: now.toLocaleString(),
        sent: schedule.sent,
        shouldSend: now >= scheduledTime && !schedule.sent
      });
      
      // 現在時刻が予定時刻を過ぎているかチェック（5分の猶予を追加）
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      if (scheduledTime <= now && scheduledTime >= fiveMinutesAgo && !schedule.sent) {
        console.log(`[SW] 通知送信: ${schedule.title} (${scheduledTime.toLocaleString()})`);
        
        // PWA強化版通知を表示
        await showPWANotification(schedule.title, {
          body: schedule.body,
          tag: schedule.id,
          url: schedule.url || '/record',
          timestamp: now.getTime(),
          priority: 'high',
          persistent: true
        });
        
        // 送信済みマークを付ける
        await markNotificationAsSent(schedule.id);
        console.log(`[SW] 通知送信完了: ${schedule.id}`);
      } else if (scheduledTime < fiveMinutesAgo && !schedule.sent) {
        // 5分以上古い通知は送信済みとしてマーク（期限切れ）
        console.log(`[SW] 期限切れ通知をスキップ: ${schedule.id} (${scheduledTime.toLocaleString()})`);
        await markNotificationAsSent(schedule.id);
      }
    }
  } catch (error) {
    console.error('[SW] 通知チェック中にエラーが発生しました:', error);
  }
}

// 定期的な通知チェックを開始
function startNotificationCheck() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
  
  // 30秒ごとにチェック（より頻繁に）
  notificationCheckInterval = setInterval(checkScheduledNotifications, 30000);
  
  // 即座に一度チェック
  checkScheduledNotifications();
  
  console.log('[SW] 30秒ごとの通知チェックを開始しました');
}

// Service Worker が起動するたびに通知チェックを開始
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// ページが見えるようになった時に通知チェックを実行
self.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkScheduledNotifications();
  }
});



// Service Worker起動時に通知チェックを開始
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    }).then(() => {
      // 通知チェックを開始
      startNotificationCheck();
      console.log('[SW] 通知チェックを開始しました');
    })
  );
});



// IndexedDBヘルパー関数
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DietAppNotifications', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('schedules')) {
        const store = db.createObjectStore('schedules', { keyPath: 'id' });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }
    };
  });
}

async function getNotificationSchedules() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['schedules'], 'readonly');
    const store = transaction.objectStore('schedules');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function markNotificationAsSent(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['schedules'], 'readwrite');
    const store = transaction.objectStore('schedules');
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const schedule = request.result;
      if (schedule) {
        schedule.sent = true;
        const updateRequest = store.put(schedule);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

// メッセージリスナー（メインスレッドからの通信用）
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    try {
      const db = await openDB();
      const transaction = db.transaction(['schedules'], 'readwrite');
      const store = transaction.objectStore('schedules');
      
      await new Promise((resolve, reject) => {
        const request = store.put(event.data.schedule);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      console.log('[SW] 通知がスケジュールされました:', event.data.schedule);
    } catch (error) {
      console.error('[SW] 通知スケジュールの保存に失敗しました:', error);
    }
  } else if (event.data && event.data.type === 'CLEAR_SCHEDULES') {
    try {
      const db = await openDB();
      const transaction = db.transaction(['schedules'], 'readwrite');
      const store = transaction.objectStore('schedules');
      
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      console.log('[SW] 通知スケジュールがクリアされました');
    } catch (error) {
      console.error('[SW] 通知スケジュールのクリアに失敗しました:', error);
    }
  } else if (event.data && event.data.type === 'FORCE_CHECK_NOTIFICATIONS') {
    console.log('[SW] 手動で通知チェックを実行します');
    try {
      await checkScheduledNotifications();
      console.log('[SW] 手動通知チェック完了');
    } catch (error) {
      console.error('[SW] 手動通知チェックでエラーが発生しました:', error);
    }
  }
});

// PWA強化版通知クリック処理
self.addEventListener('notificationclick', (event) => {
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  console.log('[SW] 通知クリック:', { action, data: notificationData });

  // PWA通知のクリック処理
  event.waitUntil(handleNotificationClick(event, action, notificationData));
});

// 通知クリック処理の詳細実装
async function handleNotificationClick(event, action, notificationData) {
  try {
    // 通知を閉じる
    event.notification.close();
    
    // アプリバッジをクリア（サポートされている場合）
    if ('clearAppBadge' in navigator) {
      try {
        await navigator.clearAppBadge();
      } catch (error) {
        console.warn('[SW] App badge clear failed:', error);
      }
    }

    let urlToOpen = '/';
    let shouldFocus = true;

    // アクション別の処理
    switch (action) {
      case 'record':
        urlToOpen = '/record';
        // 記録ページに直接移動
        await trackNotificationAction('record', notificationData);
        break;
        
      case 'view':
        urlToOpen = notificationData.url || '/dashboard';
        await trackNotificationAction('view', notificationData);
        break;
        
      case 'dismiss':
        // 通知を無視（統計用にトラッキング）
        await trackNotificationAction('dismiss', notificationData);
        shouldFocus = false;
        return; // 何もしない
        
      default:
        // 通知本体がクリックされた場合
        urlToOpen = notificationData.url || '/record';
        await trackNotificationAction('click', notificationData);
        break;
    }

    if (!shouldFocus) return;

    // ウィンドウの管理
    const clientList = await clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });

    // 既存のアプリウィンドウを探す
    for (const client of clientList) {
      const clientUrl = new URL(client.url);
      
      // 同じオリジンのウィンドウが見つかった場合
      if (clientUrl.origin === self.location.origin) {
        // ページナビゲーション
        if (client.navigate) {
          await client.navigate(urlToOpen);
        }
        // ウィンドウにフォーカス
        await client.focus();
        
        // クライアントにメッセージを送信（必要に応じて）
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          action: action,
          url: urlToOpen,
          timestamp: Date.now()
        });
        
        return;
      }
    }

    // 既存のウィンドウがない場合、新しいウィンドウを開く
    if (clients.openWindow) {
      const newClient = await clients.openWindow(urlToOpen);
      if (newClient) {
        // 新しいクライアントにメッセージを送信
        newClient.postMessage({
          type: 'NOTIFICATION_CLICKED',
          action: action,
          url: urlToOpen,
          timestamp: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('[SW] 通知クリック処理エラー:', error);
  }
}

// 通知アクションのトラッキング（統計用）
async function trackNotificationAction(action, notificationData) {
  try {
    console.log('[SW] 通知アクション:', {
      action: action,
      timestamp: Date.now(),
      notificationId: notificationData.tag || 'unknown',
      url: notificationData.url || 'unknown'
    });
    
    // 将来的に分析用データを保存する場合はここに実装
    // 例：IndexedDBに統計データを保存
  } catch (error) {
    console.error('[SW] 通知アクショントラッキングエラー:', error);
  }
}
