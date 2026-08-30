import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as api from '@/lib/api';
import {
  isDemoMode,
  loadDemoScenario,
  type DemoScenario,
} from '@/lib/demoMode';
import {
  ACADEMIC_DEMO_BUTTONS,
  ACADEMIC_DEMO_TEXT,
  HCP_PPT_DEMO_BUTTONS,
  HCP_PPT_DEMO_TEXT,
  HCP_PPT_OUTLINE_01,
  HCP_PPT_RESULT_01,
  PATIENT_EDUCATION_VIDEO_SCRIPT_01,
  PATIENT_VIDEO_DEMO_BUTTONS,
  PATIENT_VIDEO_DEMO_TEXT,
  getPatientEducationVideoVersion,
  getAcademicDemoImage,
  type DemoScriptStep,
} from '@/lib/demoScenarioFlow';
import type {
  TopicItem,
  CopyItem,
  TeamContentType,
  TeamResult,
  VideoResult,
  VideoRenderVersion,
  PptResult,
  PptOutline,
  PptSlide,
  PptDesignVersion,
  GeneratedImageMeta,
  ContentBrief,
} from '@/types/content';
import {
  applyTabForModificationTarget,
  createMockModificationTasks,
  prunePageTasksThrough,
  pruneAssetTasksThrough,
  formatModificationTaskTime,
  isPptDesignModificationTask,
  isVisualModificationTask,
  MODIFICATION_TASK_FILTERS,
  MODIFICATION_TASK_STATUS_LABEL,
  type ModificationTask,
  type ModificationTaskFilter,
} from '@/lib/modificationTasks';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import {
  searchLiteratureMock,
  type LiteratureArticle,
} from '@/lib/literatureMocks';
import {
  MOCK_KV_VERSIONS,
  MOCK_POSTER_VERSIONS,
  createMockVisualTasks,
  isGenerateConferencePosterIntent,
  isGenerateKeyVisualIntent,
  type VisualAssetKey,
} from '@/lib/imageMocks';
import {
  TOPIC_INSIGHT_MOCK_REPORT,
  isTopicInsightGenerateIntent,
  ensureTopicInsightHtml,
  htmlToPlainText,
} from '@/lib/topicInsightMocks';
import { applyElementAiToSvg } from '@/lib/elementAiEdit';
import { SelectableSvgPreview, type SelectableSvgPreviewHandle, type SelectableSvgSelection } from '@/app/components/SelectableSvgPreview';
import {
  buildTeamReviewPayload,
  TEAM_CONTENT_LABELS,
  teamReviewSupported,
} from '@/app/components/teamReviewUtils';
import { buildVideoPosterDataUrl } from '@/app/components/videoUtils';
import { VisualEditor } from '@/app/components/VisualEditor';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import { PptOutlineEditor, PptOutlineGenerateFooter } from '@/app/components/PptOutlineEditor';
import { PptTemplatePickerModal } from '@/app/components/PptTemplatePickerModal';
import { VersionFisheyeTimeline, type VersionTimelineItem } from '@/app/components/VersionFisheyeTimeline';
import { ContentBriefPanel } from '@/app/components/ContentBriefPanel';
import {
  formatContentBriefText,
  generateContentBrief,
  isGenerateBriefIntent,
} from '@/lib/contentBrief';
import {
  pptTemplateIdFromTitle,
  applyPptTemplateImages,
  BLANK_PPT_TEMPLATE,
  catalogPptTemplates,
  isBlankPptTemplate,
  recommendPptTemplates,
  type PptBuiltinTemplate,
} from '@/app/components/pptTemplates';
import { getImageTemplate, getImageTemplatesByIds } from '@/app/components/imageTemplates';
import { ImageTemplatePickerModal } from '@/app/components/ImageTemplatePickerModal';
import { MaterialPickerModal, type PickedMaterial } from '@/app/components/MaterialPickerModal';
import { LiteraturePickerModal } from '@/app/components/LiteraturePickerModal';
import { ContentFlowNav } from '@/app/components/ContentFlowNav';
import {
  flowEntryFromTab,
  inferFlowEntryFromTabs,
  type ContentFlowEntry,
  type ContentFlowProgress,
  type ContentFlowStep,
} from '@/lib/contentFlow';
import { MaterialDetailModal } from '@/app/components/MaterialDetailModal';
import { MaterialContentPreview } from '@/app/components/MaterialContentPreview';
import { ContextMaterialsPanel } from '@/app/components/ContextMaterialsPanel';
import { CreationMethodModal } from '@/app/components/CreationMethodModal';
import type { LibraryItem } from '@/types/library';
import { materialAttachmentPill, isMaterialUsable } from '@/lib/libraryUtils';
import { assignCopyTopicTitles, ensureCopyCount, groupCopiesByTopic } from '@/lib/copyUtils';
import { groupImagesByCopy } from '@/lib/imageUtils';
import { buildPreviewFieldsFromTitle } from '@/lib/materialContent';
import {
  normalizeOutline,
  parseAudience,
  parseScenario,
  slideToPreviewUrl,
  ensureSlideSpeakerNotes,
  insertCenteredImageIntoSlide,
} from '@/app/components/pptUtils';
import { RoleSwitcher } from '@/app/components/RoleSwitcher';
import { BrandSwitcher } from '@/app/components/BrandSwitcher';
import { UserAccountMenu } from '@/app/components/UserAccountMenu';
import { LoginScreen } from '@/app/components/LoginScreen';
import { loadContentBrand, matchesBrand, saveContentBrand, type ContentBrand } from '@/lib/brands';
import {
  ACCOUNT_PROFILES,
  addTokenUsage,
  isSignedIn,
  setSignedIn,
} from '@/lib/userAccount';
import { BrandLogo } from '@/app/components/BrandLogo';
import { ReviewerHome } from '@/app/components/ReviewerHome';
import { CopyRevisionDisplay } from '@/app/components/CopyRevisionDisplay';
import { OpsImageReviewPanel } from '@/app/components/OpsImageReviewPanel';
import { alignImageReviewArrays } from '@/lib/imageReviewUtils';
import { parseFigmaCaptureId } from '@/lib/figmaCapture';
import { ReviewerVisualPanel } from '@/app/components/ReviewerVisualPanel';
import { RichTextEditor } from '@/app/components/RichTextEditor';
import { loadUserRole, saveUserRole, isReviewerRole } from '@/lib/userRole';
import {
  loadReviewTasks,
  upsertReviewTask,
  getReviewTask,
  tasksForRole,
  collectTaskStatusLabel,
  updateTaskStatus,
  seedReviewTasksIfEmpty,
  reviewerTabsForContentType,
  isCommentableContentType,
  reviewCommentScopeLabel,
  mergeSessionCopyRevisions,
  sessionCopyRevisionBase,
  propagateCopyRevisionsToSession,
  saveReviewTasks,
} from '@/lib/reviewTasks';
import { createCopyRevision, downloadDataUrl, latestCopyText, saveCopyRevisionMerged, normalizeCopyRevisions } from '@/lib/copyRevisionUtils';
import {
  HOT_INSIGHT_CATEGORY,
  WORKSPACE_QUICK_PROMPTS,
  TOPIC_INSIGHT_BRANCH_CHIPS,
  buildHotInsightReport,
  buildTopicRecommendations,
  downloadInsightReport,
  getTaskHotInsightMaterials,
  getTaskMaterials,
  isTopicInsightAgentIntent,
  recommendationsToTopicItems,
  reportTopicsToTopicItems,
  type HotInsightReport,
  type TopicRecommendationItem,
} from '@/lib/topicInsightAgent';
import { HotInsightReportPanel, TopicRecommendationPanel } from '@/app/components/TopicInsightPanels';
import type { UserRole, ReviewTask, PptReviewComment } from '@/types/review';
import { ROLE_PROFILES } from '@/types/review';
import type { CopyRevision, ImageReviewStatus } from '@/types/review';
import {
  detectHomeIntent,
  getEntryWelcome,
  getHomeInputGuidance,
  isPptEntryIntent,
  isVisualEntryIntent,
  shouldPreferVisualFlow,
  type HomeEntryContext,
  type HomeEntryIntent,
} from '@/app/components/homeGuide';
import {
  analyzeBrief,
  getMissingForPpt,
  guideImagesPerCopy,
  guideMissingFields,
  guideFlexibleWorkflow,
  guidePptDirectDone,
  guidePptPath,
  isPptDirectPath,
  isPptOutlinePath,
  isStartAction,
  isInsightQuickAction,
  parseImagesPerCopy,
  parseScenarioExplicit,
} from '@/app/components/conversationGuide';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { AmbientOrbs } from '@/app/components/shell/AmbientOrbs';
import { SparkleField } from '@/app/components/shell/SparkleField';
import { cn } from '@/app/components/ui/utils';
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  Library as LibraryIcon,
  Lightbulb,
  Eraser,
  Megaphone,
  MessageSquare,
  Mic,
  Microscope,
  Paintbrush,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Square,
  Stethoscope,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { LibraryMaterialCard } from '@/app/components/LibraryMaterialCard';
import { AssetLibraryPage } from '@/app/components/AssetLibraryPage';
import { ProductPickerModal } from '@/app/components/ProductPickerModal';
import type { TaskProduct } from '@/lib/products';
import { loadAllProjects } from '@/lib/chatProjects';
import {
  WORKSPACE_MOCK_IMAGE,
  WORKSPACE_MOCK_PPT,
  WORKSPACE_MOCK_PPT_EN,
  WORKSPACE_MOCK_PPT_OUTLINE,
  WORKSPACE_MOCK_PPT_OUTLINE_EN,
  WORKSPACE_MOCK_PPT_RESTYLED,
  WORKSPACE_MOCK_PPT_RESTYLED_EN,
  WORKSPACE_MOCK_RICH_TEXT,
} from '@/lib/workspaceMocks';
import {
  DEFAULT_SESSION_TITLE,
  DEMO_SESSION_ID,
  deleteSession,
  deriveSessionSubtitle,
  fallbackSessionTitle,
  formatSessionTime,
  getSession,
  loadAllSessions,
  saveSession,
  seedSessionsIfEmpty,
} from '@/lib/chatSessions';
import type {
  ChatMessage as Message,
  ChatSession,
  SessionAppState as AppState,
  TabKey,
} from '@/types/session';

const cats = ['热点洞察', '合规手册', '参考知识', '品牌策略', 'Brief', '模板', '品牌元素'];
const HOME_TASK_PAGE_SIZE = 7;

const HOME_WORKFLOW_ACTIONS: {
  title: string;
  description: string;
  scenes?: string[];
  intent: HomeEntryIntent;
  prompt: string;
  Icon: typeof Presentation;
  art: 'case' | 'promo' | 'evidence' | 'poster' | 'insight' | 'more';
}[] = [
  {
    title: '病例内容',
    description: '围绕真实诊疗场景梳理病例叙事，生成可用于科室沟通的结构化内容。',
    scenes: ['病例PPT', '病例推文', '病例卡'],
    intent: 'ppt',
    prompt: '生成病例内容',
    Icon: Stethoscope,
    art: 'case',
  },
  {
    title: '医学与推广内容',
    description: '结合品牌与合规要求，生成面向医生或公众的医学传播与推广素材。',
    scenes: [
      '医学PPT-HCP',
      '医学推文-HCP',
      '医学内容一图读懂-HCP',
      '市场推广PPT',
      '医学PPT-患者',
      '医学推文-患者',
      '医学内容一图读懂-患者',
      '内部培训PPT',
      '内部培训一图读懂',
      '话术总结',
    ],
    intent: 'copy',
    prompt: '生成医学与推广内容',
    Icon: Megaphone,
    art: 'promo',
  },
  {
    title: '学术证据解读',
    description: '把研究数据与关键结论转译为清晰、可引用的学术解读内容。',
    scenes: ['指南解读', '文献解读', '研究解读', '共识解读'],
    intent: 'ppt',
    prompt: '生成学术证据解读',
    Icon: Microscope,
    art: 'evidence',
  },
  {
    title: '会议海报',
    description: '按会议场景生成可编辑海报，突出主题、数据与视觉层次。',
    intent: 'visual',
    prompt: '生成会议海报',
    Icon: ImageIcon,
    art: 'poster',
  },
  {
    title: '话题洞察',
    description: '基于素材与渠道趋势，提炼可执行的话题方向与内容机会。',
    intent: 'insight',
    prompt: '基于素材生成话题洞察',
    Icon: Lightbulb,
    art: 'insight',
  },
  {
    title: '更多内容',
    description: '不限定形式，从空白任务开始，按你的描述自由生成各类内容。',
    intent: 'general',
    prompt: '',
    Icon: LayoutGrid,
    art: 'more',
  },
];

const initialLibrary: LibraryItem[] = [
  { id: 1, cat: '热点洞察', title: '小红书肾脏健康热点观察 2026-05', meta: 'CMS洞察 · 热点词/互动趋势', cms: true, def: true, addedAt: Date.now() - 9 * 86400000, validUntil: '2026-11-30', brand: '拜新同' },
  { id: 2, cat: '合规手册', title: '公众渠道疾病教育合规手册', meta: 'Word · 全局资料 · 最新版', cms: false, def: true, addedAt: Date.now() - 8 * 86400000 },
  { id: 3, cat: '参考知识', title: '肾脏健康疾病教育参考知识包', meta: 'PDF/Excel · 12条知识点', cms: false, def: true, addedAt: Date.now() - 7 * 86400000, brand: '拜新同' },
  { id: 4, cat: 'Brief', title: '2026 品牌沟通 Briefing', meta: 'PDF · 2.4MB · 本地上传', cms: false, def: true, addedAt: Date.now() - 6 * 86400000 },
  { id: 5, cat: '品牌策略', title: '心肾品牌策略要点 2026', meta: 'PPT · 品牌策略主线', cms: false, def: true, addedAt: Date.now() - 5 * 86400000, brand: '拜新同' },
  { id: 6, cat: '参考知识', title: 'Approved Claims Library', meta: 'CMS · Approved · 可追溯', cms: true, def: true, addedAt: Date.now() - 4 * 86400000, validUntil: '2027-04-30' },
  { id: 7, cat: '品牌元素', title: 'Bayer Blue-Green Visual Kit 2026', meta: 'CMS · Brand Kit · Approved', cms: true, def: true, addedAt: Date.now() - 3 * 86400000, validUntil: '2026-09-12' },
  { id: 8, cat: '参考知识', title: '患者教育手册:慢性肾病风险认知', meta: 'CMS · Approved · 2026-04-12', cms: true, def: false, addedAt: Date.now() - 2 * 86400000, validUntil: '2027-03-31', brand: '拜新同' },
  { id: 9, cat: '热点洞察', title: '公众平台高互动标题样本', meta: '本地上传 · 20条样本', cms: false, def: false, addedAt: Date.now() - 86400000, brand: '拜唐苹' },
  { id: 10, cat: '模板', title: 'EYLEA nAMD Meta分析 PPT 模板', meta: 'PPT 模板 · 16:9 · 3 页', cms: false, def: true, addedAt: Date.now() - 12 * 3600000 },
  { id: 11, cat: '参考知识', title: '2025 肾病科普素材包（已过期）', meta: 'CMS · Approved · 已过期', cms: true, def: true, addedAt: Date.now() - 40 * 86400000, validUntil: '2026-06-30', brand: '拜新同' },
  { id: 12, cat: '参考知识', title: '拜唐苹餐后血糖管理要点', meta: 'CMS · Approved · 糖尿病教育', cms: true, def: true, addedAt: Date.now() - 3 * 86400000, validUntil: '2027-01-31', brand: '拜唐苹' },
  { id: 13, cat: 'Brief', title: '拜唐苹患者教育 Brief 2026', meta: 'PDF · 患者沟通主线', cms: false, def: true, addedAt: Date.now() - 2 * 86400000, brand: '拜唐苹' },
  { id: 14, cat: '品牌策略', title: '优迈渠道沟通与合规要点', meta: 'PPT · 市场部策略', cms: false, def: true, addedAt: Date.now() - 4 * 86400000, brand: '优迈' },
  { id: 15, cat: '热点洞察', title: '优迈相关疾病教育话题观察', meta: 'CMS洞察 · 互动趋势', cms: true, def: true, addedAt: Date.now() - 36 * 3600000, validUntil: '2026-12-31', brand: '优迈' },
  { id: 16, cat: '参考知识', title: '爱格希临床证据速览', meta: 'CMS · Approved · 可追溯', cms: true, def: true, addedAt: Date.now() - 5 * 86400000, validUntil: '2027-02-28', brand: '爱格希' },
  { id: 17, cat: '热点洞察', title: '爱格希学术会议热点摘录', meta: '本地上传 · Congress notes', cms: false, def: false, addedAt: Date.now() - 18 * 3600000, brand: '爱格希' },
];

const tabNames = {
  insight: '话题洞察',
  'topic-recommendation': '话题推荐',
  literature: '推荐文献',
  copy: '文案生成',
  'rich-text': '图文',
  team: '团队修改',
  visual: '图片生成',
  'video-script': '视频脚本',
  'video-render': '视频生成',
  'ppt-outline': 'PPT大纲',
  'ppt-design': 'PPT生成',
  brief: 'Brief',
  submit: 'Veeva提交',
};

function comparableCopyText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function findCopyIndexByText(copies: CopyItem[], text: string): number {
  const target = comparableCopyText(text);
  if (!target) return -1;
  return copies.findIndex((copy) => comparableCopyText(copy.body) === target);
}

function findCopyIndexForRevision(
  copies: CopyItem[],
  revisionBase: string,
  revisions: CopyRevision[]
): number {
  const baseIndex = findCopyIndexByText(copies, revisionBase);
  if (baseIndex >= 0) return baseIndex;
  if (!revisionBase || revisions.length === 0) return -1;
  return findCopyIndexByText(copies, latestCopyText(revisionBase, revisions));
}

const posterData = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 560'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eaf7ff'/%3E%3Cstop offset='1' stop-color='%23f4fff0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='560' fill='url(%23g)'/%3E%3Ccircle cx='720' cy='110' r='100' fill='%2369BE28' opacity='.22'/%3E%3Ccircle cx='145' cy='115' r='82' fill='%231d6bff' opacity='.16'/%3E%3Cpath d='M560 360c90-100 190-85 260-28v228H520c-35-68-27-137 40-200z' fill='%2369BE28' opacity='.24'/%3E%3Crect x='54' y='46' width='118' height='42' rx='21' fill='%23103C8F'/%3E%3Ctext x='83' y='73' font-size='24' font-weight='700' fill='white'%3EBayer%3C/text%3E%3Ctext x='70' y='175' font-size='58' font-weight='900' fill='%23103C8F'%3E%E8%82%BE%E8%84%8F%E5%81%A5%E5%BA%B7%3C/text%3E%3Ctext x='70' y='248' font-size='58' font-weight='900' fill='%23103C8F'%3E%E4%B8%8D%E6%AD%A2%E7%9C%8B%E7%97%87%E7%8A%B6%3C/text%3E%3Ctext x='74' y='316' font-size='28' fill='%2340536a'%3E%E4%BA%86%E8%A7%A3%E9%A3%8E%E9%99%A9%E5%9B%A0%E7%B4%A0%EF%BC%8C%E5%87%BA%E7%8E%B0%E7%96%91%E9%97%AE%E6%97%B6%E8%AF%B7%E5%92%A8%E8%AF%A2%E4%B8%93%E4%B8%9A%E5%8C%BB%E7%94%9F%3C/text%3E%3Crect x='70' y='410' width='420' height='64' rx='32' fill='%23fff' stroke='%23cfe0f1'/%3E%3Ctext x='100' y='452' font-size='24' fill='%231d5aa7'%3E%E7%96%BE%E7%97%85%E6%95%99%E8%82%B2%E5%86%85%E5%AE%B9%EF%BD%9C%E4%BB%85%E4%BE%9B%E7%A7%91%E6%99%AE%E5%8F%82%E8%80%83%3C/text%3E%3C/svg%3E";

type Screen = 'home' | 'library' | 'assets' | 'workspace';

type EditorTarget =
  | { kind: 'image'; index: number }
  | { kind: 'ppt-slide'; index: number };

const emptyWorkspaceState = (): AppState => ({
  tabs: [],
  active: null,
  insight: false,
  topicRecommendation: false,
  literature: false,
  copy: false,
  richText: false,
  team: false,
  visual: false,
  videoScript: false,
  videoRender: false,
  pptOutline: false,
  pptDesign: false,
  brief: false,
  submit: false,
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeCat, setActiveCat] = useState(cats[0]);
  const [libCatFilter, setLibCatFilter] = useState('全部');
  const [library, setLibrary] = useState(initialLibrary);
  const [libSearch, setLibSearch] = useState('');
  const [libSelectedIds, setLibSelectedIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const voiceBaseRef = useRef('');
  const speech = useSpeechRecognition({
    lang: 'zh-CN',
    onFinal: (chunk) => {
      const piece = chunk.trim();
      if (!piece) return;
      const next = `${voiceBaseRef.current}${voiceBaseRef.current && !voiceBaseRef.current.endsWith(' ') ? ' ' : ''}${piece}`;
      voiceBaseRef.current = next;
      setInputValue(next);
    },
  });
  const [homeAgentIntent, setHomeAgentIntent] = useState<HomeEntryIntent | null>(null);
  const [selectedModel, setSelectedModel] = useState('GPT-5.5');
  /** 本次输入作用于当前页，还是全局（全部页面/内容） */
  const [promptEditScope, setPromptEditScope] = useState<'page' | 'global'>('page');
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [insightSummary, setInsightSummary] = useState('');
  const [hotInsightReport, setHotInsightReport] = useState<HotInsightReport | null>(null);
  const [recommendedTopics, setRecommendedTopics] = useState<TopicRecommendationItem[]>([]);
  const [literatureResults, setLiteratureResults] = useState<LiteratureArticle[]>([]);
  const [literatureSearching, setLiteratureSearching] = useState(false);
  const [addedLiteratureIds, setAddedLiteratureIds] = useState<string[]>([]);
  const [contentBrief, setContentBrief] = useState<ContentBrief | null>(null);
  const [topicInsightReportText, setTopicInsightReportText] = useState('');
  const [copies, setCopies] = useState<CopyItem[]>([]);
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [videoVersions, setVideoVersions] = useState<VideoRenderVersion[]>([]);
  const [selectedVideoVersionId, setSelectedVideoVersionId] = useState<string | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [draggingVideoId, setDraggingVideoId] = useState<string | null>(null);
  const [showVideoScriptEditModal, setShowVideoScriptEditModal] = useState(false);
  const [videoScriptDraft, setVideoScriptDraft] = useState('');
  const [videoScriptEditTargetId, setVideoScriptEditTargetId] = useState<string | null>(null);
  const [pptResult, setPptResult] = useState<PptResult | null>(null);
  const [pptOutline, setPptOutline] = useState<PptOutline | null>(null);
  const [pptVersions, setPptVersions] = useState<PptDesignVersion[]>([]);
  const [selectedPptVersionId, setSelectedPptVersionId] = useState<string | null>(null);
  const [selectedPptTemplateId, setSelectedPptTemplateId] = useState<string | null>(null);
  const [pptWizard, setPptWizard] = useState<{
    active: boolean;
    step: 'audience' | 'scenario' | 'path' | null;
    audience: string;
    scenario: string;
    pendingNote: string;
  } | null>(null);
  const [videoWizard, setVideoWizard] = useState<{
    active: boolean;
    pendingNote: string;
  } | null>(null);
  const [visualWizard, setVisualWizard] = useState<{
    active: boolean;
    step: 'count' | 'ask';
    pendingNote: string;
    templateHint: string;
    imagesPerCopy?: number;
  } | null>(null);
  const [imageTemplateModal, setImageTemplateModal] = useState<{
    pendingNote: string;
    templateHint: string;
    imagesPerCopy: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [demoScenario, setDemoScenario] = useState<DemoScenario>(() => loadDemoScenario());
  const [demoScriptStep, setDemoScriptStep] = useState<DemoScriptStep>('idle');
  const [state, setState] = useState<AppState>(emptyWorkspaceState());
  const [richTextContent, setRichTextContent] = useState('');
  const [guides, setGuides] = useState<string[]>(['基于默认素材生成话题洞察:']);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(() => loadUserRole());
  const [signedIn, setSignedInState] = useState(() => isSignedIn());
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<ContentBrand>(() => loadContentBrand());

  const handleBrandChange = (brand: ContentBrand) => {
    setCurrentBrand(brand);
    saveContentBrand(brand);
  };
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>(() => loadReviewTasks());
  const [activeReviewTaskId, setActiveReviewTaskId] = useState<string | null>(null);
  const [reviewPptPageIndex, setReviewPptPageIndex] = useState(0);
  const [reviewPptNotes, setReviewPptNotes] = useState<Record<number, PptReviewComment[]>>({});
  const [reviewPptNoteDraft, setReviewPptNoteDraft] = useState('');
  const [reviewPptNoteImageDraft, setReviewPptNoteImageDraft] = useState<string | null>(null);
  const [reviewerReplyDrafts, setReviewerReplyDrafts] = useState<Record<string, string>>({});
  const [reviewerReplyImageDrafts, setReviewerReplyImageDrafts] = useState<Record<string, string>>(
    {}
  );
  const [creatorRightTab, setCreatorRightTab] = useState<'ai' | 'tasks' | 'comments'>('ai');
  const [modificationTasks, setModificationTasks] = useState<ModificationTask[]>(() =>
    createMockModificationTasks()
  );
  const [modificationTaskFilter, setModificationTaskFilter] =
    useState<ModificationTaskFilter>('all');
  const [workspaceElementSel, setWorkspaceElementSel] = useState<{
    slideIndex: number;
    elementId: string;
    label: string;
    isText: boolean;
    svgMarkup: string;
  } | null>(null);
  const [workspaceElementBusy, setWorkspaceElementBusy] = useState(false);
  const [creatorReplyDrafts, setCreatorReplyDrafts] = useState<Record<string, string>>({});
  const [creatorReplyImageDrafts, setCreatorReplyImageDrafts] = useState<Record<string, string>>(
    {}
  );
  const [creatorPptPageIndex, setCreatorPptPageIndex] = useState(0);
  const [pptPageVersionEpoch, setPptPageVersionEpoch] = useState(0);
  const [previewedImageAssetKey, setPreviewedImageAssetKey] = useState<VisualAssetKey | null>(null);
  const [imagePageVersionEpoch, setImagePageVersionEpoch] = useState(0);
  const [copyRevisions, setCopyRevisions] = useState<CopyRevision[]>([]);
  const [copyRevisionBase, setCopyRevisionBase] = useState('');
  const [teamAssigneeRoles, setTeamAssigneeRoles] = useState<('medical' | 'marketing')[]>([]);
  const [editorSrc, setEditorSrc] = useState('');
  const [editorSvg, setEditorSvg] = useState<string | undefined>();
  const [modalContent, setModalContent] = useState({ title: '', body: '' });
  const [showModal, setShowModal] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedImageMeta, setGeneratedImageMeta] = useState<GeneratedImageMeta[]>([]);
  const [imageReviewOrigins, setImageReviewOrigins] = useState<string[]>([]);
  const [imageReviewStatuses, setImageReviewStatuses] = useState<ImageReviewStatus[]>([]);
  const [selectedImages, setSelectedImages] = useState<boolean[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<boolean[]>([true, true, false, false]);
  const [copyCountPerTopic, setCopyCountPerTopic] = useState(3);
  const [selectedCopies, setSelectedCopies] = useState<boolean[]>([true, false, false]);
  const [editingCopy, setEditingCopy] = useState('');
  const [showCopyEditModal, setShowCopyEditModal] = useState(false);
  const [teamModificationInProgress, setTeamModificationInProgress] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamReviewTarget, setTeamReviewTarget] = useState<TeamContentType | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskTitle, setTaskTitle] = useState(DEFAULT_SESSION_TITLE);
  const [titleLocked, setTitleLocked] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [homeHistoryTab, setHomeHistoryTab] = useState<'generate' | 'collect'>(() =>
    isReviewerRole(loadUserRole()) ? 'collect' : 'generate'
  );
  const [homeTaskPage, setHomeTaskPage] = useState(1);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState<ModificationTask | null>(null);
  const isHydratingRef = useRef(false);
  const autoTitleSessionRef = useRef<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCat, setPickerCat] = useState(cats[0]);
  const [pickerTarget, setPickerTarget] = useState<'workspace' | 'chat'>('workspace');
  const [pickerTab, setPickerTab] = useState<'upload' | 'cms'>('upload');
  const [pickerMode, setPickerMode] = useState<'manage' | 'reference'>('manage');
  const [previewMaterial, setPreviewMaterial] = useState<LibraryItem | null>(null);
  const [workspacePreviewMaterial, setWorkspacePreviewMaterial] = useState<LibraryItem | null>(null);
  const [creationMethodOpen, setCreationMethodOpen] = useState(false);
  const [openPickedMaterialInPreview, setOpenPickedMaterialInPreview] = useState(false);
  const [entryContext, setEntryContext] = useState<HomeEntryContext | null>(null);
  const [flowEntry, setFlowEntry] = useState<ContentFlowEntry | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<TaskProduct | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
  const pptImportInputRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef(state);
  const pptWizardRef = useRef(pptWizard);
  const videoWizardRef = useRef(videoWizard);
  const visualWizardRef = useRef(visualWizard);
  const lastAiRetryRef = useRef<(() => void) | null>(null);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingTopicInsightNoteRef = useRef('');
  const topicInsightUploadPendingRef = useRef(false);
  stateRef.current = state;
  pptWizardRef.current = pptWizard;
  videoWizardRef.current = videoWizard;
  visualWizardRef.current = visualWizard;

  const buildWorkspaceSnapshot = useCallback(
    () => ({
      state,
      topics,
      copies,
      teamResult,
      videoResult,
      videoVersions,
      selectedVideoVersionId,
      pptResult,
      pptOutline,
      pptVersions,
      selectedPptVersionId,
      selectedPptTemplateId,
      contentBrief,
      richTextContent,
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses,
      selectedImages,
      insightSummary,
      topicInsightReportText,
      hotInsightReport,
      recommendedTopics,
      selectedTopics,
      selectedCopies,
      copyRevisions,
      copyRevisionBase,
      selectedProduct,
      flowEntry,
      entryContext,
      pptWizard,
      videoWizard,
      visualWizard,
      modificationTasks,
    }),
    [
      state,
      topics,
      copies,
      teamResult,
      videoResult,
      videoVersions,
      selectedVideoVersionId,
      pptResult,
      pptOutline,
      pptVersions,
      selectedPptVersionId,
      selectedPptTemplateId,
      contentBrief,
      richTextContent,
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses,
      selectedImages,
      insightSummary,
      topicInsightReportText,
      hotInsightReport,
      recommendedTopics,
      selectedTopics,
      selectedCopies,
      copyRevisions,
      copyRevisionBase,
      selectedProduct,
      flowEntry,
      entryContext,
      pptWizard,
      videoWizard,
      visualWizard,
      modificationTasks,
    ]
  );

  const refreshSessionList = useCallback(() => {
    setSessions(loadAllSessions());
  }, []);

  const persistCurrentSession = useCallback(() => {
    if (!currentSessionId || isHydratingRef.current) return;
    const existing = getSession(currentSessionId);
    const session: ChatSession = {
      id: currentSessionId,
      title: taskTitle,
      titleLocked,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      messages,
      workspace: buildWorkspaceSnapshot(),
      projectId: existing?.projectId ?? activeProjectId ?? undefined,
    };
    saveSession(session);
    refreshSessionList();
  }, [
    currentSessionId,
    taskTitle,
    titleLocked,
    messages,
    buildWorkspaceSnapshot,
    refreshSessionList,
    activeProjectId,
  ]);

  const loadSessionIntoApp = useCallback((session: ChatSession) => {
    isHydratingRef.current = true;
    setCreatorPptPageIndex(0);
    setCreatorRightTab('ai');
    setPromptEditScope('page');
    setWorkspaceElementSel(null);
    setCurrentSessionId(session.id);
    setTaskTitle(session.title);
    const locked =
      session.titleLocked ||
      session.title.trim() !== DEFAULT_SESSION_TITLE;
    setTitleLocked(locked);
    autoTitleSessionRef.current = locked ? session.id : null;
    setMessages(session.messages);
    const w = session.workspace;
    const legacy = w.state as AppState & { video?: boolean };
    const normalizeTabKey = (t: string): TabKey => {
      if (t === 'video' || t === 'video-script') return 'video-render';
      return t as TabKey;
    };
    const normalizedTabs = [...new Set((legacy.tabs || []).map(normalizeTabKey))] as TabKey[];
    const normalizedActive =
      legacy.active === ('video' as TabKey) || legacy.active === 'video-script'
        ? 'video-render'
        : normalizeTabKey(legacy.active as string);
    const normalizedState: AppState = {
      ...legacy,
      tabs: normalizedTabs,
      videoScript: false,
      videoRender: legacy.videoRender ?? legacy.videoScript ?? Boolean(legacy.video),
      topicRecommendation: legacy.topicRecommendation ?? false,
      literature: legacy.literature ?? false,
      richText: legacy.richText ?? false,
      brief: legacy.brief ?? false,
      active: normalizedActive,
    };
    setState(normalizedState);
    setTopics(w.topics);
    setCopies(w.copies);
    setTeamResult(w.teamResult);
    setVideoResult(w.videoResult);
    setVideoVersions(w.videoVersions || []);
    setSelectedVideoVersionId(w.selectedVideoVersionId ?? null);
    setPptResult(w.pptResult);
    setPptOutline(w.pptOutline);
    setPptVersions(w.pptVersions);
    setSelectedPptVersionId(w.selectedPptVersionId);
    const storedPptTasks = (w.modificationTasks || []).filter(isPptDesignModificationTask);
    const hasPpt =
      Boolean(w.pptResult?.slides?.length) ||
      (w.pptVersions || []).some((version) => version.slides?.length);
    setModificationTasks((prev) => {
      const keepOthers = prev.filter((task) => !isPptDesignModificationTask(task));
      if (storedPptTasks.length) return [...keepOthers, ...storedPptTasks];
      if (hasPpt) return [...keepOthers, ...createMockModificationTasks()];
      return keepOthers;
    });
    setSelectedPptTemplateId(w.selectedPptTemplateId ?? null);
    setContentBrief(w.contentBrief ?? null);
    setRichTextContent(w.richTextContent ?? '');
    setGeneratedImages(w.generatedImages);
    setGeneratedImageMeta(w.generatedImageMeta ?? w.generatedImages?.map((_, i) => ({
      copyTitle: '综合内容',
      copyIndex: -1,
      imageIndex: i,
    })) ?? []);
    const imgCount = w.generatedImages?.length ?? 0;
    const { origins: loadedOrigins, statuses: loadedStatuses } = alignImageReviewArrays(
      w.generatedImages ?? [],
      w.imageReviewOrigins ?? [],
      w.imageReviewStatuses ?? []
    );
    setImageReviewOrigins(loadedOrigins);
    setImageReviewStatuses(loadedStatuses);
    setSelectedImages(
      w.selectedImages?.length === imgCount
        ? w.selectedImages
        : imgCount > 0
          ? w.generatedImages.map((_, i) => i === 0)
          : []
    );
    setInsightSummary(w.insightSummary);
    setTopicInsightReportText(w.topicInsightReportText ?? '');
    setHotInsightReport(w.hotInsightReport ?? null);
    setRecommendedTopics(w.recommendedTopics ?? []);
    setLiteratureResults([]);
    setAddedLiteratureIds([]);
    setSelectedTopics(w.selectedTopics);
    setSelectedCopies(w.selectedCopies);
    let revisions = w.copyRevisions || [];
    let revisionBase = w.copyRevisionBase || '';
    const sessionMerged = mergeSessionCopyRevisions(session.id);
    if (sessionMerged.length) {
      revisions = sessionMerged;
      revisionBase = sessionCopyRevisionBase(session.id) || revisionBase;
    }
    setCopyRevisions(
      revisions.length ? normalizeCopyRevisions(revisionBase, revisions) : []
    );
    setCopyRevisionBase(revisionBase);
    setSelectedProduct(w.selectedProduct ?? null);
    setFlowEntry(w.flowEntry ?? inferFlowEntryFromTabs(normalizedTabs));
    setEntryContext(w.entryContext);
    setPptWizard(w.pptWizard);
    setVideoWizard(w.videoWizard ?? null);
    setVisualWizard(w.visualWizard ?? null);
    setAttachments([]);
    setInputValue('');
    setSelectedPrompt('');
    requestAnimationFrame(() => {
      isHydratingRef.current = false;
    });
  }, []);

  const getActiveCopyBody = useCallback(() => {
    if (teamResult?.after) return teamResult.after;
    const idx = selectedCopies.findIndex(Boolean);
    const copy = copies[idx >= 0 ? idx : 0];
    return copy?.body || '';
  }, [teamResult, selectedCopies, copies]);

  const getSelectedCopyTargets = useCallback(() => {
    return copies
      .map((copy, copyIndex) => ({ copy, copyIndex }))
      .filter(({ copyIndex }) => selectedCopies[copyIndex]);
  }, [copies, selectedCopies]);

  const buildTeamPayload = useCallback(
    (type: TeamContentType) =>
      buildTeamReviewPayload(type, {
        copies,
        selectedCopies,
        getCopyBody: getActiveCopyBody,
        richTextContent,
        generatedImages,
        selectedImages,
        videoResult,
        pptOutline,
        pptResult,
      }),
    [
      copies,
      selectedCopies,
      getActiveCopyBody,
      richTextContent,
      generatedImages,
      selectedImages,
      videoResult,
      pptOutline,
      pptResult,
    ]
  );

  const resolveTeamReviewType = (text: string, activeTab: TabKey | null): TeamContentType => {
    if (text.includes('图文') || text.includes('富文本')) return 'rich-text';
    if (text.includes('图片') || text.includes('配图') || text.includes('海报')) return 'visual';
    if (text.includes('视频')) {
      if (activeTab === 'video-render') return 'video';
      return 'copy';
    }
    if (text.includes('PPT') || text.includes('ppt')) {
      if (activeTab === 'ppt-design') return 'ppt';
      return 'copy';
    }
    if (activeTab === 'visual') return 'visual';
    if (activeTab === 'video-render') return 'video';
    if (activeTab === 'ppt-design') return 'ppt';
    if (activeTab === 'rich-text') return 'rich-text';
    return 'copy';
  };

  const openTeamReview = useCallback(
    (type: TeamContentType) => {
      if (!teamReviewSupported(type, stateRef.current.active)) {
        toast(
          type === 'video'
            ? '请先在「视频生成」中生成视频后再提交团队意见收集'
            : 'PPT 大纲阶段不支持团队修改，请生成 PPT 后在「PPT生成」中提交'
        );
        return;
      }
      if (type === 'visual' && generatedImages.length === 0) {
        toast('请先生成图片后再提交团队意见收集');
        return;
      }
      const payload = buildTeamPayload(type);
      if (!payload) {
        toast(`请先生成${TEAM_CONTENT_LABELS[type]}后再提交团队意见收集`);
        return;
      }
      setTeamReviewTarget(type);
      setTeamAssigneeRoles([]);
      setShowTeamModal(true);
    },
    [buildTeamPayload, generatedImages]
  );

  const toggleTeamAssigneeRole = (role: 'medical' | 'marketing') => {
    setTeamAssigneeRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const setAllTeamAssigneeRoles = (checked: boolean) => {
    setTeamAssigneeRoles(checked ? ['medical', 'marketing'] : []);
  };

  const buildContentBrief = useCallback(
    (userNote = '') => {
      const copy = getActiveCopyBody();
      if (copy.trim().length > 20) {
        return { brief: userNote ? `${copy}\n\n补充要求：${userNote}` : copy, sufficient: true };
      }
      const topicStr = topics
        .filter((_, i) => selectedTopics[i] !== false)
        .map((t) => t.title)
        .filter(Boolean)
        .join('；');
      if (topicStr) {
        const brief = `主题方向：${topicStr}${userNote ? `\n要求：${userNote}` : ''}`;
        return { brief, sufficient: true };
      }
      const recentUser = messages
        .filter((m) => m.role === 'user')
        .slice(-4)
        .map((m) => m.html.replace(/<[^>]+>/g, ''))
        .join('\n');
      const mats = library
        .filter((m) => isMaterialUsable(m))
        .map((m) => `[${m.cat}] ${m.title}`)
        .join('\n');
      const brief = [userNote, recentUser, mats ? `引用素材：\n${mats}` : '']
        .filter(Boolean)
        .join('\n\n');
      const sufficient = brief.trim().length >= 24;
      return {
        brief: sufficient ? brief : brief || '肾脏健康疾病教育｜小红书公众渠道',
        sufficient: sufficient || brief.trim().length >= 12,
      };
    },
    [getActiveCopyBody, topics, selectedTopics, messages, library]
  );

  const getRecentUserContext = useCallback(
    (extra = '') => {
      const fromMsgs = messages
        .filter((m) => m.role === 'user')
        .slice(-6)
        .map((m) => m.html.replace(/<[^>]+>/g, ''))
        .join('\n');
      return [fromMsgs, extra].filter(Boolean).join('\n');
    },
    [messages]
  );

  const guideForMoreInfo = (taskLabel: string, userNote = '') => {
    const context = getRecentUserContext(userNote);
    const analysis = analyzeBrief(context);
    const missing: string[] = [];
    if (taskLabel.includes('PPT')) {
      missing.push(...getMissingForPpt(context));
    } else if (!analysis.isSubstantial) {
      if (!analysis.audience) missing.push('受众');
      if (!analysis.channel && !context.includes('渠道')) missing.push('渠道或用途');
    }
    const guide = guideMissingFields(taskLabel, missing);
    addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
  };

  const showFlexibleWorkflowGuide = () => {
    const guide = guideFlexibleWorkflow();
    addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
  };

  const dispatchUserIntent = (text: string, skipUserMsg = false) => {
    const lower = text.toLowerCase();
    if (/自由探索|随便看看|还没想好|不知道做什么/.test(text)) {
      showFlexibleWorkflowGuide();
      return;
    }
    if (/标准流程|完整流程|从洞察开始/.test(text)) {
      runInsight(text, { skipUserMsg });
      return;
    }
    if (/直接生成PPT|直接做PPT/i.test(text)) {
      startPptFlow(text, { skipUserMsg, path: 'direct' });
      return;
    }
    if (/直接生成视频|直接做视频/.test(text)) {
      startVideoFlow(text, { skipUserMsg });
      return;
    }
    if (/先大纲后PPT|先大纲后生成PPT/i.test(text)) {
      startPptFlow(text, { skipUserMsg, path: 'outline' });
      return;
    }
    if (isStartAction(text) || text.includes('开始生成')) {
      if (isPptEntryIntent(entryContext) || text.includes('PPT') || text.includes('ppt')) {
        startPptFlow(text, { skipUserMsg });
        return;
      }
      if (isInsightQuickAction(text) || entryContext?.intent === 'insight' || text.includes('洞察')) {
        runInsight(text, { skipUserMsg });
        return;
      }
      if (entryContext?.intent === 'copy' || text.includes('文案')) {
        runCopy(text, { skipUserMsg });
        return;
      }
      if (isVisualEntryIntent(entryContext) || text.includes('配图') || text.includes('图片')) {
        startVisualFlow(text, { skipUserMsg });
        return;
      }
      if (entryContext?.intent === 'video' || text.includes('视频')) {
        startVideoFlow(text, { skipUserMsg });
        return;
      }
    }
    if (isTopicInsightAgentIntent(text)) {
      runTopicInsightAgent(text, { skipUserMsg });
      return;
    }
    if (isInsightQuickAction(text)) {
      runTopicInsightAgent(text, { skipUserMsg });
      return;
    }
    if ((text.includes('话题') || lower.includes('topic')) && text.includes('洞察')) {
      runTopicInsightAgent(text, { skipUserMsg });
    } else if (text.includes('文案') || lower.includes('copy')) {
      runCopy(text, { skipUserMsg });
    } else if (text.includes('团队') && text.includes('修改')) {
      if (text.includes('整合') || text.includes('反馈')) {
        runTeam({ skipUserMsg, feedback: text });
      } else {
        openTeamReview(resolveTeamReviewType(text, stateRef.current.active));
      }
    } else if (
      text.includes('图片') ||
      text.includes('配图') ||
      text.includes('海报') ||
      lower.includes('image') ||
      lower.includes('visual')
    ) {
      startVisualFlow(text, { skipUserMsg });
    } else if (text.includes('视频') || lower.includes('video')) {
      startVideoFlow(text, { skipUserMsg });
    } else if (text.includes('PPT') || text.includes('ppt')) {
      startPptFlow(text, { skipUserMsg });
    } else if (text.includes('Veeva') || text.includes('veeva') || text.includes('审批') || text.includes('提交')) {
      runSubmit({ skipUserMsg });
    } else {
      void runWithAi('正在思考', async () => {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.html.replace(/<[^>]+>/g, ''),
        }));
        const { reply } = await api.chat(library, history, text);
        addMsg('ai', reply.replace(/\n/g, '<br>'), 'DeepSeek-V3.1', nextPrompts());
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isDemoMode()) {
        if (!cancelled) setApiReady(true);
        return;
      }
      try {
        const h = await api.waitForApiHealth();
        if (!cancelled) setApiReady(h.deepseekConfigured ?? false);
      } catch {
        if (!cancelled) setApiReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const toast = (text: string) => {
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  const closeTransientInteractionLayers = useCallback(() => {
    setDrawerOpen(false);
    setEditorSrc('');
    setEditorSvg(undefined);
    setEditorTarget(null);
    setPickerOpen(false);
    setPreviewMaterial(null);
    setShowModal(false);
    setShowCopyEditModal(false);
    setShowTeamModal(false);
    setTeamAssigneeRoles([]);
    setDeleteConfirm(null);
    setImageTemplateModal(null);
    setShowVideoScriptEditModal(false);
    setVideoScriptEditTargetId(null);
  }, []);

  const stopDemoScriptPlayback = useCallback(() => {
    demoTimersRef.current.forEach((timer) => clearTimeout(timer));
    demoTimersRef.current = [];
    setMessages((prev) => prev.filter((m) => !m.loading));
    setIsGenerating(false);
    setDemoScriptStep('idle');
  }, []);

  const goToHome = useCallback(() => {
    stopDemoScriptPlayback();
    closeTransientInteractionLayers();
    setCurrentScreen('home');
  }, [closeTransientInteractionLayers, stopDemoScriptPlayback]);

  const openSession = useCallback(
    (id: string) => {
      stopDemoScriptPlayback();
      closeTransientInteractionLayers();
      const session = getSession(id);
      if (!session) {
        toast('会话不存在或已被删除');
        refreshSessionList();
        return;
      }
      setActiveProjectId(session.projectId ?? null);
      setCurrentScreen('workspace');
      loadSessionIntoApp(session);
    },
    [closeTransientInteractionLayers, loadSessionIntoApp, refreshSessionList, stopDemoScriptPlayback]
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTransientInteractionLayers();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeTransientInteractionLayers]);

  const handleDeleteSession = () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    deleteSession(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setCurrentScreen('home');
    }
    refreshSessionList();
    setDeleteConfirm(null);
    toast('对话已删除');
  };

  const commitTitleEdit = () => {
    setIsEditingTitle(false);
    setTitleLocked(true);
    if (currentSessionId) autoTitleSessionRef.current = currentSessionId;
    const trimmed = taskTitle.trim() || DEFAULT_SESSION_TITLE;
    setTaskTitle(trimmed);
  };

  const applyAutoSessionTitle = (title: string, sessionId: string) => {
    if (autoTitleSessionRef.current === sessionId) return;
    setTaskTitle(title);
    setTitleLocked(true);
    autoTitleSessionRef.current = sessionId;
  };

  useEffect(() => {
    seedReviewTasksIfEmpty();
    setReviewTasks(loadReviewTasks());
    setSessions(seedSessionsIfEmpty());
  }, []);

  useEffect(() => {
    const syncReviewTasks = () => setReviewTasks(loadReviewTasks());
    window.addEventListener('focus', syncReviewTasks);
    window.addEventListener('storage', syncReviewTasks);
    return () => {
      window.removeEventListener('focus', syncReviewTasks);
      window.removeEventListener('storage', syncReviewTasks);
    };
  }, []);

  useEffect(() => {
    if (!activeReviewTaskId) return;
    const task = reviewTasks.find((item) => item.id === activeReviewTaskId);
    if (!task || !isCommentableContentType(task.contentType)) return;
    setReviewPptNotes(
      (task.pptComments || []).reduce<Record<number, PptReviewComment[]>>((grouped, comment) => {
        grouped[comment.pageIndex] = [...(grouped[comment.pageIndex] || []), comment];
        return grouped;
      }, {})
    );
  }, [activeReviewTaskId, reviewTasks]);

  const refreshReviewTasks = useCallback(() => {
    setReviewTasks(loadReviewTasks());
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    saveUserRole(role);
    setActiveReviewTaskId(null);
    setCreatorRightTab('ai');
    setHomeHistoryTab(isReviewerRole(role) ? 'collect' : 'generate');
    refreshReviewTasks();
    if (role === 'ops') {
      if (currentSessionId && (copies.length > 0 || copyRevisions.length > 0)) {
        setCurrentScreen('workspace');
        setState((prev) => ({
          ...prev,
          active: 'copy',
          tabs: prev.tabs.includes('copy') ? prev.tabs : ['copy', ...prev.tabs],
        }));
      } else {
        setCurrentScreen('home');
      }
    }
  };

  const handleLogin = (role: UserRole) => {
    setSignedIn(true);
    setSignedInState(true);
    setUserRole(role);
    saveUserRole(role);
    setActiveReviewTaskId(null);
    setCreatorRightTab('ai');
    setHomeHistoryTab(isReviewerRole(role) ? 'collect' : 'generate');
    refreshReviewTasks();
    setCurrentScreen('home');
    toast(`已登录「${ACCOUNT_PROFILES[role].name} · ${ACCOUNT_PROFILES[role].dept}」`);
  };

  const confirmLogout = () => {
    setSignedIn(false);
    setSignedInState(false);
    setActiveReviewTaskId(null);
    setCurrentScreen('home');
    toast('已登出当前账号');
  };

  useEffect(() => {
    persistCurrentSession();
  }, [persistCurrentSession]);

  useEffect(() => {
    if (!currentSessionId || titleLocked || isHydratingRef.current) return;
    if (autoTitleSessionRef.current === currentSessionId) return;
    const hasUser = messages.some((m) => m.role === 'user');
    const ready = hasUser && (messages.length >= 2 || state.tabs.length > 0);
    if (!ready) return;

    const sessionId = currentSessionId;
    const timer = setTimeout(() => {
      void (async () => {
        if (autoTitleSessionRef.current === sessionId) return;
        try {
          const payload = messages.slice(-12).map((m) => ({
            role: m.role,
            content: m.html.replace(/<[^>]+>/g, ''),
          }));
          const { title } = await api.generateSessionTitle(payload);
          if (title && currentSessionId === sessionId) {
            applyAutoSessionTitle(title, sessionId);
          }
        } catch {
          if (currentSessionId === sessionId && autoTitleSessionRef.current !== sessionId) {
            applyAutoSessionTitle(fallbackSessionTitle(messages), sessionId);
          }
        }
      })();
    }, 2200);

    return () => clearTimeout(timer);
    // 仅在新对话首次满足条件时命名一次；后续 messages 变化不再触发
    // eslint-disable-next-line react-hooks/exhaustive-deps -- titleLocked / ref 负责阻断重复命名
  }, [messages.length, state.tabs.length, currentSessionId, titleLocked]);

  const deleteKnowledgeItem = (id: number) => {
    const item = library.find((entry) => entry.id === id);
    setLibrary((prev) => prev.filter((entry) => entry.id !== id));
    setLibSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    if (previewMaterial?.id === id) setPreviewMaterial(null);
    if (workspacePreviewMaterial?.id === id) setWorkspacePreviewMaterial(null);
    toast(item ? `已删除「${item.title}」` : '知识已删除');
  };

  const simulateUpload = () => {
    const title = `${activeCat}｜新上传资料.pdf`;
    setLibrary(prev => [{
      id: Date.now(),
      cat: activeCat,
      title,
      meta: '本地上传 · 刚刚 · 已解析',
      cms: false,
      def: false,
      brand: currentBrand,
      addedAt: Date.now(),
      fileName: '新上传资料.pdf',
      ...buildPreviewFieldsFromTitle(title, false),
    }, ...prev]);
    toast('素材已上传到 ' + activeCat);
  };

  const simulateCmsSearch = () => {
    const title = `CMS搜索结果｜${activeCat}相关已审批素材`;
    setLibrary(prev => [{
      id: Date.now(),
      cat: activeCat,
      title,
      meta: 'CMS · Approved · 刚刚加入候选',
      cms: true,
      def: false,
      brand: currentBrand,
      addedAt: Date.now(),
      validUntil: '2027-07-31',
      ...buildPreviewFieldsFromTitle(title, true),
    }, ...prev]);
    toast('已从 CMS 加入候选素材');
  };

  const startFromHome = (ctx: HomeEntryContext, prompt = '', opts?: { silent?: boolean }) => {
    setCurrentScreen('workspace');
    const trimmed = prompt.trim();
    reset('', ctx, {
      ...(trimmed ? { homeDraft: trimmed } : {}),
      ...(opts?.silent ? { silent: true } : {}),
    });
  };

  const newTask = (_prompt = '', intent: HomeEntryIntent = 'general') => {
    startFromHome({ intent }, '');
    setProductPickerOpen(true);
  };

  const confirmTaskProduct = (product: TaskProduct) => {
    setSelectedProduct(product);
    setProductPickerOpen(false);
    toast(`已选择产品「${product.name}」`);
  };

  const cancelTaskProduct = () => {
    setProductPickerOpen(false);
    setSelectedProduct(null);
    goToHome();
  };

  const createNewContentFromHome = () => {
    setCreationMethodOpen(false);
    setHomeAgentIntent(null);
    setWorkspacePreviewMaterial(null);
    setInputValue('');
    newTask('', 'general');
  };

  const openCmsFileFromHome = () => {
    setCreationMethodOpen(false);
    setOpenPickedMaterialInPreview(true);
    openMaterialPicker('workspace', '参考知识', 'cms');
  };

  const showLocalMockPptPreview = (fileName: string) => {
    setCreationMethodOpen(false);
    const text = inputValue.trim();
    setHomeAgentIntent(null);
    if (currentScreen !== 'workspace' || !currentSessionId) {
      startFromHome({ intent: 'ppt' }, text, { silent: true });
    }
    setWorkspacePreviewMaterial(null);
    setPptOutline(WORKSPACE_MOCK_PPT_OUTLINE);
    setPptVersions([WORKSPACE_MOCK_PPT]);
    setSelectedPptVersionId(WORKSPACE_MOCK_PPT.id);
    setPptResult({
      title: WORKSPACE_MOCK_PPT_OUTLINE.title,
      slides: WORKSPACE_MOCK_PPT.slides,
    });
    seedPptVersionMocks();
    setState({
      ...emptyWorkspaceState(),
      tabs: ['ppt-design'],
      active: 'ppt-design',
      pptOutline: true,
      pptDesign: true,
    });
    addMsg(
      'ai',
      `已打开本地文件「${fileName}」，中间区域已展示内置 Mock PPT，共 ${WORKSPACE_MOCK_PPT.slides.length} 页。`,
      '本地 Mock'
    );
  };

  const handleCreationFileSelected = (file: File) => {
    showLocalMockPptPreview(file.name);
    const now = Date.now();
    const item: LibraryItem = {
      id: now,
      cat: '参考知识',
      title: file.name,
      meta: `本地文件 · ${(file.size / 1024).toFixed(0)}KB · 使用内置 PPT 预览`,
      cms: false,
      def: false,
      referenced: true,
      addedAt: now,
      fileName: file.name,
      contentType: 'text',
      contentText: `已选择本地文件「${file.name}」。当前演示环境统一使用内置 Mock PPT 进行预览。`,
      mimeType: file.type,
    };
    setLibrary((prev) => [item, ...prev]);
    toast(`已打开「${file.name}」并展示内置 PPT`);
  };

  const openExistingTask = (sessionId = DEMO_SESSION_ID) => {
    openSession(sessionId);
  };

  const getComposerPlaceholder = () => {
    if (workspaceElementSel) {
      const scopeHint = promptEditScope === 'page' ? '仅当前页' : '全部页面同款元素';
      return workspaceElementSel.isText
        ? `修改「${workspaceElementSel.label}」（${scopeHint}）：例如改成「核心信息」、字号加大…`
        : `修改「${workspaceElementSel.label}」（${scopeHint}）：例如换成绿色、缩小一点…`;
    }
    if (promptEditScope === 'page') {
      return `针对第 ${creatorPptPageIndex + 1} 页说明要改什么…`;
    }
    const ctx = entryContext;
    if (!ctx) return '全局修改：说明要对全部内容做的调整…';
    switch (ctx.intent) {
      case 'insight':
        return '描述你想洞察的主题，如渠道、疾病领域、受众…';
      case 'copy':
        return '描述文案类型、受众与核心信息…';
      case 'visual':
      case 'visual-template':
        return '描述要生成的图片主题、风格与用途…';
      case 'video':
        return '描述视频主题、受众与时长偏好…';
      case 'ppt':
      case 'ppt-template':
        return '描述 PPT 受众、场景与核心内容…';
      default:
        return '直接说你想做什么…';
    }
  };

  const formatScopedUserPrompt = useCallback(
    (text: string) => {
      if (promptEditScope === 'global') {
        return `【全局】${text}`;
      }
      const pageNo =
        (workspaceElementSel?.slideIndex ?? creatorPptPageIndex) + 1;
      return `【单页 · 第 ${pageNo} 页】${text}`;
    },
    [promptEditScope, workspaceElementSel, creatorPptPageIndex]
  );

  const reset = (
    initialPrompt = '',
    entry?: HomeEntryContext,
    opts?: { homeDraft?: string; attachedMaterials?: LibraryItem[]; silent?: boolean }
  ) => {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setCurrentSessionId(sessionId);
    setTitleLocked(false);
    setTaskTitle(DEFAULT_SESSION_TITLE);
    autoTitleSessionRef.current = null;
    setMessages([]);
    setState(emptyWorkspaceState());
    setDemoScriptStep('idle');
    setGuides([]);
    setAttachments([]);
    setSelectedPrompt('');
    setInputValue(opts?.homeDraft ?? initialPrompt);
    setGeneratedImages([]);
    setImageReviewOrigins([]);
    setImageReviewStatuses([]);
    setSelectedImages([]);
    setTopics([]);
    setCopies([]);
    setTeamResult(null);
    setVideoResult(null);
    setVideoVersions([]);
    setSelectedVideoVersionId(null);
    setSelectedVideoIds([]);
    setDraggingVideoId(null);
    setShowVideoScriptEditModal(false);
    setVideoScriptDraft('');
    setVideoScriptEditTargetId(null);
    setPptResult(null);
    setPptOutline(null);
    setPptVersions([]);
    setSelectedPptVersionId(null);
    setModificationTasks((prev) => prev.filter((task) => !isPptDesignModificationTask(task)));
    setCreatorPptPageIndex(0);
    setCreatorRightTab('ai');
    setPromptEditScope('page');
    setWorkspaceElementSel(null);
    setRichTextContent('');
    setSelectedPptTemplateId(
      entry?.intent === 'ppt-template' && entry.templateTitle
        ? pptTemplateIdFromTitle(entry.templateTitle)
        : null
    );
    setPptWizard(null);
    setVideoWizard(null);
    setVisualWizard(null);
    setInsightSummary('');
    setHotInsightReport(null);
    setRecommendedTopics([]);
    setLiteratureResults([]);
    setAddedLiteratureIds([]);
    setContentBrief(null);
    setSelectedTopics([]);
    setSelectedCopies([]);
    setCopyRevisions([]);
    setCopyRevisionBase('');
    setWorkspacePreviewMaterial(null);
    setSelectedProduct(null);
    setFlowEntry(null);
    pendingTopicInsightNoteRef.current = '';
    topicInsightUploadPendingRef.current = false;
    const apiHint =
      apiReady === false
        ? '<br><span style="color:#b72c3e">⚠ 未检测到 DeepSeek API Key，请在项目根目录配置 .env 后重启服务。</span>'
        : '';

    if (opts?.silent) {
      const ctx = entry || { intent: 'general' as const };
      setEntryContext(ctx);
      return;
    }

    if (opts?.homeDraft) {
      const detected = detectHomeIntent(opts.homeDraft);
      const guidance = getHomeInputGuidance(opts.homeDraft, detected);
      const suggestedIntent = guidance.suggestedIntent as HomeEntryIntent;
      const ctx: HomeEntryContext = {
        intent: suggestedIntent,
        templateTitle: entry?.templateTitle,
      };
      setEntryContext(ctx);
      addMsg('user', opts.homeDraft, selectedModel);
      addMsg('ai', `${guidance.html}${apiHint}`, 'DeepSeek-V3.1', guidance.chips);
    } else if (opts?.attachedMaterials?.length) {
      const ctx = entry || { intent: 'general' as const };
      setEntryContext(ctx);
      setAttachments(opts.attachedMaterials.map(materialAttachmentPill));
      const titles = opts.attachedMaterials.map((m) => m.title).join('、');
      const welcome = getEntryWelcome(ctx);
      addMsg(
        'ai',
        `已创建新对话，并带入 ${opts.attachedMaterials.length} 项素材：${titles}。默认素材仍会参与生成。<br>${welcome.html}${apiHint}`,
        'DeepSeek-V3.1',
        welcome.chips
      );
    } else {
      const ctx = entry || { intent: 'general' as const };
      setEntryContext(ctx);
      const welcome = getEntryWelcome(ctx);
      addMsg('ai', `${welcome.html}${apiHint}`, 'DeepSeek-V3.1', welcome.chips);
    }

  };

  const addMsg = (role: 'user' | 'ai', html: string, model = '用户', quick: string[] = []) => {
    setMessages(prev => [...prev, { role, html, model: role === 'ai' ? 'GPT-5.5' : model, quick }]);
  };

  const openMockImageInPreview = (
    imageUrl: string,
    title: string,
    assetKey?: VisualAssetKey
  ) => {
    const now = Date.now();
    const isRaster = /\.png|\.jpe?g|\.webp|image\/png|image\/jpeg/i.test(imageUrl);
    setWorkspacePreviewMaterial({
      id: now,
      cat: '生成图片',
      title,
      meta: '本地 Mock 数据 · 可预览版本并修改',
      cms: false,
      def: false,
      addedAt: now,
      fileName: `${title}${isRaster ? '.png' : '.svg'}`,
      contentType: 'image',
      contentUrl: imageUrl,
      mimeType: isRaster ? 'image/png' : 'image/svg+xml',
    });
    setGeneratedImages((prev) => (prev.includes(imageUrl) ? prev : [...prev, imageUrl]));
    setGeneratedImageMeta((prev) =>
      prev.some((item) => item.copyTitle === title)
        ? prev
        : [...prev, { copyTitle: title, copyIndex: -1, imageIndex: prev.length }]
    );
    setSelectedImages((prev) => [...prev, true].slice(0, Math.max(prev.length + 1, 1)));
    setPreviewedImageAssetKey(assetKey || null);
    setImagePageVersionEpoch((value) => value + 1);
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('visual') ? prev.tabs : [...prev.tabs, 'visual'],
      active: 'visual',
      visual: true,
    }));
  };

  const publishChatImage = (opts: {
    html: string;
    imageUrl: string;
    imageTitle: string;
    assetKey: VisualAssetKey;
  }) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        html: opts.html,
        model: '本地 Mock',
        imageUrl: opts.imageUrl,
        imageTitle: opts.imageTitle,
        imageActionLabel: '修改此图片',
        imageAssetKey: opts.assetKey,
      },
    ]);
  };

  const seedVisualTasks = (assetKey: VisualAssetKey) => {
    const seeded = createMockVisualTasks(assetKey);
    setModificationTasks((prev) => [
      ...prev.filter((task) => task.assetKey !== assetKey),
      ...seeded,
    ]);
  };

  const runLiteratureSearch = (query: string, opts?: { reshuffle?: boolean; silent?: boolean }) => {
    const results = searchLiteratureMock(query, { reshuffle: opts?.reshuffle });
    setLiteratureResults(results);
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('literature') ? prev.tabs : [...prev.tabs, 'literature'],
      active: 'literature',
      literature: true,
    }));
    if (opts?.silent) return;
    const sources = [...new Set(results.map((item) => item.source))].join('、');
    const basedOnAttachments =
      attachments.length > 0
        ? `已结合当前 ${attachments.length} 个附件完成文献检索`
        : '已根据检索意图完成文献检索';
    addMsg(
      'ai',
      `${basedOnAttachments}，来源覆盖 <strong>${sources}</strong>，共推荐 <strong>${results.length}</strong> 篇文献。请在中间「推荐文献」中查看刊物、年份、标题、摘要与来源，并将合适文献添加到当前任务。`,
      '文献检索'
    );
  };

  const GENERATED_BRIEF_ID = -4100;

  const syncBriefToLibrary = (brief: ContentBrief) => {
    const text = formatContentBriefText(brief);
    const item: LibraryItem = {
      id: GENERATED_BRIEF_ID,
      cat: 'Brief',
      title: '任务 Brief',
      meta: '由洞察或提示词生成 · 可编辑',
      cms: false,
      def: false,
      referenced: true,
      addedAt: Date.now(),
      contentType: 'text',
      contentText: text,
    };
    setLibrary((prev) => [item, ...prev.filter((entry) => entry.id !== GENERATED_BRIEF_ID)]);
  };

  const runGenerateBrief = (userNote = '') => {
    const analysis = analyzeBrief(getRecentUserContext(userNote));
    const brief = generateContentBrief({
      userPrompt: userNote || getRecentUserContext(),
      insightText: topicInsightReportText || insightSummary,
      analysis,
    });
    setContentBrief(brief);
    syncBriefToLibrary(brief);
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('brief') ? prev.tabs : [...prev.tabs, 'brief'],
      active: 'brief',
      brief: true,
    }));
    addMsg(
      'ai',
      topicInsightReportText.trim()
        ? '已基于当前话题洞察报告生成 Brief。请点击「Brief」标签查看，支持在线编辑与一键复制。'
        : '已根据你的提示词生成 Brief。请点击「Brief」标签查看，支持在线编辑与一键复制。',
      'Brief',
      ['查看 Brief', '生成PPT大纲', '检索文献']
    );
  };

  const runTopicInsightReport = () => {
    setTopicInsightReportText(TOPIC_INSIGHT_MOCK_REPORT);
    setHotInsightReport(null);
    setRecommendedTopics([]);
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('insight') ? prev.tabs : [...prev.tabs, 'insight'],
      active: 'insight',
      insight: true,
      topicRecommendation: false,
    }));
    const basedOnAttachments =
      attachments.length > 0
        ? `已结合当前 ${attachments.length} 个附件`
        : '已根据你的生成请求';
    addMsg(
      'ai',
      `${basedOnAttachments}生成话题洞察报告，共 6 个心内科话题方向。请在中间「话题洞察」中查看，并可一键复制全文。`,
      '话题洞察'
    );
  };

  const addLiteratureToTask = (article: LiteratureArticle) => {
    if (addedLiteratureIds.includes(article.id)) return;
    const now = Date.now();
    const item: LibraryItem = {
      id: now,
      cat: '参考知识',
      title: article.title,
      meta: `${article.publisher} · ${article.year} · ${article.source}`,
      cms: article.source === 'CMS',
      def: false,
      referenced: true,
      addedAt: now,
      contentType: 'text',
      contentText: [
        article.title,
        `${article.publisher} (${article.year})`,
        '',
        article.abstract,
        '',
        `Source: ${article.source} · ${article.sourceUrl}`,
      ].join('\n'),
    };
    setLibrary((prev) => [item, ...prev]);
    setAddedLiteratureIds((prev) => [...prev, article.id]);
    toast(`已添加「${article.title}」到参考知识`);
  };

  const runWorkspaceMockCommand = (text: string): boolean => {
    if (/检索文献|搜索文献|文献检索|search\s*literature|find\s*papers/i.test(text)) {
      runLiteratureSearch(text);
      return true;
    }

    if (isGenerateBriefIntent(text) || text.trim() === '查看 Brief') {
      if (text.trim() === '查看 Brief' && contentBrief) {
        setState((prev) => ({
          ...prev,
          tabs: prev.tabs.includes('brief') ? prev.tabs : [...prev.tabs, 'brief'],
          active: 'brief',
          brief: true,
        }));
        return true;
      }
      runGenerateBrief(text);
      return true;
    }

    if (isTopicInsightGenerateIntent(text)) {
      runTopicInsightReport();
      return true;
    }

    const demoScriptBusy = isDemoMode() && demoScriptStep !== 'idle';

    if (!demoScriptBusy && isGenerateKeyVisualIntent(text)) {
      seedVisualTasks('kv');
      publishChatImage({
        html:
          attachments.length > 0
            ? `已结合当前 ${attachments.length} 个附件生成主 KV。请先在对话中查看，点击「修改此图片」后可在中间区域预览版本并继续修改。`
            : '主 KV 已生成。请先在对话中查看，点击「修改此图片」后可在中间区域预览版本并继续修改。',
        imageUrl: MOCK_KV_VERSIONS.current.dataUrl,
        imageTitle: MOCK_KV_VERSIONS.current.title,
        assetKey: 'kv',
      });
      return true;
    }

    if (!demoScriptBusy && isGenerateConferencePosterIntent(text)) {
      const hasKeyVisual = modificationTasks.some((task) => task.assetKey === 'kv');
      seedVisualTasks('poster');
      publishChatImage({
        html: hasKeyVisual
          ? '已根据主 KV 延展生成学术会议海报，包含会议名称、时间地点、嘉宾、亮点与议程。请先在对话中查看，点击「修改此图片」后可在中间区域预览版本。'
          : '学术会议海报已生成，包含会议名称、时间地点、嘉宾、亮点与议程。请先在对话中查看，点击「修改此图片」后可在中间区域预览版本。',
        imageUrl: MOCK_POSTER_VERSIONS.current.dataUrl,
        imageTitle: MOCK_POSTER_VERSIONS.current.title,
        assetKey: 'poster',
      });
      return true;
    }

    const command = text.replace(/\s+/g, '').toLowerCase();

    if (
      /参考模板.*(更改|修改|调整|替换).*(当前)?ppt.*(样式|风格)/.test(command) ||
      /(更改|修改|调整|替换).*(当前)?ppt.*(样式|风格).*参考模板/.test(command)
    ) {
      const isEnglishPpt =
        selectedPptVersionId === WORKSPACE_MOCK_PPT_EN.id ||
        selectedPptVersionId === WORKSPACE_MOCK_PPT_RESTYLED_EN.id;
      const restyledPpt = isEnglishPpt
        ? WORKSPACE_MOCK_PPT_RESTYLED_EN
        : WORKSPACE_MOCK_PPT_RESTYLED;
      setPptVersions([restyledPpt]);
      setSelectedPptVersionId(restyledPpt.id);
      setPptResult({
        title: pptOutline?.title || WORKSPACE_MOCK_PPT_OUTLINE.title,
        slides: restyledPpt.slides,
      });
      seedPptVersionMocks();
      setCreatorPptPageIndex(0);
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('ppt-design') ? prev.tabs : [...prev.tabs, 'ppt-design'],
        active: 'ppt-design',
        pptOutline: true,
        pptDesign: true,
      }));
      addMsg(
        'ai',
        '已参考模板重新设计当前 PPT：配色切换为深青渐变与金色强调，版式调整为左侧章节编号加右侧信息卡布局。',
        '本地 Mock'
      );
      return true;
    }

    if (
      /(将|把)?当前ppt翻译成英文/.test(command) ||
      /翻译.*ppt.*英文/.test(command) ||
      /ppt.*翻译.*英文/.test(command)
    ) {
      setPptOutline(WORKSPACE_MOCK_PPT_OUTLINE_EN);
      setPptVersions([WORKSPACE_MOCK_PPT_EN]);
      setSelectedPptVersionId(WORKSPACE_MOCK_PPT_EN.id);
      setPptResult({
        title: WORKSPACE_MOCK_PPT_OUTLINE_EN.title,
        slides: WORKSPACE_MOCK_PPT_EN.slides,
      });
      seedPptVersionMocks();
      setCreatorPptPageIndex(0);
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('ppt-design') ? prev.tabs : [...prev.tabs, 'ppt-design'],
        active: 'ppt-design',
        pptOutline: true,
        pptDesign: true,
      }));
      addMsg(
        'ai',
        `当前 PPT 已翻译为英文版，共 ${WORKSPACE_MOCK_PPT_EN.slides.length} 页。中间预览区域已切换为英文内容。`,
        '本地 Mock'
      );
      return true;
    }

    if (/(生成|创建|制作).*ppt.*大纲/.test(command)) {
      setWorkspacePreviewMaterial((current) =>
        current?.cat === '生成图片' && current.contentType === 'image' ? current : null
      );
      setPptOutline(WORKSPACE_MOCK_PPT_OUTLINE);
      setPptWizard(null);
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('ppt-outline') ? prev.tabs : [...prev.tabs, 'ppt-outline'],
        active: 'ppt-outline',
        pptOutline: true,
      }));
      addMsg(
        'ai',
        `PPT 大纲已生成，共 ${WORKSPACE_MOCK_PPT_OUTLINE.chapters.length} 节。已在中间区域展示，可直接编辑各节与页面要点。`,
        '本地 Mock'
      );
      return true;
    }

    if (/(生成|创建|制作).*ppt/.test(command)) {
      setWorkspacePreviewMaterial((current) =>
        current?.cat === '生成图片' && current.contentType === 'image' ? current : null
      );
      setPptOutline(WORKSPACE_MOCK_PPT_OUTLINE);
      setPptVersions([WORKSPACE_MOCK_PPT]);
      setSelectedPptVersionId(WORKSPACE_MOCK_PPT.id);
      setPptResult({
        title: WORKSPACE_MOCK_PPT_OUTLINE.title,
        slides: WORKSPACE_MOCK_PPT.slides,
      });
      seedPptVersionMocks();
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('ppt-design') ? prev.tabs : [...prev.tabs, 'ppt-design'],
        active: 'ppt-design',
        pptOutline: true,
        pptDesign: true,
      }));
      addMsg(
        'ai',
        `PPT 已生成，共 ${WORKSPACE_MOCK_PPT.slides.length} 页。已在中间区域展示，可逐页预览、编辑或导出。`,
        '本地 Mock'
      );
      return true;
    }

    if (/(生成|创建|制作).*图文/.test(command)) {
      setWorkspacePreviewMaterial((current) =>
        current?.cat === '生成图片' && current.contentType === 'image' ? current : null
      );
      setRichTextContent(WORKSPACE_MOCK_RICH_TEXT);
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('rich-text') ? prev.tabs : [...prev.tabs, 'rich-text'],
        active: 'rich-text',
        richText: true,
      }));
      addMsg(
        'ai',
        '病例解读已生成。中间可直接修改文字；配图支持点击替换，也可拖拽调整顺序。',
        '本地 Mock'
      );
      return true;
    }

    if (/(生成|创建|制作).*(p?图片|配图|海报)/.test(command)) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          html: '图片已生成。你可以先在对话中查看，点击「修改此图片」后在中间区域进行预览和修改。',
          model: '本地 Mock',
          imageUrl: WORKSPACE_MOCK_IMAGE.dataUrl,
          imageTitle: WORKSPACE_MOCK_IMAGE.title,
          imageActionLabel: '修改此图片',
        },
      ]);
      return true;
    }

    return false;
  };

  const send = () => {
    let text = inputValue.trim();
    if (speech.listening) {
      const interim = speech.interimTranscript.trim();
      if (interim) {
        text = `${voiceBaseRef.current}${
          voiceBaseRef.current && !voiceBaseRef.current.endsWith(' ') ? ' ' : ''
        }${interim}`.trim();
        voiceBaseRef.current = text;
        setInputValue(text);
      } else {
        text = voiceBaseRef.current.trim() || text;
      }
      speech.stop();
    }
    if (!text || workspaceElementBusy) return;
    if (workspaceElementSel) {
      void applyWorkspaceElementAi(text, promptEditScope);
      return;
    }
    const scopedText = formatScopedUserPrompt(text);
    addMsg('user', scopedText, selectedModel);
    setInputValue('');
    voiceBaseRef.current = '';
    setSelectedPrompt('');
    setAttachments([]);
    if (runWorkspaceMockCommand(text)) return;
    if (runDemoScenarioScript(text, { addUserMessage: false })) return;
    if (visualWizard?.active && handleVisualWizardReply(text)) return;
    if (pptWizard?.active && handlePptWizardReply(text, inputValue.trim())) return;
    if (text.includes('查看大纲')) {
      openPptOutlineTab();
      return;
    }
    if (shouldPreferVisualFlow(entryContext, text)) {
      const templateHint =
        entryContext?.intent === 'visual-template' ? entryContext.templateTitle : undefined;
      startVisualFlow(text, { skipUserMsg: true, templateHint });
      return;
    }
    dispatchUserIntent(text, true);
  };

  const startVoiceInput = () => {
    if (workspaceElementBusy) return;
    if (!speech.supported) {
      toast('当前浏览器不支持语音输入，请使用 Chrome / Edge');
      return;
    }
    voiceBaseRef.current = inputValue.trim();
    const ok = speech.start();
    if (!ok) toast('无法启动语音识别，请检查麦克风权限');
  };

  const stopVoiceInput = () => {
    speech.stop();
    const interim = speech.interimTranscript.trim();
    if (interim) {
      const next = `${voiceBaseRef.current}${voiceBaseRef.current && !voiceBaseRef.current.endsWith(' ') ? ' ' : ''}${interim}`;
      voiceBaseRef.current = next;
      setInputValue(next);
    }
  };

  const clearLoadingMessages = () => {
    setMessages((prev) => prev.filter((m) => !m.loading));
  };

  const showLoading = (title: string) => {
    const statusLine = isDemoMode()
      ? '正在生成，请稍候…'
      : '正在调用 DeepSeek，请稍候…';
    const modelLabel = 'GPT-5.5';
    setMessages((prev) => [
      ...prev.filter((m) => !m.loading),
      {
        role: 'ai',
        html: `<div class="agent-card"><strong>${title}</strong><div class="progress"><div class="bar" style="width:78%"></div></div><div class="small">${statusLine}</div></div>`,
        model: modelLabel,
        loading: true,
      },
    ]);
  };

  const notifyMockIfNeeded = (meta?: { mockUsed?: boolean }) => {
    if (meta?.mockUsed && !isDemoMode()) {
      toast('DeepSeek 暂不可用，已使用演示数据（可继续体验流程）');
    }
  };

  const runWithAi = async (
    title: string,
    fn: () => Promise<void>,
    onRetry?: () => void
  ) => {
    if (isGenerating) {
      toast('请等待当前 AI 生成完成');
      return;
    }
    try {
      await api.waitForApiHealth(6, 300);
    } catch {
      toast('AI 服务尚未就绪，请确认已启动 API（npm start）后重试');
      return;
    }
    setIsGenerating(true);
    showLoading(title);
    try {
      await fn();
      addTokenUsage(userRole, 800 + Math.round(Math.random() * 1600));
      clearLoadingMessages();
      lastAiRetryRef.current = null;
    } catch (e) {
      clearLoadingMessages();
      const msg = e instanceof Error ? e.message : '生成失败';
      lastAiRetryRef.current = onRetry ?? null;
      addMsg('ai', `<span style="color:#b72c3e">生成失败：${msg}</span>`, 'DeepSeek-V3.1', ['重试']);
      toast(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const retryLastAi = () => {
    const retry = lastAiRetryRef.current;
    if (!retry) {
      toast('暂无失败任务可重试');
      return;
    }
    retry();
  };

  const insertWorkspaceGuide = (prefix: string) => {
    setInputValue(prefix);
    setSelectedPrompt(prefix.replace(/[：:]\s*$/, ''));
  };

  const executeHotInsightReportSkill = (userNote = '') => {
    const hotMaterials = getTaskHotInsightMaterials(library);
    void runWithAi(
      '正在生成话题洞察报告',
      async () => {
        const result = await api.generateInsight(library, userNote);
        notifyMockIfNeeded(result);
        const report = buildHotInsightReport({
          hotMaterials,
          allMaterials: getTaskMaterials(library),
          userNote,
          apiTopics: result.topics,
          apiSummary: result.summary || '',
        });
        const topicItems = reportTopicsToTopicItems(report);
        setHotInsightReport(report);
        setRecommendedTopics([]);
        setTopics(topicItems);
        setInsightSummary(report.summary);
        setSelectedTopics(topicItems.map((_, i) => i < 2));
        setState((prev) => ({ ...prev, insight: true, topicRecommendation: false, active: 'insight' }));
        addTab('insight');
        addMsg(
          'ai',
          `已使用热点洞察素材：${report.usedHotMaterials.join('、')}。共生成 <strong>${topicItems.length}</strong> 个话题方向，完整报告已展示在右侧「话题洞察」Tab。建议下一步：生成文案、配图或 PPT 大纲。`,
          'DeepSeek-V3.1｜Hot Insight Report',
          ['生成文案', '直接生成图片', '生成PPT大纲', '直接生成视频']
        );
      },
      () => executeHotInsightReportSkill(userNote)
    );
  };

  const executeTopicRecommendationSkill = (
    userNote = '',
    opts?: { skipUserMsg?: boolean }
  ) => {
    addMsg(
      'ai',
      '好的，我将基于当前任务中已添加的素材生成话题推荐。由于本次未提供专门的热点洞察材料，结果将更侧重品牌资料、参考知识与当前内容资产中的可传播主题。',
      'DeepSeek-V3.1'
    );
    void runWithAi(
      '正在生成话题推荐',
      async () => {
        const result = await api.generateInsight(library, userNote);
        notifyMockIfNeeded(result);
        const recommendations = buildTopicRecommendations({
          materials: getTaskMaterials(library),
          userNote,
          apiTopics: result.topics,
        });
        const topicItems = recommendationsToTopicItems(recommendations);
        setRecommendedTopics(recommendations);
        setHotInsightReport(null);
        setTopics(topicItems);
        setInsightSummary('');
        setSelectedTopics(topicItems.map((_, i) => i < 2));
        setState((prev) => ({
          ...prev,
          topicRecommendation: true,
          insight: false,
          active: 'topic-recommendation',
        }));
        addTab('topic-recommendation');
        addMsg(
          'ai',
          `本次未使用热点洞察素材，已基于任务已有素材生成 <strong>${recommendations.length}</strong> 条话题推荐。请在右侧「话题推荐」中勾选后继续生成文案、PPT 或图片。`,
          'DeepSeek-V3.1｜Topic Recommendation',
          ['基于所选话题生成文案', '基于所选话题生成PPT大纲', '基于所选话题生成图片']
        );
      },
      () => executeTopicRecommendationSkill(userNote, { skipUserMsg: true })
    );
  };

  const runTopicInsightAgent = (
    userNote = '',
    opts?: { skipUserMsg?: boolean; forceSkill?: 'A' | 'B' }
  ) => {
    const note = userNote.replace(/^基于素材生成话题洞察[：:]?\s*/i, '').trim() || userNote;
    if (!opts?.skipUserMsg) {
      addMsg('user', userNote || '基于素材生成话题洞察', selectedModel);
    }

    const hotMaterials = getTaskHotInsightMaterials(library);

    if (opts?.forceSkill === 'B') {
      executeTopicRecommendationSkill(note, { skipUserMsg: true });
      return;
    }

    if (opts?.forceSkill === 'A' || hotMaterials.length > 0) {
      addMsg(
        'ai',
        '已检测到您在「热点洞察」分类下上传了素材，我将优先基于这些材料，并结合当前任务中的默认素材，为您生成话题洞察报告。',
        'DeepSeek-V3.1'
      );
      executeHotInsightReportSkill(note);
      return;
    }

    pendingTopicInsightNoteRef.current = note;
    addMsg(
      'ai',
      '检测到您尚未在「热点洞察」分类下上传素材。您可以上传热点洞察素材，以获得更完整的趋势分析；也可以直接基于当前任务已有素材生成话题推荐。',
      'DeepSeek-V3.1',
      [...TOPIC_INSIGHT_BRANCH_CHIPS]
    );
  };

  const runInsight = (userNote = '', opts?: { skipUserMsg?: boolean }) => {
    runTopicInsightAgent(userNote, opts);
  };

  const expandTopics = () => {
    const selected = topics.filter((_, i) => selectedTopics[i] !== false);
    if (selected.length === 0) {
      toast('请先勾选至少一个话题');
      return;
    }
    addMsg('user', '拓展话题', selectedModel);
    void runWithAi(
      '正在拓展话题',
      async () => {
      const result = await api.generateInsight(library, '基于已选话题拓展更多方向', selected);
      notifyMockIfNeeded(result);
      const existingTitles = new Set(topics.map((t) => t.title.trim()));
      const newTopics = result.topics
        .filter((t) => t.title?.trim() && !existingTitles.has(t.title.trim()))
        .slice(0, 3);
      if (newTopics.length === 0) {
        toast('未生成新的不重复话题，请调整已选话题后重试');
        return;
      }
      setTopics((prev) => [...prev, ...newTopics]);
      setSelectedTopics((prev) => [...prev, ...newTopics.map(() => true)]);
      if (result.summary) {
        setInsightSummary((prev) => (prev ? `${prev} ${result.summary}` : result.summary));
      }
      addMsg(
        'ai',
        `已基于所选话题拓展 ${newTopics.length} 个新话题，已与原有话题一起在右侧列表展示。`,
        'DeepSeek-V3.1｜话题拓展',
        ['生成文案']
      );
    },
      () => expandTopics()
    );
  };

  const runCopy = (userNote = '', opts?: { skipUserMsg?: boolean; copiesPerTopic?: number }) => {
    const count = Math.min(Math.max(opts?.copiesPerTopic ?? copyCountPerTopic, 1), 5);
    const selected = topics.filter((_, i) => selectedTopics[i] !== false);
    if (topics.length > 0 && selected.length === 0) {
      toast('请先勾选至少一个话题');
      return;
    }
    const topicInput =
      selected.length > 0
        ? selected
        : topics.length > 0
          ? topics
          : [{ title: userNote || '基于素材与对话内容', reason: '', source: '用户描述' }];
    if (!opts?.skipUserMsg) {
      addMsg(
        'user',
        selected.length > 0
          ? `为 ${selected.length} 个话题各生成 ${count} 篇文案`
          : userNote || '生成文案',
        selectedModel
      );
    }
    void runWithAi(
      '正在生成文案',
      async () => {
      const result = await api.generateCopy(library, topicInput, userNote, count);
      notifyMockIfNeeded(result);
      const normalized = ensureCopyCount(result.copies, topicInput, count);
      const selectedTitles = new Set(topicInput.map((t) => t.title.trim()));
      setCopies((prev) => {
        const kept = prev.filter((c) => !c.topicTitle || !selectedTitles.has(c.topicTitle));
        const merged = [...kept, ...normalized];
        setSelectedCopies((prevSel) => {
          const keptFlags = prev
            .map((c, i) => ({ c, sel: prevSel[i] ?? false }))
            .filter(({ c }) => !c.topicTitle || !selectedTitles.has(c.topicTitle))
            .map(({ sel }) => sel);
          return [...keptFlags, ...normalized.map(() => true)];
        });
        return merged;
      });
      setState((prev) => ({ ...prev, copy: true }));
      addTab('copy');
      const topicCount = new Set(normalized.map((c) => c.topicTitle)).size;
      addMsg(
        'ai',
        `已为 ${topicCount} 个话题各生成 ${count} 篇文案（共 ${normalized.length} 篇），右侧按话题分类展示。`,
        'DeepSeek-V3.1｜文案生成',
        ['生成图片', '生成PPT大纲', '直接生成视频', '进入团队修改']
      );
    },
      () => runCopy(userNote, { skipUserMsg: true, copiesPerTopic: count })
    );
  };

  const runTeam = (opts?: {
    skipUserMsg?: boolean;
    contentType?: TeamContentType;
    feedback?: string;
  }) => {
    const type = opts?.contentType || teamReviewTarget || 'copy';
    const payload = buildTeamPayload(type);
    if (!payload) {
      toast(`请先生成${TEAM_CONTENT_LABELS[type]}后再提交团队意见收集`);
      return;
    }
    if (!opts?.skipUserMsg) {
      addMsg('user', `提交${TEAM_CONTENT_LABELS[type]}团队意见收集`, selectedModel);
    }
    setTeamModificationInProgress(true);
    void runWithAi(
      `正在整合${TEAM_CONTENT_LABELS[type]}团队修改`,
      async () => {
      try {
        const result = await api.generateTeam(payload.body, {
          feedback: opts?.feedback,
          contentType: type,
          contentTitle: payload.title,
        });
        notifyMockIfNeeded(result);
        const normalized: TeamResult = {
          contentType: result.contentType || type,
          contentTitle: result.contentTitle || payload.title,
          before: result.before,
          after: result.after,
          changes: result.changes || [],
          summary: result.summary,
        };
        setTeamResult(normalized);
        setState((prev) => ({ ...prev, team: true, active: 'team' }));
        addTab('team');
        addMsg(
          'ai',
          `已整合「${normalized.contentTitle}」团队反馈：${normalized.summary}。右侧可查看修改前后差异。`,
          'DeepSeek-V3.1｜团队修改',
          ['生成图片', '生成PPT', '生成视频', '提交当前版本到Veeva Vault']
        );
      } finally {
        setTeamModificationInProgress(false);
      }
    },
      () =>
        runTeam({
          skipUserMsg: true,
          contentType: type,
          feedback: opts?.feedback,
        })
    );
  };

  const executeVisualGeneration = (
    userNote: string,
    templateIds: string[],
    imagesPerCopy = 1
  ) => {
    setVisualWizard(null);
    setImageTemplateModal(null);
    const { brief } = buildContentBrief(userNote);
    const templates = getImageTemplatesByIds(templateIds);
    const copyTargets = getSelectedCopyTargets();
    const useCopyMode = copies.length > 0 && copyTargets.length > 0;
    const perCopy = Math.min(Math.max(imagesPerCopy, 1), 5);

    const genLabel = useCopyMode
      ? `正在为 ${copyTargets.length} 篇文案各生成 ${perCopy} 张配图`
      : templates.length > 1
        ? `正在按 ${templates.length} 个模板生成配图`
        : templates.length === 1
          ? `正在按「${templates[0].name}」模板生成配图`
          : '正在生成图片方案';

    void runWithAi(genLabel, async () => {
      const newImages: string[] = [];
      const newMeta: GeneratedImageMeta[] = [];
      const titles: string[] = [];

      const generateOne = async (
        copyBody: string,
        note: string,
        templateId: string | null,
        meta: GeneratedImageMeta
      ) => {
        const result = await api.generatePoster(copyBody, note, templateId);
        notifyMockIfNeeded(result);
        const preview = templateId ? getImageTemplate(templateId)?.previewImg : undefined;
        newImages.push(preview || result.dataUrl);
        newMeta.push(meta);
        titles.push(result.title);
      };

      if (useCopyMode) {
        for (const { copy, copyIndex } of copyTargets) {
          for (let imgIdx = 0; imgIdx < perCopy; imgIdx++) {
            const tpl = templates.length > 0 ? templates[imgIdx % templates.length] : null;
            const note = [
              userNote,
              `【文案】${copy.title}`,
              `【配图 ${imgIdx + 1}/${perCopy}】`,
              tpl ? `【模板】${tpl.name}：${tpl.styleHint}` : '',
            ]
              .filter(Boolean)
              .join('\n');
            await generateOne(
              copy.body,
              note,
              tpl?.id ?? null,
              { copyTitle: copy.title, copyIndex, imageIndex: imgIdx }
            );
          }
        }
      } else if (templates.length === 0) {
        await generateOne(brief, userNote, null, {
          copyTitle: '综合内容',
          copyIndex: -1,
          imageIndex: 0,
        });
      } else {
        for (let i = 0; i < templates.length; i++) {
          const tpl = templates[i];
          await generateOne(
            brief,
            `${userNote}\n【模板】${tpl.name}：${tpl.styleHint}`,
            tpl.id,
            { copyTitle: '综合内容', copyIndex: -1, imageIndex: i }
          );
        }
      }

      const regenCopyIndices = new Set(copyTargets.map((t) => t.copyIndex));
      const keptImages: string[] = [];
      const keptMeta: GeneratedImageMeta[] = [];
      const keptSelected: boolean[] = [];
      generatedImages.forEach((img, i) => {
        const m = generatedImageMeta[i];
        if (!useCopyMode || !m || !regenCopyIndices.has(m.copyIndex)) {
          keptImages.push(img);
          keptMeta.push(
            m ?? { copyTitle: '综合内容', copyIndex: -1, imageIndex: i }
          );
          keptSelected.push(selectedImages[i] ?? false);
        }
      });

      const mergedImages =
        newImages.length > 0 ? [...keptImages, ...newImages] : keptImages.length ? keptImages : [posterData];
      const mergedMeta =
        newImages.length > 0
          ? [...keptMeta, ...newMeta]
          : keptMeta.length
            ? keptMeta
            : [{ copyTitle: '综合内容', copyIndex: -1, imageIndex: 0 }];
      const mergedSelected =
        newImages.length > 0
          ? [...keptSelected, ...newImages.map(() => true)]
          : mergedImages.map((_, i) => i === 0);

      setGeneratedImages(mergedImages);
      setGeneratedImageMeta(mergedMeta);
      setImageReviewOrigins([]);
      setImageReviewStatuses([]);
      setSelectedImages(mergedSelected);
      setState((prev) => ({ ...prev, visual: true, active: 'visual' }));
      addTab('visual');

      const summary = useCopyMode
        ? `已为 ${copyTargets.length} 篇文案各生成 ${perCopy} 张配图（共 ${newImages.length} 张），右侧按文案分类展示。`
        : templates.length > 1
          ? `已按 ${templates.length} 个模板生成 ${newImages.length || mergedImages.length} 张配图（${templates.map((t) => t.name).join('、')}）。请在右侧查看。`
          : templates.length === 1
            ? `已按「${templates[0].name}」模板生成配图「${titles[0] || copyTargets[0]?.copy.title}」。请在右侧查看，可勾选后提交团队意见收集。`
            : `已生成 AI 海报「${titles[0] || '配图'}」。右侧可勾选图片提交团队意见收集，或继续生成视频、PPT。`;

      addMsg('ai', summary, 'DeepSeek-V3.1｜图片生成', [
        '进入团队修改',
        '生成视频',
        '生成PPT',
        '提交当前版本到Veeva Vault',
      ]);
    }, () => executeVisualGeneration(userNote, templateIds, imagesPerCopy));
  };

  const openImageTemplatePicker = (
    pendingNote: string,
    templateHint = '',
    imagesPerCopy = 1
  ) => {
    setVisualWizard(null);
    setImageTemplateModal({ pendingNote, templateHint, imagesPerCopy });
    addMsg(
      'ai',
      '请在弹窗中浏览模板缩略图，可<strong>多选</strong>模板；右侧可查看版式与风格详情。',
      'DeepSeek-V3.1'
    );
  };

  const isVisualTemplateYes = (text: string) =>
    /^(是|要|需要|好|可以|选用|选择模板|是[，,])/.test(text.trim()) ||
    text.includes('选择模板') ||
    text.includes('选用模板') ||
    (text.includes('是') && text.includes('模板'));

  const isVisualTemplateNo = (text: string) =>
    /^(否|不|不要|不需要|不用|直接)/.test(text.trim()) ||
    text.includes('直接生成') ||
    text.includes('不用模板') ||
    text.includes('否，');

  const handleVisualWizardReply = (text: string): boolean => {
    if (!visualWizard?.active) return false;
    const wizard = visualWizard;

    if (wizard.step === 'count') {
      const n = parseImagesPerCopy(text);
      if (n) {
        setVisualWizard({ ...wizard, step: 'ask', imagesPerCopy: n });
        addMsg(
          'ai',
          `好的，将为每个选中文案各生成 <strong>${n}</strong> 张配图。是否选用内置模板？`,
          'DeepSeek-V3.1',
          ['是，选择模板', '否，直接生成']
        );
        return true;
      }
      const guide = guideImagesPerCopy(getSelectedCopyTargets().length);
      addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
      return true;
    }

    if (wizard.step === 'ask') {
      const count = wizard.imagesPerCopy ?? 1;
      if (isVisualTemplateYes(text)) {
        openImageTemplatePicker(wizard.pendingNote, wizard.templateHint, count);
        return true;
      }
      if (isVisualTemplateNo(text)) {
        executeVisualGeneration(wizard.pendingNote, [], count);
        return true;
      }
      addMsg(
        'ai',
        '请先选择是否使用内置模板：<strong>是，选择模板</strong> 或 <strong>否，直接生成</strong>。',
        'DeepSeek-V3.1',
        ['是，选择模板', '否，直接生成']
      );
      return true;
    }

    return true;
  };

  const startVisualFlow = (
    userNote = '',
    opts?: { skipUserMsg?: boolean; templateHint?: string; imagesPerCopy?: number }
  ) => {
    if (!opts?.skipUserMsg) addMsg('user', userNote || '生成图片', selectedModel);

    if (visualWizardRef.current?.active) {
      handleVisualWizardReply(userNote);
      return;
    }

    const copyTargets = getSelectedCopyTargets();
    const hasCopies = copies.length > 0;

    if (hasCopies && copyTargets.length === 0) {
      toast('请先在「文案」标签勾选要配图的文案');
      const guide = guideImagesPerCopy(0);
      addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
      return;
    }

    const parsedCount = opts?.imagesPerCopy ?? parseImagesPerCopy(userNote);
    if (hasCopies && !parsedCount) {
      setVisualWizard({
        active: true,
        step: 'count',
        pendingNote: userNote,
        templateHint:
          opts?.templateHint ||
          (entryContext?.intent === 'visual-template' ? entryContext.templateTitle : ''),
      });
      const guide = guideImagesPerCopy(copyTargets.length);
      addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
      return;
    }

    const imagesPerCopy = parsedCount ?? 1;
    const context = getRecentUserContext(userNote);
    const analysis = analyzeBrief(context);
    const { sufficient } = buildContentBrief(userNote);

    if (isVisualTemplateYes(userNote) || analysis.wantsTemplate) {
      openImageTemplatePicker(
        userNote,
        opts?.templateHint ||
          (entryContext?.intent === 'visual-template' ? entryContext.templateTitle : ''),
        imagesPerCopy
      );
      return;
    }

    if (isVisualTemplateNo(userNote) || analysis.skipsTemplate) {
      executeVisualGeneration(userNote, [], imagesPerCopy);
      return;
    }

    if (!hasCopies && !sufficient && !analysis.isSubstantial) {
      guideForMoreInfo('生成配图/海报', userNote);
      return;
    }

    executeVisualGeneration(userNote, [], imagesPerCopy);
  };

  const executeVideoDirect = (userNote = '', opts?: { skipUserMsg?: boolean }) => {
    if (!opts?.skipUserMsg) addMsg('user', userNote || '直接生成视频', selectedModel);
    const { brief, sufficient } = buildContentBrief(userNote);
    if (!sufficient) {
      guideForMoreInfo('生成视频', userNote);
      return;
    }
    void runWithAi(
      '正在生成视频',
      async () => {
      const script = await api.generateVideo(brief, userNote);
      notifyMockIfNeeded(script);
      setVideoResult(script);
      setVideoVersions([]);
      setSelectedVideoVersionId(null);

      const res = await api.generateVideoRender(script);
      notifyMockIfNeeded(res);
      const versions = enrichVideoVersions(res.versions || [], script);
      setVideoVersions(versions);
      const first = versions[0];
      if (first) setSelectedVideoVersionId(first.id);
      setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
      addTab('video-render');
      addMsg(
        'ai',
        `已生成 ${versions.length} 套视频方案（演示占位成片）。请在右侧「视频生成」中预览并提交 Veeva 审批。`,
        'DeepSeek-V3.1｜视频合成',
        ['提交当前版本到Veeva Vault', '重新生成视频']
      );
    },
      () => executeVideoDirect(userNote, { skipUserMsg: true })
    );
  };

  const startVideoFlow = (userNote = '', opts?: { skipUserMsg?: boolean }) => {
    executeVideoDirect(userNote, opts);
  };

  const enrichVideoVersions = (versions: VideoRenderVersion[], script: VideoResult) =>
    versions.map((v) => ({
      ...v,
      script,
      posterDataUrl: v.posterDataUrl || buildVideoPosterDataUrl(script.title, v.styleTag),
    }));

  const confirmVideoRender = () => {
    if (!videoResult) {
      toast('请先在对话中生成视频');
      return;
    }
    void runWithAi(
      '正在合成视频',
      async () => {
      const res = await api.generateVideoRender(videoResult);
      notifyMockIfNeeded(res);
      const versions = enrichVideoVersions(res.versions || [], videoResult);
      setVideoVersions(versions);
      const first = versions[0];
      if (first) setSelectedVideoVersionId(first.id);
      setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
      addTab('video-render');
      addMsg(
        'ai',
        `已重新生成 ${versions.length} 套视频方案（演示占位成片）。请在右侧「视频生成」中预览并提交 Veeva 审批。`,
        'DeepSeek-V3.1｜视频合成',
        ['提交当前版本到Veeva Vault']
      );
    },
      () => confirmVideoRender()
    );
  };

  const selectVideoVersion = (version: VideoRenderVersion) => {
    setSelectedVideoVersionId(version.id);
    toast(`已选用「${version.name}」`);
  };

  useEffect(() => {
    setSelectedVideoIds((prev) => {
      const valid = new Set(videoVersions.map((v) => v.id));
      const kept = prev.filter((id) => valid.has(id));
      return kept.length ? kept : videoVersions.map((v) => v.id);
    });
  }, [videoVersions]);

  const formatVideoScriptDraft = (script: VideoResult | null): string => {
    if (!script) return '';
    const lines = [`标题：${script.title}`, `封面建议：${script.coverSuggestion || ''}`, ''];
    script.segments.forEach((segment, index) => {
      lines.push(
        `#${index + 1}`,
        `时间：${segment.time}`,
        `画面：${segment.scene}`,
        `旁白：${segment.narration}`,
        `合规：${segment.compliance || ''}`,
        ''
      );
    });
    return lines.join('\n');
  };

  const parseVideoScriptDraft = (draft: string, fallback: VideoResult): VideoResult => {
    const title = draft.match(/^标题：(.+)$/m)?.[1]?.trim() || fallback.title;
    const coverSuggestion = draft.match(/^封面建议：(.*)$/m)?.[1]?.trim() || fallback.coverSuggestion;
    const blocks = draft
      .split(/\n(?=#\d+)/)
      .map((block) => block.trim())
      .filter((block) => /^#\d+/m.test(block));
    const segments = blocks
      .map((block, index) => ({
        time: block.match(/^时间：(.+)$/m)?.[1]?.trim() || fallback.segments[index]?.time || `0:0${index}-0:0${index + 1}`,
        scene: block.match(/^画面：([\s\S]*?)(?:\n旁白：|\n合规：|$)/)?.[1]?.trim() || fallback.segments[index]?.scene || '画面',
        narration:
          block.match(/^旁白：([\s\S]*?)(?:\n合规：|$)/m)?.[1]?.trim() ||
          fallback.segments[index]?.narration ||
          '',
        compliance: block.match(/^合规：(.*)$/m)?.[1]?.trim() || fallback.segments[index]?.compliance,
      }))
      .filter((segment) => segment.scene || segment.narration);
    return {
      title,
      coverSuggestion,
      segments: segments.length ? segments : fallback.segments,
    };
  };

  const openVideoScriptEditor = (videoId?: string) => {
    const targetVersion = videoId ? videoVersions.find((v) => v.id === videoId) : null;
    const script = targetVersion?.script || videoResult;
    if (!script) {
      toast('暂无视频脚本可编辑');
      return;
    }
    setVideoScriptEditTargetId(videoId || null);
    setVideoScriptDraft(formatVideoScriptDraft(script));
    setShowVideoScriptEditModal(true);
  };

  const saveVideoScriptAndRegenerate = () => {
    const targetId = videoScriptEditTargetId;
    const baseScript = targetId ? videoVersions.find((v) => v.id === targetId)?.script || videoResult : videoResult;
    if (!baseScript) {
      toast('暂无视频脚本可保存');
      return;
    }
    const edited = parseVideoScriptDraft(videoScriptDraft, baseScript);
    setShowVideoScriptEditModal(false);
    setVideoScriptEditTargetId(null);
    void runWithAi(
      '正在根据修改后的脚本重新生成视频',
      async () => {
        setVideoResult(edited);
        if (targetId) {
          const current = videoVersions.find((v) => v.id === targetId);
          const fallback = getPatientEducationVideoVersion();
          const nextVersion: VideoRenderVersion = {
            ...(current || fallback),
            id: targetId,
            name: current?.name || fallback.name,
            description: `已根据修改后脚本重新生成：${edited.title}`,
            posterDataUrl: current?.posterDataUrl || fallback.posterDataUrl,
            videoUrl: current?.videoUrl || fallback.videoUrl,
            script: edited,
            isDemo: current?.isDemo ?? fallback.isDemo,
          };
          setVideoVersions((prev) => prev.map((v) => (v.id === targetId ? nextVersion : v)));
          setSelectedVideoVersionId(targetId);
          setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
          addTab('video-render');
          addMsg('ai', '已根据修改后的视频脚本重新生成该视频，并覆盖原有结果。', 'GPT-5.5', [
            '提交当前版本到Veeva Vault',
            '重新生成视频',
          ]);
          return;
        }
        const res = await api.generateVideoRender(edited);
        notifyMockIfNeeded(res);
        const versions = enrichVideoVersions(res.versions || [], edited);
        setVideoVersions(versions);
        setSelectedVideoIds(versions.map((v) => v.id));
        const first = versions[0];
        setSelectedVideoVersionId(first?.id || null);
        setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
        addTab('video-render');
        addMsg('ai', '已根据修改后的视频脚本重新生成视频，并覆盖原有视频结果。', 'GPT-5.5', [
          '提交当前版本到Veeva Vault',
          '重新生成视频',
        ]);
      },
      () => saveVideoScriptAndRegenerate()
    );
  };

  const regenerateSingleVideoVersion = (videoId: string) => {
    const current = videoVersions.find((v) => v.id === videoId);
    const script = current?.script || videoResult;
    if (!script) {
      toast('暂无视频脚本可用于重新生成');
      return;
    }
    void runWithAi(
      '正在重新生成视频',
      async () => {
        const res = await api.generateVideoRender(script);
        notifyMockIfNeeded(res);
        const [generated] = enrichVideoVersions(res.versions || [], script);
        if (!generated && !current) {
          toast('未生成新的视频结果');
          return;
        }
        const nextVersion: VideoRenderVersion = {
          ...(generated || current!),
          id: videoId,
          name: current?.name || generated?.name || '重新生成视频',
          description: generated?.description || current?.description || '已重新生成的视频',
        };
        setVideoVersions((prev) => prev.map((v) => (v.id === videoId ? nextVersion : v)));
        setSelectedVideoVersionId(videoId);
        addMsg('ai', `已重新生成「${nextVersion.name}」，并覆盖该视频结果。`, 'GPT-5.5', [
          '提交当前版本到Veeva Vault',
        ]);
      },
      () => regenerateSingleVideoVersion(videoId)
    );
  };

  const toggleVideoSelection = (id: string, checked: boolean) => {
    setSelectedVideoIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const reorderVideoVersion = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    setVideoVersions((prev) => {
      const from = prev.findIndex((v) => v.id === dragId);
      const to = prev.findIndex((v) => v.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const exportMergedVideos = () => {
    const selected = videoVersions.filter((v) => selectedVideoIds.includes(v.id));
    if (!selected.length) {
      toast('请先勾选要合并导出的视频');
      return;
    }
    const content = [
      '合并导出视频清单',
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      '',
      ...selected.map((v, index) =>
        [
          `${index + 1}. ${v.name}`,
          `   风格：${v.styleTag}`,
          `   时长：${v.duration}`,
          `   描述：${v.description}`,
          `   视频地址：${v.videoUrl || '演示占位/预览图'}`,
        ].join('\n')
      ),
    ].join('\n');
    const blob = new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-video-export-list.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast(`已导出 ${selected.length} 个视频的合并清单`);
  };

  const finishPptWizardAndAskPath = (
    wizard: NonNullable<typeof pptWizard>,
    scenario: string
  ) => {
    const audience = wizard.audience;
    if (!audience) {
      toast('请先确认目标受众');
      return;
    }
    const finalScenario = scenario || wizard.scenario || '疾病教育';
    setPptWizard({
      active: true,
      step: 'path',
      audience,
      scenario: finalScenario,
      pendingNote: wizard.pendingNote,
    });
    const guide = guidePptPath();
    addMsg(
      'ai',
      `已记录受众 <strong>${audience}</strong>、场景 <strong>${finalScenario}</strong>。${guide.html}`,
      'DeepSeek-V3.1',
      guide.chips
    );
  };

  const handlePptWizardReply = (text: string, extraAudienceHint = ''): boolean => {
    if (!pptWizard?.active) return false;

    const fullContext = [pptWizard.pendingNote, text, extraAudienceHint].filter(Boolean).join('\n');
    const step = pptWizard.step || 'audience';

    if (step === 'path') {
      if (isPptOutlinePath(text)) {
        setPptWizard(null);
        void generatePptOutlineAndOpen(
          pptWizard.pendingNote,
          pptWizard.audience,
          pptWizard.scenario
        );
        return true;
      }
      if (isPptDirectPath(text)) {
        setPptWizard(null);
        void generatePptDirectly(pptWizard.pendingNote, pptWizard.audience, pptWizard.scenario);
        return true;
      }
      const guide = guidePptPath();
      addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
      return true;
    }

    const audience =
      parseAudience(fullContext) ||
      (step === 'audience' && text.trim().length <= 24 ? text.trim() : '');
    const scenario =
      parseScenarioExplicit(fullContext) ||
      (step === 'scenario' && text.trim().length >= 2 && !parseAudience(text) ? text.trim() : '');

    if (audience && scenario) {
      finishPptWizardAndAskPath({ ...pptWizard, audience, scenario }, scenario);
      return true;
    }

    if (step === 'audience') {
      if (isPptOutlinePath(text) || isPptDirectPath(text)) {
        setPptWizard(null);
        const aud = audience || pptWizard.audience || '公众';
        const scen =
          scenario ||
          pptWizard.scenario ||
          parseScenarioExplicit(pptWizard.pendingNote) ||
          '疾病教育';
        if (isPptDirectPath(text)) {
          void generatePptDirectly(pptWizard.pendingNote, aud, scen);
        } else {
          void generatePptOutlineAndOpen(pptWizard.pendingNote, aud, scen);
        }
        return true;
      }
      if (combinedIncludesGenerateOutline(text)) {
        const aud = audience || parseAudience(fullContext) || pptWizard.audience;
        const scen =
          scenario ||
          parseScenarioExplicit(fullContext) ||
          pptWizard.scenario ||
          parseScenarioExplicit(pptWizard.pendingNote);
        if (aud && scen) {
          setPptWizard(null);
          void generatePptOutlineAndOpen(pptWizard.pendingNote, aud, scen);
          return true;
        }
        toast('还差一项信息：请补充目标受众或使用场景');
        return true;
      }
      if (!audience) {
        const guide = guideMissingFields('生成 PPT', ['audience']);
        addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
        return true;
      }
      if (pptWizard.scenario || parseScenarioExplicit(pptWizard.pendingNote)) {
        finishPptWizardAndAskPath(
          { ...pptWizard, audience, scenario: pptWizard.scenario || parseScenarioExplicit(pptWizard.pendingNote) || '' },
          pptWizard.scenario || parseScenarioExplicit(pptWizard.pendingNote) || '疾病教育'
        );
        return true;
      }
      setPptWizard({
        ...pptWizard,
        audience,
        scenario: pptWizard.scenario || parseScenarioExplicit(fullContext) || '',
        step: 'scenario',
      });
      const guide = guideMissingFields('生成 PPT', ['scenario']);
      addMsg('ai', `已记录受众 <strong>${audience}</strong>。${guide.html}`, 'DeepSeek-V3.1', guide.chips);
      return true;
    }

    if (step === 'scenario') {
      if (!scenario) {
        const guide = guideMissingFields('生成 PPT', ['scenario']);
        addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
        return true;
      }
      finishPptWizardAndAskPath({ ...pptWizard, audience: audience || pptWizard.audience }, scenario);
      return true;
    }

    return true;
  };

  function combinedIncludesGenerateOutline(t: string) {
    return t.includes('生成大纲');
  }

  const generatePptDirectly = async (
    userNote: string,
    audience: string,
    scenario: string
  ) => {
    const { brief } = buildContentBrief(userNote);
    void runWithAi(
      '正在直接生成 PPT',
      async () => {
      const raw = await api.generatePptOutline({
        materials: library,
        brief,
        audience,
        scenario,
        userNote,
      });
      notifyMockIfNeeded(raw);
      const outline = normalizeOutline(raw, audience, scenario);
      setPptOutline(outline);

      const designs = await api.generatePptDesigns(outline, audience, scenario, null);
      notifyMockIfNeeded(designs);
      const { versions } = designs;
      const notedVersions = versions.map((version) => ({
        ...version,
        slides: ensureSlideSpeakerNotes(version.slides),
      }));
      setPptVersions(notedVersions);
      seedPptVersionMocks();
      const first = notedVersions[0];
      if (first) {
        setSelectedPptVersionId(first.id);
        setPptResult({ title: outline.title, slides: first.slides });
      }
      setState((prev) => ({ ...prev, pptDesign: true }));
      addTab('ppt-design');
      const doneGuide = guidePptDirectDone(versions.length, first?.slides?.length ?? 0);
      addMsg('ai', doneGuide.html, 'DeepSeek-V3.1｜PPT 设计', doneGuide.chips);
    },
      () => void generatePptDirectly(userNote, audience, scenario)
    );
  };

  const generatePptOutlineAndOpen = async (
    userNote: string,
    audience: string,
    scenario: string
  ) => {
    const { brief } = buildContentBrief(userNote);
    void runWithAi(
      '正在智能生成 PPT 大纲',
      async () => {
      const raw = await api.generatePptOutline({
        materials: library,
        brief,
        audience,
        scenario,
        userNote,
      });
      notifyMockIfNeeded(raw);
      const outline = normalizeOutline(raw, audience, scenario);
      setPptOutline(outline);
      setState((prev) => ({ ...prev, pptOutline: true, active: 'ppt-outline' }));
      addTab('ppt-outline');
      addMsg(
        'ai',
        `已为「${outline.title}」生成大纲，共 ${outline.chapters.length} 节。请在中间「PPT大纲」中按节编辑，确认后点击「按模板生成 PPT」。`,
        'DeepSeek-V3.1｜PPT 大纲',
        ['查看大纲']
      );
    },
      () => void generatePptOutlineAndOpen(userNote, audience, scenario)
    );
  };

  const startPptFlow = (
    userNote = '',
    opts?: { skipUserMsg?: boolean; path?: 'outline' | 'direct' }
  ) => {
    if (isGenerating) {
      toast('请等待当前 AI 生成完成');
      return;
    }
    if (!opts?.skipUserMsg) addMsg('user', userNote || '生成PPT', selectedModel);

    const fullContext = getRecentUserContext(userNote);
    const audience =
      parseAudience(fullContext) || parseAudience(userNote) || '公众';
    const scenario =
      parseScenarioExplicit(fullContext) ||
      parseScenarioExplicit(userNote) ||
      parseScenario(fullContext) ||
      '疾病教育';
    const note = userNote || fullContext;

    // 快捷按钮「生成PPT大纲 / 直接生成PPT」须绕过向导，否则会卡在 audience 步骤反复提示
    if (opts?.path === 'outline') {
      setPptWizard(null);
      void generatePptOutlineAndOpen(note, audience, scenario);
      return;
    }
    if (opts?.path === 'direct') {
      setPptWizard(null);
      void generatePptDirectly(note, audience, scenario);
      return;
    }

    if (pptWizardRef.current?.active) {
      handlePptWizardReply(userNote, '');
      return;
    }

    const parsedAudience = parseAudience(fullContext);
    const parsedScenario = parseScenarioExplicit(fullContext) || parseScenario(fullContext);

    const runWithPath = (aud: string, scen: string, note: string) => {
      if (opts?.path === 'outline' || isPptOutlinePath(note)) {
        void generatePptOutlineAndOpen(note, aud, scen);
        return;
      }
      if (opts?.path === 'direct' || isPptDirectPath(note)) {
        void generatePptDirectly(note, aud, scen);
        return;
      }
      setPptWizard({
        active: true,
        step: 'path',
        audience: aud,
        scenario: scen,
        pendingNote: note,
      });
      const guide = guidePptPath();
      addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
    };

    if (parsedAudience && parsedScenario) {
      runWithPath(parsedAudience, parsedScenario, note);
      return;
    }

    const missing = getMissingForPpt(fullContext);
    if (missing.length === 0) {
      runWithPath(parsedAudience || '公众', parsedScenario || '疾病教育', note);
      return;
    }

    setPptWizard({
      active: true,
      step: missing[0] === 'audience' ? 'audience' : 'scenario',
      audience: audience || '',
      scenario: scenario || '',
      pendingNote: userNote || fullContext,
    });

    const guide = guideMissingFields('生成 PPT', missing);
    addMsg('ai', guide.html, 'DeepSeek-V3.1', guide.chips);
  };

  const regeneratePptOutline = () => {
    if (!pptOutline) return;
    void generatePptOutlineAndOpen(
      pptWizard?.pendingNote || '',
      pptOutline.audience,
      pptOutline.scenario
    );
  };

  const outlineFromCopy = () => {
    const copy = getActiveCopyBody();
    if (!copy) {
      toast('暂无文案，请先生成文案或在对话中描述需求');
      return;
    }
    const audience = pptOutline?.audience || '公众';
    const scenario = pptOutline?.scenario || '疾病教育';
    void runWithAi(
      '正在根据文案生成大纲',
      async () => {
      const raw = await api.generatePptOutline({
        materials: library,
        brief: copy,
        audience,
        scenario,
        userNote: '根据已有文案结构化为PPT大纲',
      });
      notifyMockIfNeeded(raw);
      const outline = normalizeOutline(raw, audience, scenario);
      setPptOutline(outline);
      setState((prev) => ({ ...prev, pptOutline: true, active: 'ppt-outline' }));
      addTab('ppt-outline');
      toast('已根据文案更新大纲');
    },
      () => outlineFromCopy()
    );
  };

  const seedPptVersionMocks = () => {
    setModificationTasks((prev) => [
      ...prev.filter((task) => !isPptDesignModificationTask(task)),
      ...createMockModificationTasks(),
    ]);
    setPptPageVersionEpoch((value) => value + 1);
  };

  const confirmPptDesigns = (mode?: 'template' | 'no-template', templateId?: string) => {
    if (!pptOutline) {
      toast('请先生成并确认 PPT 大纲，再切换模板');
      setState((prev) => ({ ...prev, active: 'ppt-outline' }));
      return;
    }
    if (templateId) setSelectedPptTemplateId(templateId);
    const resolvedTemplateId = templateId ?? selectedPptTemplateId;
    const selectedTemplate = allPptTemplates.find(
      (template) => template.id === resolvedTemplateId
    );
    const blankSelected = isBlankPptTemplate(selectedTemplate);
    const effectiveMode =
      mode ?? (blankSelected ? 'no-template' : selectedTemplate ? 'template' : 'no-template');
    if (effectiveMode === 'template' && !selectedTemplate) {
      toast('请先在「PPT大纲」中选择一套模板');
      setState((prev) => ({ ...prev, active: 'ppt-outline' }));
      return;
    }
    const tpl = effectiveMode === 'template' && !blankSelected ? selectedTemplate : null;
    const loadingLabel = tpl
      ? `正在按「${tpl.name}」模板生成 PPT`
      : '正在按「空白模板」生成 PPT';
    void runWithAi(
      loadingLabel,
      async () => {
      const designs = await api.generatePptDesigns(
        pptOutline,
        pptOutline.audience,
        pptOutline.scenario,
        tpl?.generationTemplateId ?? tpl?.id ?? null
      );
      notifyMockIfNeeded(designs);
      const versions = applyPptTemplateImages(
        (tpl ? designs.versions : designs.versions.slice(0, 1)).map((version) => ({
          ...version,
          slides: ensureSlideSpeakerNotes(version.slides),
        })),
        tpl ?? undefined
      );
      setPptVersions(versions);
      seedPptVersionMocks();
      const first = versions[0];
      if (first) {
        setSelectedPptVersionId(first.id);
        setPptResult({ title: pptOutline.title, slides: first.slides });
      }
      setState((prev) => ({ ...prev, pptDesign: true, active: 'ppt-design' }));
      addTab('ppt-design');
      if (tpl) {
        addMsg(
          'ai',
          `已按「${tpl.name}」模板生成 PPT，共 ${first?.slides?.length ?? 0} 页。请在右侧「PPT生成」中预览与编辑。`,
          'DeepSeek-V3.1｜PPT 设计',
          ['查看大纲', '提交当前版本到Veeva Vault']
        );
      } else {
        addMsg(
          'ai',
          `已按「空白模板」生成 PPT，共 ${first?.slides?.length ?? 0} 页。请在右侧「PPT生成」中预览与编辑。`,
          'DeepSeek-V3.1｜PPT 设计',
          ['查看大纲', '提交当前版本到Veeva Vault']
        );
      }
    },
      () => confirmPptDesigns(effectiveMode)
    );
  };

  const selectPptVersion = (version: PptDesignVersion) => {
    const slides = ensureSlideSpeakerNotes(version.slides);
    setSelectedPptVersionId(version.id);
    setPptResult({ title: pptOutline?.title, slides });
    setPptVersions((prev) =>
      prev.map((item) => (item.id === version.id ? { ...item, slides } : item))
    );
    toast(`已选用「${version.name}」`);
  };

  const runSubmit = (opts?: { skipUserMsg?: boolean }) => {
    if (!opts?.skipUserMsg) addMsg('user', '提交Veeva Vault审批', selectedModel);
    const selectedVideo = videoVersions.find((v) => v.id === selectedVideoVersionId);
    const parts = ['内容文件', '素材引用', '合规记录', '团队修改记录'];
    if (selectedVideo) parts.push(`视频「${selectedVideo.name}」`);
    setState((prev) => ({ ...prev, submit: true, active: 'submit' }));
    addTab('submit');
    addMsg(
      'ai',
      `已整理 Veeva Vault 提交包：${parts.join('、')}。（演示模式：实际提交需对接 Veeva API）`,
      'DeepSeek-V3.1',
      ['下载审计报告', '保存回CMS']
    );
  };

  const fillQuick = (text: string) => {
    if (isGenerating) {
      toast('请等待当前 AI 生成完成');
      return;
    }
    if (text === '切换到 Agent 模式') {
      toast('已在执行模式，可直接下达修改或生成指令');
      return;
    }
    if (text === '继续完善计划') {
      setInputValue('请补充验收标准、风险点与优先级：');
      toast('可继续补充计划细节');
      return;
    }
    if (text === '按此计划执行') {
      addMsg('user', text, selectedModel);
      addMsg(
        'ai',
        '开始按计划执行。你可以指定从哪一步开始，或直接下达生成指令。',
        selectedModel,
        ['生成PPT', '生成图片', '生成图文']
      );
      return;
    }
    if (runDemoScenarioScript(text, { addUserMessage: true })) return;
    addMsg('user', text, selectedModel);
    if (runWorkspaceMockCommand(text)) return;

    const activeTab = stateRef.current.active;
    const wizard = pptWizardRef.current;
    const visualWiz = visualWizardRef.current;

    if (visualWiz?.active) {
      handleVisualWizardReply(text);
      return;
    }

    if (text === '上传热点洞察素材') {
      topicInsightUploadPendingRef.current = true;
      openMaterialPicker('workspace', HOT_INSIGHT_CATEGORY);
      return;
    }
    if (text === '使用已有素材继续') {
      const note = pendingTopicInsightNoteRef.current || getRecentUserContext(text);
      pendingTopicInsightNoteRef.current = '';
      runTopicInsightAgent(note, { skipUserMsg: true, forceSkill: 'B' });
      return;
    }
    if (text === '基于所选话题生成文案') {
      runCopy(undefined, { skipUserMsg: true });
      return;
    }
    if (text === '基于所选话题生成PPT大纲') {
      startPptFlow(getRecentUserContext(text), { skipUserMsg: true, path: 'outline' });
      return;
    }
    if (text === '基于所选话题生成图片') {
      startVisualFlow(getRecentUserContext(text), { skipUserMsg: true });
      return;
    }

    if (text === '自由探索') {
      showFlexibleWorkflowGuide();
      return;
    }
    if (text === '标准流程：洞察→文案') {
      runInsight('按标准流程生成话题洞察', { skipUserMsg: true });
      return;
    }
    if (text === '直接生成文案') {
      runCopy(getRecentUserContext(text), { skipUserMsg: true });
      return;
    }
    if (text === '直接生成图片') {
      const templateHint =
        entryContext?.intent === 'visual-template' ? entryContext.templateTitle : undefined;
      startVisualFlow(getRecentUserContext(text), { skipUserMsg: true, templateHint });
      return;
    }
    if (text === '先大纲后PPT' || text === '生成PPT大纲') {
      startPptFlow(getRecentUserContext(text), { skipUserMsg: true, path: 'outline' });
      return;
    }
    if (text === '直接生成PPT') {
      startPptFlow(getRecentUserContext(text), { skipUserMsg: true, path: 'direct' });
      return;
    }
    if (text === '直接生成视频' || text === '跳过脚本直接生成') {
      startVideoFlow(getRecentUserContext(text), { skipUserMsg: true });
      return;
    }
    if (text === '重试') {
      retryLastAi();
      return;
    }
    if (text.includes('开始生成PPT')) {
      startPptFlow(text, { skipUserMsg: true });
      return;
    }
    if (text.includes('开始生成配图') || text.includes('开始生成图片')) {
      const templateHint =
        entryContext?.intent === 'visual-template' ? entryContext.templateTitle : undefined;
      startVisualFlow(text, { skipUserMsg: true, templateHint });
      return;
    }
    if (text.includes('开始生成话题洞察') || isInsightQuickAction(text)) {
      runInsight(text, { skipUserMsg: true });
      return;
    }
    if (text.includes('开始生成文案')) {
      runCopy(text, { skipUserMsg: true });
      return;
    }
    if (text === '选用内置模板') {
      const note = getRecentUserContext(text);
      openImageTemplatePicker(note, entryContext?.templateTitle || '');
      return;
    }
    if (text === '直接开始') {
      dispatchUserIntent(text, true);
      return;
    }

    if (text.includes('查看大纲')) {
      openPptOutlineTab();
      return;
    }
    if (text === '返回 PPT 生成') {
      setState((prev) => ({ ...prev, active: 'ppt-design' }));
      return;
    }
    if (text === '重新生成视频') {
      confirmVideoRender();
      return;
    }
    if (text.includes('生成设计')) {
      confirmPptDesigns();
      return;
    }
    if (text.includes('从文案生成大纲')) {
      outlineFromCopy();
      return;
    }
    if (wizard?.active) {
      handlePptWizardReply(text, inputValue.trim());
      return;
    }
    if (text.includes('生成大纲')) {
      if (stateRef.current.active === 'ppt-outline' || pptOutline) {
        setState((prev) => ({ ...prev, active: 'ppt-outline' }));
        return;
      }
    }
    if (shouldPreferVisualFlow(entryContext, text)) {
      const templateHint =
        entryContext?.intent === 'visual-template' ? entryContext.templateTitle : undefined;
      startVisualFlow(text, { skipUserMsg: true, templateHint });
      return;
    }
    const inPptEntry = isPptEntryIntent(entryContext);
    const parsedAud = parseAudience(text);
    const parsedScen = parseScenario(text);
    if (
      inPptEntry &&
      (parsedAud || parsedScen) &&
      text.trim().length <= 24 &&
      !text.includes('生成文案')
    ) {
      startPptFlow(text, { skipUserMsg: true });
      return;
    }
    if (text.includes('编辑器') || text === '打开视觉编辑器') {
      const idx = selectedImages.findIndex(Boolean);
      const pick = idx >= 0 ? idx : 0;
      openImageEditor(generatedImages[pick] || posterData, pick);
      return;
    }
    if (
      text === '生成视频' ||
      text.includes('生成视频') ||
      text.includes('视频脚本') ||
      text.includes('视频')
    ) {
      if (text === '重新生成视频' && videoResult) {
        confirmVideoRender();
      } else {
        startVideoFlow(getRecentUserContext(text), { skipUserMsg: true });
      }
      return;
    }
    if (
      text.includes('Veeva') ||
      text.includes('veeva') ||
      text.includes('提交当前') ||
      (text.includes('提交') && text.includes('审批'))
    ) {
      runSubmit({ skipUserMsg: true });
      return;
    }
    if (text.includes('文案') && (text.includes('生成') || text.includes('批量'))) {
      runCopy(text, { skipUserMsg: true });
      return;
    }
    if (text.includes('生成文案')) {
      runCopy(text, { skipUserMsg: true });
      return;
    }
    if (
      (text.includes('图片') || text.includes('配图') || text.includes('海报')) &&
      !text.includes('团队修改邀请')
    ) {
      const templateHint =
        entryContext?.intent === 'visual-template' && entryContext.templateTitle
          ? entryContext.templateTitle
          : undefined;
      startVisualFlow(text, { skipUserMsg: true, templateHint });
      return;
    }
    if (text.includes('PPT') || text.includes('ppt')) {
      startPptFlow(text, { skipUserMsg: true });
      return;
    }
    if (text.includes('团队') && text.includes('修改')) {
      if (text.includes('整合') || text.includes('反馈')) {
        runTeam({ skipUserMsg: true, feedback: text });
      } else {
        openTeamReview(resolveTeamReviewType(text, activeTab));
      }
      return;
    }
    dispatchUserIntent(text, true);
  };

  const nextPrompts = (): string[] => {
    const base = ['生成话题洞察', '直接生成文案', '直接生成图片', '直接生成PPT', '直接生成视频'];
    if (state.visual && generatedImages.length) {
      return ['进入团队修改', '提交当前版本到Veeva Vault', '直接生成PPT', '直接生成视频'];
    }
    if (state.copy || state.insight) {
      return ['生成图片', '生成PPT大纲', '直接生成视频', '提交当前版本到Veeva Vault'];
    }
    return base;
  };

  const lockFlowEntry = (next: ContentFlowEntry | null) => {
    if (!next) return;
    setFlowEntry((prev) => prev ?? next);
  };

  const addTab = (key: TabKey) => {
    lockFlowEntry(flowEntryFromTab(key));
    setState(prev => {
      if (!prev.tabs.includes(key)) {
        return { ...prev, tabs: [...prev.tabs, key], active: key };
      }
      return { ...prev, active: key };
    });
  };

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach((timer) => clearTimeout(timer));
    demoTimersRef.current = [];
  };

  const demoSleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        demoTimersRef.current = demoTimersRef.current.filter((item) => item !== timer);
        resolve();
      }, ms);
      demoTimersRef.current.push(timer);
    });

  const escapeDemoHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatDemoStreamText = (value: string) =>
    escapeDemoHtml(value)
      .replace(/\n/g, '<br>')
      .replace(/• /g, '&bull; ');

  const streamDemoAiMessage = async (text: string, quick: string[] = []) => {
    const streamId = `demo-stream-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const marker = `<!--${streamId}-->`;
    setMessages((prev) => [...prev, { role: 'ai', html: marker, model: 'GPT-5.5', quick: [] }]);
    let visible = '';
    for (let i = 0; i < text.length; i += 2) {
      visible += text.slice(i, i + 2);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.html.includes(marker)
            ? { ...msg, html: `${marker}${formatDemoStreamText(visible)}`, quick: [] }
            : msg
        )
      );
      await demoSleep(8);
    }
    setMessages((prev) =>
      prev.map((msg) =>
        msg.html.includes(marker)
          ? { ...msg, html: `${marker}${formatDemoStreamText(text)}`, quick }
          : msg
      )
    );
  };

  const publishAcademicDemoImage = (kind: 'poster' | 'case-card') => {
    const image = getAcademicDemoImage(kind);
    setGeneratedImages((prev) => (kind === 'poster' ? [image.dataUrl] : [...prev, image.dataUrl]));
    setGeneratedImageMeta((prev) =>
      kind === 'poster'
        ? [{ copyTitle: image.copyTitle, copyIndex: -1, imageIndex: 0 }]
        : [...prev, { copyTitle: image.copyTitle, copyIndex: -1, imageIndex: prev.length }]
    );
    setSelectedImages((prev) => (kind === 'poster' ? [true] : [...prev, true]));
    setImageReviewOrigins([]);
    setImageReviewStatuses([]);
    addTab('visual');
    setState((prev) => ({ ...prev, visual: true, active: 'visual' }));
  };

  const runDemoLoadingStep = async (title: string, task: () => Promise<void>) => {
    setIsGenerating(true);
    showLoading(title);
    try {
      await demoSleep(1000);
      clearLoadingMessages();
      await task();
      lastAiRetryRef.current = null;
    } catch (e) {
      clearLoadingMessages();
      const msg = e instanceof Error ? e.message : '演示脚本执行失败';
      addMsg('ai', `<span style="color:#b72c3e">生成失败：${msg}</span>`, 'DeepSeek-V3.1', ['重试']);
      toast(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const runAcademicCaseCardDemo = () => {
    setDemoScriptStep('complete');
    void runDemoLoadingStep('正在生成病例卡', async () => {
      await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.caseGenerating);
      await demoSleep(5000);
      publishAcademicDemoImage('case-card');
      await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.caseDone, [...ACADEMIC_DEMO_BUTTONS.caseNext]);
    });
  };

  const runAcademicPosterDemo = () => {
    setDemoScriptStep('after-poster');
    void runDemoLoadingStep('正在生成会议海报', async () => {
      await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.posterGenerating);
      await demoSleep(5000);
      publishAcademicDemoImage('poster');
      await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.posterDone, [...ACADEMIC_DEMO_BUTTONS.posterNext]);
    });
  };

  const runAcademicDemoScript = (
    text: string,
    opts?: { addUserMessage?: boolean; forceStart?: boolean }
  ): boolean => {
    const shouldUseAcademicScript =
      isDemoMode() && demoScenario === 'academic' && (opts?.forceStart || demoScriptStep !== 'idle');
    if (!shouldUseAcademicScript) return false;
    if (isGenerating) {
      toast('请等待当前演示步骤完成');
      return true;
    }

    const currentStep = opts?.forceStart ? 'idle' : demoScriptStep;
    if (opts?.addUserMessage) {
      addMsg('user', text, selectedModel);
    }

    if (currentStep === 'idle') {
      setDemoScriptStep('await-scene');
      void runDemoLoadingStep('正在理解创作需求', async () => {
        await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.askScene, [...ACADEMIC_DEMO_BUTTONS.scene]);
      });
      return true;
    }

    if (currentStep === 'await-scene') {
      setDemoScriptStep('await-format');
      void runDemoLoadingStep('正在识别应用场景', async () => {
        await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.askFormat, [...ACADEMIC_DEMO_BUTTONS.format]);
      });
      return true;
    }

    if (currentStep === 'await-format') {
      setDemoScriptStep('await-brief');
      void runDemoLoadingStep('正在确认内容形式', async () => {
        await streamDemoAiMessage(ACADEMIC_DEMO_TEXT.askBrief, [...ACADEMIC_DEMO_BUTTONS.direct]);
      });
      return true;
    }

    if (currentStep === 'await-brief') {
      runAcademicPosterDemo();
      return true;
    }

    if (currentStep === 'after-poster' && text === '生成病例卡') {
      setDemoScriptStep('await-case-card');
      return true;
    }

    if (currentStep === 'after-poster' && (text.includes('PPT') || text.includes('新闻'))) {
      void runDemoLoadingStep('正在读取预置分支', async () => {
        await streamDemoAiMessage(
          '该按钮已记录为后续演示分支。本场景当前继续演示「病例卡」生成，请点击【生成病例卡】或直接补充病例卡需求。',
          [...ACADEMIC_DEMO_BUTTONS.posterNext]
        );
      });
      return true;
    }

    if (currentStep === 'after-poster' || currentStep === 'await-case-card') {
      runAcademicCaseCardDemo();
      return true;
    }

    if (currentStep === 'complete') {
      void runDemoLoadingStep('正在读取预置素材', async () => {
        await streamDemoAiMessage(
          '当前学术传播会议演示脚本已完成。本轮结果均为预置素材，您可以在右侧继续查看和编辑海报与病例卡。',
          [...ACADEMIC_DEMO_BUTTONS.caseNext]
        );
      });
      return true;
    }

    return false;
  };

  const publishPatientVideoScript = () => {
    setVideoResult(PATIENT_EDUCATION_VIDEO_SCRIPT_01);
    setVideoVersions([]);
    setSelectedVideoVersionId(null);
    addTab('video-render');
    setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
  };

  const publishPatientVideoResult = () => {
    const version = getPatientEducationVideoVersion();
    setVideoVersions([version]);
    setSelectedVideoVersionId(version.id);
    addTab('video-render');
    setState((prev) => ({ ...prev, videoRender: true, active: 'video-render' }));
  };

  const runPatientEducationVideoGeneration = () => {
    setDemoScriptStep('video-ready');
    setIsGenerating(true);
    showLoading('正在分析视频脚本');
    void (async () => {
      try {
        const stages = ['正在分析视频脚本...', '正在生成分镜...', '正在匹配数字素材...', '正在生成视频...'];
        for (const stage of stages) {
          showLoading(stage);
          await demoSleep(900);
        }
        clearLoadingMessages();
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.videoGenerating);
        await demoSleep(5000);
        publishPatientVideoResult();
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.videoDone, [...PATIENT_VIDEO_DEMO_BUTTONS.videoNext]);
      } catch (e) {
        clearLoadingMessages();
        const msg = e instanceof Error ? e.message : '生成失败';
        addMsg('ai', `<span style="color:#b72c3e">生成失败：${msg}</span>`, 'GPT-5.5', ['重试']);
        toast(msg);
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const runPatientEducationVideoDemoScript = (
    text: string,
    opts?: { addUserMessage?: boolean; forceStart?: boolean }
  ): boolean => {
    const shouldUsePatientVideoScript =
      isDemoMode() && demoScenario === 'patient-education' && (opts?.forceStart || demoScriptStep !== 'idle');
    if (!shouldUsePatientVideoScript) return false;
    if (isGenerating) {
      toast('请等待当前演示步骤完成');
      return true;
    }

    const currentStep = opts?.forceStart ? 'idle' : demoScriptStep;
    if (opts?.addUserMessage) {
      addMsg('user', text, selectedModel);
    }

    if (currentStep === 'idle') {
      setDemoScriptStep('await-video-choice');
      void runDemoLoadingStep('正在理解创作需求', async () => {
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.recognized, [...PATIENT_VIDEO_DEMO_BUTTONS.firstChoice]);
      });
      return true;
    }

    if (currentStep === 'await-video-choice') {
      if (text === '生成视频') {
        publishPatientVideoScript();
        runPatientEducationVideoGeneration();
        return true;
      }
      setDemoScriptStep('script-ready');
      void runDemoLoadingStep('正在生成视频脚本', async () => {
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.scriptGenerating);
        await demoSleep(3000);
        publishPatientVideoScript();
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.scriptDone, [...PATIENT_VIDEO_DEMO_BUTTONS.scriptReady]);
      });
      return true;
    }

    if (currentStep === 'script-ready') {
      if (text === '编辑脚本') {
        void runDemoLoadingStep('正在打开视频脚本', async () => {
          publishPatientVideoScript();
          await streamDemoAiMessage('已打开右侧视频脚本，您可以查看分镜内容。', [
            ...PATIENT_VIDEO_DEMO_BUTTONS.scriptReady,
          ]);
        });
        return true;
      }
      runPatientEducationVideoGeneration();
      return true;
    }

    if (currentStep === 'video-ready') {
      void runDemoLoadingStep('正在读取患者教育素材', async () => {
        await streamDemoAiMessage(PATIENT_VIDEO_DEMO_TEXT.videoDone, [...PATIENT_VIDEO_DEMO_BUTTONS.videoNext]);
      });
      return true;
    }

    return false;
  };

  const publishHcpPptOutline = () => {
    setPptOutline(HCP_PPT_OUTLINE_01);
    setPptVersions([]);
    setPptResult(null);
    setSelectedPptVersionId(null);
    setSelectedPptTemplateId(null);
    addTab('ppt-outline');
    setState((prev) => ({ ...prev, pptOutline: true, active: 'ppt-outline' }));
  };

  const publishHcpPptResult = () => {
    const version = HCP_PPT_RESULT_01;
    setPptOutline(HCP_PPT_OUTLINE_01);
    setPptVersions([version]);
    setSelectedPptVersionId(version.id);
    setPptResult({ title: HCP_PPT_OUTLINE_01.title, slides: version.slides });
    seedPptVersionMocks();
    addTab('ppt-outline');
    addTab('ppt-design');
    setState((prev) => ({
      ...prev,
      pptOutline: true,
      pptDesign: true,
      active: 'ppt-design',
    }));
  };

  const runHcpPptDemoScript = (
    text: string,
    opts?: { addUserMessage?: boolean; forceStart?: boolean }
  ): boolean => {
    const shouldUseHcpPptScript =
      isDemoMode() && demoScenario === 'hcp' && (opts?.forceStart || demoScriptStep !== 'idle');
    if (!shouldUseHcpPptScript) return false;
    if (isGenerating) {
      toast('请等待当前演示步骤完成');
      return true;
    }

    const currentStep = opts?.forceStart ? 'idle' : demoScriptStep;
    if (opts?.addUserMessage) {
      addMsg('user', text, selectedModel);
    }

    if (currentStep === 'idle') {
      setDemoScriptStep('hcp-await-scene');
      void runDemoLoadingStep('正在理解创作需求', async () => {
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.askScene, [...HCP_PPT_DEMO_BUTTONS.scene]);
      });
      return true;
    }

    if (currentStep === 'hcp-await-scene') {
      setDemoScriptStep('hcp-await-requirements');
      void runDemoLoadingStep('正在识别应用场景', async () => {
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.askRequirements, [...HCP_PPT_DEMO_BUTTONS.direct]);
      });
      return true;
    }

    if (currentStep === 'hcp-await-requirements') {
      setDemoScriptStep('hcp-await-path');
      void runDemoLoadingStep('正在确认PPT生成路径', async () => {
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.askPath, [...HCP_PPT_DEMO_BUTTONS.path]);
      });
      return true;
    }

    if (currentStep === 'hcp-await-path') {
      if (text.includes('PPT') && !text.includes('大纲')) {
        setDemoScriptStep('hcp-complete');
        void runDemoLoadingStep('正在生成PPT', async () => {
          await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.pptGenerating);
          await demoSleep(3000);
          publishHcpPptResult();
          await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.pptDone, [...HCP_PPT_DEMO_BUTTONS.done]);
        });
        return true;
      }

      setDemoScriptStep('hcp-outline-ready');
      void runDemoLoadingStep('正在生成PPT大纲', async () => {
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.outlineGenerating);
        await demoSleep(3000);
        publishHcpPptOutline();
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.outlineDone, [...HCP_PPT_DEMO_BUTTONS.outlineDone]);
      });
      return true;
    }

    if (currentStep === 'hcp-outline-ready') {
      setDemoScriptStep('hcp-complete');
      void runDemoLoadingStep('正在生成PPT', async () => {
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.pptGenerating);
        await demoSleep(3000);
        publishHcpPptResult();
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.pptDone, [...HCP_PPT_DEMO_BUTTONS.done]);
      });
      return true;
    }

    if (currentStep === 'hcp-complete') {
      void runDemoLoadingStep('正在读取预置PPT', async () => {
        publishHcpPptResult();
        await streamDemoAiMessage(HCP_PPT_DEMO_TEXT.pptDone, [...HCP_PPT_DEMO_BUTTONS.done]);
      });
      return true;
    }

    return false;
  };

  const runDemoScenarioScript = (
    text: string,
    opts?: { addUserMessage?: boolean; forceStart?: boolean }
  ): boolean => {
    if (!isDemoMode()) return false;

    if (demoScenario === 'academic') {
      return runAcademicDemoScript(text, opts);
    }

    if (demoScenario === 'patient-education') {
      return runPatientEducationVideoDemoScript(text, opts);
    }

    if (demoScenario === 'hcp') {
      return runHcpPptDemoScript(text, opts);
    }

    if (isGenerating) {
      toast('请等待当前演示步骤完成');
      return true;
    }

    if (opts?.addUserMessage) {
      addMsg('user', text, selectedModel);
    }

    void runDemoLoadingStep('正在读取演示脚本', async () => {
      const scenarioLabel = demoScenario === 'hcp' ? 'HCP沟通' : '患者教育';
      await streamDemoAiMessage(
        `当前演示场景为【${scenarioLabel}】。该场景脚本尚未配置完成。\n\n请切换到【学术会议】后重新点击开始创作，或继续提供该场景的固定脚本，我会按相同机制接入。`,
        ['生成图片', '生成PPT大纲', '直接生成视频']
      );
    });
    return true;
  };

  useEffect(() => {
    return () => clearDemoTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 组件卸载时清理演示脚本定时器
  }, []);

  const openPptOutlineTab = () => {
    if (!pptOutline) {
      toast('暂无 PPT 大纲，请先生成 PPT');
      return;
    }
    const wasHidden = !stateRef.current.tabs.includes('ppt-outline');
    addTab('ppt-outline');
    setState((prev) => ({ ...prev, pptOutline: true }));
    if (wasHidden) {
      addMsg(
        'ai',
        `已在中间展示「PPT大纲」，共 ${pptOutline.chapters.length} 节。可按需编辑结构；修改后可在「PPT生成」中重新生成设计稿。`,
        'DeepSeek-V3.1',
        ['生成设计', '返回 PPT 生成']
      );
    }
  };

  const openDetail = (title: string, body: string) => {
    setModalContent({ title, body });
    setShowModal(true);
  };

  const importLocalPptVersion = (file: File) => {
    const isPpt = /\.pptx?$/i.test(file.name);
    if (!isPpt) {
      toast('请选择 PPT 或 PPTX 文件');
      return;
    }
    const sourceSlides =
      pptResult?.slides?.length
        ? pptResult.slides
        : pptVersions.find((version) => version.id === selectedPptVersionId)?.slides ||
          pptVersions[0]?.slides ||
          WORKSPACE_MOCK_PPT.slides;
    const slides = sourceSlides.map((slide, index) => ({
      ...slide,
      title: index === 0 ? file.name.replace(/\.(pptx?)$/i, '') : slide.title,
    }));
    const fileUrl = URL.createObjectURL(file);
    const currentId = selectedPptVersionId || pptVersions[0]?.id;
    if (currentId && pptVersions.length) {
      setPptVersions((prev) =>
        prev.map((version) =>
          version.id === currentId
            ? {
                ...version,
                name: `${file.name.replace(/\.(pptx?)$/i, '')}（本地导入）`,
                styleTag: '本地版本',
                description: `已用本地文件「${file.name}」覆盖当前在线版本`,
                slides,
                fileName: file.name,
                fileUrl,
              }
            : version
        )
      );
      setSelectedPptVersionId(currentId);
    } else {
      const imported = {
        id: `imported-${Date.now()}`,
        name: `${file.name.replace(/\.(pptx?)$/i, '')}（本地导入）`,
        styleTag: '本地版本',
        description: `已用本地文件「${file.name}」覆盖当前在线版本`,
        slides,
        fileName: file.name,
        fileUrl,
      };
      setPptVersions([imported]);
      setSelectedPptVersionId(imported.id);
    }
    setPptResult({
      title: file.name.replace(/\.(pptx?)$/i, '') || pptResult?.title || WORKSPACE_MOCK_PPT_OUTLINE.title,
      slides,
    });
    seedPptVersionMocks();
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('ppt-design') ? prev.tabs : [...prev.tabs, 'ppt-design'],
      active: 'ppt-design',
      pptDesign: true,
    }));
    toast(`已用「${file.name}」覆盖当前在线版本`);
  };

  const openVisualEditor = (src: string, target: EditorTarget, initialSvg?: string) => {
    let svg = initialSvg?.trim() || undefined;
    if (!svg && src.startsWith('data:image/svg+xml')) {
      svg = parseSvgFromDataUrl(src);
    }
    setEditorTarget(target);
    setEditorSrc(src);
    setEditorSvg(svg);
    setDrawerOpen(true);
    setShowModal(false);
  };

  const openImageEditor = (src: string, index: number) => {
    openVisualEditor(src, { kind: 'image', index });
  };

  const openPptSlideEditor = (index: number) => {
    if (!pptResult?.slides[index]) return;
    const slide = pptResult.slides[index];
    openVisualEditor(slideToPreviewUrl(slide), { kind: 'ppt-slide', index }, slide.svg || slide.imageUrl);
  };

  const touchActiveReviewTask = () => {
    if (!activeReviewTaskId) return;
    const task = getReviewTask(activeReviewTaskId);
    if (task && task.status !== 'completed') {
      upsertReviewTask({ ...task, status: 'in_progress' });
      refreshReviewTasks();
    }
  };

  const readCommentImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件');
      return null;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      toast('图片请小于 2.5MB');
      return null;
    }
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('读取失败'));
      reader.readAsDataURL(file);
    });
  }, [toast]);

  const replyToPptComment = (taskId: string, commentId: string) => {
    const content = creatorReplyDrafts[commentId]?.trim() || '';
    const imageUrl = creatorReplyImageDrafts[commentId];
    if (!content && !imageUrl) return;
    const task = getReviewTask(taskId);
    if (!task) {
      toast('批注所属审阅任务不存在');
      return;
    }
    const now = Date.now();
    upsertReviewTask({
      ...task,
      pptComments: (task.pptComments || []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...(comment.replies || []),
                {
                  id: `reply_${now}_${Math.random().toString(36).slice(2, 8)}`,
                  authorRole: 'ops',
                  authorName: ROLE_PROFILES.ops.name,
                  content,
                  imageUrl,
                  createdAt: now,
                },
              ],
            }
          : comment
      ),
    });
    setCreatorReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    setCreatorReplyImageDrafts((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    refreshReviewTasks();
    toast('回复已同步给审阅者');
  };

  const replyToCreatorAsReviewer = (commentId: string) => {
    const content = reviewerReplyDrafts[commentId]?.trim() || '';
    const imageUrl = reviewerReplyImageDrafts[commentId];
    if ((!content && !imageUrl) || !activeReviewTaskId) return;
    const task = getReviewTask(activeReviewTaskId);
    if (!task) return;
    const now = Date.now();
    upsertReviewTask({
      ...task,
      status: 'in_progress',
      pptComments: (task.pptComments || []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [
                ...(comment.replies || []),
                {
                  id: `reply_${now}_${Math.random().toString(36).slice(2, 8)}`,
                  authorRole: userRole,
                  authorName: ROLE_PROFILES[userRole].name,
                  content,
                  imageUrl,
                  createdAt: now,
                },
              ],
            }
          : comment
      ),
    });
    setReviewerReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    setReviewerReplyImageDrafts((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    refreshReviewTasks();
    toast('回复已同步给内容创作者');
  };

  const acceptImageReview = (index: number) => {
    setImageReviewStatuses((statuses) => {
      const { statuses: aligned } = alignImageReviewArrays(
        generatedImages,
        imageReviewOrigins,
        statuses
      );
      const next = [...aligned];
      next[index] = 'accepted';
      return next;
    });
    setImageReviewOrigins((origins) => {
      const { origins: aligned } = alignImageReviewArrays(
        generatedImages,
        origins,
        imageReviewStatuses
      );
      const next = [...aligned];
      next[index] = generatedImages[index];
      return next;
    });
    toast(`已采纳配图 ${index + 1} 的修改`);
  };

  const rejectImageReview = (index: number) => {
    const { origins } = alignImageReviewArrays(
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses
    );
    const original = origins[index];
    if (original) {
      setGeneratedImages((prev) => prev.map((img, i) => (i === index ? original : img)));
    }
    setImageReviewStatuses((statuses) => {
      const { statuses: aligned } = alignImageReviewArrays(
        generatedImages,
        imageReviewOrigins,
        statuses
      );
      const next = [...aligned];
      next[index] = 'rejected';
      return next;
    });
    toast(`配图 ${index + 1} 已恢复为原图`);
  };

  const acceptAllImageReviews = () => {
    const { origins, statuses } = alignImageReviewArrays(
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses
    );
    setImageReviewStatuses(statuses.map((s) => (s === 'pending' ? 'accepted' : s)));
    setImageReviewOrigins(
      generatedImages.map((img, i) => (statuses[i] === 'pending' ? img : origins[i]))
    );
    toast('已采纳全部待审配图修改');
  };

  const rejectAllImageReviews = () => {
    const { origins, statuses } = alignImageReviewArrays(
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses
    );
    setGeneratedImages((prev) =>
      prev.map((img, i) => (statuses[i] === 'pending' ? origins[i] ?? img : img))
    );
    setImageReviewStatuses((statuses) =>
      statuses.map((s) => (s === 'pending' ? 'rejected' : s))
    );
    toast('已全部恢复为原图');
  };

  const handleEditorUpdate = (dataUrl: string, svg?: string) => {
    if (editorTarget?.kind === 'image') {
      const index = editorTarget.index;
      setGeneratedImages((prev) => {
        const oldUrl = prev[index];
        if (isReviewerRole(userRole) && oldUrl && oldUrl !== dataUrl) {
          setImageReviewOrigins((origins) => {
            const { origins: aligned } = alignImageReviewArrays(prev, origins, []);
            const next = [...aligned];
            if (!origins[index] || origins.length !== prev.length) {
              next[index] = oldUrl;
            }
            return next;
          });
          setImageReviewStatuses((statuses) => {
            const { statuses: aligned } = alignImageReviewArrays(prev, [], statuses);
            const next = [...aligned];
            next[index] = 'pending';
            return next;
          });
        }
        return prev.map((img, i) => (i === index ? dataUrl : img));
      });
      touchActiveReviewTask();
      toast(
        activeReviewTaskId && isReviewerRole(userRole)
          ? '配图已保存，待内容运营采纳或恢复原图'
          : '图片已更新'
      );
    } else if (editorTarget?.kind === 'ppt-slide' && pptResult) {
      const idx = editorTarget.index;
      const slides = pptResult.slides.map((s, i) =>
        i === idx ? { ...s, svg: svg || s.svg } : s
      );
      setPptResult({ ...pptResult, slides });
      if (selectedPptVersionId) {
        setPptVersions((prev) =>
          prev.map((v) =>
            v.id === selectedPptVersionId ? { ...v, slides } : v
          )
        );
      }
      touchActiveReviewTask();
      toast(
        activeReviewTaskId && isReviewerRole(userRole)
          ? `第 ${slides[idx]?.page ?? idx + 1} 页已保存`
          : `第 ${slides[idx]?.page ?? idx + 1} 页已更新`
      );
    }
    setEditorSrc(dataUrl);
    if (svg) setEditorSvg(svg);
  };

  const handleEditorExport = () => {
    if (!editorSrc) return;
    const name =
      editorTarget?.kind === 'ppt-slide'
        ? `PPT-第${(editorTarget.index ?? 0) + 1}页.png`
        : '配图编辑.png';
    downloadDataUrl(editorSrc, name);
    toast('已导出 PNG');
  };

  const openReviewTask = (taskId: string) => {
    const task = getReviewTask(taskId);
    if (!task) {
      toast('任务不存在');
      return;
    }
    updateTaskStatus(taskId, 'in_progress');
    refreshReviewTasks();
    setActiveReviewTaskId(taskId);
    setReviewPptPageIndex(0);
    setReviewPptNotes(
      (task.pptComments || []).reduce<Record<number, PptReviewComment[]>>((grouped, comment) => {
        grouped[comment.pageIndex] = [...(grouped[comment.pageIndex] || []), comment];
        return grouped;
      }, {})
    );
    setReviewPptNoteDraft('');
    setReviewerReplyDrafts({});
    openSession(task.sessionId);
    setCurrentScreen('workspace');
    const session = getSession(task.sessionId);
    const sessionHasPpt =
      Boolean(session?.workspace.pptResult?.slides?.length) ||
      Boolean(session?.workspace.pptVersions?.some((version) => version.slides?.length));
    if (task.contentType === 'ppt' && !sessionHasPpt) {
      setPptOutline(WORKSPACE_MOCK_PPT_OUTLINE);
      setPptVersions([WORKSPACE_MOCK_PPT]);
      setSelectedPptVersionId(WORKSPACE_MOCK_PPT.id);
      setPptResult({
        title: WORKSPACE_MOCK_PPT_OUTLINE.title,
        slides: WORKSPACE_MOCK_PPT.slides,
      });
    }
    const tabs =
      task.contentType === 'ppt'
        ? ['ppt-design' as TabKey]
        : reviewerTabsForContentType(task.contentType, session?.workspace);
    setState((prev) => ({
      ...prev,
      active: tabs[0],
      tabs,
    }));
    const revisionBase =
      sessionCopyRevisionBase(task.sessionId) ||
      task.copyRevisionBase ||
      task.baseCopyText ||
      '';
    const mergedRevisions = mergeSessionCopyRevisions(task.sessionId);
    if (revisionBase) setCopyRevisionBase(revisionBase);
    setCopyRevisions(
      mergedRevisions.length
        ? normalizeCopyRevisions(revisionBase, mergedRevisions)
        : normalizeCopyRevisions(revisionBase, task.copyRevisions ?? [])
    );
  };

  const applyFigmaCapture = useCallback(
    (preset: string) => {
      seedReviewTasksIfEmpty();
      seedSessionsIfEmpty();
      refreshReviewTasks();
      setSessions(loadAllSessions());
      isHydratingRef.current = true;

      const demoCopy =
        '肾脏健康常常被忽略。了解相关风险因素，出现疑问时请咨询专业医生。';
      const demoCopyEdited =
        '肾脏健康需要长期关注。了解相关风险因素，出现疑问时请咨询专业医生。';
      const sampleImages = [posterData, posterData];

      const loadDemo = () => {
        const session = getSession(DEMO_SESSION_ID);
        if (session) loadSessionIntoApp(session);
        setCurrentScreen('workspace');
        return session;
      };

      switch (preset) {
        case 'home-ops':
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          setCurrentScreen('home');
          break;
        case 'home-reviewer':
          saveUserRole('medical');
          setUserRole('medical');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          setCurrentScreen('home');
          break;
        case 'library':
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          setCurrentScreen('library');
          break;
        case 'workspace-copy': {
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          const hcp = getSession('sess_demo_hcp');
          if (hcp) loadSessionIntoApp(hcp);
          setCurrentScreen('workspace');
          setState((prev) => ({
            ...prev,
            tabs: ['copy'],
            active: 'copy',
            copy: true,
            visual: false,
            team: false,
          }));
          break;
        }
        case 'workspace-visual': {
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          loadDemo();
          setGeneratedImages(sampleImages);
          setImageReviewOrigins([...sampleImages]);
          setImageReviewStatuses(['pending', null]);
          setSelectedImages([true, false]);
          setState((prev) => ({
            ...prev,
            tabs: ['visual'],
            active: 'visual',
            visual: true,
            copy: false,
            team: false,
          }));
          break;
        }
        case 'workspace-team': {
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          setDrawerOpen(false);
          loadDemo();
          setState((prev) => ({
            ...prev,
            tabs: ['team'],
            active: 'team',
            team: true,
          }));
          break;
        }
        case 'reviewer-copy': {
          saveUserRole('medical');
          setUserRole('medical');
          setDrawerOpen(false);
          loadDemo();
          setCopies([
            {
              title: '小红书疾病教育',
              body: demoCopyEdited,
              compliance: '已标注合规提示',
            },
          ]);
          setCopyRevisionBase(demoCopy);
          setCopyRevisions([
            createCopyRevision(demoCopy, demoCopyEdited, 'medical'),
          ]);
          setActiveReviewTaskId('rt_demo_medical');
          setState((prev) => ({
            ...prev,
            tabs: ['copy'],
            active: 'copy',
            copy: true,
          }));
          break;
        }
        case 'reviewer-visual': {
          saveUserRole('medical');
          setUserRole('medical');
          setDrawerOpen(false);
          loadDemo();
          setGeneratedImages(sampleImages);
          setSelectedImages([true, true]);
          setActiveReviewTaskId('rt_demo_visual');
          setState((prev) => ({
            ...prev,
            tabs: ['visual'],
            active: 'visual',
            visual: true,
          }));
          break;
        }
        case 'visual-editor': {
          saveUserRole('ops');
          setUserRole('ops');
          setActiveReviewTaskId(null);
          loadDemo();
          setGeneratedImages(sampleImages);
          setState((prev) => ({
            ...prev,
            tabs: ['visual'],
            active: 'visual',
            visual: true,
          }));
          setEditorTarget({ kind: 'image', index: 0 });
          setEditorSrc(sampleImages[0]);
          setDrawerOpen(true);
          break;
        }
        default:
          break;
      }

      requestAnimationFrame(() => {
        isHydratingRef.current = false;
      });
    },
    [loadSessionIntoApp]
  );

  useEffect(() => {
    const captureId = parseFigmaCaptureId();
    if (!captureId) return;
    document.body.setAttribute('data-figma-capture', captureId);
    applyFigmaCapture(captureId);
  }, [applyFigmaCapture]);

  const syncReviewTaskArtifacts = (
    revisions: CopyRevision[],
    revisionBase: string,
    status?: ReviewTask['status']
  ) => {
    if (!activeReviewTaskId) return;
    const task = getReviewTask(activeReviewTaskId);
    if (!task) return;
    if (task.contentType === 'copy') {
      propagateCopyRevisionsToSession(task.sessionId, revisions, revisionBase, {
        activeTaskId: activeReviewTaskId,
        statusForActive: status,
      });
    } else {
      upsertReviewTask({
        ...task,
        status: status ?? task.status,
        copyRevisions: revisions,
        copyRevisionBase: revisionBase,
        baseCopyText: task.baseCopyText || revisionBase,
      });
    }
    refreshReviewTasks();
  };

  const completeReviewTask = () => {
    if (!activeReviewTaskId) return;
    const task = getReviewTask(activeReviewTaskId);
    if (task) {
      const revisionBase =
        copyRevisionBase || task.copyRevisionBase || task.baseCopyText || '';
      if (task.contentType === 'copy') {
        propagateCopyRevisionsToSession(task.sessionId, copyRevisions, revisionBase, {
          activeTaskId: activeReviewTaskId,
          statusForActive: 'completed',
        });
      } else {
        upsertReviewTask({
          ...task,
          status: 'completed',
          copyRevisions,
          copyRevisionBase: revisionBase,
          completedReviewCount: isCommentableContentType(task.contentType)
            ? (task.completedReviewCount || 0) + 1
            : task.completedReviewCount,
        });
      }
    } else {
      updateTaskStatus(activeReviewTaskId, 'completed');
    }
    refreshReviewTasks();
    toast('已标记为审阅完成');
    setActiveReviewTaskId(null);
    if (isReviewerRole(userRole)) {
      setCurrentScreen('home');
    }
  };

  const saveCopyReview = (newText: string) => {
    const task = activeReviewTaskId ? getReviewTask(activeReviewTaskId) : undefined;
    const base =
      copyRevisionBase ||
      task?.copyRevisionBase ||
      task?.baseCopyText ||
      getActiveCopyBody() ||
      copies[0]?.body ||
      '';
    const revisionBase = copyRevisionBase || base;
    if (!copyRevisionBase) setCopyRevisionBase(revisionBase);
    const next = saveCopyRevisionMerged(copyRevisions, revisionBase, newText, userRole);
    setCopyRevisions(next);
    if (copies.length) {
      const matchedIndex = findCopyIndexByText(copies, revisionBase);
      const selectedIndex = selectedCopies.findIndex(Boolean);
      const targetIndex = matchedIndex >= 0 ? matchedIndex : selectedIndex >= 0 ? selectedIndex : 0;
      const updated = copies.map((copy, index) =>
        index === targetIndex ? { ...copy, body: newText } : copy
      );
      setCopies(updated);
    } else if (teamResult?.contentType === 'copy') {
      setTeamResult({ ...teamResult, after: newText });
    }
    syncReviewTaskArtifacts(next, revisionBase, 'in_progress');
    toast('文案修改已保存，运营端可查看增删记录');
  };

  const savePptOutlineReview = () => {
    if (!pptOutline) {
      toast('暂无 PPT 大纲可保存');
      return;
    }
    touchActiveReviewTask();
    persistCurrentSession();
    toast('PPT 大纲修改已保存，内容运营可在「PPT大纲」中查看');
  };

  const handleEditorGenerate = async (params: {
    editPrompt: string;
    maskBounds: { x: number; y: number; w: number; h: number } | null;
    svg?: string;
    layers: import('@/app/components/VisualEditor').DragLayer[];
  }) => {
    const result = await api.generatePosterEdit({
      svg: params.svg,
      editPrompt: params.editPrompt,
      maskBounds: params.maskBounds,
      layers: params.layers,
      copyBody: getActiveCopyBody(),
    });
    return { dataUrl: result.dataUrl, svg: result.svg, title: result.title };
  };

  const openMaterialPicker = (
    target: 'workspace' | 'chat',
    cat = '参考知识',
    tab: 'upload' | 'cms' = 'upload'
  ) => {
    setPickerMode('manage');
    setPickerTarget(target);
    setPickerCat(cat);
    setPickerTab(tab);
    setPickerOpen(true);
  };

  const handleMaterialPicked = (item: PickedMaterial) => {
    const now = Date.now();
    const fromInsightUpload = topicInsightUploadPendingRef.current && item.cat === HOT_INSIGHT_CATEGORY;
    if (item.existingId !== undefined) {
      setLibrary((prev) =>
        prev.map((entry) => (entry.id === item.existingId ? { ...entry, referenced: true } : entry))
      );
      const pill = materialAttachmentPill(item);
      setAttachments((prev) => [...prev.filter((entry) => entry !== pill), pill]);
      if (item.cat === 'Brief') {
        lockFlowEntry('brief');
        addTab('brief');
        setContentBrief((prev) =>
          prev ?? {
            audience: '',
            scenario: '',
            format: 'PPT 演示文稿',
            goal: '',
            keyMessage: item.title,
            length: '',
            notes: `已引用 Brief「${item.title}」`,
          }
        );
      }
      toast(`已添加「${item.title}」到参考知识`);
      return;
    }
    const libraryItem: LibraryItem = {
      id: now,
      cat: item.cat,
      title: item.title,
      meta: item.meta,
      cms: item.cms,
      def: false,
      referenced: pickerTarget === 'workspace' || fromInsightUpload,
      addedAt: now,
      fileName: item.fileName,
      contentType: item.contentType,
      contentText: item.contentText,
      contentUrl: item.contentUrl,
      mimeType: item.mimeType,
      validUntil: item.validUntil,
    };
    setLibrary((prev) => [libraryItem, ...prev]);
    if (item.cat === 'Brief') {
      lockFlowEntry('brief');
      addTab('brief');
      setContentBrief((prev) =>
        prev ?? {
          audience: '',
          scenario: '',
          format: 'PPT 演示文稿',
          goal: '',
          keyMessage: item.title,
          length: '',
          notes: `已上传 Brief「${item.title}」`,
        }
      );
    }
    const pill = materialAttachmentPill(item);
    setAttachments((prev) => [...prev.filter((p) => !p.endsWith('×')), pill]);
    toast(pickerTarget === 'chat' ? '附件已加入本次对话' : `已添加素材到「${item.cat}」`);
    if (openPickedMaterialInPreview) {
      setOpenPickedMaterialInPreview(false);
      setHomeAgentIntent(null);
      if (currentScreen !== 'workspace' || !currentSessionId) {
        startFromHome({ intent: 'general' }, '');
      }
      setWorkspacePreviewMaterial(libraryItem);
      setAttachments([pill]);
    }
    if (fromInsightUpload) {
      topicInsightUploadPendingRef.current = false;
      const note = pendingTopicInsightNoteRef.current;
      pendingTopicInsightNoteRef.current = '';
      addMsg(
        'ai',
        `已上传热点洞察素材「${item.title}」，正在基于该素材生成话题洞察报告…`,
        'DeepSeek-V3.1'
      );
      runTopicInsightAgent(note || '基于素材生成话题洞察', { skipUserMsg: true, forceSkill: 'A' });
      return;
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredLibrary = library
    .filter((x) => matchesBrand(x.brand, currentBrand))
    .filter((x) => libCatFilter === '全部' || x.cat === libCatFilter)
    .filter((x) => !libSearch || `${x.title} ${x.meta} ${x.cat} ${x.brand || ''}`.toLowerCase().includes(libSearch.toLowerCase()));
  const libraryUploadCat = libCatFilter === '全部' ? activeCat : libCatFilter;
  const morePptTemplates = useMemo(() => catalogPptTemplates(), []);
  const recommendedPptTemplates = useMemo(
    () =>
      recommendPptTemplates(
        `${pptOutline?.title || ''} ${pptOutline?.audience || ''} ${pptOutline?.scenario || ''} ${inputValue}`
      ),
    [inputValue, pptOutline]
  );
  const allPptTemplates = useMemo(() => {
    const map = new Map<string, PptBuiltinTemplate>();
    for (const item of [BLANK_PPT_TEMPLATE, ...recommendedPptTemplates, ...morePptTemplates]) {
      map.set(item.id, item);
    }
    return [...map.values()];
  }, [morePptTemplates, recommendedPptTemplates]);
  const pptTemplateOptions = useMemo<PptBuiltinTemplate[]>(() => {
    const extra = allPptTemplates.find((item) => item.id === selectedPptTemplateId);
    if (extra && !recommendedPptTemplates.some((item) => item.id === extra.id)) {
      return [...recommendedPptTemplates, extra];
    }
    return recommendedPptTemplates;
  }, [allPptTemplates, recommendedPptTemplates, selectedPptTemplateId]);

  useEffect(() => {
    if (!selectedPptTemplateId) {
      setSelectedPptTemplateId(BLANK_PPT_TEMPLATE.id);
      return;
    }
    if (!allPptTemplates.some((template) => template.id === selectedPptTemplateId)) {
      setSelectedPptTemplateId(BLANK_PPT_TEMPLATE.id);
    }
  }, [allPptTemplates, selectedPptTemplateId]);

  const libSelectedCount = libSelectedIds.length;
  const allVisibleSelected =
    filteredLibrary.length > 0 && filteredLibrary.every((x) => libSelectedIds.includes(x.id));

  const toggleLibSelect = (id: number) => {
    setLibSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredLibrary.map((x) => x.id);
    setLibSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...prev, ...visibleIds])];
    });
  };

  const startChatWithSelectedMaterials = () => {
    const items = library.filter((x) => libSelectedIds.includes(x.id));
    if (!items.length) return;
    setLibSelectedIds([]);
    setCurrentScreen('workspace');
    reset('', { intent: 'general' }, { attachedMaterials: items });
    toast(`已创建新对话，带入 ${items.length} 项素材`);
  };

  const activeReviewTask = activeReviewTaskId ? getReviewTask(activeReviewTaskId) : undefined;
  const reviewFocusMode = Boolean(activeReviewTaskId && isReviewerRole(userRole));
  const reviewerAllowedTabs =
    reviewFocusMode && activeReviewTask
      ? reviewerTabsForContentType(activeReviewTask.contentType, {
          pptOutline,
          pptVersions,
          pptResult,
          videoVersions,
        })
      : null;
  const reviewPptSlides =
    pptResult?.slides ||
    pptVersions.find((version) => version.id === selectedPptVersionId)?.slides ||
    pptVersions[0]?.slides ||
    [];
  const creatorCommentContentType: TeamContentType =
    state.active === 'visual' ? 'visual' : state.active === 'rich-text' ? 'rich-text' : 'ppt';
  const creatorCommentReviewTasks = reviewTasks.filter(
    (task) =>
      task.sessionId === currentSessionId && isCommentableContentType(task.contentType)
  );
  const hasCompletedContentReview = creatorCommentReviewTasks.some(
    (task) => task.status === 'completed' || (task.completedReviewCount || 0) > 0
  );
  const creatorContextComments = creatorCommentReviewTasks
    .filter((task) => task.contentType === creatorCommentContentType)
    .flatMap((task) =>
      (task.pptComments || []).map((comment) => ({
        taskId: task.id,
        reviewerName: task.assigneeName,
        reviewerDept: ROLE_PROFILES[task.assigneeRole].dept,
        comment,
      }))
    )
    .sort((a, b) => a.comment.createdAt - b.comment.createdAt);
  const creatorVisibleComments =
    creatorCommentContentType === 'ppt'
      ? creatorContextComments.filter(({ comment }) => comment.pageIndex === creatorPptPageIndex)
      : creatorContextComments;
  const creatorPptComments = creatorCommentReviewTasks
    .filter((task) => task.contentType === 'ppt')
    .flatMap((task) =>
      (task.pptComments || []).map((comment) => ({
        taskId: task.id,
        reviewerName: task.assigneeName,
        reviewerDept: ROLE_PROFILES[task.assigneeRole].dept,
        comment,
      }))
    )
    .sort((a, b) => a.comment.createdAt - b.comment.createdAt);
  const pptModificationTasks = useMemo(
    () => modificationTasks.filter(isPptDesignModificationTask),
    [modificationTasks]
  );
  const currentPageModificationTasks = useMemo(
    () => pptModificationTasks.filter((task) => task.pageIndex === creatorPptPageIndex),
    [pptModificationTasks, creatorPptPageIndex]
  );
  const visualModificationTasks = useMemo(
    () =>
      modificationTasks.filter(
        (task) =>
          isVisualModificationTask(task) &&
          (!previewedImageAssetKey || task.assetKey === previewedImageAssetKey)
      ),
    [modificationTasks, previewedImageAssetKey]
  );
  const showingVisualTasks = state.active === 'visual' && Boolean(previewedImageAssetKey);
  const contextModificationTasks = showingVisualTasks
    ? visualModificationTasks
    : currentPageModificationTasks;
  const filteredModificationTasks = useMemo(() => {
    const list =
      modificationTaskFilter === 'all'
        ? contextModificationTasks
        : contextModificationTasks.filter((task) => task.status === modificationTaskFilter);
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [contextModificationTasks, modificationTaskFilter]);
  const runningModificationTaskCount = (showingVisualTasks ? visualModificationTasks : pptModificationTasks).filter(
    (task) => task.status === 'running'
  ).length;
  const hasGeneratedPpt =
    Boolean(pptResult?.slides?.length) || pptVersions.some((version) => version.slides?.length);
  const showVersionTasksTab = hasGeneratedPpt || showingVisualTasks;

  useEffect(() => {
    if (!showVersionTasksTab && creatorRightTab === 'tasks') {
      setCreatorRightTab('ai');
    }
  }, [showVersionTasksTab, creatorRightTab]);

  const openModificationTaskDetail = useCallback(
    (task: ModificationTask) => {
      setWorkspaceElementSel(null);
      setState((prev) => applyTabForModificationTarget(prev, task.targetTab));
      if (task.targetTab === 'visual' && task.imageSnapshot) {
        const assetKey = (task.assetKey as VisualAssetKey) || 'kv';
        openMockImageInPreview(task.imageSnapshot, task.targetLabel, assetKey);
      } else {
        setWorkspacePreviewMaterial(null);
        if (task.pageIndex != null) {
          setCreatorPptPageIndex(task.pageIndex);
        }
      }
      setCreatorRightTab('tasks');
      toast(`已定位到「${task.targetLabel}」`);
    },
    [toast]
  );

  const cancelModificationTask = useCallback((taskId: string) => {
    setModificationTasks((prev) =>
      prev.map((task) =>
        task.id === taskId && task.status === 'running'
          ? {
              ...task,
              status: 'cancelled',
              resultSummary: '任务已取消，未继续写入产出物。',
              updatedAt: Date.now(),
            }
          : task
      )
    );
    toast('任务已取消');
  }, [toast]);

  const restartModificationTask = useCallback((taskId: string) => {
    setModificationTasks((prev) =>
      prev.map((task) =>
        task.id === taskId && task.status === 'cancelled'
          ? {
              ...task,
              status: 'running',
              resultSummary: '任务已重新启动，AI 正在按原 prompt 继续修改…',
              updatedAt: Date.now(),
            }
          : task
      )
    );
    toast('任务已重新运转');
  }, [toast]);

  const restorePageVersionFromTask = useCallback(
    (task: ModificationTask) => {
      if (task.pageIndex == null || !task.slideSnapshot) {
        toast('该版本没有可回溯的页面快照');
        return;
      }
      const pageIndex = task.pageIndex;
      const snapshot: PptSlide = {
        ...task.slideSnapshot,
        page: task.slideSnapshot.page || pageIndex + 1,
        bullets: [...(task.slideSnapshot.bullets || [])],
      };

      setPptResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slides: prev.slides.map((slide, index) =>
            index === pageIndex ? { ...snapshot, page: slide.page || pageIndex + 1 } : slide
          ),
        };
      });
      setPptVersions((prev) =>
        prev.map((version) => {
          if (selectedPptVersionId && version.id !== selectedPptVersionId) return version;
          return {
            ...version,
            slides: version.slides.map((slide, index) =>
              index === pageIndex ? { ...snapshot, page: slide.page || pageIndex + 1 } : slide
            ),
          };
        })
      );

      setModificationTasks((prev) => {
        if (!prev.some((item) => item.id === task.id)) return prev;
        // 目标快照写入「当前」后，该任务及之后的历史节点一并清除
        return prunePageTasksThrough(prev, pageIndex, task.id).next;
      });

      setCreatorPptPageIndex(pageIndex);
      setPptPageVersionEpoch((value) => value + 1);
      setWorkspaceElementSel(null);
      setCreatorRightTab('tasks');
      toast('已回溯到该版本');
    },
    [selectedPptVersionId, toast]
  );

  const restoreImageVersionFromTask = useCallback(
    (task: ModificationTask) => {
      if (!task.imageSnapshot || !task.assetKey) {
        toast('该版本没有可回溯的图片快照');
        return;
      }
      const assetKey = task.assetKey as VisualAssetKey;
      const snapshot = task.imageSnapshot;
      const title = task.assetKey === 'poster' ? MOCK_POSTER_VERSIONS.current.title : MOCK_KV_VERSIONS.current.title;
      setModificationTasks((prev) => {
        if (!prev.some((item) => item.id === task.id)) return prev;
        return pruneAssetTasksThrough(prev, assetKey, task.id).next;
      });
      openMockImageInPreview(snapshot, title, assetKey);
      setCreatorRightTab('tasks');
      toast('已回溯到该版本');
    },
    [toast]
  );

  const confirmRollbackModificationTask = useCallback(() => {
    const target = rollbackConfirm;
    if (!target || (!target.slideSnapshot && !target.imageSnapshot)) {
      setRollbackConfirm(null);
      if (target && !target.slideSnapshot && !target.imageSnapshot) {
        toast('该任务没有可回溯的版本快照');
      }
      return;
    }
    if (target.imageSnapshot) {
      restoreImageVersionFromTask(target);
    } else {
      restorePageVersionFromTask(target);
      setWorkspacePreviewMaterial(null);
      setState((prev) => applyTabForModificationTarget(prev, target.targetTab));
    }
    setWorkspaceElementSel(null);
    setCreatorRightTab('tasks');
    setRollbackConfirm(null);
  }, [restoreImageVersionFromTask, restorePageVersionFromTask, rollbackConfirm, toast]);

  const insertChatImageIntoCurrentPpt = useCallback(
    (imageUrl: string) => {
      if (!imageUrl) return;
      const sourceSlides =
        pptResult?.slides?.length
          ? pptResult.slides
          : pptVersions.find((version) => version.id === selectedPptVersionId)?.slides ||
            pptVersions[0]?.slides ||
            [];
      if (!sourceSlides.length) {
        toast('请先生成 PPT，再将图片插入页面');
        return;
      }
      const pageIndex = Math.min(creatorPptPageIndex, sourceSlides.length - 1);
      const nextSlides = sourceSlides.map((slide, index) =>
        index === pageIndex ? insertCenteredImageIntoSlide(slide, imageUrl) : slide
      );
      setPptResult((prev) => ({ title: prev?.title, slides: nextSlides }));
      setPptVersions((prev) =>
        prev.map((version) => {
          if (selectedPptVersionId && version.id !== selectedPptVersionId) return version;
          if (!version.slides?.length) return version;
          return { ...version, slides: nextSlides };
        })
      );
      setState((prev) => ({
        ...prev,
        tabs: prev.tabs.includes('ppt-design') ? prev.tabs : [...prev.tabs, 'ppt-design'],
        active: 'ppt-design',
        pptDesign: true,
      }));
      setPptPageVersionEpoch((n) => n + 1);
      toast(`已将图片插入第 ${pageIndex + 1} 页中心`);
    },
    [creatorPptPageIndex, pptResult, pptVersions, selectedPptVersionId, toast]
  );

  const handleSpeakerNotesChange = useCallback(
    (pageIndex: number, notes: string) => {
      setPptResult((prev) => {
        if (!prev) return prev;
        const slides = prev.slides.map((slide, index) =>
          index === pageIndex ? { ...slide, speakerNotes: notes } : slide
        );
        return { ...prev, slides };
      });
      setPptVersions((prev) =>
        prev.map((version) => {
          if (selectedPptVersionId && version.id !== selectedPptVersionId) return version;
          return {
            ...version,
            slides: version.slides.map((slide, index) =>
              index === pageIndex ? { ...slide, speakerNotes: notes } : slide
            ),
          };
        })
      );
    },
    [selectedPptVersionId]
  );

  const handleCreatorPptPageChange = useCallback((index: number) => {
    setCreatorPptPageIndex(index);
    setWorkspaceElementSel(null);
  }, []);

  const handleReorderCreatorPptSlides = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!pptResult || fromIndex === toIndex) return;
      const slides = pptResult.slides;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= slides.length ||
        toIndex >= slides.length
      ) {
        return;
      }

      const remapIndex = (oldIndex: number) => {
        if (oldIndex === fromIndex) return toIndex;
        if (fromIndex < toIndex) {
          if (oldIndex > fromIndex && oldIndex <= toIndex) return oldIndex - 1;
        } else if (oldIndex >= toIndex && oldIndex < fromIndex) {
          return oldIndex + 1;
        }
        return oldIndex;
      };

      const nextSlides = [...slides];
      const [moved] = nextSlides.splice(fromIndex, 1);
      nextSlides.splice(toIndex, 0, moved);
      const renumbered = nextSlides.map((slide, index) => ({
        ...slide,
        page: index + 1,
      }));

      setPptResult((prev) => (prev ? { ...prev, slides: renumbered } : prev));
      setPptVersions((prev) =>
        prev.map((version) =>
          version.id === selectedPptVersionId || (!selectedPptVersionId && version.id === prev[0]?.id)
            ? { ...version, slides: renumbered, coverDataUrl: renumbered[0]?.imageUrl || version.coverDataUrl }
            : version
        )
      );
      setCreatorPptPageIndex((prev) => remapIndex(prev));
      setWorkspaceElementSel((prev) =>
        prev ? { ...prev, slideIndex: remapIndex(prev.slideIndex) } : prev
      );
      setModificationTasks((prev) =>
        prev.map((task) => {
          if (task.targetTab !== 'ppt-design' || task.pageIndex == null) return task;
          const nextPage = remapIndex(task.pageIndex);
          if (nextPage === task.pageIndex) return task;
          return {
            ...task,
            pageIndex: nextPage,
            targetLabel: `PPT 设计 · 第 ${nextPage + 1} 页`,
            updatedAt: Date.now(),
          };
        })
      );

      const nextReviewTasks = loadReviewTasks().map((task) => {
        if (task.sessionId !== currentSessionId || task.contentType !== 'ppt' || !task.pptComments?.length) {
          return task;
        }
        return {
          ...task,
          pptComments: task.pptComments.map((comment) => ({
            ...comment,
            pageIndex: remapIndex(comment.pageIndex),
          })),
          updatedAt: Date.now(),
        };
      });
      saveReviewTasks(nextReviewTasks);
      setReviewTasks(nextReviewTasks);
      toast(`已调整页面顺序：第 ${fromIndex + 1} 页 → 第 ${toIndex + 1} 页`);
    },
    [pptResult, selectedPptVersionId, currentSessionId, toast]
  );

  const handleWorkspaceElementSelect = useCallback((selection: SelectableSvgSelection | null, slideIndex: number) => {
    if (!selection) {
      setWorkspaceElementSel(null);
      return;
    }
    setWorkspaceElementSel((prev) => {
      if (prev?.elementId === selection.id && prev.slideIndex === slideIndex) {
        return null;
      }
      return {
        slideIndex,
        elementId: selection.id,
        label: selection.label,
        isText: selection.isText,
        svgMarkup: selection.svgMarkup,
      };
    });
    setCreatorRightTab('ai');
  }, []);

  const applyWorkspaceElementAi = useCallback(
    async (promptText: string, scope: 'page' | 'global' = 'page') => {
      if (!workspaceElementSel || !promptText.trim() || !pptResult) return;
      const prompt = promptText.trim();
      const target = workspaceElementSel;
      const markup = target.svgMarkup.trim();
      if (!markup) {
        toast('当前页面无法解析为可编辑 SVG');
        return;
      }
      addMsg('user', formatScopedUserPrompt(prompt), selectedModel);
      setInputValue('');
      setSelectedPrompt('');
      setWorkspaceElementBusy(true);
      try {
        await new Promise((r) => setTimeout(r, 480));
        const primary = applyElementAiToSvg(markup, target.elementId, prompt);
        if (!primary) {
          addMsg('ai', '未能修改选中元素，请重新点选后再试。', selectedModel);
          toast('未能修改选中元素，请重新选择后再试');
          return;
        }

        let changedPages = 1;
        const slides = pptResult.slides.map((item, index) => {
          if (index === target.slideIndex) {
            return {
              ...item,
              svg: primary.svg,
              imageUrl: undefined,
            };
          }
          if (scope !== 'global') return item;
          const slideSvg = (item.svg || item.imageUrl || '').trim();
          if (!slideSvg || slideSvg.startsWith('data:')) return item;
          const updated = applyElementAiToSvg(slideSvg, target.elementId, prompt);
          if (!updated) return item;
          changedPages += 1;
          return {
            ...item,
            svg: updated.svg,
            imageUrl: undefined,
          };
        });

        setPptResult({ ...pptResult, slides });
        if (selectedPptVersionId) {
          setPptVersions((prev) =>
            prev.map((version) =>
              version.id === selectedPptVersionId ? { ...version, slides } : version
            )
          );
        }
        const now = Date.now();
        const scopeSummary =
          scope === 'global'
            ? `全局 · 共 ${changedPages} 页`
            : `单页 · 第 ${target.slideIndex + 1} 页`;
        setModificationTasks((prev) => [
          {
            id: `mod-task-live-${now}`,
            prompt,
            status: 'completed',
            targetTab: 'ppt-design',
            pageIndex: target.slideIndex,
            targetLabel: `PPT 设计 · ${scopeSummary} · ${target.label}`,
            resultSummary: primary.summary,
            slideSnapshot: slides[target.slideIndex],
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ]);
        setWorkspaceElementSel((prev) =>
          prev
            ? {
                ...prev,
                label: primary.elementLabel,
                svgMarkup: primary.svg,
              }
            : prev
        );
        addMsg(
          'ai',
          scope === 'global'
            ? `已按【全局】指令修改「${primary.elementLabel}」，覆盖 ${changedPages} 页。<br>${primary.summary}`
            : `已按【单页】指令修改「${primary.elementLabel}」。<br>${primary.summary}`,
          selectedModel
        );
        toast(primary.summary);
      } finally {
        setWorkspaceElementBusy(false);
      }
    },
    [
      workspaceElementSel,
      pptResult,
      selectedPptVersionId,
      selectedModel,
      toast,
      formatScopedUserPrompt,
    ]
  );

  const activeProjectName = useMemo(() => {
    if (!activeProjectId) return null;
    return loadAllProjects().find((p) => p.id === activeProjectId)?.name ?? null;
  }, [activeProjectId, sessions]);
  const homeTaskSessions = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    return sessions.filter((session) => {
      if (activeProjectId && session.projectId !== activeProjectId) return false;
      if (!query) return true;
      return `${session.title} ${deriveSessionSubtitle(session)}`.toLowerCase().includes(query);
    });
  }, [sessions, activeProjectId, sessionSearch]);
  const homeCollectTasks = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    const source =
      userRole === 'medical' || userRole === 'marketing'
        ? reviewTasks.filter((task) => task.assigneeRole === userRole)
        : reviewTasks;
    return source.filter((task) => {
      if (activeProjectId) {
        const session = sessions.find((item) => item.id === task.sessionId);
        if (session && session.projectId !== activeProjectId) return false;
      }
      if (!query) return true;
      const hay = [
        task.title,
        TEAM_CONTENT_LABELS[task.contentType],
        ROLE_PROFILES[task.assigneeRole].dept,
        task.assigneeName,
        collectTaskStatusLabel(task.status),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
  }, [userRole, reviewTasks, sessions, activeProjectId, sessionSearch]);
  const homeHistoryCount = homeHistoryTab === 'generate' ? homeTaskSessions.length : homeCollectTasks.length;
  const homeTaskPageCount = Math.max(
    1,
    Math.ceil(homeHistoryCount / HOME_TASK_PAGE_SIZE)
  );
  const visibleHomeTaskPage = Math.min(homeTaskPage, homeTaskPageCount);
  const pagedHomeTaskSessions = homeTaskSessions.slice(
    (visibleHomeTaskPage - 1) * HOME_TASK_PAGE_SIZE,
    visibleHomeTaskPage * HOME_TASK_PAGE_SIZE
  );
  const pagedHomeCollectTasks = homeCollectTasks.slice(
    (visibleHomeTaskPage - 1) * HOME_TASK_PAGE_SIZE,
    visibleHomeTaskPage * HOME_TASK_PAGE_SIZE
  );
  const homeTaskPageItems = useMemo(() => {
    const total = homeTaskPageCount;
    const current = visibleHomeTaskPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set<number>([1, total, current]);
    for (let i = current - 1; i <= current + 1; i += 1) {
      if (i > 1 && i < total) set.add(i);
    }
    if (current <= 3) {
      set.add(2);
      set.add(3);
      set.add(4);
    }
    if (current >= total - 2) {
      set.add(total - 1);
      set.add(total - 2);
      set.add(total - 3);
    }
    return [...set].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  }, [homeTaskPageCount, visibleHomeTaskPage]);

  useEffect(() => {
    setHomeTaskPage(1);
  }, [activeProjectId, sessionSearch, homeHistoryTab]);

  useEffect(() => {
    if (homeTaskPage > homeTaskPageCount) setHomeTaskPage(homeTaskPageCount);
  }, [homeTaskPage, homeTaskPageCount]);

  const showGlobalHeader = currentScreen === 'home' || currentScreen === 'workspace';

  if (!signedIn) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AmbientOrbs />
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientOrbs />
      {showGlobalHeader && (
        <header className="app-global-header relative z-30">
          <div className="app-global-header-left animate-fade-up">
            <BrandLogo onClick={goToHome} />
          </div>
          <div className="app-global-header-right animate-fade-up [animation-delay:120ms]">
            <RoleSwitcher role={userRole} onChange={handleRoleChange} />
            <UserAccountMenu
              role={userRole}
              onLogout={confirmLogout}
              onOpenChange={setAccountMenuOpen}
            />
          </div>
        </header>
      )}

      {/* Home Screen */}
      <section className={`screen home-screen ${currentScreen === 'home' ? 'active' : ''}`}>
        <div className={`app-screen-body relative z-10 min-h-0 px-6 pb-6 lg:px-10${isReviewerRole(userRole) ? ' is-reviewer' : ''}`}>
            <main className="relative min-h-0 min-w-0 flex-1">
              <div
                className={`home-lib-shortcuts absolute right-0 top-0 z-20 flex items-center gap-2 animate-fade-up${
                  accountMenuOpen ? ' invisible pointer-events-none' : ''
                }`}
              >
                <button
                  type="button"
                  className="glass-button flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary"
                  onClick={() => setCurrentScreen('library')}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#54B9F9] to-[#3BA6E8] shadow-[0_3px_8px_-2px_rgba(59,150,210,0.5)] ring-1 ring-white/40">
                    <Database className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  个人知识收藏
                </button>
                <button
                  type="button"
                  className="glass-button flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary"
                  onClick={() => setCurrentScreen('assets')}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#8AD329] to-[#54B9F9] shadow-[0_3px_8px_-2px_rgba(120,180,40,0.45)] ring-1 ring-white/40">
                    <LibraryIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  视觉素材库
                </button>
              </div>

              {isReviewerRole(userRole) ? (
                <div className="px-2 pt-2">
                  <ReviewerHome
                    tasks={homeCollectTasks}
                    generateSessions={homeTaskSessions}
                    deptLabel={ROLE_PROFILES[userRole].dept}
                    onOpenTask={openReviewTask}
                    onOpenSession={openSession}
                  />
                </div>
              ) : (
                <div className="home-task-dashboard home-inspire-layout relative mx-auto h-full max-w-6xl overflow-y-auto px-2 pb-8 pt-12 lg:pt-14">
                  {activeProjectName && (
                    <div className="relative z-10 mb-4 animate-fade-up">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-glass px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>新建对话将归入项目「{activeProjectName}」</span>
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => setActiveProjectId(null)}>
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  <SparkleField />

                  <header className="home-inspire-head relative z-10 animate-fade-up">
                    <h2 className="text-gradient animate-gradient-pan">今天你有什么灵感？</h2>
                    <p>
                      无论是病例内容、会议海报，还是话题洞察，一切需求，新建任务即可开始。
                    </p>
                  </header>

                  <div className="home-inspire-grid relative z-10 mt-6 animate-fade-up [animation-delay:120ms]">
                    <div className="home-inspire-left">
                      <div className="home-inspire-actions">
                        {HOME_WORKFLOW_ACTIONS.map(({ title, description, scenes, intent, prompt, Icon, art }) => (
                          <button
                            key={title}
                            type="button"
                            className={`home-inspire-action home-task-card art-${art}`}
                            onClick={() => newTask(prompt, intent)}
                          >
                            <span className="home-inspire-action-icon">
                              <Icon className="h-4 w-4" strokeWidth={2.4} />
                            </span>
                            <ArrowUpRight className="home-inspire-action-arrow h-4 w-4" />
                            <div className="home-inspire-action-body">
                              <strong>{title}</strong>
                              {scenes?.length ? (
                                <span className="home-inspire-action-scenes">
                                  {scenes.map((scene) => (
                                    <em key={scene}>{scene}</em>
                                  ))}
                                </span>
                              ) : (
                                <span className="home-inspire-action-desc">{description}</span>
                              )}
                              <span className="home-inspire-action-cta">
                                新建任务
                                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                              </span>
                            </div>
                            <div className={`home-inspire-action-art art-${art}`} aria-hidden="true">
                              {art === 'case' && (
                                <div className="home-inspire-deco is-case">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <span className="deco-case-clip" />
                                    <span className="deco-line w-80" />
                                    <span className="deco-line w-65" />
                                    <span className="deco-pulse" />
                                  </div>
                                </div>
                              )}
                              {art === 'promo' && (
                                <div className="home-inspire-deco is-promo">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <span className="deco-promo-badge" />
                                    <span className="deco-line w-95" />
                                    <span className="deco-line w-70" />
                                    <span className="deco-line w-85" />
                                  </div>
                                </div>
                              )}
                              {art === 'evidence' && (
                                <div className="home-inspire-deco is-evidence">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <span className="deco-ppt-rule is-accent" />
                                    <div className="deco-ppt-chart">
                                      <i style={{ height: '38%' }} />
                                      <i style={{ height: '64%' }} />
                                      <i style={{ height: '52%' }} />
                                      <i style={{ height: '86%' }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {art === 'poster' && (
                                <div className="home-inspire-deco is-poster">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <div className="deco-landscape is-poster">
                                      <span className="deco-sun" />
                                      <span className="deco-poster-band" />
                                      <span className="deco-peak is-far" />
                                      <span className="deco-peak is-near" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {art === 'insight' && (
                                <div className="home-inspire-deco is-insight">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <span className="deco-spark is-a" />
                                    <span className="deco-spark is-b" />
                                    <span className="deco-trend" />
                                    <span className="deco-line w-70" />
                                  </div>
                                </div>
                              )}
                              {art === 'more' && (
                                <div className="home-inspire-deco is-more">
                                  <div className="home-inspire-deco-back" />
                                  <div className="home-inspire-deco-front">
                                    <div className="deco-tiles">
                                      <i />
                                      <i />
                                      <i />
                                      <i />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <aside className="home-task-section home-inspire-history">
                      <div className="home-task-section-head">
                        <div>
                          <h3>历史任务</h3>
                          <p>
                            {homeHistoryTab === 'collect'
                              ? activeProjectName
                                ? `项目「${activeProjectName}」中的意见收集任务`
                                : '查看已提交的团队意见收集任务'
                              : activeProjectName
                                ? `项目「${activeProjectName}」中的任务`
                                : '继续处理最近的内容创作任务'}
                          </p>
                        </div>
                        <div className="home-task-search">
                          <Search className="h-3.5 w-3.5" />
                          <input
                            value={sessionSearch}
                            onChange={(event) => setSessionSearch(event.target.value)}
                            placeholder={homeHistoryTab === 'collect' ? '搜索意见收集任务' : '搜索历史任务'}
                          />
                        </div>
                      </div>

                      <div className="home-history-tabs" role="tablist" aria-label="历史任务类型">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={homeHistoryTab === 'generate'}
                          className={`home-history-tab ${homeHistoryTab === 'generate' ? 'active' : ''}`}
                          onClick={() => setHomeHistoryTab('generate')}
                        >
                          内容生成
                          <span>{homeTaskSessions.length}</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={homeHistoryTab === 'collect'}
                          className={`home-history-tab ${homeHistoryTab === 'collect' ? 'active' : ''}`}
                          onClick={() => setHomeHistoryTab('collect')}
                        >
                          意见收集
                          <span>{homeCollectTasks.length}</span>
                        </button>
                      </div>

                      {homeHistoryTab === 'generate' && homeTaskSessions.length > 0 ? (
                        <>
                          <div className="home-task-grid home-inspire-history-list">
                            {pagedHomeTaskSessions.map((session) => (
                                <article
                                  key={session.id}
                                  className={`home-task-card group ${currentSessionId === session.id ? 'active' : ''}`}
                                >
                                  <button
                                    type="button"
                                    className="home-task-card-main"
                                    onClick={() => openSession(session.id)}
                                  >
                                    <span className="home-task-card-icon">
                                      <Presentation className="h-4 w-4 text-white" strokeWidth={2.4} />
                                    </span>
                                    <span className="home-task-card-copy">
                                      <strong>{session.title}</strong>
                                      <span>
                                        {session.id.slice(0, 10)} · {deriveSessionSubtitle(session)} ·{' '}
                                        {formatSessionTime(session.updatedAt)}
                                      </span>
                                    </span>
                                    <ArrowRight className="home-task-card-arrow h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="home-task-card-delete"
                                    aria-label={`删除任务：${session.title}`}
                                    title="删除任务"
                                    onClick={() => setDeleteConfirm({ id: session.id, title: session.title })}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </article>
                              ))}
                          </div>
                          {homeTaskPageCount > 1 && homeHistoryTab === 'generate' && (
                            <nav className="home-task-pagination" aria-label="历史任务分页">
                              <button
                                type="button"
                                className="home-task-page-arrow"
                                disabled={visibleHomeTaskPage === 1}
                                onClick={() => setHomeTaskPage((page) => Math.max(1, page - 1))}
                                aria-label="上一页"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              {homeTaskPageItems.map((page, index) => {
                                const prev = homeTaskPageItems[index - 1];
                                const showEllipsis = index > 0 && page - (prev || 0) > 1;
                                return (
                                  <span key={page} className="home-task-page-cluster">
                                    {showEllipsis && (
                                      <span className="home-task-page-ellipsis" aria-hidden>
                                        …
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className={`home-task-page-number ${
                                        visibleHomeTaskPage === page ? 'active' : ''
                                      }`}
                                      onClick={() => setHomeTaskPage(page)}
                                      aria-current={visibleHomeTaskPage === page ? 'page' : undefined}
                                    >
                                      {page}
                                    </button>
                                  </span>
                                );
                              })}
                              <button
                                type="button"
                                className="home-task-page-arrow"
                                disabled={visibleHomeTaskPage === homeTaskPageCount}
                                onClick={() =>
                                  setHomeTaskPage((page) => Math.min(homeTaskPageCount, page + 1))
                                }
                                aria-label="下一页"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </nav>
                          )}
                        </>
                      ) : homeHistoryTab === 'collect' && homeCollectTasks.length > 0 ? (
                        <>
                          <div className="home-task-grid home-inspire-history-list">
                            {pagedHomeCollectTasks.map((task) => (
                              <article
                                key={task.id}
                                className={`home-task-card group ${activeReviewTaskId === task.id ? 'active' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="home-task-card-main"
                                  onClick={() => {
                                    if (isReviewerRole(userRole)) {
                                      openReviewTask(task.id);
                                      return;
                                    }
                                    openSession(task.sessionId);
                                  }}
                                >
                                  <span className="home-task-card-icon is-collect">
                                    <MessageSquare className="h-4 w-4 text-white" strokeWidth={2.4} />
                                  </span>
                                  <span className="home-task-card-copy">
                                    <strong>{task.title}</strong>
                                    <span>
                                      {TEAM_CONTENT_LABELS[task.contentType]} · {ROLE_PROFILES[task.assigneeRole].dept} ·{' '}
                                      {collectTaskStatusLabel(task.status)} · {formatSessionTime(task.updatedAt)}
                                    </span>
                                  </span>
                                  <ArrowRight className="home-task-card-arrow h-4 w-4" />
                                </button>
                              </article>
                            ))}
                          </div>
                          {homeTaskPageCount > 1 && (
                            <nav className="home-task-pagination" aria-label="意见收集任务分页">
                              <button
                                type="button"
                                className="home-task-page-arrow"
                                disabled={visibleHomeTaskPage === 1}
                                onClick={() => setHomeTaskPage((page) => Math.max(1, page - 1))}
                                aria-label="上一页"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              {homeTaskPageItems.map((page, index) => {
                                const prev = homeTaskPageItems[index - 1];
                                const showEllipsis = index > 0 && page - (prev || 0) > 1;
                                return (
                                  <span key={page} className="home-task-page-cluster">
                                    {showEllipsis && (
                                      <span className="home-task-page-ellipsis" aria-hidden>
                                        …
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className={`home-task-page-number ${
                                        visibleHomeTaskPage === page ? 'active' : ''
                                      }`}
                                      onClick={() => setHomeTaskPage(page)}
                                      aria-current={visibleHomeTaskPage === page ? 'page' : undefined}
                                    >
                                      {page}
                                    </button>
                                  </span>
                                );
                              })}
                              <button
                                type="button"
                                className="home-task-page-arrow"
                                disabled={visibleHomeTaskPage === homeTaskPageCount}
                                onClick={() =>
                                  setHomeTaskPage((page) => Math.min(homeTaskPageCount, page + 1))
                                }
                                aria-label="下一页"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </nav>
                          )}
                        </>
                      ) : (
                        <div className="home-task-empty">
                          {homeHistoryTab === 'collect' ? (
                            <>
                              <MessageSquare className="h-6 w-6" />
                              <strong>暂无意见收集任务</strong>
                              <span>在工作台提交团队意见收集后，任务会出现在这里</span>
                            </>
                          ) : (
                            <>
                              <Presentation className="h-6 w-6" />
                              <strong>暂无历史任务</strong>
                              <span>从左侧工作流开始第一项内容创作</span>
                            </>
                          )}
                        </div>
                      )}
                    </aside>
                  </div>
                </div>
              )}
            </main>
        </div>
      </section>

      {/* Knowledge Library Screen */}
      <section className={`screen screen-full ${currentScreen === 'library' ? 'active' : ''}`}>
        <div className="page relative z-10 px-6 pb-8 lg:px-10">
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
            onClick={goToHome}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            返回首页
          </button>

          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="sparkle-surface grid h-11 w-11 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
                  <Database className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[28px] font-semibold tracking-tight text-foreground">个人知识收藏</h2>
                  <p className="mt-0.5 max-w-xl text-[12.5px] text-muted-foreground">
                    正在查看「{currentBrand}」的知识收藏，通用资料会一并显示。支持多选后一键带入新对话。
                  </p>
                </div>
              </div>
              <div className="text-[12px] text-muted-foreground">
                共 <strong className="text-foreground">{library.length}</strong> 项知识
                {filteredLibrary.length !== library.length
                  ? ` · 当前显示 ${filteredLibrary.length} 项`
                  : ''}
                {libSelectedCount > 0 ? ` · 已选 ${libSelectedCount}` : ''}
              </div>
            </div>

            <div className="flex w-full max-w-3xl flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    placeholder="搜索知识名称、来源、标签…"
                    className="glass-input w-full rounded-xl border border-border/70 py-2.5 pl-10 pr-3 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <BrandSwitcher value={currentBrand} onChange={handleBrandChange} size="page" />
                <select
                  value={libCatFilter}
                  onChange={(e) => setLibCatFilter(e.target.value)}
                  className="glass-input rounded-xl border border-border/70 px-3 py-2.5 text-[12.5px] outline-none"
                  aria-label="按分类筛选"
                >
                  <option value="全部">全部分类</option>
                  {cats.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn soft inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
                  onClick={() => openMaterialPicker('workspace', libraryUploadCat, 'cms')}
                >
                  <Search className="h-3.5 w-3.5" />
                  搜索 CMS
                </button>
                <button
                  type="button"
                  className="btn soft inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
                  disabled={filteredLibrary.length === 0}
                  onClick={toggleSelectAllVisible}
                >
                  <Check className="h-3.5 w-3.5" />
                  {allVisibleSelected ? '取消全选' : '全选'}
                </button>
                <button
                  type="button"
                  className="btn-hero-3d inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold"
                  onClick={() => openMaterialPicker('workspace', libraryUploadCat)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  上传知识
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden rounded-2xl border border-border/70 p-4 md:p-5">
            {filteredLibrary.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredLibrary.map((x) => (
                  <LibraryMaterialCard
                    key={x.id}
                    item={x}
                    selected={libSelectedIds.includes(x.id)}
                    onToggleSelect={() => toggleLibSelect(x.id)}
                    onPreview={() => setPreviewMaterial(x)}
                    onDelete={() => deleteKnowledgeItem(x.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
                  <FolderOpen className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <p className="text-[13px] font-semibold text-foreground">暂无匹配的知识</p>
                <p className="mt-1.5 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
                  上传本地文件，或从 CMS 搜索已审批内容加入「{currentBrand}」的个人知识收藏。
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-hero-3d inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold"
                    onClick={() => openMaterialPicker('workspace', libraryUploadCat)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    上传知识
                  </button>
                  <button
                    type="button"
                    className="btn soft rounded-xl px-4 py-2 text-[12px] font-medium"
                    onClick={() => openMaterialPicker('workspace', libraryUploadCat, 'cms')}
                  >
                    搜索 CMS
                  </button>
                </div>
              </div>
            )}
          </div>

          {libSelectedCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-[12.5px] text-muted-foreground">
                已选 <span className="font-semibold text-foreground">{libSelectedCount}</span> 项知识
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn soft rounded-xl px-3.5 py-2 text-[12px] font-medium"
                  onClick={() => setLibSelectedIds([])}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="btn-hero-3d inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold"
                  onClick={startChatWithSelectedMaterials}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  添加至新对话
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Asset Library Screen */}
      <section className={`screen screen-full ${currentScreen === 'assets' ? 'active' : ''}`}>
        <AssetLibraryPage
          brand={currentBrand}
          onBrandChange={handleBrandChange}
          onNotify={toast}
          onBack={goToHome}
        />
      </section>

      {/* Workspace Screen */}
      <section className={`screen ${currentScreen === 'workspace' ? 'active' : ''}`}>
        <div className={`workspace relative z-10 ${reviewFocusMode ? 'reviewer-focus' : ''} ${!reviewFocusMode && !contextPanelOpen ? 'context-collapsed' : ''}`}>
          {!reviewFocusMode && (
          <aside className={`wpanel context context-sidebar ${contextPanelOpen ? 'open' : 'collapsed'}`}>
            {contextPanelOpen ? (
              <>
                <div className="context-sidebar-head">
                  <div className="context-sidebar-head-row">
                    <div className="context-sidebar-head-title workspace-panel-title">
                      <span className="context-sidebar-head-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </svg>
                      </span>
                      <h3 className="context-sidebar-title workspace-panel-title-text">引用素材</h3>
                    </div>
                    <button
                      type="button"
                      className="context-sidebar-collapse-btn"
                      onClick={() => setContextPanelOpen(false)}
                      title="收起引用素材"
                      aria-label="收起引用素材"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="context-scroll">
                  <ContextMaterialsPanel
                    library={library}
                    onOpenPicker={(category) => {
                      setPickerTarget('workspace');
                      setPickerCat(category);
                      setPickerMode('reference');
                      setPickerOpen(true);
                    }}
                    onPreview={setPreviewMaterial}
                    onRemove={(item) => {
                      setLibrary((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, referenced: false } : entry
                        )
                      );
                      const pill = materialAttachmentPill(item);
                      setAttachments((prev) => prev.filter((entry) => entry !== pill));
                      if (previewMaterial?.id === item.id) setPreviewMaterial(null);
                      toast(`已从引用素材中移除「${item.title}」`);
                    }}
                  />
                </div>
              </>
            ) : (
              <button
                type="button"
                className="context-sidebar-expand-tab"
                onClick={() => setContextPanelOpen(true)}
                title="展开引用素材"
                aria-label="展开引用素材"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="context-sidebar-expand-label">素材</span>
              </button>
            )}
          </aside>
          )}

          {!reviewFocusMode ? (
          <main className="wpanel chat relative overflow-hidden">
            <SparkleField />
            <div className="relative z-10 flex h-full flex-col">
            <div className="chat-head">
              <div className="chat-title workspace-panel-title">
                <span className="context-sidebar-head-icon" aria-hidden>
                  <MessageSquare className="h-4 w-4" strokeWidth={2.2} />
                </span>
                {isEditingTitle ? (
                  <input
                    type="text"
                    className="input workspace-panel-title-input"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    onBlur={commitTitleEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitTitleEdit();
                      }
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h3
                    className="workspace-panel-title-text"
                    onClick={() => setIsEditingTitle(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    {taskTitle}
                  </h3>
                )}
                {selectedProduct && (
                  <span className="task-product-chip" title={`${selectedProduct.en} · ${selectedProduct.hint}`}>
                    {selectedProduct.name}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`creator-right-tabs ${hasCompletedContentReview ? 'has-comments' : ''}`}
              role="tablist"
              aria-label="对话、任务与批注"
            >
              <button
                type="button"
                role="tab"
                aria-selected={creatorRightTab === 'ai'}
                className={creatorRightTab === 'ai' ? 'active' : ''}
                onClick={() => setCreatorRightTab('ai')}
              >
                对话
              </button>
              {showVersionTasksTab && (
              <button
                type="button"
                role="tab"
                aria-selected={creatorRightTab === 'tasks'}
                className={creatorRightTab === 'tasks' ? 'active' : ''}
                onClick={() => setCreatorRightTab('tasks')}
              >
                当前版本任务
                {runningModificationTaskCount > 0 && (
                  <span>{runningModificationTaskCount}</span>
                )}
              </button>
              )}
              {hasCompletedContentReview && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={creatorRightTab === 'comments'}
                  className={creatorRightTab === 'comments' ? 'active' : ''}
                  onClick={() => {
                    refreshReviewTasks();
                    setCreatorRightTab('comments');
                  }}
                >
                  批注
                  {creatorVisibleComments.length > 0 && <span>{creatorVisibleComments.length}</span>}
                </button>
              )}
            </div>

            {creatorRightTab === 'ai' ||
            (creatorRightTab === 'comments' && !hasCompletedContentReview) ? (
            <>
            {activeReviewTaskId && activeReviewTask && (
                <div className="review-task-banner">
                  <div>
                    <strong>团队修改任务</strong>
                    <div className="small">
                      {activeReviewTask.title} · 截止 {activeReviewTask.deadline.replace('T', ' ')} · 分配人 {activeReviewTask.assignerName}
                    </div>
                  </div>
                  <div className="quick-row">
                    <button
                      type="button"
                      className="btn soft"
                      onClick={() => {
                        setActiveReviewTaskId(null);
                        goToHome();
                      }}
                    >
                      返回首页
                    </button>
                  </div>
                </div>
            )}

            <div className="chat-feed" ref={feedRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`msg ${msg.role}`}>
                  <div className="avatar">{msg.role === 'user' ? '我' : 'AI'}</div>
                  <div className="bubble">
                    <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                    {msg.imageUrl && (
                      <div className="chat-generated-image">
                        <img src={msg.imageUrl} alt={msg.imageTitle || 'AI 生成图片'} />
                        <div className="chat-generated-image-actions">
                          <button
                            type="button"
                            className="btn soft"
                            onClick={() =>
                              openMockImageInPreview(
                                msg.imageUrl || WORKSPACE_MOCK_IMAGE.dataUrl,
                                msg.imageTitle || WORKSPACE_MOCK_IMAGE.title,
                                msg.imageAssetKey as VisualAssetKey | undefined
                              )
                            }
                          >
                            {msg.imageActionLabel || '修改此图片'}
                          </button>
                          {hasGeneratedPpt && (
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => insertChatImageIntoCurrentPpt(msg.imageUrl || '')}
                            >
                              一键插入
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {msg.quick && msg.quick.length > 0 && (
                      <div className="chips">
                        {msg.quick.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`chip ${msg.role === 'ai' && i === 0 ? 'recommended' : ''}`}
                            onClick={() => fillQuick(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="composer">
              {attachments.length > 0 && (
                <div className="attach-row">
                  {attachments.map((pill, i) => (
                    <span
                      key={`${pill}-${i}`}
                      className={`attach-pill ${pill.endsWith('×') ? 'removable' : ''}`}
                      onClick={() => pill.endsWith('×') && removeAttachment(i)}
                      title={pill.endsWith('×') ? '点击移除' : undefined}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              )}
              {selectedPrompt && (
                <div className="attach-row">
                  <span className="prompt-token">{selectedPrompt}</span>
                </div>
              )}
              {workspaceElementSel && (
                <div className="attach-row">
                  <span className="prompt-token">
                    已选中 · 第 {workspaceElementSel.slideIndex + 1} 页 · {workspaceElementSel.label}
                  </span>
                </div>
              )}

              {!reviewFocusMode && (
                <div className="composer-guides quick-row">
                  {WORKSPACE_QUICK_PROMPTS.map(({ label, prefix }) => (
                    <button
                      key={label}
                      type="button"
                      className="chip"
                      onClick={() => insertWorkspaceGuide(prefix)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className={`compose-shell${speech.listening ? ' is-listening' : ''}`}>
                <button
                  type="button"
                  className="compose-attach"
                  title="添加附件"
                  aria-label="添加附件"
                  onClick={() => openMaterialPicker('chat')}
                  disabled={speech.listening}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.4} />
                </button>
                {speech.listening ? (
                  <div className="compose-voice-live" aria-live="polite">
                    <span className="compose-voice-bars" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="compose-voice-label">
                      {speech.interimTranscript.trim() || '正在聆听…'}
                    </span>
                  </div>
                ) : (
                  <textarea
                    className="compose-input"
                    placeholder={getComposerPlaceholder()}
                    value={inputValue}
                    rows={1}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      voiceBaseRef.current = e.target.value;
                    }}
                    disabled={workspaceElementBusy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                )}
                <div className="compose-actions">
                  {!speech.listening && (
                    <select
                      className="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      aria-label="选择模型"
                    >
                      <option>GPT-5.5</option>
                    </select>
                  )}
                  {speech.listening ? (
                    <>
                      <button
                        type="button"
                        className="compose-voice-stop"
                        onClick={stopVoiceInput}
                        title="停止录音"
                        aria-label="停止录音"
                      >
                        <Square className="h-3.5 w-3.5" strokeWidth={2.6} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        className="compose-send"
                        onClick={send}
                        disabled={workspaceElementBusy || !(inputValue.trim() || speech.interimTranscript.trim())}
                        title="发送"
                        aria-label="发送"
                      >
                        <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="compose-mic"
                        onClick={startVoiceInput}
                        disabled={workspaceElementBusy}
                        title="语音输入"
                        aria-label="语音输入"
                      >
                        <Mic className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        className="compose-send"
                        onClick={send}
                        disabled={workspaceElementBusy || !inputValue.trim()}
                        title={workspaceElementBusy ? '修改中…' : '发送'}
                        aria-label={workspaceElementBusy ? '修改中' : '发送'}
                      >
                        {workspaceElementBusy ? (
                          <span className="compose-send-label">…</span>
                        ) : (
                          <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            </>
            ) : creatorRightTab === 'tasks' ? (
              <div className="creator-tasks-view">
                <div className="creator-tasks-panel">
                  <div className="creator-tasks-summary">
                    <div className="creator-tasks-summary-title">
                      {showingVisualTasks ? (
                        <ImageIcon className="h-3.5 w-3.5 text-[#3BA6E8]" strokeWidth={2.4} />
                      ) : (
                        <Presentation className="h-3.5 w-3.5 text-[#3BA6E8]" strokeWidth={2.4} />
                      )}
                      <strong>
                        {showingVisualTasks
                          ? `${previewedImageAssetKey === 'poster' ? '会议海报' : '主KV'}任务`
                          : `第 ${creatorPptPageIndex + 1} 页任务`}
                      </strong>
                    </div>
                    <span className="creator-tasks-count">{contextModificationTasks.length}</span>
                  </div>
                  <div className="creator-tasks-filters" role="tablist" aria-label="任务状态筛选">
                    {MODIFICATION_TASK_FILTERS.map(({ key, label }) => {
                      const count =
                        key === 'all'
                          ? contextModificationTasks.length
                          : contextModificationTasks.filter((task) => task.status === key).length;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={modificationTaskFilter === key}
                          className={modificationTaskFilter === key ? 'active' : ''}
                          onClick={() => setModificationTaskFilter(key)}
                        >
                          {label}
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="creator-tasks-list">
                    {filteredModificationTasks.length > 0 ? (
                      filteredModificationTasks.map((task) => (
                        <article
                          key={task.id}
                          className={`creator-task-card status-${task.status}`}
                        >
                          <div className="creator-task-card-main">
                            <span
                              className={`creator-task-card-icon tone-${
                                task.status === 'completed'
                                  ? 'green'
                                  : task.status === 'running'
                                    ? 'blue'
                                    : 'muted'
                              }`}
                              aria-hidden
                            >
                              {showingVisualTasks ? (
                                <ImageIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                              ) : (
                                <Presentation className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                              )}
                            </span>
                            <div className="creator-task-card-body">
                              <div className="creator-task-card-head">
                                <span className={`creator-task-status status-${task.status}`}>
                                  {MODIFICATION_TASK_STATUS_LABEL[task.status]}
                                </span>
                                <span className="creator-task-target">{task.targetLabel}</span>
                              </div>
                              <p className="creator-task-prompt">{task.prompt}</p>
                              {task.resultSummary && (
                                <p className="creator-task-summary">{task.resultSummary}</p>
                              )}
                              <div className="creator-task-meta">
                                <span>更新于 {formatModificationTaskTime(task.updatedAt)}</span>
                              </div>
                              <div className="creator-task-actions">
                                {(task.slideSnapshot || task.imageSnapshot) && task.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    className="btn primary"
                                    onClick={() => setRollbackConfirm(task)}
                                  >
                                    回退至此
                                  </button>
                                )}
                                {task.status === 'running' && (
                                  <button
                                    type="button"
                                    className="btn warn"
                                    onClick={() => cancelModificationTask(task.id)}
                                  >
                                    取消任务
                                  </button>
                                )}
                                {task.status === 'cancelled' && (
                                  <button
                                    type="button"
                                    className="btn primary"
                                    onClick={() => restartModificationTask(task.id)}
                                  >
                                    重新运转
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="creator-tasks-empty">
                        {showingVisualTasks ? '当前图片暂无修改任务' : '当前页面暂无修改任务'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="creator-comments-view">
                <div className="creator-comments-panel">
                  <div className="creator-comments-summary">
                    <div className="creator-comments-summary-title">
                      <MessageSquare className="h-3.5 w-3.5 text-[#3BA6E8]" strokeWidth={2.4} />
                      <strong>
                        {creatorCommentContentType === 'ppt'
                          ? `第 ${creatorPptPageIndex + 1} 页批注`
                          : `${TEAM_CONTENT_LABELS[creatorCommentContentType]}批注`}
                      </strong>
                    </div>
                    <span className="creator-comments-count">{creatorVisibleComments.length}</span>
                  </div>
                  <div className="creator-comments-list">
                    {creatorVisibleComments.length > 0 ? (
                      creatorVisibleComments.map(({ taskId, reviewerName, reviewerDept, comment }) => (
                        <article key={comment.id} className="creator-comment-thread">
                          <div className="creator-comment-card-main">
                            <span className="creator-comment-card-icon" aria-hidden>
                              <MessageSquare className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                            </span>
                            <div className="creator-comment-card-body">
                              <div className="creator-comment-meta">
                                <strong>
                                  {reviewCommentScopeLabel(
                                    creatorCommentContentType,
                                    comment.pageNumber
                                  )}{' '}
                                  · {reviewerName}
                                </strong>
                                <span className="creator-comment-dept">{reviewerDept}</span>
                              </div>
                              <p>{comment.content}</p>
                              {comment.imageUrl && (
                                <a
                                  className="comment-attach-image-link"
                                  href={comment.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={comment.imageUrl}
                                    alt="批注附图"
                                    className="comment-attach-image"
                                  />
                                </a>
                              )}
                              {(comment.replies || []).map((reply) => (
                                <div
                                  key={reply.id}
                                  className={`creator-comment-reply ${
                                    reply.authorRole === 'ops' ? 'reply-ops' : 'reply-reviewer'
                                  }`}
                                >
                                  <strong>{reply.authorName} 回复</strong>
                                  {reply.content ? <span>{reply.content}</span> : null}
                                  {reply.imageUrl && (
                                    <a
                                      className="comment-attach-image-link"
                                      href={reply.imageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <img
                                        src={reply.imageUrl}
                                        alt="回复附图"
                                        className="comment-attach-image"
                                      />
                                    </a>
                                  )}
                                </div>
                              ))}
                              <div className="creator-comment-compose">
                                {creatorReplyImageDrafts[comment.id] && (
                                  <div className="comment-image-draft">
                                    <img
                                      src={creatorReplyImageDrafts[comment.id]}
                                      alt="待发送附图"
                                    />
                                    <button
                                      type="button"
                                      className="comment-image-draft-remove"
                                      aria-label="移除图片"
                                      onClick={() =>
                                        setCreatorReplyImageDrafts((prev) => {
                                          const next = { ...prev };
                                          delete next[comment.id];
                                          return next;
                                        })
                                      }
                                    >
                                      <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                                    </button>
                                  </div>
                                )}
                                <div className="comment-compose-row">
                                  <label
                                    className="comment-image-upload-btn"
                                    title="上传图片"
                                  >
                                    <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      hidden
                                      onChange={async (event) => {
                                        const file = event.target.files?.[0];
                                        event.target.value = '';
                                        if (!file) return;
                                        try {
                                          const dataUrl = await readCommentImageFile(file);
                                          if (!dataUrl) return;
                                          setCreatorReplyImageDrafts((prev) => ({
                                            ...prev,
                                            [comment.id]: dataUrl,
                                          }));
                                        } catch {
                                          toast('图片读取失败');
                                        }
                                      }}
                                    />
                                  </label>
                                  <textarea
                                    value={creatorReplyDrafts[comment.id] || ''}
                                    onChange={(event) =>
                                      setCreatorReplyDrafts((prev) => ({
                                        ...prev,
                                        [comment.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="回复这条批注…"
                                  />
                                  <button
                                    type="button"
                                    className="btn primary"
                                    disabled={
                                      !creatorReplyDrafts[comment.id]?.trim() &&
                                      !creatorReplyImageDrafts[comment.id]
                                    }
                                    onClick={() => replyToPptComment(taskId, comment.id)}
                                  >
                                    回复
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="creator-comments-empty">
                        {creatorCommentContentType === 'visual'
                          ? '当前图片暂无审阅批注'
                          : creatorCommentContentType === 'rich-text'
                            ? '当前图文暂无审阅批注'
                            : '当前页面暂无审阅批注'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </main>
          ) : (
          <main className="wpanel reviewer-task-main">
            {activeReviewTask && activeReviewTask.contentType === 'ppt' ? (
              <div className="reviewer-ppt-sidebar">
                <div className="reviewer-ppt-sidebar-head">
                  <div>
                    <strong>{activeReviewTask.title}</strong>
                    <div className="small">PPT 审阅 · {reviewPptSlides.length} 页</div>
                  </div>
                  <button
                    type="button"
                    className="btn soft"
                    onClick={() => {
                      setActiveReviewTaskId(null);
                      goToHome();
                    }}
                  >
                    返回
                  </button>
                </div>
                <div className="reviewer-ppt-thumbnails">
                  {reviewPptSlides.map((slide, index) => (
                    <button
                      key={slide.page ?? index}
                      type="button"
                      className={`reviewer-ppt-thumbnail ${reviewPptPageIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setReviewPptPageIndex(index);
                        setReviewPptNoteDraft('');
                        setReviewPptNoteImageDraft(null);
                      }}
                    >
                      <span className="reviewer-ppt-page-no">{slide.page ?? index + 1}</span>
                      <img src={slideToPreviewUrl(slide)} alt={`第 ${slide.page ?? index + 1} 页`} />
                      {(reviewPptNotes[index]?.length ?? 0) > 0 && (
                        <span className="reviewer-ppt-comment-count">{reviewPptNotes[index].length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : activeReviewTask ? (
                <div className="review-task-banner reviewer-task-banner-main">
                  <div>
                    <strong>{activeReviewTask.title}</strong>
                    <div className="small">
                      {ROLE_PROFILES[userRole].dept}审阅 · 截止 {activeReviewTask.deadline.replace('T', ' ')} · 分配人 {activeReviewTask.assignerName}
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>
                      {activeReviewTask.contentType === 'ppt'
                        ? '请在「PPT大纲」中修改章节与页面要点并保存；无需生成 PPT 成品。'
                        : isCommentableContentType(activeReviewTask.contentType)
                          ? '请在中间预览中查看内容，并在右侧批注栏添加意见。'
                          : '请仅修改右侧已生成的内容；保存后运营可在任务中查看修改详情。'}
                    </div>
                  </div>
                  <div className="quick-row">
                    <button type="button" className="btn primary" onClick={completeReviewTask}>
                      完成审阅
                    </button>
                    <button
                      type="button"
                      className="btn soft"
                      onClick={() => {
                        setActiveReviewTaskId(null);
                        goToHome();
                      }}
                    >
                      返回首页
                    </button>
                  </div>
                </div>
            ) : null}
          </main>
          )}

          <WorkspaceRightPanel
            state={state}
            setState={setState}
            openDetail={openDetail}
            fillQuick={fillQuick}
            toast={toast}
            setDrawerOpen={setDrawerOpen}
            openedFile={workspacePreviewMaterial}
            onCloseOpenedFile={() => setWorkspacePreviewMaterial(null)}
            onOpenLocalFile={() => workspaceFileInputRef.current?.click()}
            onOpenCmsFile={openCmsFileFromHome}
            generatedImages={generatedImages}
            generatedImageMeta={generatedImageMeta}
            imageReviewOrigins={imageReviewOrigins}
            imageReviewStatuses={imageReviewStatuses}
            onAcceptImageReview={acceptImageReview}
            onRejectImageReview={rejectImageReview}
            onAcceptAllImageReviews={acceptAllImageReviews}
            onRejectAllImageReviews={rejectAllImageReviews}
            topics={topics}
            copies={copies}
            teamResult={teamResult}
            videoResult={videoResult}
            pptResult={pptResult}
            pptOutline={pptOutline}
            pptVersions={pptVersions}
            selectedPptVersionId={selectedPptVersionId}
            selectedPptTemplateId={selectedPptTemplateId}
            pptTemplateOptions={pptTemplateOptions}
            morePptTemplates={morePptTemplates}
            richTextContent={richTextContent}
            onRichTextChange={setRichTextContent}
            creatorPptPageIndex={creatorPptPageIndex}
            pptPageVersionEpoch={pptPageVersionEpoch}
            onCreatorPptPageChange={handleCreatorPptPageChange}
            onReorderCreatorPptSlides={handleReorderCreatorPptSlides}
            pageModificationTasks={currentPageModificationTasks}
            imageModificationTasks={visualModificationTasks}
            imagePageVersionEpoch={imagePageVersionEpoch}
            onSpeakerNotesChange={handleSpeakerNotesChange}
            onRestorePageVersion={restorePageVersionFromTask}
            onRestoreImageVersion={restoreImageVersionFromTask}
            creatorPptComments={creatorPptComments.map(({ comment }) => comment)}
            workspaceElementId={workspaceElementSel?.elementId ?? null}
            onWorkspaceElementSelect={handleWorkspaceElementSelect}
            onSelectPptTemplate={setSelectedPptTemplateId}
            onPptOutlineChange={setPptOutline}
            onRollbackPptSlides={(slides) => {
              setPptResult((prev) => (prev ? { ...prev, slides } : prev));
              setPptVersions((prev) =>
                prev.map((version) =>
                  version.id === selectedPptVersionId ? { ...version, slides } : version
                )
              );
            }}
            onDiscardPptPageVersions={() => {
              setModificationTasks((prev) => prev.filter((task) => !task.slideSnapshot));
              setPptPageVersionEpoch((value) => value + 1);
              setWorkspaceElementSel(null);
            }}
            onConfirmPptDesigns={confirmPptDesigns}
            onRegeneratePptOutline={regeneratePptOutline}
            isGenerating={isGenerating}
            onSelectPptVersion={selectPptVersion}
            onStartPptFlow={() => startPptFlow()}
            insightSummary={insightSummary}
            topicInsightReportText={topicInsightReportText}
            selectedTopics={selectedTopics}
            setSelectedTopics={setSelectedTopics}
            copyCountPerTopic={copyCountPerTopic}
            setCopyCountPerTopic={setCopyCountPerTopic}
            selectedCopies={selectedCopies}
            setSelectedCopies={setSelectedCopies}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            setEditingCopy={setEditingCopy}
            setShowCopyEditModal={setShowCopyEditModal}
            teamModificationInProgress={teamModificationInProgress}
            runCopy={runCopy}
            runInsight={runInsight}
            runTopicInsightAgent={runTopicInsightAgent}
            expandTopics={expandTopics}
            hotInsightReport={hotInsightReport}
            recommendedTopics={recommendedTopics}
            literatureResults={literatureResults}
            literatureSearching={literatureSearching}
            addedLiteratureIds={addedLiteratureIds}
            onAddLiteratureToTask={addLiteratureToTask}
            onResearchLiterature={() => {
              setLiteratureSearching(true);
              window.setTimeout(() => {
                runLiteratureSearch(getRecentUserContext('重新检索文献'), { reshuffle: true, silent: true });
                setLiteratureSearching(false);
                toast('已重新检索文献');
              }, 480);
            }}
            contentBrief={contentBrief}
            onContentBriefChange={(next) => {
              setContentBrief(next);
              syncBriefToLibrary(next);
            }}
            onImportLocalPpt={() => pptImportInputRef.current?.click()}
            taskTitle={taskTitle}
            selectedProduct={selectedProduct}
            entryContext={entryContext}
            flowEntry={flowEntry}
            onSelectFlowStep={(step) => {
              if (!step.tab) {
                setState((prev) => ({ ...prev, active: null }));
                return;
              }
              if (step.id === 'ppt' && !contentBrief && !pptOutline) {
                toast('从 0 到 1 生成 PPT 前，请先完成 Brief 与大纲');
              }
              addTab(step.tab);
            }}
            onUploadBrief={() => openMaterialPicker('workspace', 'Brief')}
            onDownloadInsightReport={() => {
              if (!hotInsightReport) {
                toast('暂无洞察报告可下载');
                return;
              }
              downloadInsightReport(hotInsightReport, taskTitle);
              toast('洞察报告已开始下载');
            }}
            onStartVisualFlow={() => startVisualFlow(getRecentUserContext('基于所选话题生成图片'), { skipUserMsg: true })}
            onOpenImageEditor={openImageEditor}
            onOpenTeamReview={openTeamReview}
            videoVersions={videoVersions}
            selectedVideoVersionId={selectedVideoVersionId}
            selectedVideoIds={selectedVideoIds}
            draggingVideoId={draggingVideoId}
            onSelectVideoVersion={selectVideoVersion}
            onOpenVideoScriptEditor={openVideoScriptEditor}
            onRegenerateVideoVersion={regenerateSingleVideoVersion}
            onToggleVideoSelection={toggleVideoSelection}
            onVideoDragStart={setDraggingVideoId}
            onVideoDrop={reorderVideoVersion}
            onExportMergedVideos={exportMergedVideos}
            userRole={userRole}
            reviewerMode={reviewFocusMode}
            reviewContentType={activeReviewTask?.contentType}
            reviewerPptPageIndex={reviewPptPageIndex}
            reviewerAllowedTabs={reviewerAllowedTabs}
            posterPlaceholder={posterData}
            onSavePptOutlineReview={savePptOutlineReview}
            copyRevisions={copyRevisions}
            copyRevisionBase={copyRevisionBase}
            onSaveCopyReview={saveCopyReview}
            onOpenPptSlideEditor={openPptSlideEditor}
          />
          {reviewFocusMode &&
            activeReviewTask &&
            isCommentableContentType(activeReviewTask.contentType) && (
            <aside className="wpanel reviewer-ppt-comments-panel">
              <div className="reviewer-ppt-comments-panel-head">
                <strong>批注</strong>
                <span>
                  {activeReviewTask.contentType === 'ppt'
                    ? `第 ${reviewPptSlides[reviewPptPageIndex]?.page ?? reviewPptPageIndex + 1} 页`
                    : TEAM_CONTENT_LABELS[activeReviewTask.contentType]}
                </span>
              </div>
              <div className="reviewer-ppt-comment-list reviewer-ppt-comment-list-expanded">
                {(reviewPptNotes[
                  activeReviewTask.contentType === 'ppt' ? reviewPptPageIndex : 0
                ] || []).length > 0 ? (
                  (reviewPptNotes[
                    activeReviewTask.contentType === 'ppt' ? reviewPptPageIndex : 0
                  ] || []).map((note) => (
                    <div key={note.id} className="reviewer-ppt-comment">
                      <strong>{note.authorName}</strong>
                      {note.content ? <span>{note.content}</span> : null}
                      {note.imageUrl && (
                        <a
                          className="comment-attach-image-link"
                          href={note.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={note.imageUrl}
                            alt="批注附图"
                            className="comment-attach-image"
                          />
                        </a>
                      )}
                      {(note.replies || []).map((reply) => (
                        <div
                          key={reply.id}
                          className={`reviewer-ppt-comment-reply ${
                            reply.authorRole === 'ops' ? 'reply-ops' : 'reply-reviewer'
                          }`}
                        >
                          <strong>{reply.authorName} 回复</strong>
                          {reply.content ? <span>{reply.content}</span> : null}
                          {reply.imageUrl && (
                            <a
                              className="comment-attach-image-link"
                              href={reply.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={reply.imageUrl}
                                alt="回复附图"
                                className="comment-attach-image"
                              />
                            </a>
                          )}
                        </div>
                      ))}
                      {(note.replies || []).some((reply) => reply.authorRole === 'ops') && (
                        <div className="reviewer-comment-reply-compose">
                          {reviewerReplyImageDrafts[note.id] && (
                            <div className="comment-image-draft">
                              <img src={reviewerReplyImageDrafts[note.id]} alt="待发送附图" />
                              <button
                                type="button"
                                className="comment-image-draft-remove"
                                aria-label="移除图片"
                                onClick={() =>
                                  setReviewerReplyImageDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[note.id];
                                    return next;
                                  })
                                }
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                              </button>
                            </div>
                          )}
                          <div className="comment-compose-row">
                            <label className="comment-image-upload-btn" title="上传图片">
                              <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await readCommentImageFile(file);
                                    if (!dataUrl) return;
                                    setReviewerReplyImageDrafts((prev) => ({
                                      ...prev,
                                      [note.id]: dataUrl,
                                    }));
                                  } catch {
                                    toast('图片读取失败');
                                  }
                                }}
                              />
                            </label>
                            <textarea
                              value={reviewerReplyDrafts[note.id] || ''}
                              onChange={(event) =>
                                setReviewerReplyDrafts((prev) => ({
                                  ...prev,
                                  [note.id]: event.target.value,
                                }))
                              }
                              placeholder="回复内容创作者…"
                            />
                            <button
                              type="button"
                              className="btn primary"
                              disabled={
                                !reviewerReplyDrafts[note.id]?.trim() &&
                                !reviewerReplyImageDrafts[note.id]
                              }
                              onClick={() => replyToCreatorAsReviewer(note.id)}
                            >
                              回复
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="reviewer-ppt-comments-empty">
                    {activeReviewTask.contentType === 'visual'
                      ? '当前图片暂无批注'
                      : activeReviewTask.contentType === 'rich-text'
                        ? '当前图文暂无批注'
                        : '当前页面暂无批注'}
                  </div>
                )}
              </div>
              <div className="reviewer-ppt-comment-compose">
                {reviewPptNoteImageDraft && (
                  <div className="comment-image-draft">
                    <img src={reviewPptNoteImageDraft} alt="待发送附图" />
                    <button
                      type="button"
                      className="comment-image-draft-remove"
                      aria-label="移除图片"
                      onClick={() => setReviewPptNoteImageDraft(null)}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                )}
                <div className="comment-compose-row">
                  <label className="comment-image-upload-btn" title="上传图片">
                    <ImagePlus className="h-4 w-4" strokeWidth={2.2} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await readCommentImageFile(file);
                          if (!dataUrl) return;
                          setReviewPptNoteImageDraft(dataUrl);
                        } catch {
                          toast('图片读取失败');
                        }
                      }}
                    />
                  </label>
                  <textarea
                    className="reviewer-ppt-comment-input"
                    value={reviewPptNoteDraft}
                    onChange={(event) => setReviewPptNoteDraft(event.target.value)}
                    placeholder={
                      activeReviewTask.contentType === 'visual'
                        ? '针对当前图片添加批注…'
                        : activeReviewTask.contentType === 'rich-text'
                          ? '针对当前图文添加批注…'
                          : '针对当前页面添加批注…'
                    }
                  />
                  <button
                    type="button"
                    className="btn primary reviewer-ppt-comment-submit"
                    disabled={!reviewPptNoteDraft.trim() && !reviewPptNoteImageDraft}
                    onClick={() => {
                      const content = reviewPptNoteDraft.trim();
                      const imageUrl = reviewPptNoteImageDraft || undefined;
                      if ((!content && !imageUrl) || !activeReviewTaskId) return;
                      const task = getReviewTask(activeReviewTaskId);
                      if (!task) return;
                      const isPaged = activeReviewTask.contentType === 'ppt';
                      const pageIndex = isPaged ? reviewPptPageIndex : 0;
                      const now = Date.now();
                      const note: PptReviewComment = {
                        id: `ppt_comment_${now}_${Math.random().toString(36).slice(2, 8)}`,
                        pageIndex,
                        pageNumber: isPaged
                          ? reviewPptSlides[reviewPptPageIndex]?.page ?? reviewPptPageIndex + 1
                          : 1,
                        authorRole: userRole,
                        authorName: ROLE_PROFILES[userRole].name,
                        content,
                        imageUrl,
                        createdAt: now,
                        replies: [],
                      };
                      const nextComments = [...(task.pptComments || []), note];
                      upsertReviewTask({
                        ...task,
                        status: 'in_progress',
                        pptComments: nextComments,
                      });
                      setReviewPptNotes((prev) => ({
                        ...prev,
                        [pageIndex]: [...(prev[pageIndex] || []), note],
                      }));
                      setReviewPptNoteDraft('');
                      setReviewPptNoteImageDraft(null);
                      refreshReviewTasks();
                      toast('批注已添加');
                    }}
                  >
                    添加批注
                  </button>
                </div>
                <button type="button" className="btn soft reviewer-ppt-complete" onClick={completeReviewTask}>
                  完成审阅
                </button>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Visual Editor Drawer — portal 避免审阅模式下被 .screen overflow 裁切 */}
      {createPortal(
        <div
          className={`drawer ${drawerOpen && editorSrc ? 'open' : ''} ${
            reviewFocusMode ? 'reviewer-editor-drawer' : ''
          }`}
        >
          {drawerOpen && editorSrc && (
            <>
              <div className="drawer-editor-toolbar">
                <button type="button" className="btn soft" onClick={handleEditorExport}>
                  导出 PNG
                </button>
                <button type="button" className="btn" onClick={() => setDrawerOpen(false)}>
                  关闭
                </button>
              </div>
              <VisualEditor
                imageSrc={editorSrc}
                initialSvg={editorSvg}
                onClose={() => setDrawerOpen(false)}
                onUpdate={handleEditorUpdate}
                onGenerate={async (params) => {
                  setIsGenerating(true);
                  try {
                    return await handleEditorGenerate(params);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                isGenerating={isGenerating}
                allowBrush={editorTarget?.kind !== 'ppt-slide'}
                allowShapes={editorTarget?.kind !== 'ppt-slide'}
              />
            </>
          )}
        </div>,
        document.body
      )}

      <input
        ref={workspaceFileInputRef}
        type="file"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) handleCreationFileSelected(file);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={pptImportInputRef}
        type="file"
        className="hidden"
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) importLocalPptVersion(file);
          event.currentTarget.value = '';
        }}
      />

      <ProductPickerModal
        open={productPickerOpen}
        onConfirm={confirmTaskProduct}
        onCancel={cancelTaskProduct}
      />

      <CreationMethodModal
        open={creationMethodOpen}
        onClose={() => setCreationMethodOpen(false)}
        onCreateNew={createNewContentFromHome}
        onOpenLocal={handleCreationFileSelected}
        onOpenCms={openCmsFileFromHome}
      />

      {pickerOpen && pickerMode === 'reference' && pickerCat === '参考知识' ? (
        <LiteraturePickerModal
          open
          knowledgeItems={library}
          addedLiteratureIds={addedLiteratureIds}
          onClose={() => {
            setPickerOpen(false);
            setOpenPickedMaterialInPreview(false);
          }}
          onAddLiterature={addLiteratureToTask}
          onAddKnowledge={(item) => {
            handleMaterialPicked({
              existingId: item.id,
              title: item.title,
              meta: item.meta,
              cat: item.cat,
              cms: item.cms,
              fileName: item.fileName,
              contentType: item.contentType,
              contentText: item.contentText,
              contentUrl: item.contentUrl,
              mimeType: item.mimeType,
              validUntil: item.validUntil,
            });
          }}
          onUpload={handleMaterialPicked}
        />
      ) : (
        <MaterialPickerModal
          open={pickerOpen}
          defaultCat={pickerCat}
          initialTab={pickerTab}
          categories={cats}
          mode={pickerMode}
          knowledgeItems={library}
          onClose={() => {
            setPickerOpen(false);
            setOpenPickedMaterialInPreview(false);
          }}
          onConfirm={handleMaterialPicked}
        />
      )}

      <MaterialDetailModal item={previewMaterial} onClose={() => setPreviewMaterial(null)} />

      {/* Modal */}
      <div className={`modal-bg ${showModal ? 'show' : ''}`} onClick={e => {
        if ((e.target as HTMLElement).className.includes('modal-bg')) {
          setShowModal(false);
        }
      }}>
        <div className="modal">
          <h3>{modalContent.title}</h3>
          <div className="small" style={{ fontSize: '13px', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: modalContent.body }} />
          <div className="quick-row">
            <button className="btn primary" onClick={() => setShowModal(false)}>关闭</button>
          </div>
        </div>
      </div>

      {/* Copy Edit Modal */}
      <div className={`modal-bg ${showCopyEditModal ? 'show' : ''}`} onClick={e => {
        if ((e.target as HTMLElement).className.includes('modal-bg')) {
          setShowCopyEditModal(false);
        }
      }}>
        <div className="modal">
          <h3>编辑文案</h3>
          <textarea
            className="inline-edit"
            value={editingCopy}
            onChange={e => setEditingCopy(e.target.value)}
            style={{ width: '100%', minHeight: '200px' }}
          />
          <div className="quick-row">
            <button className="btn primary" onClick={() => {
              const idx = selectedCopies.findIndex(Boolean);
              const i = idx >= 0 ? idx : 0;
              setCopies((prev) =>
                prev.map((c, j) => (j === i ? { ...c, body: editingCopy } : c))
              );
              toast('文案修改已保存');
              setShowCopyEditModal(false);
            }}>保存修改</button>
            <button className="btn" onClick={() => setShowCopyEditModal(false)}>取消</button>
          </div>
        </div>
      </div>

      <ImageTemplatePickerModal
        open={Boolean(imageTemplateModal)}
        preferredTitle={imageTemplateModal?.templateHint}
        onClose={() => setImageTemplateModal(null)}
        onSkip={() => {
          if (!imageTemplateModal) return;
          executeVisualGeneration(
            imageTemplateModal.pendingNote,
            [],
            imageTemplateModal.imagesPerCopy
          );
        }}
        onConfirm={(templateIds) => {
          if (!imageTemplateModal) return;
          executeVisualGeneration(
            imageTemplateModal.pendingNote,
            templateIds,
            imageTemplateModal.imagesPerCopy
          );
        }}
      />

      {/* Team Modification Modal */}
      <div className={`modal-bg ${showTeamModal ? 'show' : ''}`} onClick={e => {
        if ((e.target as HTMLElement).className.includes('modal-bg')) {
          setShowTeamModal(false);
          setTeamAssigneeRoles([]);
        }
      }}>
        <div className="modal">
          <h3>提交团队意见收集</h3>
          {teamReviewTarget && (
            <div className="detail-card team-review-target-card">
              <h4>本次提交内容</h4>
              <div className="small">
                类型：<strong>{TEAM_CONTENT_LABELS[teamReviewTarget]}</strong>
                {buildTeamPayload(teamReviewTarget)?.title
                  ? ` · ${buildTeamPayload(teamReviewTarget)?.title}`
                  : ''}
              </div>
            </div>
          )}
          <div className="detail-card">
            <h4>分配给（可多选）</h4>
            <div className="small" style={{ marginBottom: 10 }}>
              可同时选择医学部与市场部，将分别为每位同事创建意见收集任务。
            </div>
            <label className="option team-assignee-option">
              <input
                type="checkbox"
                checked={
                  teamAssigneeRoles.includes('medical') &&
                  teamAssigneeRoles.includes('marketing')
                }
                onChange={(e) => setAllTeamAssigneeRoles(e.target.checked)}
              />
              <div>
                <strong>全选</strong>
              </div>
            </label>
            {(['medical', 'marketing'] as const).map((role) => {
              const profile = ROLE_PROFILES[role];
              return (
                <label key={role} className="option team-assignee-option">
                  <input
                    type="checkbox"
                    checked={teamAssigneeRoles.includes(role)}
                    onChange={() => toggleTeamAssigneeRole(role)}
                  />
                  <div>
                    <strong>
                      {profile.name}（{profile.dept}）
                    </strong>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="detail-card">
            <h4>修改截止时间</h4>
            <input
              type="datetime-local"
              className="input"
              style={{ width: '100%', marginTop: '8px' }}
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>
          <div className="quick-row">
            <button
              className="btn primary"
              onClick={() => {
                if (teamAssigneeRoles.length === 0 || !deadline) {
                  toast('请至少选择一位同事并设置截止时间');
                  return;
                }
                if (!currentSessionId) {
                  toast('请先保存当前任务');
                  return;
                }
                const target = teamReviewTarget || 'copy';
                const label = TEAM_CONTENT_LABELS[target];
                const baseCopy = target === 'copy' ? getActiveCopyBody() || '' : '';
                if (baseCopy) setCopyRevisionBase(baseCopy);
                if (target === 'visual' && generatedImages.length > 0) {
                  setImageReviewOrigins([...generatedImages]);
                  setImageReviewStatuses(generatedImages.map(() => null));
                }

                const assigneeLabels: string[] = [];
                const existingTasks = loadReviewTasks();
                teamAssigneeRoles.forEach((role, index) => {
                  const assignee = ROLE_PROFILES[role];
                  const existingTask = existingTasks.find(
                    (task) =>
                      task.sessionId === currentSessionId &&
                      task.contentType === target &&
                      task.assigneeRole === role
                  );
                  const now = Date.now();
                  const task: ReviewTask = {
                    ...existingTask,
                    id:
                      existingTask?.id ||
                      `rt_${now}_${index}_${Math.random().toString(36).slice(2, 8)}`,
                    sessionId: currentSessionId,
                    title: taskTitle,
                    contentType: target,
                    assigneeRole: role,
                    assigneeName: assignee.name,
                    assignerName: ROLE_PROFILES.ops.name,
                    deadline,
                    status: 'pending',
                    createdAt: existingTask?.createdAt || now,
                    updatedAt: now,
                    baseCopyText: baseCopy || undefined,
                    copyRevisionBase: baseCopy || undefined,
                    reviewRound: (existingTask?.reviewRound || 0) + 1,
                    completedReviewCount:
                      existingTask?.completedReviewCount ||
                      (existingTask?.status === 'completed' ? 1 : 0),
                  };
                  upsertReviewTask(task);
                  assigneeLabels.push(`${assignee.name}（${assignee.dept}）`);
                });
                refreshReviewTasks();
                const namesText = assigneeLabels.join('、');
                setShowTeamModal(false);
                setTeamAssigneeRoles([]);
                toast(`已向 ${namesText} 分配${label}修改任务`);
                addMsg(
                  'user',
                  `向 ${namesText} 分配${label}团队修改任务（截止 ${deadline}）`,
                  selectedModel
                );
                addMsg(
                  'ai',
                  `已为 ${assigneeLabels.length} 位同事创建意见收集任务，他们将在各自首页的「意见收集」列表中查看并反馈。完成后你可在「团队修改」或「文案生成」标签查看修改详情。`,
                  'DeepSeek-V3.1'
                );
              }}
            >
              发送邀请
            </button>
            <button
              className="btn"
              onClick={() => {
                setShowTeamModal(false);
                setTeamAssigneeRoles([]);
              }}
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="删除对话"
        message={
          deleteConfirm
            ? `确定删除「${deleteConfirm.title}」？删除后无法恢复。`
            : ''
        }
        confirmLabel="删除"
        danger
        onConfirm={handleDeleteSession}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        open={Boolean(rollbackConfirm)}
        title="回退至此"
        message={
          rollbackConfirm
            ? `确定回溯到该版本吗？`
            : ''
        }
        confirmLabel="确认回退"
        onConfirm={confirmRollbackModificationTask}
        onCancel={() => setRollbackConfirm(null)}
      />

      {showVideoScriptEditModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVideoScriptEditModal(false);
          }}
        >
          <div className="modal video-script-edit-modal">
            <div className="modal-head">
              <h3>修改视频脚本</h3>
              <button className="icon-btn" onClick={() => setShowVideoScriptEditModal(false)}>×</button>
            </div>
            <div className="small" style={{ marginBottom: 10 }}>
              修改标题、分镜、旁白或合规说明后，点击保存将自动重新生成视频并覆盖当前结果。
            </div>
            <textarea
              className="input video-script-edit-textarea"
              value={videoScriptDraft}
              onChange={(e) => setVideoScriptDraft(e.target.value)}
            />
            <div className="quick-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn primary" onClick={saveVideoScriptAndRegenerate}>
                保存并重新生成视频
              </button>
              <button type="button" className="btn soft" onClick={() => setShowVideoScriptEditModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${showToast ? 'show' : ''}`}>{toastText}</div>
    </div>
  );
}

function VideoPreviewPlayer({ version }: { version: VideoRenderVersion }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const usePoster =
    videoFailed || !version.videoUrl?.trim();
  if (usePoster && version.posterDataUrl) {
    return (
      <div className="video-preview-wrap video-preview-poster-only">
        <img
          className="video-preview-player"
          src={version.posterDataUrl}
          alt={version.name}
        />
        <div className="small video-preview-demo-hint">演示占位成片（预览图）</div>
      </div>
    );
  }
  return (
    <div className="video-preview-wrap">
      <video
        className="video-preview-player"
        src={version.videoUrl}
        poster={version.posterDataUrl}
        controls
        preload="metadata"
        onError={() => setVideoFailed(true)}
      />
    </div>
  );
}

function DrawableImagePreview({ item }: { item: LibraryItem }) {
  const [brushActive, setBrushActive] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [activeStroke, setActiveStroke] = useState<string>('');
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef('');

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 1000;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const finishStroke = () => {
    const completedStroke = activeStrokeRef.current;
    if (completedStroke) setStrokes((prev) => [...prev, completedStroke]);
    activeStrokeRef.current = '';
    setActiveStroke('');
    drawingRef.current = false;
  };

  return (
    <div className="image-draw-editor">
      <div className="image-draw-toolbar">
        <button
          type="button"
          className={`btn image-draw-tool ${brushActive ? 'primary active' : 'soft'}`}
          onClick={() => setBrushActive((active) => !active)}
        >
          <Paintbrush className="h-3.5 w-3.5" />
          画笔
        </button>
        <button
          type="button"
          className="btn soft image-draw-tool"
          disabled={strokes.length === 0 && !activeStroke}
          onClick={() => {
            setStrokes([]);
            activeStrokeRef.current = '';
            setActiveStroke('');
            drawingRef.current = false;
          }}
        >
          <Eraser className="h-3.5 w-3.5" />
          清除
        </button>
      </div>
      <div className="image-draw-canvas">
        <img src={item.contentUrl} alt={item.title} draggable={false} />
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className={`image-draw-layer ${brushActive ? 'active' : ''}`}
          onPointerDown={(event) => {
            if (!brushActive) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            const point = pointFromEvent(event);
            activeStrokeRef.current = point;
            setActiveStroke(point);
          }}
          onPointerMove={(event) => {
            if (!brushActive || !drawingRef.current) return;
            activeStrokeRef.current = `${activeStrokeRef.current} ${pointFromEvent(event)}`;
            setActiveStroke(activeStrokeRef.current);
          }}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        >
          {strokes.map((points, index) => (
            <polyline key={index} points={points} className="image-draw-stroke" />
          ))}
          {activeStroke && <polyline points={activeStroke} className="image-draw-stroke" />}
        </svg>
      </div>
    </div>
  );
}

const PPT_MAJOR_VERSION_SEED = [
  { id: 'major-v1', label: 'V1', time: '今天 10:08', depth: 2 },
  { id: 'major-v2', label: 'V2', time: '今天 15:24', depth: 1 },
  { id: 'major-latest', label: '当前', time: '刚刚', depth: 0 },
];

function WorkspaceRightPanel({
  state,
  setState,
  openDetail,
  fillQuick,
  toast,
  setDrawerOpen,
  openedFile,
  onCloseOpenedFile,
  onOpenLocalFile,
  onOpenCmsFile,
  generatedImages,
  generatedImageMeta,
  imageReviewOrigins,
  imageReviewStatuses,
  onAcceptImageReview,
  onRejectImageReview,
  onAcceptAllImageReviews,
  onRejectAllImageReviews,
  topics,
  copies,
  teamResult,
  videoResult,
  pptResult,
  pptOutline,
  pptVersions,
  selectedPptVersionId,
  selectedPptTemplateId,
  pptTemplateOptions,
  morePptTemplates,
  richTextContent,
  onRichTextChange,
  creatorPptPageIndex,
  pptPageVersionEpoch,
  onCreatorPptPageChange,
  onReorderCreatorPptSlides,
  pageModificationTasks,
  imageModificationTasks,
  imagePageVersionEpoch,
  onSpeakerNotesChange,
  onRestorePageVersion,
  onRestoreImageVersion,
  creatorPptComments,
  workspaceElementId,
  onWorkspaceElementSelect,
  onSelectPptTemplate,
  onPptOutlineChange,
  onRollbackPptSlides,
  onDiscardPptPageVersions,
  onConfirmPptDesigns,
  onRegeneratePptOutline,
  isGenerating,
  onSelectPptVersion,
  onStartPptFlow,
  insightSummary,
  topicInsightReportText,
  selectedTopics,
  setSelectedTopics,
  copyCountPerTopic,
  setCopyCountPerTopic,
  selectedCopies,
  setSelectedCopies,
  selectedImages,
  setSelectedImages,
  setEditingCopy,
  setShowCopyEditModal,
  teamModificationInProgress,
  onOpenTeamReview,
  videoVersions,
  selectedVideoVersionId,
  selectedVideoIds,
  draggingVideoId,
  onSelectVideoVersion,
  onOpenVideoScriptEditor,
  onRegenerateVideoVersion,
  onToggleVideoSelection,
  onVideoDragStart,
  onVideoDrop,
  onExportMergedVideos,
  runCopy,
  runInsight,
  runTopicInsightAgent,
  expandTopics,
  hotInsightReport,
  recommendedTopics,
  literatureResults,
  addedLiteratureIds,
  onAddLiteratureToTask,
  taskTitle,
  onDownloadInsightReport,
  onStartVisualFlow,
  onOpenImageEditor,
  userRole,
  reviewerMode,
  reviewContentType,
  reviewerPptPageIndex,
  reviewerAllowedTabs,
  posterPlaceholder,
  onSavePptOutlineReview,
  copyRevisions,
  copyRevisionBase,
  onSaveCopyReview,
  onOpenPptSlideEditor,
  literatureSearching,
  onResearchLiterature,
  contentBrief,
  onContentBriefChange,
  onImportLocalPpt,
  selectedProduct,
  entryContext,
  flowEntry,
  onSelectFlowStep,
  onUploadBrief,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  openDetail: (title: string, body: string) => void;
  fillQuick: (text: string) => void;
  toast: (text: string) => void;
  setDrawerOpen: (open: boolean) => void;
  openedFile: LibraryItem | null;
  onCloseOpenedFile: () => void;
  onOpenLocalFile: () => void;
  onOpenCmsFile: () => void;
  generatedImages: string[];
  generatedImageMeta: GeneratedImageMeta[];
  imageReviewOrigins: string[];
  imageReviewStatuses: ImageReviewStatus[];
  onAcceptImageReview: (index: number) => void;
  onRejectImageReview: (index: number) => void;
  onAcceptAllImageReviews: () => void;
  onRejectAllImageReviews: () => void;
  topics: TopicItem[];
  copies: CopyItem[];
  teamResult: TeamResult | null;
  videoResult: VideoResult | null;
  pptResult: PptResult | null;
  pptOutline: PptOutline | null;
  pptVersions: PptDesignVersion[];
  selectedPptVersionId: string | null;
  selectedPptTemplateId: string | null;
  pptTemplateOptions: PptBuiltinTemplate[];
  morePptTemplates: PptBuiltinTemplate[];
  richTextContent: string;
  onRichTextChange: (html: string) => void;
  creatorPptPageIndex: number;
  pptPageVersionEpoch: number;
  onCreatorPptPageChange: (index: number) => void;
  onReorderCreatorPptSlides: (fromIndex: number, toIndex: number) => void;
  pageModificationTasks: ModificationTask[];
  imageModificationTasks: ModificationTask[];
  imagePageVersionEpoch: number;
  onSpeakerNotesChange: (pageIndex: number, notes: string) => void;
  onRestorePageVersion: (task: ModificationTask) => void;
  onRestoreImageVersion: (task: ModificationTask) => void;
  creatorPptComments: PptReviewComment[];
  workspaceElementId: string | null;
  onWorkspaceElementSelect: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
  onSelectPptTemplate: (id: string | null) => void;
  onPptOutlineChange: (outline: PptOutline) => void;
  onRollbackPptSlides: (slides: PptSlide[]) => void;
  onDiscardPptPageVersions: () => void;
  onConfirmPptDesigns: (mode?: 'template' | 'no-template', templateId?: string) => void;
  onRegeneratePptOutline: () => void;
  isGenerating: boolean;
  onSelectPptVersion: (v: PptDesignVersion) => void;
  onStartPptFlow: () => void;
  insightSummary: string;
  topicInsightReportText: string;
  selectedTopics: boolean[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<boolean[]>>;
  copyCountPerTopic: number;
  setCopyCountPerTopic: React.Dispatch<React.SetStateAction<number>>;
  selectedCopies: boolean[];
  setSelectedCopies: React.Dispatch<React.SetStateAction<boolean[]>>;
  selectedImages: boolean[];
  setSelectedImages: React.Dispatch<React.SetStateAction<boolean[]>>;
  setEditingCopy: React.Dispatch<React.SetStateAction<string>>;
  setShowCopyEditModal: React.Dispatch<React.SetStateAction<boolean>>;
  teamModificationInProgress: boolean;
  onOpenTeamReview: (type: TeamContentType) => void;
  videoVersions: VideoRenderVersion[];
  selectedVideoVersionId: string | null;
  selectedVideoIds: string[];
  draggingVideoId: string | null;
  onSelectVideoVersion: (v: VideoRenderVersion) => void;
  onOpenVideoScriptEditor: (videoId?: string) => void;
  onRegenerateVideoVersion: (videoId: string) => void;
  onToggleVideoSelection: (id: string, checked: boolean) => void;
  onVideoDragStart: (id: string | null) => void;
  onVideoDrop: (dragId: string, targetId: string) => void;
  onExportMergedVideos: () => void;
  runCopy: (note?: string, opts?: { copiesPerTopic?: number }) => void;
  runInsight: (note?: string) => void;
  runTopicInsightAgent: (note?: string) => void;
  expandTopics: () => void;
  hotInsightReport: HotInsightReport | null;
  recommendedTopics: TopicRecommendationItem[];
  literatureResults: LiteratureArticle[];
  literatureSearching?: boolean;
  addedLiteratureIds: string[];
  onAddLiteratureToTask: (article: LiteratureArticle) => void;
  onResearchLiterature?: () => void;
  contentBrief?: ContentBrief | null;
  onContentBriefChange?: (brief: ContentBrief) => void;
  onImportLocalPpt?: () => void;
  selectedProduct?: TaskProduct | null;
  entryContext?: HomeEntryContext | null;
  flowEntry?: ContentFlowEntry | null;
  onSelectFlowStep: (step: ContentFlowStep) => void;
  onUploadBrief?: () => void;
  taskTitle: string;
  onDownloadInsightReport: () => void;
  onStartVisualFlow: () => void;
  onOpenImageEditor: (src: string, index: number) => void;
  userRole: UserRole;
  reviewerMode: boolean;
  reviewContentType?: TeamContentType;
  reviewerPptPageIndex: number;
  reviewerAllowedTabs: TabKey[] | null;
  posterPlaceholder: string;
  onSavePptOutlineReview: () => void;
  copyRevisions: CopyRevision[];
  copyRevisionBase: string;
  onSaveCopyReview: (text: string) => void;
  onOpenPptSlideEditor: (index: number) => void;
}) {
  const visibleTabs =
    reviewerMode && reviewerAllowedTabs?.length
      ? state.tabs.filter((t) => reviewerAllowedTabs.includes(t))
      : state.tabs;
  const flowProgress: ContentFlowProgress = {
    create: true,
    insight: Boolean(topicInsightReportText.trim() || insightSummary.trim() || hotInsightReport),
    brief: Boolean(contentBrief),
    literature: literatureResults.length > 0 || addedLiteratureIds.length > 0,
    outline: Boolean(pptOutline),
    ppt: Boolean(pptResult),
    copy: copies.length > 0,
    visual: generatedImages.length > 0,
    video: Boolean(videoResult || videoVersions.length),
    team: Boolean(teamResult),
    submit: state.submit,
  };
  const entryLabel =
    entryContext?.intent === 'insight'
      ? '话题洞察'
      : entryContext?.intent === 'ppt' || entryContext?.intent === 'ppt-template'
        ? 'PPT 内容'
        : entryContext?.intent === 'copy'
          ? '文案'
          : entryContext?.intent === 'visual' || entryContext?.intent === 'visual-template'
            ? '视觉'
            : entryContext?.intent === 'video'
              ? '视频'
              : '通用任务';
  const previewFile: LibraryItem | null =
    openedFile ||
    (generatedImages[0]
      ? {
          id: -1,
          cat: '生成图片',
          title: generatedImageMeta[0]?.copyTitle || '生成图片',
          meta: 'AI 生成图片 · 可预览和修改',
          cms: false,
          def: false,
          addedAt: Date.now(),
          fileName: '生成图片.svg',
          contentType: 'image',
          contentUrl: generatedImages[0],
          mimeType: 'image/svg+xml',
        }
      : null);
  const isGeneratedImagePreview = previewFile?.cat === '生成图片' && previewFile.contentType === 'image';
  const [selectedCopyRevisionIndex, setSelectedCopyRevisionIndex] = useState<number | null>(null);
  const [previewHistoryId, setPreviewHistoryId] = useState<string | null>(null);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const [majorVersions, setMajorVersions] = useState(PPT_MAJOR_VERSION_SEED);
  const [slideVersionId, setSlideVersionId] = useState('current');
  const [literatureVisibleCount, setLiteratureVisibleCount] = useState(30);
  const [pptSwitchTemplateOpen, setPptSwitchTemplateOpen] = useState(false);
  const [imageVersionId, setImageVersionId] = useState('current');
  const [imageDownloadOpen, setImageDownloadOpen] = useState(false);
  const [draggingThumbIndex, setDraggingThumbIndex] = useState<number | null>(null);
  const [dropThumbIndex, setDropThumbIndex] = useState<number | null>(null);
  const thumbDragMovedRef = useRef(false);
  const pptPreviewRef = useRef<SelectableSvgPreviewHandle>(null);
  const selectedHistory = majorVersions.find((version) => version.id === previewHistoryId) ?? null;
  const historyDepth = selectedHistory?.depth ?? 0;
  const switchPptTemplates = useMemo(() => {
    const map = new Map<string, PptBuiltinTemplate>();
    for (const item of [BLANK_PPT_TEMPLATE, ...morePptTemplates]) {
      map.set(item.id, item);
    }
    return [...map.values()];
  }, [morePptTemplates]);

  const openSwitchPptTemplate = () => {
    if (isGenerating) {
      toast('请等待当前 AI 生成完成');
      return;
    }
    if (!pptOutline) {
      toast('请先生成并确认 PPT 大纲，再切换模板');
      setState((prev) => ({ ...prev, active: 'ppt-outline' }));
      return;
    }
    setPptSwitchTemplateOpen(true);
  };

  const applySwitchPptTemplate = (templateId: string) => {
    setPptSwitchTemplateOpen(false);
    const tpl = switchPptTemplates.find((item) => item.id === templateId);
    onConfirmPptDesigns(isBlankPptTemplate(tpl) ? 'no-template' : 'template', templateId);
  };

  const previewOutline = useMemo(() => {
    if (!pptOutline || historyDepth === 0) return pptOutline;
    return {
      ...pptOutline,
      chapters: pptOutline.chapters.slice(
        0,
        Math.max(1, pptOutline.chapters.length - historyDepth)
      ),
    };
  }, [historyDepth, pptOutline]);
  const previewSlides = useMemo(() => {
    if (!pptResult || historyDepth === 0) return pptResult?.slides || [];
    return pptResult.slides.slice(0, Math.max(1, pptResult.slides.length - historyDepth));
  }, [historyDepth, pptResult]);
  const revisedCopyIndex = useMemo(
    () => findCopyIndexForRevision(copies, copyRevisionBase, copyRevisions),
    [copies, copyRevisionBase, copyRevisions]
  );

  useEffect(() => {
    setMajorVersions(PPT_MAJOR_VERSION_SEED);
    setPreviewHistoryId(null);
  }, [selectedPptVersionId, pptVersions[0]?.id]);

  useEffect(() => {
    setSlideVersionId('current');
  }, [creatorPptPageIndex, pptPageVersionEpoch]);

  useEffect(() => {
    setLiteratureVisibleCount(30);
  }, [literatureResults]);

  useEffect(() => {
    setImageVersionId('current');
    setImageDownloadOpen(false);
  }, [imagePageVersionEpoch, openedFile?.id]);

  const imageVersions = [
    ...[...imageModificationTasks]
      .filter((task) => task.imageSnapshot)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((task, index) => ({
        id: task.id,
        label: `V${index + 1}`,
        prompt: task.prompt,
        url: task.imageSnapshot!,
      })),
    ...(previewFile?.contentUrl
      ? [
          {
            id: 'current',
            label: '当前',
            prompt: '当前图片版本',
            url: previewFile.contentUrl,
          },
        ]
      : []),
  ];
  const activeImageVersion =
    imageVersions.find((version) => version.id === imageVersionId) ||
    imageVersions[imageVersions.length - 1];
  const viewingHistoricalImage =
    imageVersionId !== 'current' &&
    imageVersions.some((version) => version.id === imageVersionId && version.id !== 'current');
  const previewedImageItem =
    previewFile && activeImageVersion?.url
      ? {
          ...previewFile,
          contentUrl: activeImageVersion.url,
          title:
            activeImageVersion.label === '当前'
              ? previewFile.title
              : `${previewFile.title} · ${activeImageVersion.label}`,
        }
      : previewFile;

  useEffect(() => {
    if (selectedCopyRevisionIndex !== null && selectedCopyRevisionIndex !== revisedCopyIndex) {
      setSelectedCopyRevisionIndex(null);
    }
  }, [revisedCopyIndex, selectedCopyRevisionIndex]);

  const restoreHistoryVersion = () => {
    if (!selectedHistory) return;
    if (state.active === 'ppt-outline' && previewOutline) {
      onPptOutlineChange(previewOutline);
    }
    if (state.active === 'ppt-design' && previewSlides.length) {
      onRollbackPptSlides(previewSlides);
      onDiscardPptPageVersions();
    }
    const restoredDepth = selectedHistory.depth;
    setMajorVersions((prev) => {
      const index = prev.findIndex((item) => item.id === selectedHistory.id);
      if (index < 0) return prev;
      const kept = prev.slice(0, index).map((item) => ({
        ...item,
        depth: Math.max(0, item.depth - restoredDepth),
      }));
      return [
        ...kept,
        {
          id: 'major-latest',
          label: '当前',
          time: '刚刚',
          depth: 0,
        },
      ];
    });
    setRestoredFrom(selectedHistory.label);
    setPreviewHistoryId(null);
    setSlideVersionId('current');
    toast(`已回溯到该版本`);
  };

  const teamReviewButton = (contentType: TeamContentType) => (
    reviewerMode ? null : (
    <div className="team-review-strip">
      <button
        type="button"
        className={`btn team-review-action-btn ${teamModificationInProgress ? '' : 'warn'}`}
        disabled={teamModificationInProgress}
        style={{
          opacity: teamModificationInProgress ? 0.6 : 1,
          cursor: teamModificationInProgress ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !teamModificationInProgress && onOpenTeamReview(contentType)}
      >
        {teamModificationInProgress ? '意见收集中...' : '提交团队意见收集'}
      </button>
    </div>
    )
  );

  const renderDetail = () => {
    const k = state.active;
    if (!k) {
      if (reviewerMode) {
        return (
          <div className="detail-card">
            <h4>暂无待审内容</h4>
            <div className="small">运营尚未在本任务中生成可审阅的成品，请联系内容运营同学。</div>
          </div>
        );
      }
      return (
        <div className="detail-card content-flow-task-card">
          <h4>任务已创建</h4>
          <p className="small content-flow-task-hint">
            您可以先上传品牌策略或其他参考文献进行话题洞察；也可以直接上传
            brief，开启 PPT 从零到一的制作流程。当然，您也可以选择打开本地文件，基于本地文件进行在线编辑。
          </p>
          <div className="preview-entry-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn primary" onClick={onOpenLocalFile}>
              <FolderOpen className="h-4 w-4" />
              打开本地文件
            </button>
            <button type="button" className="btn primary" onClick={onOpenCmsFile}>
              <Database className="h-4 w-4" />
              打开 CMS 文件
            </button>
          </div>
        </div>
      );
    }

    if (reviewerMode && reviewerAllowedTabs?.length && !reviewerAllowedTabs.includes(k)) {
      return (
        <div className="detail-card">
          <h4>审阅内容加载中</h4>
          <div className="small">正在切换到对应产物视图…</div>
        </div>
      );
    }

    const veevaSubmitBtn = (quickText = '提交当前选中内容到Veeva Vault审批:') =>
      reviewerMode ? null : (
        <button
          type="button"
          className="btn green"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => fillQuick(quickText)}
        >
          提交 Veeva Vault 审批
        </button>
      );

    const teamAndVeevaActions = (contentType: TeamContentType, veevaQuick?: string) => (
      <>
        {teamReviewSupported(contentType, state.active) && teamReviewButton(contentType)}
        {veevaSubmitBtn(veevaQuick)}
      </>
    );

    const exportAllPptPages = () => {
      const slides = pptResult?.slides || [];
      if (!slides.length) {
        toast('暂无可导出的 PPT 页面');
        return;
      }
      const deckTitle = (pptResult?.title || pptOutline?.title || 'PPT')
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim() || 'PPT';
      slides.forEach((slide, index) => {
        const pageNo = slide.page || index + 1;
        const slideTitle = (slide.title || '')
          .replace(/[\\/:*?"<>|]/g, '-')
          .replace(/\s+/g, ' ')
          .trim();
        setTimeout(() => {
          downloadDataUrl(
            slideToPreviewUrl(slide),
            `${deckTitle}-第${pageNo}页${slideTitle ? `-${slideTitle}` : ''}.png`
          );
        }, index * 200);
      });
      toast(`正在导出 ${slides.length} 页 PPT`);
    };

    switch (k) {
      case 'insight':
        if (topicInsightReportText.trim()) {
          const insightHtml = ensureTopicInsightHtml(topicInsightReportText);
          const titleMatch = insightHtml.match(/^<h1>([\s\S]*?)<\/h1>\s*/);
          const titleHtml = titleMatch?.[1] ?? '话题洞察';
          const bodyHtml = titleMatch ? insightHtml.slice(titleMatch[0].length) : insightHtml;
          return (
            <div className="workspace-surface-panel topic-insight-preview-panel">
              <div className="topic-insight-title-row">
                <h1 dangerouslySetInnerHTML={{ __html: titleHtml }} />
                <button
                  type="button"
                  className="btn primary topic-insight-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(htmlToPlainText(insightHtml));
                      toast('话题洞察已复制');
                    } catch {
                      toast('复制失败，请手动选择文本复制');
                    }
                  }}
                >
                  一键复制
                </button>
              </div>
              <div
                className="topic-insight-markdown"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          );
        }
        if (!topics.length && !hotInsightReport) {
          return (
            <div className="detail-card">
              <h4>话题洞察</h4>
              <div className="small">
                在对话区输入「帮我生成五到六个话题」（可有可无附件），即可在此查看话题洞察报告。
              </div>
              <button
                className="btn primary"
                style={{ marginTop: 12 }}
                onClick={() => runTopicInsightAgent('基于素材生成话题洞察')}
              >
                基于素材生成话题洞察
              </button>
            </div>
          );
        }
        if (hotInsightReport) {
          return (
            <HotInsightReportPanel
              report={hotInsightReport}
              insightSummary={insightSummary}
              topics={topics}
              selectedTopics={selectedTopics}
              setSelectedTopics={setSelectedTopics}
              copyCountPerTopic={copyCountPerTopic}
              setCopyCountPerTopic={setCopyCountPerTopic}
              onDownload={onDownloadInsightReport}
              onRunCopy={() => runCopy(undefined, { copiesPerTopic: copyCountPerTopic })}
              onExpandTopics={expandTopics}
              openDetail={openDetail}
              fillQuick={fillQuick}
            />
          );
        }
        return (
          <>
            <div className="detail-card">
              <h4>话题洞察详情</h4>
              <div className="small">{insightSummary || '基于默认素材与 DeepSeek 生成。点击话题查看详情，勾选后继续生成文案。'}</div>
            </div>
            <label className="option" style={{ marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={selectedTopics.length > 0 && selectedTopics.every((x) => x)}
                onChange={(e) => setSelectedTopics(topics.map(() => e.target.checked))}
              />
              <div><strong>全选</strong></div>
            </label>
            {topics.map((t, i) => (
              <label
                key={i}
                className="option content-tile"
                onClick={() =>
                  openDetail(
                    t.title,
                    `来源：${t.source}<br>推荐理由：${t.reason}`
                  )
                }
              >
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedTopics[i] ?? false}
                  onChange={(e) => {
                    const newSelected = [...selectedTopics];
                    newSelected[i] = e.target.checked;
                    setSelectedTopics(newSelected);
                  }}
                />
                <div>
                  <strong>{t.title}</strong>
                  <div className="small">{t.reason}</div>
                </div>
              </label>
            ))}
            <div className="copy-generate-options">
              <label className="copy-per-topic-control">
                <span className="small">每话题生成</span>
                <select
                  className="copy-per-topic-select"
                  value={copyCountPerTopic}
                  onChange={(e) => setCopyCountPerTopic(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="small">篇文案</span>
              </label>
            </div>
            <div className="quick-row">
              <button
                className="btn primary"
                onClick={() => runCopy(undefined, { copiesPerTopic: copyCountPerTopic })}
              >
                基于选中话题生成文案
              </button>
              <button className="btn" onClick={() => expandTopics()}>
                拓展话题
              </button>
            </div>
          </>
        );

      case 'topic-recommendation':
        if (!recommendedTopics.length) {
          return (
            <div className="detail-card">
              <h4>话题推荐</h4>
              <div className="small">当未上传热点洞察素材并选择「使用已有素材继续」后，推荐话题将展示在此。</div>
              <button
                className="btn primary"
                style={{ marginTop: 12 }}
                onClick={() => runTopicInsightAgent('基于素材生成话题洞察')}
              >
                开始话题洞察
              </button>
            </div>
          );
        }
        return (
          <TopicRecommendationPanel
            items={recommendedTopics}
            selectedTopics={selectedTopics}
            setSelectedTopics={setSelectedTopics}
            onRunCopy={() => runCopy()}
            onStartPptFlow={onStartPptFlow}
            onStartVisualFlow={onStartVisualFlow}
            openDetail={openDetail}
          />
        );

      case 'literature':
        if (!literatureResults.length) {
          return (
            <div className="detail-card">
              <h4>推荐文献</h4>
              <div className="small literature-more-hint">
                如需检索更多文献，请访问
                <a href="https://www.cnki.net/" target="_blank" rel="noreferrer">
                  CNKI
                </a>
                ，
                <a href="https://med.wanfangdata.com.cn/" target="_blank" rel="noreferrer">
                  万方医学
                </a>
                等三方知识库。
              </div>
            </div>
          );
        }
        return (
          <div className="workspace-surface-panel literature-panel">
            <div className="literature-panel-head">
              <div>
                <h4>推荐文献</h4>
                <div className="small literature-more-hint">
                  如需检索更多文献，请访问
                  <a href="https://www.cnki.net/" target="_blank" rel="noreferrer">
                    CNKI
                  </a>
                  ，
                  <a href="https://med.wanfangdata.com.cn/" target="_blank" rel="noreferrer">
                    万方医学
                  </a>
                  等三方知识库。
                </div>
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={literatureSearching}
                onClick={() => onResearchLiterature?.()}
              >
                {literatureSearching ? '检索中…' : '重新检索文献'}
              </button>
            </div>
            <div className="literature-list">
              {literatureResults.slice(0, literatureVisibleCount).map((article) => {
                const added = addedLiteratureIds.includes(article.id);
                return (
                  <article key={article.id} className="literature-card">
                    <div className="literature-card-top">
                      <div className="literature-card-meta">
                        <span className="literature-source-tag">{article.source}</span>
                        <span className="literature-journal">
                          {article.journalAbbr || article.publisher} · {article.year}
                        </span>
                      </div>
                      <div className="literature-actions">
                        {article.access === 'free' ? (
                          <>
                            <a
                              className="btn soft literature-link-btn"
                              href={article.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                              查看原文章链接
                            </a>
                            <button
                              type="button"
                              className={`btn ${added ? 'soft' : 'primary'} literature-add-btn`}
                              disabled={added}
                              onClick={() => onAddLiteratureToTask(article)}
                            >
                              {added ? (
                                <>
                                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                                  已添加
                                </>
                              ) : (
                                '添加到当前任务'
                              )}
                            </button>
                          </>
                        ) : (
                          <a
                            className="btn soft literature-link-btn"
                            href={article.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                            前往原链接下载
                          </a>
                        )}
                      </div>
                    </div>
                    <h5>{article.title}</h5>
                    <p className="literature-abstract">{article.abstract}</p>
                  </article>
                );
              })}
              {literatureVisibleCount < literatureResults.length && (
                <button
                  type="button"
                  className="btn soft literature-more-btn"
                  onClick={() => setLiteratureVisibleCount((count) => count + 30)}
                >
                  查看更多文献
                </button>
              )}
            </div>
          </div>
        );

      case 'brief':
        if (!contentBrief) {
          return (
            <div className="detail-card">
              <h4>生成 / 上传 Brief</h4>
              <div className="small">
                这是从 0 到 1 生成 PPT 的必要步骤。可在对话中输入「生成 Brief」，或上传已有 Brief。
              </div>
              <div className="quick-row" style={{ marginTop: 12 }}>
                <button type="button" className="btn primary" onClick={() => fillQuick('生成 Brief')}>
                  生成 Brief
                </button>
                <button type="button" className="btn soft" onClick={() => onUploadBrief?.()}>
                  上传 Brief
                </button>
              </div>
            </div>
          );
        }
        return (
          <ContentBriefPanel
            brief={contentBrief}
            onChange={(next) => onContentBriefChange?.(next)}
            onCopy={async () => {
              try {
                await navigator.clipboard.writeText(formatContentBriefText(contentBrief));
                toast('Brief 已复制');
              } catch {
                toast('复制失败，请手动选择文本复制');
              }
            }}
          />
        );

      case 'copy':
        if (!copies.length && !reviewerMode) {
          return (
            <div className="detail-card">
              <h4>文案生成</h4>
              <div className="small">请先生成话题洞察，再基于此生成文案。</div>
              <button className="btn primary" style={{ marginTop: 12 }} onClick={() => runCopy()}>
                生成文案
              </button>
            </div>
          );
        }
        if (reviewerMode) {
          const revisionBase =
            copyRevisionBase ||
            copies[0]?.body ||
            teamResult?.after ||
            teamResult?.before ||
            '';
          if (!revisionBase.trim()) {
            return (
              <div className="detail-card">
                <h4>文案审阅</h4>
                <div className="small">当前任务中还没有可编辑的文案正文，请联系内容运营。</div>
              </div>
            );
          }
          const editText = latestCopyText(revisionBase, copyRevisions);
          return (
            <CopyRevisionDisplay
              key={
                copyRevisions.length
                  ? copyRevisions[copyRevisions.length - 1].id
                  : 'copy-base'
              }
              baseText={revisionBase}
              revisions={copyRevisions}
              editable
              editText={editText}
              role={userRole}
              onSave={onSaveCopyReview}
            />
          );
        }
        return (
          <>
            <div className="detail-card">
              <h4>文案生成详情</h4>
              <div className="small">
                已生成 {copies.length} 篇文案，按 {groupCopiesByTopic(copies).length} 个话题分类。
                {copyRevisions.length > 0 && revisedCopyIndex >= 0
                  ? ' 带「有修改」标记的文案可点击查看修改详情。'
                  : ' 点击编辑或勾选进入团队修改。'}
              </div>
            </div>
            <label className="option" style={{ marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={selectedCopies.length > 0 && selectedCopies.every((x) => x)}
                onChange={(e) => setSelectedCopies(copies.map(() => e.target.checked))}
              />
              <div><strong>全选</strong></div>
            </label>
            {groupCopiesByTopic(copies).map((group) => (
              <div key={group.topicTitle} className="copy-topic-group glass-card-subtle">
                <div className="copy-topic-group-head">
                  <strong>{group.topicTitle}</strong>
                  <span className="small">{group.items.length} 篇</span>
                </div>
                {group.items.map(({ copy: c, index: i }) => (
                  <label
                    key={`${group.topicTitle}-${i}`}
                    className="option content-tile copy-topic-item"
                    onClick={() => {
                      if (copyRevisions.length > 0 && i === revisedCopyIndex) {
                        setSelectedCopyRevisionIndex(i);
                        return;
                      }
                      setSelectedCopyRevisionIndex(null);
                      setEditingCopy(c.body);
                      setShowCopyEditModal(true);
                    }}
                  >
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      checked={selectedCopies[i] ?? false}
                      onChange={(e) => {
                        const newSelected = [...selectedCopies];
                        newSelected[i] = e.target.checked;
                        setSelectedCopies(newSelected);
                      }}
                    />
                    <div>
                      <strong>{c.title}</strong>
                      <div className="small">{c.compliance}</div>
                      {copyRevisions.length > 0 && i === revisedCopyIndex && (
                        <span className="badge green" style={{ marginTop: 6 }}>
                          有修改，点击查看详情
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ))}
            {copyRevisions.length > 0 && selectedCopyRevisionIndex === revisedCopyIndex && (
              <CopyRevisionDisplay
                baseText={copyRevisionBase || copies[revisedCopyIndex]?.body || ''}
                revisions={copyRevisions}
              />
            )}
            <div className="quick-row" style={{ marginTop: '10px' }}>
              <button className="btn soft" onClick={() => fillQuick('生成图片')}>生成图片</button>
              <button className="btn soft" onClick={() => fillQuick('生成视频')}>生成视频</button>
              <button className="btn soft" onClick={() => fillQuick('生成PPT')}>生成PPT</button>
            </div>
            {teamAndVeevaActions('copy')}
          </>
        );

      case 'rich-text':
        return (
          <div className="ppt-design-fit-panel">
            <RichTextEditor
              value={richTextContent || WORKSPACE_MOCK_RICH_TEXT}
              onChange={onRichTextChange}
            />
            <div className="content-submit-actions">
              <button
                type="button"
                className="btn soft"
                onClick={() => toast('已开始导出 DOCX 文件')}
              >
                导出docx文件
              </button>
              {!reviewerMode && (
                <>
                  <button
                    type="button"
                    className="btn warn"
                    disabled={teamModificationInProgress}
                    onClick={() => !teamModificationInProgress && onOpenTeamReview('rich-text')}
                  >
                    {teamModificationInProgress ? '意见收集中...' : '提交团队意见收集'}
                  </button>
                  <button
                    type="button"
                    className="btn green"
                    onClick={() => fillQuick('提交当前图文内容到Veeva Vault审批:')}
                  >
                    提交 Veeva Vault 审批
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 'team':
        if (!teamResult) {
          return (
            <div className="detail-card">
              <h4>团队修改</h4>
              <div className="small">在对话中提交团队意见收集邀请，或点击「进入团队修改」由 AI 整合反馈。</div>
            </div>
          );
        }
        return (
          <>
            <div className="detail-card">
              <h4>团队修改详情</h4>
              <div className="small">
                内容类型：<strong>{TEAM_CONTENT_LABELS[teamResult.contentType || 'copy']}</strong>
                {teamResult.contentTitle ? ` · ${teamResult.contentTitle}` : ''}
              </div>
              <div className="small" style={{ marginTop: 6 }}>{teamResult.summary}</div>
            </div>
            {copyRevisions.length > 0 && (
              <CopyRevisionDisplay
                baseText={copyRevisionBase || teamResult.before}
                revisions={copyRevisions}
              />
            )}
            <div
              className="copy-preview content-tile"
              onClick={() => openDetail('修改前', teamResult.before.replace(/\n/g, '<br>'))}
            >
              <strong>修改前</strong>
              <p>{teamResult.before}</p>
            </div>
            <div
              className="copy-preview content-tile"
              onClick={() =>
                openDetail(
                  '修改后',
                  `${teamResult.after.replace(/\n/g, '<br>')}<br><br>变更：${teamResult.changes?.join('；') || ''}`
                )
              }
            >
              <strong>修改后</strong>
              <p>{teamResult.after.slice(0, 120)}…</p>
              {(teamResult.changes || []).map((ch, i) => (
                <span key={i} className="badge green">
                  {ch}
                </span>
              ))}
            </div>
            <div className="quick-row">
              <button className="btn soft" onClick={() => fillQuick('生成图片')}>生成图片</button>
              <button className="btn soft" onClick={() => fillQuick('生成视频')}>生成视频</button>
              <button className="btn soft" onClick={() => fillQuick('生成PPT')}>生成PPT</button>
            </div>
            {veevaSubmitBtn()}
          </>
        );

      case 'visual': {
        const hasGenerated = generatedImages.length > 0;
        if (reviewerMode) {
          return (
            <ReviewerVisualPanel
              images={generatedImages}
              placeholderDataUrl={posterPlaceholder}
              onEditImage={onOpenImageEditor}
            />
          );
        }
        const displayImages = hasGenerated ? generatedImages : [posterData];
        const { origins: alignedOrigins, statuses: alignedStatuses } = alignImageReviewArrays(
          generatedImages,
          imageReviewOrigins,
          imageReviewStatuses
        );
        const selection = hasGenerated
          ? selectedImages.length === generatedImages.length
            ? selectedImages
            : generatedImages.map((_, i) => i === 0)
          : [];
        return (
          <>
            <div className="detail-card">
              <h4>图片生成详情</h4>
              <div className="small">
                {hasGenerated
                  ? `已生成 ${generatedImages.length} 张配图，按 ${groupImagesByCopy(generatedImages, generatedImageMeta).length} 篇文案分类。勾选后提交团队意见收集；点击图片可进入编辑。`
                  : '尚未生成配图，以下为示意预览。请先在对话中生成图片，并说明每个文案想生成几张。'}
              </div>
            </div>
            {hasGenerated && (
              <OpsImageReviewPanel
                images={generatedImages}
                origins={alignedOrigins}
                statuses={alignedStatuses}
                onAccept={onAcceptImageReview}
                onReject={onRejectImageReview}
                onAcceptAll={onAcceptAllImageReviews}
                onRejectAll={onRejectAllImageReviews}
              />
            )}
            {hasGenerated && (
              <label className="option" style={{ marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={selection.length > 0 && selection.every((x) => x)}
                  onChange={(e) => setSelectedImages(generatedImages.map(() => e.target.checked))}
                />
                <div><strong>全选</strong></div>
              </label>
            )}
            {hasGenerated
              ? groupImagesByCopy(generatedImages, generatedImageMeta).map((group) => (
                  <div
                    key={`${group.copyIndex}:${group.copyTitle}`}
                    className="copy-image-group glass-card-subtle"
                  >
                    <div className="copy-image-group-head">
                      <strong>{group.copyTitle}</strong>
                      <span className="small">{group.items.length} 张</span>
                    </div>
                    {group.items.map(({ dataUrl: img, index: idx }) => (
                      <label
                        key={idx}
                        className="option generated-img-option copy-image-item"
                        style={{ marginBottom: '10px' }}
                      >
                        <input
                          type="checkbox"
                          checked={selection[idx] ?? false}
                          onChange={(e) => {
                            const next = [...selection];
                            next[idx] = e.target.checked;
                            setSelectedImages(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="generated-img-wrap content-tile"
                          onClick={() => onOpenImageEditor(img, idx)}
                        >
                          {alignedStatuses[idx] === 'pending' && (
                            <span className="img-review-badge">待采纳</span>
                          )}
                          {alignedStatuses[idx] === 'rejected' && (
                            <span className="img-review-badge rejected">已恢复原图</span>
                          )}
                          <img className="generated-img" src={img} alt={`生成的图片 ${idx + 1}`} />
                          <span className="img-edit-hint">点击进入图片编辑</span>
                          {alignedStatuses[idx] === 'pending' && (
                            <div
                              className="img-review-inline-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="btn primary"
                                onClick={() => onAcceptImageReview(idx)}
                              >
                                采纳
                              </button>
                              <button
                                type="button"
                                className="btn soft"
                                onClick={() => onRejectImageReview(idx)}
                              >
                                恢复原图
                              </button>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ))
              : displayImages.map((img, idx) => (
              <label
                key={idx}
                className="option generated-img-option"
                style={{ marginBottom: '10px' }}
              >
                <div
                  className="generated-img-wrap content-tile"
                  onClick={() => onOpenImageEditor(img, idx)}
                >
                  <img className="generated-img" src={img} alt={`生成的图片 ${idx + 1}`} />
                  <span className="img-edit-hint">点击进入图片编辑</span>
                </div>
              </label>
            ))}
            {hasGenerated && (
              <>
                <div className="visual-action-strip">
                  <button
                    type="button"
                    className="btn"
                    style={{ width: '100%' }}
                    onClick={() => fillQuick('请重新生成一版更清爽、更少营销感的图片:')}
                  >
                    重新生成
                  </button>
                </div>
                {teamAndVeevaActions('visual', '提交当前图片和文案到Veeva Vault审批:')}
              </>
            )}
          </>
        );
      }

      case 'video-script':
      case 'video-render':
        if (reviewerMode && !videoVersions.length && videoResult) {
          return (
            <>
              <div className="detail-card detail-card-ppt-outline">
                <h4>{videoResult.title}</h4>
                <div className="small">脚本已生成，成片尚未合成。</div>
              </div>
              <div className="detail-card">
                <h4>分镜列表</h4>
                <ol>
                  {videoResult.segments.map((s, i) => (
                    <li key={i}>
                      <strong>{s.time}</strong> {s.scene}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          );
        }
        if (!videoVersions.length && videoResult) {
          return (
            <>
              <div className="detail-card detail-card-ppt-outline">
                <h4>{videoResult.title}</h4>
                <div className="small">视频脚本已生成，右侧可查看分镜内容。</div>
              </div>
              <div className="detail-card">
                <h4>分镜脚本</h4>
                <ol className="insight-bullet-list" style={{ paddingLeft: 18 }}>
                  {videoResult.segments.map((s, i) => (
                    <li key={`${s.time}-${i}`}>
                      <strong>{s.time}</strong> {s.scene}
                      <div className="small" style={{ marginTop: 4 }}>
                        旁白：{s.narration}
                      </div>
                      {s.compliance && (
                        <div className="small" style={{ marginTop: 2 }}>
                          合规：{s.compliance}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="quick-row">
                <button type="button" className="btn soft" onClick={() => onOpenVideoScriptEditor()}>
                  编辑脚本
                </button>
                <button type="button" className="btn primary" onClick={() => fillQuick('生成视频')}>
                  生成视频
                </button>
              </div>
            </>
          );
        }
        if (!videoVersions.length) {
          return (
            <div className="detail-card">
              <h4>视频生成</h4>
              <div className="small">在对话中说「直接生成视频」，或补充主题后一键生成视频方案。</div>
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: 12 }}
                onClick={() => fillQuick('直接生成视频')}
              >
                直接生成视频
              </button>
            </div>
          );
        }
        if (reviewerMode) {
          const selectedVideo = videoVersions.find((v) => v.id === selectedVideoVersionId) || videoVersions[0];
          return (
            <>
              <div className="detail-card detail-card-ppt-design">
                <h4>视频预览</h4>
                <div className="small">{selectedVideo.name}</div>
              </div>
              <VideoPreviewPlayer version={selectedVideo} />
            </>
          );
        }
        return (
          <>
            <div className="detail-card detail-card-ppt-design">
              <h4>视频预览</h4>
              <div className="small">共 {videoVersions.length} 套方案，可勾选、拖拽排序并合并导出。</div>
              <div className="quick-row" style={{ marginTop: 10 }}>
                <button type="button" className="btn primary" onClick={onExportMergedVideos}>
                  合并导出已勾选视频
                </button>
              </div>
            </div>
            <div className="video-version-grid">
              {videoVersions.map((v, index) => (
                <div
                  key={v.id}
                  className={`video-version-card ${selectedVideoVersionId === v.id ? 'selected' : ''} ${draggingVideoId === v.id ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    onVideoDragStart(v.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', v.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragId = e.dataTransfer.getData('text/plain') || draggingVideoId;
                    if (dragId) onVideoDrop(dragId, v.id);
                    onVideoDragStart(null);
                  }}
                  onDragEnd={() => onVideoDragStart(null)}
                  onClick={() => onSelectVideoVersion(v)}
                >
                  <div className="video-version-controls" onClick={(e) => e.stopPropagation()}>
                    <label className="video-version-check">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.includes(v.id)}
                        onChange={(e) => onToggleVideoSelection(v.id, e.target.checked)}
                      />
                      合并
                    </label>
                    <span className="video-drag-handle" title="拖拽调整顺序">拖拽 #{index + 1}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <VideoPreviewPlayer version={v} />
                  </div>
                  <div className="video-version-meta">
                    <strong>{v.name}</strong>
                    <div className="small">
                      {v.styleTag} · {v.duration}
                      {v.isDemo ? ' · 演示' : ''}
                    </div>
                    <div className="quick-row" style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn soft" onClick={() => onOpenVideoScriptEditor(v.id)}>
                        修改视频脚本
                      </button>
                      <button type="button" className="btn soft" onClick={() => onRegenerateVideoVersion(v.id)}>
                        重新生成视频
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {teamAndVeevaActions('video', '提交当前版本到Veeva Vault审批')}
          </>
        );

      case 'ppt-outline':
        if (!pptOutline) {
          return (
            <div className="detail-card">
              <h4>PPT 大纲</h4>
              <div className="small">
                {reviewerMode
                  ? '当前任务中还没有 PPT 大纲，请联系内容运营。'
                  : '在对话中说「生成 PPT」，确认受众与场景后将在此编辑大纲。'}
              </div>
              {!reviewerMode && (
                <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={onStartPptFlow}>
                  开始生成 PPT
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="ppt-outline-tab-layout">
            <PptOutlineEditor
              variant="inline"
              outline={previewOutline || pptOutline}
              onChange={onPptOutlineChange}
              onGenerateDesigns={onConfirmPptDesigns}
              onRegenerateOutline={onRegeneratePptOutline}
              selectedTemplateId={selectedPptTemplateId}
              templates={pptTemplateOptions}
              moreTemplates={morePptTemplates}
              onSelectTemplate={onSelectPptTemplate}
              isGenerating={isGenerating}
              reviewerMode={reviewerMode}
              onSaveOutlineReview={onSavePptOutlineReview}
              showGenerateFooter={false}
            />
            {!reviewerMode && (
              <div className="ppt-outline-tab-foot">
                <PptOutlineGenerateFooter
                  isGenerating={isGenerating}
                  selectedTemplateId={selectedPptTemplateId}
                  templates={pptTemplateOptions}
                  onGenerateDesigns={onConfirmPptDesigns}
                />
              </div>
            )}
          </div>
        );

      case 'ppt-design': {
        if (reviewerMode) {
          const slide = previewSlides[reviewerPptPageIndex] || previewSlides[0];
          if (!slide) {
            return (
              <div className="detail-card">
                <h4>暂无 PPT 页面</h4>
                <div className="small">当前任务尚未包含可审阅的 PPT 成品。</div>
              </div>
            );
          }
          return (
            <div className="reviewer-ppt-stage">
              <div className="reviewer-ppt-stage-head">
                <strong>第 {slide.page ?? reviewerPptPageIndex + 1} 页</strong>
                <span>{slide.title}</span>
              </div>
              <div className="reviewer-ppt-slide-canvas">
                <img src={slideToPreviewUrl(slide)} alt={slide.title} />
              </div>
            </div>
          );
        }
        if (!pptVersions.length) {
          return (
            <div className="detail-card">
              <h4>PPT 生成</h4>
              <div className="small">
                请先在「PPT大纲」中确认大纲并点击「按模板生成 PPT」。
              </div>
              <button
                type="button"
                className="btn soft"
                style={{ marginTop: 12 }}
                onClick={() => setState((prev) => ({ ...prev, active: 'ppt-outline' }))}
              >
                前往 PPT 大纲
              </button>
              <div className="ppt-local-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => onImportLocalPpt?.()}
                >
                  导入本地版本
                </button>
                <button
                  type="button"
                  className="btn soft"
                  disabled={isGenerating}
                  onClick={openSwitchPptTemplate}
                >
                  切换PPT模板
                </button>
              </div>
            </div>
          );
        }
        const singleVersion = pptVersions.length <= 1;
        const creatorActivePageIndex = Math.min(
          creatorPptPageIndex,
          Math.max(previewSlides.length - 1, 0)
        );
        const liveSlide = previewSlides[creatorActivePageIndex] || previewSlides[0];
        const pageVersions = [
          ...[...pageModificationTasks]
            .filter((task) => task.slideSnapshot)
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((task, index) => ({
              id: task.id,
              label: `V${index + 1}`,
              prompt: task.prompt,
              status: task.status,
              slide: task.slideSnapshot!,
            })),
          ...(liveSlide
            ? [
                {
                  id: 'current',
                  label: '当前',
                  prompt: '当前页面版本',
                  status: 'current' as const,
                  slide: liveSlide,
                },
              ]
            : []),
        ];
        const activePageVersion =
          pageVersions.find((version) => version.id === slideVersionId) ||
          pageVersions[pageVersions.length - 1];
        const creatorActiveSlide = activePageVersion?.slide || liveSlide;
        const viewingHistoricalVersion =
          slideVersionId !== 'current' &&
          pageVersions.some((version) => version.id === slideVersionId && version.id !== 'current');
        const canReorderThumbs = !selectedHistory && !reviewerMode;
        const currentMajorMinors: VersionTimelineItem[] =
          pageVersions.length > 1
            ? pageVersions.map((version) => ({
                id: version.id,
                label: version.id === 'current' ? '当前' : version.label.replace(/^V/i, ''),
                title: version.prompt,
                kind: 'minor' as const,
              }))
            : [];
        const timelineItems: VersionTimelineItem[] = [
          ...majorVersions.map((version) => ({
            id: version.id,
            label: version.label,
            title: restoredFrom && version.id === 'major-latest'
              ? `当前大版本（回溯自 ${restoredFrom}）· ${version.time}`
              : `大版本 ${version.label} · ${version.time}`,
            kind: 'major' as const,
          })),
          ...currentMajorMinors,
        ];
        const timelineActiveId =
          previewHistoryId || (currentMajorMinors.length ? slideVersionId : 'major-latest');
        const selectTimelineVersion = (id: string) => {
          const major = majorVersions.find((item) => item.id === id);
          if (major) {
            setPreviewHistoryId(major.depth === 0 ? null : major.id);
            if (major.depth === 0) setSlideVersionId('current');
            return;
          }
          setPreviewHistoryId(null);
          setSlideVersionId(id);
        };
        return (
          <div className="ppt-design-fit-panel">
            {!singleVersion && (
              <div className="detail-card detail-card-ppt-design">
                <div className="ppt-design-title-row">
                  <div>
                    <h4>选择 PPT 设计方案</h4>
                    <div className="small">共 {pptVersions.length} 套拜耳蓝绿风格方案</div>
                  </div>
                </div>
                <div className="ppt-version-grid">
                  {pptVersions.map((v) => (
                    <div
                      key={v.id}
                      className={`ppt-version-card ${selectedPptVersionId === v.id ? 'selected' : ''}`}
                      onClick={() => onSelectPptVersion(v)}
                    >
                      {v.coverDataUrl ? (
                        <img src={v.coverDataUrl} alt={v.name} />
                      ) : (
                        <div className="ppt-version-placeholder" />
                      )}
                      <div className="ppt-version-meta">
                        <strong>{v.name}</strong>
                        <div className="small">{v.styleTag}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pptResult && creatorActiveSlide && (
              <div className="creator-ppt-preview-card">
                <div className="creator-ppt-toolbar">
                  <div className="creator-ppt-toolbar-page">
                    <strong>第 {liveSlide?.page ?? creatorActivePageIndex + 1} 页</strong>
                    <span>{creatorActiveSlide.title}</span>
                    {viewingHistoricalVersion && (
                      <span className="creator-ppt-version-pill">
                        当前页面版本 · {activePageVersion?.label}
                      </span>
                    )}
                  </div>
                  <div className="creator-ppt-toolbar-tools" role="toolbar" aria-label="页面操作">
                    {!selectedHistory && viewingHistoricalVersion && activePageVersion?.id !== 'current' && (
                      <button
                        type="button"
                        className="creator-ppt-tool primary"
                        onClick={() => {
                          const task =
                            pageModificationTasks.find(
                              (item) => item.id === activePageVersion?.id
                            ) ||
                            // 兜底：按快照 id 从当前页任务中查找
                            pageModificationTasks.find((item) => item.slideSnapshot && item.id === slideVersionId);
                          if (!task?.slideSnapshot) {
                            toast('未找到可回溯的版本任务');
                            return;
                          }
                          onRestorePageVersion(task);
                          setSlideVersionId('current');
                        }}
                      >
                        回溯到该版本
                      </button>
                    )}
                    {!selectedHistory && !viewingHistoricalVersion && (
                      <button
                        type="button"
                        className="creator-ppt-tool primary"
                        onClick={() => onOpenPptSlideEditor(creatorActivePageIndex)}
                      >
                        手动调整
                      </button>
                    )}
                  </div>
                </div>
                <div className="creator-ppt-workspace">
                  <div className="creator-ppt-thumbnails" aria-label="页面缩略图，可拖拽排序">
                    {previewSlides.map((slide, index) => {
                      const commentCount = creatorPptComments.filter(
                        (comment) => comment.pageIndex === index
                      ).length;
                      return (
                        <button
                          key={`ppt-thumb-${index}`}
                          type="button"
                          draggable={canReorderThumbs}
                          className={[
                            creatorActivePageIndex === index ? 'active' : '',
                            draggingThumbIndex === index ? 'is-dragging' : '',
                            dropThumbIndex === index && draggingThumbIndex !== index
                              ? 'is-drop-target'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          title={canReorderThumbs ? '拖拽调整页面顺序' : undefined}
                          onDragStart={(event) => {
                            if (!canReorderThumbs) {
                              event.preventDefault();
                              return;
                            }
                            thumbDragMovedRef.current = false;
                            setDraggingThumbIndex(index);
                            setDropThumbIndex(null);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(index));
                          }}
                          onDragOver={(event) => {
                            if (!canReorderThumbs || draggingThumbIndex == null) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            if (dropThumbIndex !== index) setDropThumbIndex(index);
                          }}
                          onDragLeave={() => {
                            setDropThumbIndex((prev) => (prev === index ? null : prev));
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!canReorderThumbs) return;
                            const raw = event.dataTransfer.getData('text/plain');
                            const fromIndex = Number(
                              raw !== '' ? raw : draggingThumbIndex ?? Number.NaN
                            );
                            if (
                              Number.isFinite(fromIndex) &&
                              fromIndex >= 0 &&
                              fromIndex < previewSlides.length &&
                              fromIndex !== index
                            ) {
                              thumbDragMovedRef.current = true;
                              onReorderCreatorPptSlides(fromIndex, index);
                            }
                            setDraggingThumbIndex(null);
                            setDropThumbIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggingThumbIndex(null);
                            setDropThumbIndex(null);
                          }}
                          onClick={() => {
                            if (thumbDragMovedRef.current) {
                              thumbDragMovedRef.current = false;
                              return;
                            }
                            onCreatorPptPageChange(index);
                          }}
                        >
                          <span className="creator-ppt-thumbnail-page">
                            {slide.page ?? index + 1}
                          </span>
                          <img
                            src={slideToPreviewUrl(slide)}
                            alt={`第 ${slide.page ?? index + 1} 页`}
                            draggable={false}
                          />
                          {commentCount > 0 && (
                            <span className="creator-ppt-thumbnail-comments">{commentCount}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="creator-ppt-stage">
                    <div className="creator-ppt-slide-canvas">
                      <SelectableSvgPreview
                        ref={pptPreviewRef}
                        key={`${creatorActiveSlide.page}-${creatorActivePageIndex}-${slideVersionId}-${pptPageVersionEpoch}-${(creatorActiveSlide.svg || creatorActiveSlide.imageUrl || '').length}`}
                        svgMarkup={creatorActiveSlide.svg}
                        imageSrc={slideToPreviewUrl(creatorActiveSlide)}
                        selectedId={viewingHistoricalVersion ? null : workspaceElementId}
                        disabled={Boolean(selectedHistory) || viewingHistoricalVersion}
                        hideToolbar
                        onSelect={(selection) =>
                          onWorkspaceElementSelect(selection, creatorActivePageIndex)
                        }
                      />
                    </div>
                    <div className="creator-ppt-speaker-notes">
                      <div className="creator-ppt-speaker-notes-head">
                        <strong>Speaker Notes</strong>
                        <span>{viewingHistoricalVersion ? '历史版本只读' : '可直接编辑'}</span>
                      </div>
                      <textarea
                        value={creatorActiveSlide.speakerNotes || ''}
                        placeholder="在此编辑本页演讲备注…"
                        readOnly={viewingHistoricalVersion}
                        rows={4}
                        onChange={(event) =>
                          onSpeakerNotesChange(creatorActivePageIndex, event.target.value)
                        }
                      />
                    </div>
                    {timelineItems.length > 0 && (
                      <VersionFisheyeTimeline
                        items={timelineItems}
                        activeId={timelineActiveId}
                        onSelect={selectTimelineVersion}
                        ariaLabel="PPT 版本时间轴"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {!singleVersion && (
              <div className="ppt-design-foot-actions">
                <button type="button" className="btn soft" onClick={() => fillQuick('生成设计')}>
                  重新生成设计
                </button>
              </div>
            )}
            <div className="content-submit-actions">
              <button type="button" className="btn soft" onClick={() => onImportLocalPpt?.()}>
                导入本地版本
              </button>
              {!reviewerMode && (
                <button
                  type="button"
                  className="btn soft"
                  disabled={isGenerating}
                  onClick={openSwitchPptTemplate}
                >
                  切换PPT模板
                </button>
              )}
              <button type="button" className="btn soft" onClick={exportAllPptPages}>
                一键导出全部页面
              </button>
              {!reviewerMode && (
                <>
                  <button
                    type="button"
                    className="btn warn"
                    disabled={teamModificationInProgress}
                    onClick={() => !teamModificationInProgress && onOpenTeamReview('ppt')}
                  >
                    {teamModificationInProgress ? '意见收集中...' : '提交团队意见收集'}
                  </button>
                  <button
                    type="button"
                    className="btn green"
                    onClick={() => fillQuick('提交当前选中内容到Veeva Vault审批:')}
                  >
                    提交 Veeva Vault 审批
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }

      case 'submit': {
        const selectedVideo = videoVersions.find((v) => v.id === selectedVideoVersionId);
        return (
          <>
            <div className="detail-card">
              <h4>Veeva Vault 提交包</h4>
              <div className="small">系统已整理当前内容、引用素材、合规记录与团队修改记录。</div>
              {selectedVideo && (
                <div className="mat-meta" style={{ marginTop: 10 }}>
                  <span className="badge green">视频已纳入</span>
                  <span className="badge">{selectedVideo.name}</span>
                </div>
              )}
            </div>
            <div className="detail-card">
              <h4>Metadata</h4>
              <div className="small">
                品牌:未指定<br />
                渠道:小红书<br />
                受众:公众<br />
                用途:疾病教育<br />
                状态:Pending MLR Review
              </div>
              <div className="mat-meta">
                <span className="badge green">References included</span>
                <span className="badge green">Audit trail ready</span>
                <span className="badge warn">VV-2026-05821</span>
              </div>
            </div>
            <button className="btn green" onClick={() => toast('已提交至 Veeva Vault')}>确认提交</button>{' '}
            <button className="btn" onClick={() => toast('审计报告已生成')}>下载审计报告</button>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <aside className="wpanel right">
      <div className="right-head">
        <div className="right-head-title-row">
          <div className="workspace-panel-title">
            <span className="context-sidebar-head-icon" aria-hidden>
              <Presentation className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <h3 className="workspace-preview-title workspace-panel-title-text">内容预览</h3>
          </div>
        </div>
        <div className="tabs">
          <div className="tabs-list">
            {previewFile && !isGeneratedImagePreview ? (
              <span className="tab active">文件预览</span>
            ) : reviewerMode ? (
              visibleTabs.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`tab ${state.active === k ? 'active' : ''}`}
                  onClick={() => setState((prev) => ({ ...prev, active: k }))}
                >
                  {tabNames[k]}
                </button>
              ))
            ) : (
              <ContentFlowNav
                entry={flowEntry ?? null}
                progress={flowProgress}
                activeTab={state.active}
                onSelect={onSelectFlowStep}
              />
            )}
          </div>
        </div>
      </div>
      <div className="detail">
        {selectedHistory && (
          <div className="preview-history-banner">
            <div>
              <strong>正在预览大版本 {selectedHistory.label}</strong>
              <span>{selectedHistory.time}</span>
            </div>
            <div className="preview-history-actions">
              <button type="button" className="btn primary" onClick={restoreHistoryVersion}>
                回溯到该版本
              </button>
            </div>
          </div>
        )}
        <div className={selectedHistory ? 'preview-history-readonly' : undefined}>
        {previewFile && (!isGeneratedImagePreview || state.active === 'visual') ? (
          <div className="workspace-file-preview">
            {previewFile.contentType === 'image' && previewFile.contentUrl ? (
              <>
                <div className="workspace-surface-panel image-preview-stage">
                  {previewedImageItem && <DrawableImagePreview item={previewedImageItem} />}
                  {imageVersions.length > 1 && (
                    <VersionFisheyeTimeline
                      items={imageVersions.map((version) => ({
                        id: version.id,
                        label: version.label,
                        title: version.prompt,
                        kind: 'minor' as const,
                      }))}
                      activeId={imageVersionId}
                      onSelect={setImageVersionId}
                      ariaLabel="图片版本时间轴"
                    />
                  )}
                </div>
                <div className="image-preview-submit-actions">
                  {viewingHistoricalImage && (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        const task = imageModificationTasks.find((item) => item.id === imageVersionId);
                        if (!task?.imageSnapshot) {
                          toast('未找到可回溯的图片版本');
                          return;
                        }
                        onRestoreImageVersion(task);
                        setImageVersionId('current');
                      }}
                    >
                      回溯到该版本
                    </button>
                  )}
                  <div className="image-download-control">
                    <button
                      type="button"
                      className="btn soft"
                      aria-expanded={imageDownloadOpen}
                      aria-haspopup="menu"
                      onClick={() => setImageDownloadOpen((open) => !open)}
                    >
                      下载图片
                      <ChevronDown className={`h-3.5 w-3.5 transition ${imageDownloadOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {imageDownloadOpen && (
                      <div className="image-download-menu" role="menu" aria-label="选择下载格式">
                        <button
                          type="button"
                          role="menuitem"
                          className="image-download-option"
                          onClick={() => {
                            setImageDownloadOpen(false);
                            toast('已开始下载 JPG 格式');
                          }}
                        >
                          <span>JPG 格式</span>
                          <small>适合预览与分享</small>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="image-download-option"
                          onClick={() => {
                            setImageDownloadOpen(false);
                            toast('已开始下载 PSD 格式');
                          }}
                        >
                          <span>PSD 格式</span>
                          <small>适合分层继续修改</small>
                        </button>
                      </div>
                    )}
                  </div>
                  {!reviewerMode && !viewingHistoricalImage && (
                    <>
                      <button
                        type="button"
                        className="btn warn"
                        disabled={teamModificationInProgress}
                        onClick={() => !teamModificationInProgress && onOpenTeamReview('visual')}
                      >
                        {teamModificationInProgress ? '意见收集中...' : '提交团队意见收集'}
                      </button>
                      <button
                        type="button"
                        className="btn green"
                        onClick={() => fillQuick('提交当前图片和文案到Veeva Vault审批:')}
                      >
                        提交 Veeva 审批
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="workspace-file-preview-head">
                  <div className="min-w-0">
                    <strong className="block truncate text-[13px] text-foreground">{previewFile.fileName || previewFile.title}</strong>
                    <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{previewFile.meta}</span>
                  </div>
                  <button type="button" className="btn soft" onClick={onCloseOpenedFile}>
                    关闭预览
                  </button>
                </div>
                <MaterialContentPreview item={previewFile} />
              </>
            )}
          </div>
        ) : (
          <>
            {renderDetail()}
          </>
        )}
        </div>
      </div>
      <PptTemplatePickerModal
        open={pptSwitchTemplateOpen}
        templates={switchPptTemplates}
        selectedId={selectedPptTemplateId}
        title="切换 PPT 模板"
        description="选择一套模板后，将按当前大纲重新生成 PPT。"
        confirmLabel="切换并重新生成"
        onClose={() => setPptSwitchTemplateOpen(false)}
        onConfirm={applySwitchPptTemplate}
      />
    </aside>
  );
}
