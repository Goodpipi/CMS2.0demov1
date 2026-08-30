import type {
  TopicItem,
  CopyItem,
  TeamResult,
  VideoResult,
  VideoRenderVersion,
  PptResult,
  PptOutline,
  PptDesignVersion,
  GeneratedImageMeta,
  ContentBrief,
} from '@/types/content';
import type {
  HotInsightReport,
  TopicRecommendationItem,
} from '@/lib/topicInsightAgent';
import type { HomeEntryContext } from '@/app/components/homeGuide';
import type { TaskProduct } from '@/lib/products';
import type { CopyRevision, ImageReviewStatus } from '@/types/review';
import type { ModificationTask } from '@/lib/modificationTasks';

export type TabKey =
  | 'insight'
  | 'topic-recommendation'
  | 'literature'
  | 'copy'
  | 'rich-text'
  | 'team'
  | 'visual'
  | 'video-script'
  | 'video-render'
  | 'ppt-outline'
  | 'ppt-design'
  | 'brief'
  | 'submit';

export interface ChatMessage {
  role: 'user' | 'ai';
  html: string;
  model: string;
  quick?: string[];
  /** 本地 Mock 图片消息，随会话持久化 */
  imageUrl?: string;
  imageTitle?: string;
  imageActionLabel?: string;
  imageAssetKey?: string;
  /** 生成中的占位消息，完成后移除 */
  loading?: boolean;
}

export interface SessionAppState {
  tabs: TabKey[];
  active: TabKey | null;
  insight: boolean;
  topicRecommendation: boolean;
  literature: boolean;
  copy: boolean;
  richText: boolean;
  team: boolean;
  visual: boolean;
  videoScript: boolean;
  videoRender: boolean;
  pptOutline: boolean;
  pptDesign: boolean;
  brief: boolean;
  submit: boolean;
}

export interface SessionWorkspace {
  state: SessionAppState;
  topics: TopicItem[];
  copies: CopyItem[];
  teamResult: TeamResult | null;
  videoResult: VideoResult | null;
  videoVersions: VideoRenderVersion[];
  selectedVideoVersionId: string | null;
  pptResult: PptResult | null;
  pptOutline: PptOutline | null;
  pptVersions: PptDesignVersion[];
  selectedPptVersionId: string | null;
  selectedPptTemplateId: string | null;
  contentBrief?: ContentBrief | null;
  richTextContent?: string;
  generatedImages: string[];
  generatedImageMeta?: GeneratedImageMeta[];
  /** 团队审阅前或上次采纳时的原图（与 generatedImages 下标对齐） */
  imageReviewOrigins?: string[];
  /** 每张配图的采纳状态（审阅者保存后为 pending） */
  imageReviewStatuses?: ImageReviewStatus[];
  selectedImages: boolean[];
  insightSummary: string;
  topicInsightReportText?: string;
  hotInsightReport: HotInsightReport | null;
  recommendedTopics: TopicRecommendationItem[];
  selectedTopics: boolean[];
  selectedCopies: boolean[];
  copyRevisions: CopyRevision[];
  copyRevisionBase: string;
  selectedProduct?: TaskProduct | null;
  /** 用户首次内容操作锁定的流程第二步 */
  flowEntry?: import('@/lib/contentFlow').ContentFlowEntry | null;
  entryContext: HomeEntryContext | null;
  pptWizard: {
    active: boolean;
    step: 'audience' | 'scenario' | 'path' | null;
    audience: string;
    scenario: string;
    pendingNote: string;
  } | null;
  videoWizard: {
    active: boolean;
    pendingNote: string;
  } | null;
  modificationTasks?: ModificationTask[];
  visualWizard: {
    active: boolean;
    step: 'count' | 'ask' | 'template';
    pendingNote: string;
    templateHint: string;
    imagesPerCopy?: number;
  } | null;
}

export type SessionStatus = 'draft' | 'in_progress' | 'team' | 'submitted';

export interface ChatSession {
  id: string;
  title: string;
  titleLocked: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  workspace: SessionWorkspace;
  /** 所属项目；未设置则在侧栏「未分组对话」中展示 */
  projectId?: string;
}
