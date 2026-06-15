export function registerServiceWorker() {
  const isViteDevServer =
    ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
    ['5173', '5174'].includes(window.location.port);

  if (!('serviceWorker' in navigator) || isViteDevServer) {
    return;
  }

  const register = () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    void navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(
                new CustomEvent('workwise-sw-update', {
                  detail: {
                    applyUpdate: () => installingWorker.postMessage({ type: 'SKIP_WAITING' }),
                  },
                })
              );
            }
          });
        });

        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('workwise-sw-update', {
              detail: {
                applyUpdate: () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }),
              },
            })
          );
        }
      })
      .catch(error => {
        console.warn('Service worker registration failed', error);
      });
  };

  if (document.readyState === 'complete') {
    register();
    return;
  }

  window.addEventListener('load', register, { once: true });
}
