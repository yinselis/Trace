const CACHE_NAME = 'trace-cache-auto-update';

// 安装阶段：强制立刻接管控制权
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 激活阶段：清理旧缓存，立刻控制当前页面
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// 抓取阶段：网络优先 (Network First) 策略
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 1. 如果手机有网，且请求成功，就把最新拉到的代码偷偷存到缓存里
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response; // 网页显示最新的内容
      })
      .catch(() => {
        // 2. 如果手机断网了（fetch 报错），就从缓存里把上次存的代码掏出来用
        return caches.match(event.request);
      })
  );
});