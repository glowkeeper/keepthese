import { describe, expect, it, vi } from 'vitest';

import {
  connectOfflineSupport,
  OFFLINE_MESSAGES,
  type InstallPromptEvent,
  type OfflineServices,
} from './offline-install';

function footer() {
  document.body.innerHTML = `
    <footer>
      <button data-install-button hidden>Install Keep These</button>
      <button data-update-button hidden>Update now</button>
      <span data-offline-feedback aria-live="polite"></span>
      <p data-offline-status hidden></p>
    </footer>`;
  return {
    feedback: document.querySelector<HTMLElement>('[data-offline-feedback]')!,
    install: document.querySelector<HTMLButtonElement>(
      '[data-install-button]',
    )!,
    status: document.querySelector<HTMLElement>('[data-offline-status]')!,
    update: document.querySelector<HTMLButtonElement>('[data-update-button]')!,
  };
}

class FakeWorker extends EventTarget {
  state = 'installing';
  postMessage = vi.fn();
  become(state: string) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  active: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

function setup(
  options: {
    controller?: boolean;
    online?: boolean;
    standalone?: boolean;
    register?: () => Promise<unknown>;
    registration?: FakeRegistration;
  } = {},
) {
  const registration = options.registration ?? new FakeRegistration();
  const container = Object.assign(new EventTarget(), {
    controller: options.controller ? {} : null,
    register: vi.fn(options.register ?? (async () => registration)),
  });
  const events = new EventTarget();
  const reload = vi.fn();
  const services: OfflineServices = {
    serviceWorker: container as unknown as ServiceWorkerContainer,
    events,
    isOnline: () => options.online ?? true,
    isStandalone: () => options.standalone ?? false,
    reload,
  };
  return { container, events, registration, reload, services };
}

describe('offline and install controls', () => {
  it('says nothing, and shows nothing, on a first visit before the worker is ready', async () => {
    const ui = footer();
    const { services } = setup();
    await connectOfflineSupport(document, services);

    expect(ui.status.hidden).toBe(true);
    expect(ui.install.hidden).toBe(true);
    expect(ui.update.hidden).toBe(true);
  });

  it('reports readiness once the first worker has activated', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.installing = new FakeWorker();
    const { services } = setup({ registration });
    await connectOfflineSupport(document, services);

    registration.installing.become('installed');
    expect(ui.status.hidden).toBe(true);
    registration.installing.become('activated');

    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.ready);
    expect(ui.feedback.textContent).toBe(OFFLINE_MESSAGES.ready);
  });

