import type { ContentBrand } from '@/lib/brands';

export type MaterialContentType = 'text' | 'image' | 'pdf';

export interface LibraryItem {
  id: number;
  cat: string;
  title: string;
  meta: string;
  /** 未设置则视为全品牌通用 */
  brand?: ContentBrand;
  cms: boolean;
  def: boolean;
  /** 当前任务是否引用；未设置时沿用默认素材状态 */
  referenced?: boolean;
  addedAt: number;
  fileName?: string;
  contentType?: MaterialContentType;
  /** 文本类文件正文 */
  contentText?: string;
  /** 图片 / PDF 的 data URL */
  contentUrl?: string;
  mimeType?: string;
  /** CMS 同步内容的有效期，ISO 日期 */
  validUntil?: string;
  /** 从文献检索添加时对应的文献 id，用于生成后回标「已引用」 */
  literatureId?: string;
}
