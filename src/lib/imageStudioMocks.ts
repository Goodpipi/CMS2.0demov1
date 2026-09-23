export type ImageStudioMockKind = 'kv' | 'countdown-3' | 'countdown-2' | 'countdown-1';

export interface ImageStudioProduct {
  id: string;
  kind: ImageStudioMockKind;
  title: string;
  imageUrl: string;
  prompt: string;
  createdAt: number;
}

export interface ImageStudioState {
  products: ImageStudioProduct[];
  currentProductId: string | null;
}

export function emptyImageStudio(): ImageStudioState {
  return {
    products: [],
    currentProductId: null,
  };
}

const IMAGE_STUDIO_MOCKS: Record<
  ImageStudioMockKind,
  Pick<ImageStudioProduct, 'kind' | 'title' | 'imageUrl'>
> = {
  kv: {
    kind: 'kv',
    title: '2026 CUA 主KV',
    imageUrl: '/demo-assets/poster-studio/kv.png',
  },
  'countdown-3': {
    kind: 'countdown-3',
    title: '倒计时3天 · ARAMIS',
    imageUrl: '/demo-assets/poster-studio/countdown-3.png',
  },
  'countdown-2': {
    kind: 'countdown-2',
    title: '倒计时2天 · ARASENS',
    imageUrl: '/demo-assets/poster-studio/countdown-2.png',
  },
  'countdown-1': {
    kind: 'countdown-1',
    title: '倒计时1天 · ARANOTE',
    imageUrl: '/demo-assets/poster-studio/countdown-1.png',
  },
};

export function matchImageStudioMock(text: string): ImageStudioProduct | null {
  const normalized = text.replace(/\s+/g, '');
  const kind: ImageStudioMockKind | null = /kv/i.test(normalized)
    ? 'kv'
    : normalized.includes('三天')
      ? 'countdown-3'
      : normalized.includes('两天')
        ? 'countdown-2'
        : normalized.includes('一天')
          ? 'countdown-1'
          : null;
  if (!kind) return null;
  const mock = IMAGE_STUDIO_MOCKS[kind];
  return {
    ...mock,
    id: `image_studio_${kind}_${Date.now()}`,
    prompt: text,
    createdAt: Date.now(),
  };
}
