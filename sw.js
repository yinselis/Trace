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
            // 1. 如果手机有网，且请求成功，就把最新拉到的数据存进缓存
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
            });
            return response; // 网页显示最新的内容
        })
        .catch(() => {
            // 2. 如果手机断网了 (fetch 报错)，就从缓存里找
            return caches.match(event.request);
        })
    );
});

// =================================================================
// 👇 下面是新加的：处理系统弹窗通知的点击事件 👇
// =================================================================

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // 点击后自动关掉顶部通知横幅

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // 1. 如果网页还在手机后台挂着，直接把它拉回前台
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                // 只要 URL 包含 Trace 就唤醒它
                if (client.url.includes('Trace') && 'focus' in client) {
                    return client.focus(); 
                }
            }
            // 2. 如果你把网页彻底划掉杀后台了，点击通知自动重新打开新网页
            if (clients.openWindow) {
                // 注意：这里写死你部署的具体网址
                return clients.openWindow('https://yinselis.github.io/Trace/index.html'); 
            }
        })
    );
});