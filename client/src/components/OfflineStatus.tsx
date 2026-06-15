import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type ServiceWorkerUpdateEvent = CustomEvent<{
  applyUpdate?: () => void;
}>;

function isStandaloneDisplay() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallDismissed, setIsInstallDismissed] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      window.setTimeout(() => setWasOffline(false), 5000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!isStandaloneDisplay()) {
        setInstallPrompt(event as BeforeInstallPromptEvent);
      }
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallDismissed(true);
    };

    const handleServiceWorkerUpdate = (event: Event) => {
      const updateEvent = event as ServiceWorkerUpdateEvent;
      if (updateEvent.detail?.applyUpdate) {
        setApplyUpdate(() => updateEvent.detail.applyUpdate!);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('workwise-sw-update', handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('workwise-sw-update', handleServiceWorkerUpdate);
    };
  }, []);

  const status = useMemo(() => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        title: 'Offline mode',
        message: 'Saved pages stay available. Reconnect for jobs, account data, and AI tools.',
        tone: 'border-amber-300 bg-amber-50 text-amber-950',
      };
    }

    if (wasOffline) {
      return {
        icon: Wifi,
        title: 'Back online',
        message: 'Connection restored. New data will refresh as you browse.',
        tone: 'border-emerald-300 bg-emerald-50 text-emerald-950',
      };
    }

    return null;
  }, [isOnline, wasOffline]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome !== 'accepted') {
      setIsInstallDismissed(true);
    }
    setInstallPrompt(null);
  };

  const canShowInstall = installPrompt && !isInstallDismissed && isOnline && !applyUpdate;

  if (!status && !canShowInstall && !applyUpdate) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md space-y-2 sm:bottom-5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-live="polite"
    >
      {status && (
        <div className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur ${status.tone}`}>
          <div className="flex items-start gap-3">
            <status.icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{status.title}</p>
              <p className="mt-0.5 text-xs leading-5">{status.message}</p>
            </div>
            {isOnline && (
              <button
                type="button"
                className="rounded-md p-1 opacity-70 hover:opacity-100"
                onClick={() => setWasOffline(false)}
                aria-label="Dismiss network status"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {applyUpdate && (
        <div className="rounded-lg border border-primary/30 bg-white px-4 py-3 text-primary shadow-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Update ready</p>
              <p className="text-xs leading-5 text-slate-600">
                Refresh to use the latest app version.
              </p>
            </div>
            <Button size="sm" className="bg-primary" onClick={applyUpdate}>
              Refresh
            </Button>
          </div>
        </div>
      )}

      {canShowInstall && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">Install WorkWise SA</p>
              <p className="text-xs leading-5 text-slate-600">
                Open faster and keep core pages available offline.
              </p>
            </div>
            <Button size="sm" className="bg-primary" onClick={handleInstall}>
              Install
            </Button>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:text-slate-900"
              onClick={() => setIsInstallDismissed(true)}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;
