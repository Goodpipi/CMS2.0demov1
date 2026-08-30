export const CONTENT_BRANDS = ['拜新同', '拜唐苹', '优迈', '爱格希'] as const;

export type ContentBrand = (typeof CONTENT_BRANDS)[number];

const STORAGE_KEY = 'acp_content_brand_v1';

export function loadContentBrand(): ContentBrand {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (CONTENT_BRANDS.includes(raw as ContentBrand)) return raw as ContentBrand;
  } catch {
    /* ignore */
  }
  return '拜新同';
}

export function saveContentBrand(brand: ContentBrand): void {
  localStorage.setItem(STORAGE_KEY, brand);
}

export function matchesBrand(
  itemBrand: ContentBrand | ContentBrand[] | null | undefined,
  current: ContentBrand
): boolean {
  if (!itemBrand || (Array.isArray(itemBrand) && itemBrand.length === 0)) return true;
  return Array.isArray(itemBrand) ? itemBrand.includes(current) : itemBrand === current;
}