  it('shows readiness quietly, without announcing it, on a repeat visit', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.active = new FakeWorker();
    const { services } = setup({ controller: true, registration });
    await connectOfflineSupport(document, services);

    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.ready);
    expect(ui.feedback.textContent).toBe('');
  });

  it('offers an update that waits, and reloads only when the maker chooses it', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.active = new FakeWorker();
    const { container, reload, services } = setup({
      controller: true,
      registration,
    });
    await connectOfflineSupport(document, services);

    const incoming = new FakeWorker();
    registration.installing = incoming;
    registration.dispatchEvent(new Event('updatefound'));
    incoming.become('installed');

    expect(ui.update.hidden).toBe(false);
    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.updateReady);
    expect(ui.status.textContent).toContain('saved work is kept');
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).not.toHaveBeenCalled();
    expect(incoming.postMessage).not.toHaveBeenCalled();

    ui.update.click();
    expect(incoming.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(ui.update.disabled).toBe(true);
    expect(ui.feedback.textContent).toBe(OFFLINE_MESSAGES.updating);
    expect(reload).not.toHaveBeenCalled();

    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('finds an update that was already waiting when the page opened', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.active = new FakeWorker();
    registration.waiting = new FakeWorker();
    const { services } = setup({ controller: true, registration });
    await connectOfflineSupport(document, services);

    expect(ui.update.hidden).toBe(false);
  });

  it('tells the maker when they are offline and when they are back', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.active = new FakeWorker();
    const { events, services } = setup({ controller: true, registration });
    await connectOfflineSupport(document, services);

    events.dispatchEvent(new Event('offline'));
    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.offline);
    expect(ui.feedback.textContent).toBe(OFFLINE_MESSAGES.offline);

    events.dispatchEvent(new Event('online'));
    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.ready);
    expect(ui.feedback.textContent).toBe(OFFLINE_MESSAGES.online);
  });

  it('keeps an update visible, and announces reconnection, when back online', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.active = new FakeWorker();
    registration.waiting = new FakeWorker();
    const { events, services } = setup({ controller: true, registration });
    await connectOfflineSupport(document, services);

    events.dispatchEvent(new Event('offline'));
    events.dispatchEvent(new Event('online'));

    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.updateReady);
    expect(ui.feedback.textContent).toBe(OFFLINE_MESSAGES.online);
  });

  it('makes no offline claim before a worker is ready', async () => {
    const ui = footer();
    const registration = new FakeRegistration();
    registration.installing = new FakeWorker();
    const { events, services } = setup({ online: false, registration });
    await connectOfflineSupport(document, services);

    // Offline from the start, and offline events, while still installing.
    expect(ui.status.hidden).toBe(true);
    events.dispatchEvent(new Event('offline'));
    events.dispatchEvent(new Event('online'));
    events.dispatchEvent(new Event('offline'));
    expect(ui.status.hidden).toBe(true);
    expect(ui.feedback.textContent).toBe('');

    // Once the worker has activated, the claim becomes true and is shown.
    registration.installing.become('activated');
    expect(ui.status.textContent).toBe(OFFLINE_MESSAGES.offline);
  });

  it('makes no offline claim when the worker cannot be registered', async () => {
    const ui = footer();
    const { events, services } = setup({
      online: false,
      register: async () => {
        throw new Error('blocked');
      },
    });
    await connectOfflineSupport(document, services);

    events.dispatchEvent(new Event('offline'));
    events.dispatchEvent(new Event('online'));

    expect(ui.status.hidden).toBe(true);
    expect(ui.feedback.textContent).toBe('');
  });

  it('makes no offline claim in a browser without service workers', async () => {
    const ui = footer();
    const { events, services } = setup({ online: false });
    await connectOfflineSupport(document, {
      ...services,
      serviceWorker: undefined,
    });

    events.dispatchEvent(new Event('offline'));
    events.dispatchEvent(new Event('online'));

    expect(ui.status.hidden).toBe(true);
    expect(ui.feedback.textContent).toBe('');
  });

  it('offers installing quietly, and only when the browser does', async () => {
    const ui = footer();
    const { events, services } = setup();
    await connectOfflineSupport(document, services);
    expect(ui.install.hidden).toBe(true);

    const prompt = vi.fn(async () => undefined);
    const offer = Object.assign(
      new Event('beforeinstallprompt', { cancelable: true }),
      {
        prompt,
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      },
    ) as InstallPromptEvent;
    events.dispatchEvent(offer);

    expect(offer.defaultPrevented).toBe(true);
    expect(ui.install.hidden).toBe(false);
    ui.install.click();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(ui.install.hidden).toBe(true);
  });

  it('never offers installing inside the installed app', async () => {
    const ui = footer();
    const { events, services } = setup({ standalone: true });
    await connectOfflineSupport(document, services);

    events.dispatchEvent(
      new Event('beforeinstallprompt', { cancelable: true }),
    );
    expect(ui.install.hidden).toBe(true);
  });

  it('leaves the site unaffected when the worker cannot be registered', async () => {
    const ui = footer();
    const { services } = setup({
      register: async () => {
        throw new Error('blocked');
      },
    });
    await expect(
      connectOfflineSupport(document, services),
    ).resolves.toBeUndefined();

    expect(ui.status.hidden).toBe(true);
    expect(ui.update.hidden).toBe(true);
  });

  it('works without service worker support', async () => {
    const ui = footer();
    const { services } = setup();
    await connectOfflineSupport(document, {
      ...services,
      serviceWorker: undefined,
    });

    expect(ui.status.hidden).toBe(true);
  });
});
