import type { GeneratedImageMeta } from '@/types/content';

export interface ImageCopyGroup {
  copyTitle: string;
  copyIndex: number;
  items: { dataUrl: string; index: number; meta: GeneratedImageMeta }[];
}

/** 按文案分组展示配图 */
export function groupImagesByCopy(
  images: string[],
  meta: GeneratedImageMeta[]
): ImageCopyGroup[] {
  const order: string[] = [];
  const map = new Map<string, ImageCopyGroup>();

  images.forEach((dataUrl, index) => {
    const m = meta[index];
    const copyTitle = m?.copyTitle?.trim() || '综合内容';
    const copyIndex = m?.copyIndex ?? -1;
    const key = `${copyIndex}:${copyTitle}`;
    if (!map.has(key)) {
      map.set(key, { copyTitle, copyIndex, items: [] });
      order.push(key);
    }
    map.get(key)!.items.push({
      dataUrl,
      index,
      meta: m ?? { copyTitle, copyIndex, imageIndex: index },
    });
  });

  return order.map((key) => map.get(key)!);
}
