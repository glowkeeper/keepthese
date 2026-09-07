const minimumExportWidth = 1200;
const preferredScale = 2;

export function pngFilename(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `keep-these-${slug || 'poem'}.png`;
}

export async function prepareElementForExport(
  element: HTMLElement,
): Promise<HTMLElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  const assetCache = new Map<string, string>();
  await inlineStyles(element, clone, assetCache);
  return clone;
}

export async function renderElementToPng(element: HTMLElement): Promise<Blob> {
  await document.fonts.ready;

  const width = Math.ceil(element.getBoundingClientRect().width);
  const height = Math.ceil(element.scrollHeight);
  if (width <= 0 || height <= 0) {
    throw new Error('The artwork has no renderable dimensions.');
  }

  const clone = await prepareElementForExport(element);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = '0';
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  for (const link of clone.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    link.append(document.createTextNode(` · ${exportSourceUrl(link.href)}`));
  }

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  {
    const image = await loadImage(svgUrl);
    const scale = Math.max(preferredScale, minimumExportWidth / width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable.');

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    return await canvasToBlob(canvas);
  }
}

export function exportSourceUrl(url: string): string {
  const parsed = new URL(url);
  const route = parsed.host + parsed.pathname + parsed.search;
  return route.endsWith('/') ? route.slice(0, -1) : route;
}

export function downloadPng(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function inlineStyles(
  source: HTMLElement,
  clone: HTMLElement,
  assetCache: Map<string, string>,
): Promise<void> {
  const computed = getComputedStyle(source);
  for (const property of computed) {
    clone.style.setProperty(
      property,
      computed.getPropertyValue(property).includes('url(')
        ? await inlineAssetUrls(computed.getPropertyValue(property), assetCache)
        : computed.getPropertyValue(property),
      computed.getPropertyPriority(property),
    );
  }

  const sourceChildren = [...source.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  const cloneChildren = [...clone.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  await Promise.all(
    sourceChildren.map((child, index) =>
      inlineStyles(child, cloneChildren[index]!, assetCache),
    ),
  );

  const before = await materializePseudoElement(source, '::before', assetCache);
  if (before) clone.prepend(before);
  const after = await materializePseudoElement(source, '::after', assetCache);
  if (after) clone.append(after);
}

async function inlineAssetUrls(
  value: string,
  cache: Map<string, string>,
): Promise<string> {
  const urls = [...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
    ([, url]) => url!,
  );
  let inlined = value;

  for (const url of urls) {
    if (url.startsWith('data:')) continue;
    let dataUrl = cache.get(url);
    if (!dataUrl) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load export asset: ${url}`);
      dataUrl = await blobToDataUrl(await response.blob());
      cache.set(url, dataUrl);
    }
    inlined = inlined.replaceAll(url, dataUrl);
  }

  return inlined;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read an export asset.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error('Could not render the artwork.'));
    image.onload = () => resolve(image);
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the artwork as PNG.'));
    }, 'image/png');
  });
}

async function materializePseudoElement(
  source: HTMLElement,
  pseudo: '::after' | '::before',
  assetCache: Map<string, string>,
): Promise<HTMLSpanElement | null> {
  const computed = getComputedStyle(source, pseudo);
  if (computed.content === 'none' || computed.content === 'normal') return null;

  const element = document.createElement('span');
  element.dataset.exportPseudo = pseudo.slice(2);
  element.setAttribute('aria-hidden', 'true');
  if (computed.content !== '""' && computed.content !== "''") {
    element.textContent = computed.content.replace(/^['"]|['"]$/g, '');
  }

  for (const property of computed) {
    const value = computed.getPropertyValue(property);
    element.style.setProperty(
      property,
      value.includes('url(') ? await inlineAssetUrls(value, assetCache) : value,
      computed.getPropertyPriority(property),
    );
  }
  return element;
}
