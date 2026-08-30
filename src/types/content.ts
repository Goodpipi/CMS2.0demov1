export interface LibraryItem {
  id: number;
  cat: string;
  title: string;
  meta: string;
  cms: boolean;
  def: boolean;
}

export interface TopicItem {
  title: string;
  reason: string;
  source: string;
}

export interface CopyItem {
  title: string;
  body: string;
  compliance: string;
  /** 所属话题标题，用于按话题分组展示 */
  topicTitle?: string;
}

export type TeamContentType = 'copy' | 'rich-text' | 'visual' | 'video' | 'ppt';

export interface TeamResult {
  contentType: TeamContentType;
  contentTitle: string;
  before: string;
  after: string;
  changes: string[];
  summary: string;
}

export interface VideoSegment {
  time: string;
  scene: string;
  narration: string;
  compliance?: string;
}

export interface VideoResult {
  title: string;
  segments: VideoSegment[];
  coverSuggestion?: string;
}

/** 根据脚本合成的视频方案（演示可为占位 MP4） */
export interface VideoRenderVersion {
  id: string;
  name: string;
  styleTag: string;
  description: string;
  duration: string;
  posterDataUrl: string;
  videoUrl: string;
  script?: VideoResult;
  isDemo?: boolean;
}

export interface PptSlide {
  page: number;
  title: string;
  bullets: string[];
  speakerNotes?: string;
  svg?: string;
  /** 演示模式预置幻灯片图片（public 静态资源路径） */
  imageUrl?: string;
}

export interface PptResult {
  slides: PptSlide[];
  title?: string;
}

export type PptOutlineSectionKind = 'cover' | 'toc' | 'section' | 'back';
export type PptOutlinePageKind = 'cover' | 'toc' | 'section-title' | 'content' | 'back';

export interface PptOutlinePage {
  id: string;
  title: string;
  bullets: string[];
  speakerNotes?: string;
  /** 页面可视化建议 */
  visualSuggestion?: string;
  /** 当前页面参考文献 */
  references?: string[];
  /** 封面 / 目录 / 章节标题页 / 正文 / 封底 */
  kind?: PptOutlinePageKind;
}

export interface ContentBrief {
  audience: string;
  scenario: string;
  format: string;
  goal: string;
  keyMessage: string;
  length: string;
  notes: string;
}

export interface PptOutlineChapter {
  id: string;
  title: string;
  pages: PptOutlinePage[];
  /** 封面 / 目录 / 内容节 / 封底，对应 PowerPoint 节 */
  kind?: PptOutlineSectionKind;
}

export interface PptOutline {
  title: string;
  audience: string;
  scenario: string;
  chapters: PptOutlineChapter[];
}

export interface PptDesignVersion {
  id: string;
  name: string;
  styleTag: string;
  description: string;
  slides: PptSlide[];
  coverDataUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface PosterResult {
  title: string;
  svg: string;
  dataUrl: string;
}

/** 与 generatedImages 下标对齐，标记配图所属文案 */
export interface GeneratedImageMeta {
  copyTitle: string;
  copyIndex: number;
  imageIndex: number;
}
