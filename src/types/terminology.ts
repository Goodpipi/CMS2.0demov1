/** 专业术语：供 PPT 翻译等场景预置给 AI 的标准译法 */
export interface TerminologyEntry {
  id: string;
  /** 源语言原文 */
  source: string;
  /** 目标语言标准译文 */
  target: string;
  /** 源语言，如 zh / en */
  sourceLang: string;
  /** 目标语言，如 en / zh */
  targetLang: string;
  /** 领域或分类，如 肾病 / 合规 */
  domain: string;
  /** 备注（使用场景、禁用译法等） */
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type TerminologyDraft = Omit<TerminologyEntry, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};
