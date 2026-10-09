/**
 * Offline use, updates, and installing Keep These, from the site footer.
 *
 * The service worker (see docs/offline-and-install.md) stores only the site's
 * own static files. This module reports what that means in plain words and
 * offers the two choices that belong to the maker: installing the site, and
 * applying a downloaded update.
 *
 * Nothing here interrupts anyone. There is no banner or dialog; the install
 * button appears quietly in the footer and only where the browser offers
 * installing. A new version waits until every Keep These tab is closed or the
 * maker chooses "Update now", and only the tab where that choice was made
 * reloads. Unfinished poems live in browser storage, which the worker never
 * touches, so an update cannot remove them.
 *
 * Keep These sends nothing about any of this to a server.
 */

export const OFFLINE_MESSAGES = {
  ready: 'Keep These is ready to use offline.',
  offline:
    'You are offline. Keep These still works, and your saved poem stays on this device.',
  updateReady:
    'An update is ready. It applies the next time you open Keep These, and your saved work is kept.',
  updating: 'Updating Keep These…',
  online: 'You are back online.',
  installed: 'Keep These is installed.',
} as const;

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface OfflineServices {
  readonly serviceWorker?: ServiceWorkerContainer;
  /** Receives `online`, `offline`, `beforeinstallprompt`, and `appinstalled`. */
  readonly events: EventTarget;
  readonly isOnline: () => boolean;
  readonly isStandalone: () => boolean;
  readonly reload: () => void;
}

export function browserOfflineServices(): OfflineServices {
  return {
    serviceWorker:
      'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    events: window,
    isOnline: () => navigator.onLine,
    isStandalone: () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    reload: () => window.location.reload(),
  };
}

/**
 * Wires the footer controls. Returns once registration has settled; a worker
 * that cannot be registered leaves the site working normally and says nothing.
 */
export async function connectOfflineSupport(
  root: ParentNode,
  services: OfflineServices,
): Promise<void> {
  const status = root.querySelector<HTMLElement>('[data-offline-status]');
  const feedback = root.querySelector<HTMLElement>('[data-offline-feedback]');
  const installButton = root.querySelector<HTMLButtonElement>(
    '[data-install-button]',
  );
  const updateButton = root.querySelector<HTMLButtonElement>(
    '[data-update-button]',
  );

  // `capable` means a worker has installed and activated, so every file is
  // cached. Nothing is said about being offline until then, because until then
  // Keep These cannot promise that it still works.
  const state = {
    capable: false,
    ready: false,
    updateReady: false,
    offline: false,
  };

  function render() {
    const text =
      state.capable && state.offline
        ? OFFLINE_MESSAGES.offline
        : state.updateReady
          ? OFFLINE_MESSAGES.updateReady
          : state.ready
            ? OFFLINE_MESSAGES.ready
            : '';
    if (status) {
      status.textContent = text;
      status.hidden = text === '';
    }
    if (updateButton) updateButton.hidden = !state.updateReady;
  }

  // The visible status is not a live region, so moving between pages does not
  // re-announce it. Only changes the reader has not just caused are announced.
  function announce(text: string) {
    if (feedback) feedback.textContent = text;
  }

  // Going offline and coming back are announced from the moment they change,
  // but only once a worker can back the promise (see `capable`).
  state.offline = !services.isOnline();
  services.events.addEventListener('offline', () => {
    state.offline = true;
    render();
    if (state.capable) announce(OFFLINE_MESSAGES.offline);
  });
  services.events.addEventListener('online', () => {
    state.offline = false;
    render();
    if (state.capable) announce(OFFLINE_MESSAGES.online);
  });

  if (installButton && !services.isStandalone()) {
    let prompt: InstallPromptEvent | null = null;
    services.events.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      prompt = event as InstallPromptEvent;
      installButton.hidden = false;
    });
    installButton.addEventListener('click', () => {
      const pending = prompt;
      if (!pending) return;
      prompt = null;
      installButton.hidden = true;
      void pending.prompt().then(() => pending.userChoice);
    });
    services.events.addEventListener('appinstalled', () => {
      prompt = null;
      installButton.hidden = true;
      announce(OFFLINE_MESSAGES.installed);
    });
  }

  const container = services.serviceWorker;
  if (!container) {
    render();
    return;
  }

  let reloadOnTakeover = false;
  container.addEventListener('controllerchange', () => {
    if (reloadOnTakeover) services.reload();
  });

  function offerUpdate(waiting: ServiceWorker) {
    state.capable = true;
    state.updateReady = true;
    render();
    announce(OFFLINE_MESSAGES.updateReady);
    updateButton?.addEventListener(
      'click',
      () => {
        reloadOnTakeover = true;
        updateButton.disabled = true;
        announce(OFFLINE_MESSAGES.updating);
        waiting.postMessage({ type: 'SKIP_WAITING' });
      },
      { once: true },
    );
  }

  function watch(worker: ServiceWorker) {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && container?.controller) {
        offerUpdate(worker);
      } else if (worker.state === 'activated' && !state.updateReady) {
        state.capable = true;
        state.ready = true;
        render();
        announce(OFFLINE_MESSAGES.ready);
      }
    });
  }

  try {
    const registration = await container.register('/sw.js', { scope: '/' });
    if (registration.waiting && container.controller) {
      offerUpdate(registration.waiting);
    } else if (registration.active && container.controller) {
      state.capable = true;
      state.ready = true;
    }
    if (registration.installing) watch(registration.installing);
    registration.addEventListener('updatefound', () => {
      if (registration.installing) watch(registration.installing);
    });
  } catch {
    // Registration can fail in private windows or on insecure origins. The
    // site works as it always has; it just makes no offline promise.
  }
  render();
}
