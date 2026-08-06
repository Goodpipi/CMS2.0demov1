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
} from '@/types/content';
import {
  createMockTaskQueue,
  QUEUE_STATUS_LABEL,
  type TaskQueueItem,
} from '@/lib/taskQueue';
import { applyElementAiToSvg } from '@/lib/elementAiEdit';
import { SelectableSvgPreview, type SelectableSvgSelection } from '@/app/components/SelectableSvgPreview';
import {
  buildTeamReviewPayload,
  TEAM_CONTENT_LABELS,
  teamReviewSupported,
} from '@/app/components/teamReviewUtils';
import { buildVideoPosterDataUrl } from '@/app/components/videoUtils';
import { VisualEditor } from '@/app/components/VisualEditor';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import { PptOutlineEditor, PptOutlineGenerateFooter } from '@/app/components/PptOutlineEditor';
import {
  pptTemplateIdFromTitle,
  PPT_BUILTIN_TEMPLATES,
  type PptBuiltinTemplate,
} from '@/app/components/pptTemplates';
import { getImageTemplatesByIds } from '@/app/components/imageTemplates';
import { ImageTemplatePickerModal } from '@/app/components/ImageTemplatePickerModal';
import { MaterialPickerModal, type PickedMaterial } from '@/app/components/MaterialPickerModal';
import { MaterialDetailModal } from '@/app/components/MaterialDetailModal';
import { MaterialContentPreview } from '@/app/components/MaterialContentPreview';
import { ContextMaterialsPanel } from '@/app/components/ContextMaterialsPanel';
import { CreationMethodModal } from '@/app/components/CreationMethodModal';
import type { LibraryItem } from '@/types/library';
import { materialAttachmentPill } from '@/lib/libraryUtils';
import { assignCopyTopicTitles, ensureCopyCount, groupCopiesByTopic } from '@/lib/copyUtils';
import { groupImagesByCopy } from '@/lib/imageUtils';
import { buildPreviewFieldsFromTitle } from '@/lib/materialContent';
import {
  normalizeOutline,
  parseAudience,
  parseScenario,
  slideToPreviewUrl,
} from '@/app/components/pptUtils';
import { RoleSwitcher } from '@/app/components/RoleSwitcher';
import { ReviewerHome } from '@/app/components/ReviewerHome';
import { CopyRevisionDisplay } from '@/app/components/CopyRevisionDisplay';
import { OpsImageReviewPanel } from '@/app/components/OpsImageReviewPanel';
import { alignImageReviewArrays } from '@/lib/imageReviewUtils';
import { parseFigmaCaptureId } from '@/lib/figmaCapture';
import { ReviewerVisualPanel } from '@/app/components/ReviewerVisualPanel';
import {
  RichTextEditor,
  buildRichTextHtmlDocument,
} from '@/app/components/RichTextEditor';
import { PptCommentThread } from '@/app/components/PptCommentThread';
import { loadUserRole, saveUserRole, isReviewerRole } from '@/lib/userRole';
import {
  loadReviewTasks,
  upsertReviewTask,
  getReviewTask,
  tasksForRole,
  updateTaskStatus,
  seedReviewTasksIfEmpty,
  reviewerTabsForContentType,
  mergeSessionCopyRevisions,
  sessionCopyRevisionBase,
  propagateCopyRevisionsToSession,
  findReviewTask,
  addPptComment,
  addPptCommentReply,
  reopenReviewTask,
  createReviewTask,
} from '@/lib/reviewTasks';
import { createCopyRevision, downloadDataUrl, latestCopyText, saveCopyRevisionMerged, normalizeCopyRevisions } from '@/lib/copyRevisionUtils';
import {
  HOT_INSIGHT_CATEGORY,
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
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  FileText,
  Filter,
  FolderOpen,
  History,
  Image as ImageIcon,
  Library as LibraryIcon,
  Eraser,
  Paintbrush,
  ListTodo,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Star,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { LibraryMaterialCard } from '@/app/components/LibraryMaterialCard';
import { AssetLibraryPage } from '@/app/components/AssetLibraryPage';
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
  deriveSessionStatus,
  deriveSessionSubtitle,
  fallbackSessionTitle,
  formatSessionTime,
  getSession,
  loadAllSessions,
  saveSession,
  seedSessionsIfEmpty,
  sessionStatusBadgeClass,
  sessionStatusLabel,
} from '@/lib/chatSessions';
import type {
  ChatMessage as Message,
  ChatSession,
  SessionAppState as AppState,
  TabKey,
} from '@/types/session';

const cats = ['热点洞察', '合规手册', '参考知识', '品牌briefing', '渠道特色'];
const HOME_TASK_PAGE_SIZE = 6;

const initialLibrary: LibraryItem[] = [
  { id: 1, cat: '热点洞察', title: '小红书肾脏健康热点观察 2026-05', meta: 'CMS洞察 · 热点词/互动趋势', cms: true, def: true, addedAt: Date.now() - 9 * 86400000, validUntil: '2026-11-30' },
  { id: 2, cat: '合规手册', title: '公众渠道疾病教育合规手册', meta: 'Word · 全局资料 · 最新版', cms: false, def: true, addedAt: Date.now() - 8 * 86400000 },
  { id: 3, cat: '参考知识', title: '肾脏健康疾病教育参考知识包', meta: 'PDF/Excel · 12条知识点', cms: false, def: true, addedAt: Date.now() - 7 * 86400000 },
  { id: 4, cat: '品牌briefing', title: '2026 品牌沟通 Briefing', meta: 'PDF · 2.4MB · 本地上传', cms: false, def: true, addedAt: Date.now() - 6 * 86400000 },
  { id: 5, cat: '渠道特色', title: '小红书渠道表达与视觉偏好', meta: '上传资料 · 风格案例 15 个', cms: false, def: true, addedAt: Date.now() - 5 * 86400000 },
  { id: 6, cat: '参考知识', title: 'Approved Claims Library', meta: 'CMS · Approved · 可追溯', cms: true, def: true, addedAt: Date.now() - 4 * 86400000, validUntil: '2027-04-30' },
  { id: 7, cat: '渠道特色', title: 'Bayer Blue-Green Visual Kit 2026', meta: 'CMS · Brand Kit · Approved', cms: true, def: true, addedAt: Date.now() - 3 * 86400000, validUntil: '2026-12-31' },
  { id: 8, cat: '参考知识', title: '患者教育手册:慢性肾病风险认知', meta: 'CMS · Approved · 2026-04-12', cms: true, def: false, addedAt: Date.now() - 2 * 86400000, validUntil: '2027-03-31' },
  { id: 9, cat: '热点洞察', title: '公众平台高互动标题样本', meta: '本地上传 · 20条样本', cms: false, def: false, addedAt: Date.now() - 86400000 },
];

const tabNames = {
  insight: '话题洞察',
  'topic-recommendation': '话题推荐',
  copy: '文案生成',
  'rich-text': '图文',
  team: '团队修改',
  visual: '图片生成',
  'video-script': '视频脚本',
  'video-render': '视频生成',
  'ppt-outline': 'PPT大纲',
  'ppt-design': 'PPT生成',
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
  copy: false,
  richText: false,
  team: false,
  visual: false,
  videoScript: false,
  videoRender: false,
  pptOutline: false,
  pptDesign: false,
  submit: false,
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeCat, setActiveCat] = useState(cats[0]);
  const [onlyDefault, setOnlyDefault] = useState(false);
  const [library, setLibrary] = useState(initialLibrary);
  const [libSearch, setLibSearch] = useState('');
  const [libSelectedIds, setLibSelectedIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [homeAgentIntent, setHomeAgentIntent] = useState<HomeEntryIntent | null>(null);
  const [selectedModel, setSelectedModel] = useState('GPT-5.5');
  const [composerMode, setComposerMode] = useState<'agent' | 'plan'>('agent');
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [insightSummary, setInsightSummary] = useState('');
  const [hotInsightReport, setHotInsightReport] = useState<HotInsightReport | null>(null);
  const [recommendedTopics, setRecommendedTopics] = useState<TopicRecommendationItem[]>([]);
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
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>(() => loadReviewTasks());
  const [activeReviewTaskId, setActiveReviewTaskId] = useState<string | null>(null);
  const [reviewPptPageIndex, setReviewPptPageIndex] = useState(0);
  const [reviewPptNotes, setReviewPptNotes] = useState<Record<number, PptReviewComment[]>>({});
  const [reviewPptNoteDraft, setReviewPptNoteDraft] = useState('');
  const [reviewerReplyDrafts, setReviewerReplyDrafts] = useState<Record<string, string>>({});
  const [creatorRightTab, setCreatorRightTab] = useState<'ai' | 'comments'>('ai');
  const [taskQueue, setTaskQueue] = useState<TaskQueueItem[]>(() => createMockTaskQueue());
  const [taskQueueOpen, setTaskQueueOpen] = useState(true);
  const [workspaceElementSel, setWorkspaceElementSel] = useState<{
    slideIndex: number;
    elementId: string;
    label: string;
    isText: boolean;
    svgMarkup: string;
  } | null>(null);
  const [workspaceElementBusy, setWorkspaceElementBusy] = useState(false);
  const [creatorReplyDrafts, setCreatorReplyDrafts] = useState<Record<string, string>>({});
  const [creatorPptPageIndex, setCreatorPptPageIndex] = useState(0);
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
  const [homeTaskPage, setHomeTaskPage] = useState(1);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
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

  const feedRef = useRef<HTMLDivElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
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
      richTextContent,
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses,
      selectedImages,
      insightSummary,
      hotInsightReport,
      recommendedTopics,
      selectedTopics,
      selectedCopies,
      copyRevisions,
      copyRevisionBase,
      entryContext,
      pptWizard,
      videoWizard,
      visualWizard,
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
      richTextContent,
      generatedImages,
      generatedImageMeta,
      imageReviewOrigins,
      imageReviewStatuses,
      selectedImages,
      insightSummary,
      hotInsightReport,
      recommendedTopics,
      selectedTopics,
      selectedCopies,
      copyRevisions,
      copyRevisionBase,
      entryContext,
      pptWizard,
      videoWizard,
      visualWizard,
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
    setComposerMode('agent');
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
      richText: legacy.richText ?? false,
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
    setSelectedPptTemplateId(w.selectedPptTemplateId ?? null);
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
    setHotInsightReport(w.hotInsightReport ?? null);
    setRecommendedTopics(w.recommendedTopics ?? []);
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
            ? '请先在「视频生成」中生成视频后再提交团队审阅'
            : 'PPT 大纲阶段不支持团队修改，请生成 PPT 后在「PPT生成」中提交'
        );
        return;
      }
      if (type === 'visual' && generatedImages.length > 0 && !selectedImages.some(Boolean)) {
        toast('请至少勾选一张图片后再提交团队审阅');
        return;
      }
      const payload = buildTeamPayload(type);
      if (!payload) {
        if (type === 'visual' && generatedImages.length > 0) {
          toast('请至少勾选一张图片后再提交团队审阅');
        } else {
          toast(`请先生成${TEAM_CONTENT_LABELS[type]}后再提交团队审阅`);
        }
        return;
      }
      setTeamReviewTarget(type);
      setTeamAssigneeRoles([]);
      setShowTeamModal(true);
    },
    [buildTeamPayload, generatedImages, selectedImages]
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
        .filter((m) => m.referenced ?? m.def)
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
    if (!task || task.contentType !== 'ppt') return;
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

  const toggleDefault = (id: number) => {
    setLibrary(prev => prev.map(item =>
      item.id === id ? { ...item, def: !item.def } : item
    ));
    const item = library.find(x => x.id === id);
    if (item) {
      toast(item.def ? '已取消默认素材' : '已设为默认素材');
    }
  };

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

  const newTask = (prompt = '', intent: HomeEntryIntent = 'general') =>
    startFromHome({ intent }, prompt);

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
    if (composerMode === 'plan') {
      return '描述目标，AI 先给出实施计划（不会直接改产出物）…';
    }
    if (workspaceElementSel) {
      return workspaceElementSel.isText
        ? `修改「${workspaceElementSel.label}」：例如改成「核心信息」、字号加大、换成拜耳蓝…`
        : `修改「${workspaceElementSel.label}」：例如换成绿色、缩小一点、半透明…`;
    }
    const ctx = entryContext;
    if (!ctx) return '直接说你想做什么：生成图片、PPT、视频、文案或话题洞察…';
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

  const toggleComposerMode = useCallback(() => {
    setComposerMode((prev) => (prev === 'agent' ? 'plan' : 'agent'));
  }, []);

  const buildPlanReplyHtml = useCallback((goal: string) => {
    const shortGoal = goal.length > 48 ? `${goal.slice(0, 48)}…` : goal;
    const focus = workspaceElementSel
      ? `围绕已选中元素「${workspaceElementSel.label}」`
      : state.active
        ? `围绕当前预览「${tabNames[state.active] || state.active}」`
        : '结合当前任务上下文';
    return `
      <div class="proposed-plan">
        <div class="proposed-plan-eyebrow">Proposed Plan</div>
        <strong class="proposed-plan-title">针对「${shortGoal}」的实施计划</strong>
        <p class="proposed-plan-desc">${focus}，先规划再执行；确认后可切换到 Agent 模式落地。</p>
        <ol class="proposed-plan-steps">
          <li>澄清目标与约束，确认受众、合规口径与交付物范围</li>
          <li>盘点现有素材 / 大纲 / 页面，标出需改动的关键元素</li>
          <li>给出分步修改方案（文案 → 视觉 → 结构），每步可单独验收</li>
          <li>按步骤执行并在预览区核对，必要时回滚到上一版本</li>
        </ol>
      </div>
    `;
  }, [workspaceElementSel, state.active]);

  const runPlanModeTurn = useCallback(
    (goal: string) => {
      addMsg('user', goal, selectedModel);
      setInputValue('');
      setSelectedPrompt('');
      setTimeout(() => {
        addMsg('ai', buildPlanReplyHtml(goal), selectedModel, [
          '按此计划执行',
          '继续完善计划',
          '切换到 Agent 模式',
        ]);
      }, 420);
    },
    [selectedModel, buildPlanReplyHtml]
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
    setCreatorPptPageIndex(0);
    setCreatorRightTab('ai');
    setComposerMode('agent');
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
    setSelectedTopics([]);
    setSelectedCopies([]);
    setCopyRevisions([]);
    setCopyRevisionBase('');
    setWorkspacePreviewMaterial(null);
    pendingTopicInsightNoteRef.current = '';
    topicInsightUploadPendingRef.current = false;
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

  const openMockImageInPreview = (imageUrl: string, title: string) => {
    const now = Date.now();
    setWorkspacePreviewMaterial({
      id: now,
      cat: '生成图片',
      title,
      meta: '本地 Mock 数据 · 可在部署环境直接预览',
      cms: false,
      def: false,
      addedAt: now,
      fileName: `${title}.svg`,
      contentType: 'image',
      contentUrl: imageUrl,
      mimeType: 'image/svg+xml',
    });
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.includes('visual') ? prev.tabs : [...prev.tabs, 'visual'],
      active: 'visual',
      visual: true,
    }));
  };

  const runWorkspaceMockCommand = (text: string): boolean => {
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
        `PPT 大纲已生成，共 ${WORKSPACE_MOCK_PPT_OUTLINE.chapters.length} 章。已在中间区域展示，可直接编辑章节与页面要点。`,
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
        '图文内容已生成，并已在中间区域打开富文本编辑器。你可以直接修改标题、段落、列表和强调样式。',
        '本地 Mock'
      );
      return true;
    }

    if (/(生成|创建|制作).*(p?图片|配图|海报)/.test(command)) {
      setGeneratedImages([WORKSPACE_MOCK_IMAGE.dataUrl]);
      setGeneratedImageMeta([
        { copyTitle: WORKSPACE_MOCK_IMAGE.title, copyIndex: -1, imageIndex: 0 },
      ]);
      setImageReviewOrigins([WORKSPACE_MOCK_IMAGE.dataUrl]);
      setImageReviewStatuses([null]);
      setSelectedImages([true]);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          html: '图片已生成。你可以先在对话中查看，点击下方按钮后在中间区域进行预览和修改。',
          model: '本地 Mock',
          imageUrl: WORKSPACE_MOCK_IMAGE.dataUrl,
          imageTitle: WORKSPACE_MOCK_IMAGE.title,
          imageActionLabel: '图片修改',
        },
      ]);
      return true;
    }

    return false;
  };

  const send = () => {
    const text = inputValue.trim();
    if (!text || workspaceElementBusy) return;
    if (composerMode === 'plan') {
      runPlanModeTurn(text);
      return;
    }
    if (workspaceElementSel) {
      void applyWorkspaceElementAi(text);
      return;
    }
    addMsg('user', text, selectedModel);
    setInputValue('');
    setSelectedPrompt('');
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
      toast(`请先生成${TEAM_CONTENT_LABELS[type]}后再提交团队审阅`);
      return;
    }
    if (!opts?.skipUserMsg) {
      addMsg('user', `提交${TEAM_CONTENT_LABELS[type]}团队审阅`, selectedModel);
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
        newImages.push(result.dataUrl);
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
            ? `已按「${templates[0].name}」模板生成配图「${titles[0] || copyTargets[0]?.copy.title}」。请在右侧查看，可勾选后提交团队审阅。`
            : `已生成 AI 海报「${titles[0] || '配图'}」。右侧可勾选图片提交团队审阅，或继续生成视频、PPT。`;

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
      setPptVersions(versions);
      const first = versions[0];
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
        `已为「${outline.title}」生成大纲，共 ${outline.chapters.length} 章。请在右侧「PPT大纲」中编辑大纲；可选模板（不选则生成 3 套方案），确认后点击生成。`,
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

  const confirmPptDesigns = (mode?: 'template' | 'no-template') => {
    if (!pptOutline) return;
    const selectedTemplate = pptTemplateOptions.find(
      (template) => template.id === selectedPptTemplateId
    );
    const effectiveMode =
      mode ?? (selectedTemplate ? 'template' : 'no-template');
    if (effectiveMode === 'template' && !selectedTemplate) {
      toast('请先在「PPT大纲」中选择一套模板');
      setState((prev) => ({ ...prev, active: 'ppt-outline' }));
      return;
    }
    if (effectiveMode === 'no-template') {
      setSelectedPptTemplateId(null);
    }
    const tpl = effectiveMode === 'template' ? selectedTemplate : null;
    const loadingLabel = tpl
      ? `正在按「${tpl.name}」模板生成 PPT`
      : '正在不使用模板直接生成 PPT';
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
      const versions = tpl ? designs.versions : designs.versions.slice(0, 1);
      setPptVersions(versions);
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
          `未使用任何模板，已直接生成 PPT，共 ${first?.slides?.length ?? 0} 页。请在右侧「PPT生成」中预览与编辑。`,
          'DeepSeek-V3.1｜PPT 设计',
          ['查看大纲', '提交当前版本到Veeva Vault']
        );
      }
    },
      () => confirmPptDesigns(effectiveMode)
    );
  };

  const selectPptVersion = (version: PptDesignVersion) => {
    setSelectedPptVersionId(version.id);
    setPptResult({ title: pptOutline?.title, slides: version.slides });
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
      setComposerMode('agent');
      toast('已切换到 Agent 模式');
      return;
    }
    if (text === '继续完善计划') {
      setComposerMode('plan');
      setInputValue('请补充验收标准、风险点与优先级：');
      toast('仍在计划模式，可继续完善');
      return;
    }
    if (text === '按此计划执行') {
      setComposerMode('agent');
      addMsg('user', text, selectedModel);
      addMsg(
        'ai',
        '已退出计划模式，开始按计划执行。你可以指定从哪一步开始，或直接下达生成指令。',
        selectedModel,
        ['生成PPT', '生成图片', '生成图文']
      );
      return;
    }
    if (runDemoScenarioScript(text, { addUserMessage: true })) return;
    addMsg('user', text, selectedModel);

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

  const addTab = (key: TabKey) => {
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
        `已在右侧展示「PPT大纲」，共 ${pptOutline.chapters.length} 章。可按需编辑结构；修改后可在「PPT生成」中重新生成设计稿。`,
        'DeepSeek-V3.1',
        ['生成设计', '返回 PPT 生成']
      );
    }
  };

  const openDetail = (title: string, body: string) => {
    setModalContent({ title, body });
    setShowModal(true);
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

  const replyToPptComment = (taskId: string, commentId: string) => {
    const content = creatorReplyDrafts[commentId]?.trim();
    if (!content) return;
    const reply = addPptCommentReply(taskId, commentId, {
      authorRole: 'ops',
      authorName: ROLE_PROFILES.ops.name,
      content,
    });
    if (!reply) {
      toast('批注所属审阅任务不存在');
      return;
    }
    setCreatorReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
    refreshReviewTasks();
    toast('回复已同步给审阅者');
  };

  const replyToCreatorAsReviewer = (commentId: string) => {
    const content = reviewerReplyDrafts[commentId]?.trim();
    if (!content || !activeReviewTaskId) return;
    const reply = addPptCommentReply(activeReviewTaskId, commentId, {
      authorRole: userRole,
      authorName: ROLE_PROFILES[userRole].name,
      content,
    });
    if (!reply) return;
    setReviewerReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
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
          completedReviewCount:
            task.contentType === 'ppt'
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
    .filter(x => !libSearch || `${x.title} ${x.meta} ${x.cat}`.toLowerCase().includes(libSearch.toLowerCase()))
    .filter(x => !onlyDefault || x.def);
  const referencedTemplateItems = useMemo(
    () =>
      library.filter(
        (item) => (item.referenced ?? item.def) && ['参考模板', '模板'].includes(item.cat)
      ),
    [library]
  );
  const pptTemplateOptions = useMemo<PptBuiltinTemplate[]>(() => {
    if (referencedTemplateItems.length > 0) {
      return referencedTemplateItems.flatMap((item) => {
        const context = `${item.title} ${item.meta}`.toLowerCase();
        const base =
          /患者|宣教|关怀/.test(context)
            ? PPT_BUILTIN_TEMPLATES.find((template) => template.id === 'patient-edu')
            : /培训|内部|品牌/.test(context)
              ? PPT_BUILTIN_TEMPLATES.find((template) => template.id === 'internal-training')
              : /科普|疾病|社交|海报|图卡/.test(context)
                ? PPT_BUILTIN_TEMPLATES.find((template) => template.id === 'disease-science')
                : PPT_BUILTIN_TEMPLATES.find((template) => template.id === 'hcp-comm');
        if (!base) return [];
        return [{
          ...base,
          id: `reference-template-${item.id}`,
          generationTemplateId: base.id,
          name: item.title,
          description: `来自左侧引用素材 · ${item.meta}`,
        }];
      });
    }

    const context = `${pptOutline?.title || ''} ${pptOutline?.audience || ''} ${
      pptOutline?.scenario || ''
    } ${inputValue}`.toLowerCase();
    const priorityId =
      /患者|公众|宣教|家属/.test(context)
        ? 'patient-edu'
        : /培训|内训|内部/.test(context)
          ? 'internal-training'
          : /科普|疾病教育/.test(context)
            ? 'disease-science'
            : 'hcp-comm';
    return [...PPT_BUILTIN_TEMPLATES].sort((a, b) =>
      a.id === priorityId ? -1 : b.id === priorityId ? 1 : 0
    );
  }, [inputValue, pptOutline, referencedTemplateItems]);
  const pptTemplateSource: 'referenced' | 'recommended' =
    referencedTemplateItems.length > 0 ? 'referenced' : 'recommended';

  useEffect(() => {
    if (
      selectedPptTemplateId &&
      !pptTemplateOptions.some((template) => template.id === selectedPptTemplateId)
    ) {
      setSelectedPptTemplateId(null);
    }
  }, [pptTemplateOptions, selectedPptTemplateId]);

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

  const defaultCount = library.filter(x => x.def).length;
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
  const creatorPptReviewTasks = reviewTasks.filter(
    (task) => task.sessionId === currentSessionId && task.contentType === 'ppt'
  );
  const creatorPptComments = creatorPptReviewTasks
    .flatMap((task) =>
      (task.pptComments || []).map((comment) => ({
        taskId: task.id,
        reviewerName: task.assigneeName,
        reviewerDept: ROLE_PROFILES[task.assigneeRole].dept,
        comment,
      }))
    )
    .sort((a, b) => a.comment.createdAt - b.comment.createdAt);
  /** 仅当当前会话存在审阅批注时展示「AI 对话 / 查看批注」切换 */
  const showCreatorCommentTabs = creatorPptComments.length > 0;
  const creatorCurrentPageComments = creatorPptComments.filter(
    ({ comment }) => comment.pageIndex === creatorPptPageIndex
  );

  useEffect(() => {
    if (!showCreatorCommentTabs && creatorRightTab === 'comments') {
      setCreatorRightTab('ai');
    }
  }, [showCreatorCommentTabs, creatorRightTab]);
  const queuedItems = taskQueue.filter((item) => item.status === 'queued');
  const visibleQueueItems = taskQueue.filter((item) => item.status !== 'done');

  const removeQueueItem = useCallback((id: string) => {
    setTaskQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const moveQueueItem = useCallback((id: string, direction: -1 | 1) => {
    setTaskQueue((prev) => {
      const queued = prev.filter((item) => item.status === 'queued');
      const index = queued.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= queued.length) return prev;
      const reordered = [...queued];
      const [picked] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, picked);
      let qi = 0;
      return prev.map((item) => {
        if (item.status !== 'queued') return item;
        return reordered[qi++];
      });
    });
  }, []);

  const promoteQueueItem = useCallback((id: string) => {
    setTaskQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target || target.status !== 'queued') return prev;
      return prev.map((item) => {
        if (item.id === id) return { ...item, status: 'running' as const };
        if (item.status === 'running') return { ...item, status: 'queued' as const };
        return item;
      });
    });
    toast('已提升为当前执行任务');
  }, [toast]);

  const handleCreatorPptPageChange = useCallback((index: number) => {
    setCreatorPptPageIndex(index);
    setWorkspaceElementSel(null);
  }, []);

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
    async (promptText: string) => {
      if (!workspaceElementSel || !promptText.trim() || !pptResult) return;
      const prompt = promptText.trim();
      const target = workspaceElementSel;
      const markup = target.svgMarkup.trim();
      if (!markup) {
        toast('当前页面无法解析为可编辑 SVG');
        return;
      }
      addMsg('user', prompt, selectedModel);
      setInputValue('');
      setSelectedPrompt('');
      setWorkspaceElementBusy(true);
      try {
        await new Promise((r) => setTimeout(r, 480));
        const result = applyElementAiToSvg(markup, target.elementId, prompt);
        if (!result) {
          addMsg('ai', '未能修改选中元素，请重新点选后再试。', selectedModel);
          toast('未能修改选中元素，请重新选择后再试');
          return;
        }
        const slides = pptResult.slides.map((item, index) =>
          index === target.slideIndex
            ? {
                ...item,
                svg: result.svg,
                imageUrl: undefined,
              }
            : item
        );
        setPptResult({ ...pptResult, slides });
        if (selectedPptVersionId) {
          setPptVersions((prev) =>
            prev.map((version) =>
              version.id === selectedPptVersionId ? { ...version, slides } : version
            )
          );
        }
        setWorkspaceElementSel((prev) =>
          prev
            ? {
                ...prev,
                label: result.elementLabel,
                svgMarkup: result.svg,
              }
            : prev
        );
        addMsg(
          'ai',
          `已按你的指令修改「${result.elementLabel}」。<br>${result.summary}`,
          selectedModel
        );
        toast(result.summary);
      } finally {
        setWorkspaceElementBusy(false);
      }
    },
    [workspaceElementSel, pptResult, selectedPptVersionId, selectedModel, toast]
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
  const homeTaskPageCount = Math.max(
    1,
    Math.ceil(homeTaskSessions.length / HOME_TASK_PAGE_SIZE)
  );
  const visibleHomeTaskPage = Math.min(homeTaskPage, homeTaskPageCount);
  const pagedHomeTaskSessions = homeTaskSessions.slice(
    (visibleHomeTaskPage - 1) * HOME_TASK_PAGE_SIZE,
    visibleHomeTaskPage * HOME_TASK_PAGE_SIZE
  );

  useEffect(() => {
    setHomeTaskPage(1);
  }, [activeProjectId, sessionSearch]);

  useEffect(() => {
    if (homeTaskPage > homeTaskPageCount) setHomeTaskPage(homeTaskPageCount);
  }, [homeTaskPage, homeTaskPageCount]);

  const libraryCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cats) {
      counts[c] = library.filter((x) => x.cat === c).length;
    }
    return counts;
  }, [library]);

  const librarySelectedByCategory = useMemo(() => {
    const selected = new Set(libSelectedIds);
    const counts: Record<string, number> = {};
    for (const c of cats) {
      counts[c] = library.filter((x) => x.cat === c && selected.has(x.id)).length;
    }
    return counts;
  }, [library, libSelectedIds]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientOrbs />
      <header className="relative z-10 flex h-[72px] items-center justify-between px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-4 animate-fade-up">
          {currentScreen !== 'home' && (
            <button
              type="button"
              className="home-back-btn shrink-0"
              onClick={goToHome}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              返回首页
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs animate-fade-up [animation-delay:120ms]">
          <RoleSwitcher role={userRole} onChange={handleRoleChange} />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">当前品牌</span>
            <select className="rounded-lg border border-border/70 bg-glass px-3 py-1.5 font-medium text-foreground shadow-soft transition hover:border-primary/40">
              <option value="">请选择品牌</option>
              <option>拜新同</option>
              <option>拜唐苹</option>
              <option>优迈</option>
              <option>爱格希</option>
            </select>
          </div>
        </div>
      </header>

      {/* Home Screen */}
      <section className={`screen home-screen ${currentScreen === 'home' ? 'active' : ''}`}>
        <div className={`relative z-10 min-h-0 px-6 pb-6 lg:px-10 ${!isReviewerRole(userRole) ? 'h-[calc(100vh-72px)]' : 'min-h-[calc(100vh-72px)]'}`}>
            <main className="relative min-h-0 min-w-0 flex-1">
              <div className="absolute right-0 top-0 z-20 flex items-center gap-2 animate-fade-up">
                <button
                  type="button"
                  className="glass-button flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary"
                  onClick={() => setCurrentScreen('library')}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#4A9EE0] to-[#3B7FBF] shadow-[0_3px_8px_-2px_rgba(59,127,191,0.5)] ring-1 ring-white/40">
                    <Database className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  知识库
                </button>
                <button
                  type="button"
                  className="glass-button flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary"
                  onClick={() => setCurrentScreen('assets')}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-[#D8466A] to-[#7762B8] shadow-[0_3px_8px_-2px_rgba(119,98,184,0.55)] ring-1 ring-white/40">
                    <LibraryIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </span>
                  素材库
                </button>
              </div>

              {isReviewerRole(userRole) ? (
                <div className="px-2 pt-2">
                  <ReviewerHome
                    tasks={tasksForRole(userRole)}
                    deptLabel={ROLE_PROFILES[userRole].dept}
                    onOpenTask={openReviewTask}
                  />
                </div>
              ) : (
                <div className="home-task-dashboard relative mx-auto h-full max-w-6xl overflow-y-auto px-2 pb-10 pt-14 lg:pt-16">
                  {activeProjectName && (
                    <div className="relative z-10 mb-5 text-center animate-fade-up">
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

                  <h2 className="relative z-10 text-center text-[40px] font-bold leading-[1.1] tracking-tight md:text-[52px] animate-fade-up [animation-delay:80ms]">
                    <span className="text-gradient animate-gradient-pan">今天你有什么灵感？</span>
                  </h2>
                  <p className="relative z-10 mx-auto mt-4 max-w-lg text-center text-[13.5px] leading-relaxed text-muted-foreground animate-fade-up [animation-delay:160ms]">
                    新建任务后，可在工作台中调用知识与素材，完成内容创作、预览与团队审阅。
                  </p>

                  <div className="relative z-10 mt-7 flex justify-center animate-fade-up [animation-delay:240ms]">
                    <button
                      type="button"
                      className="home-new-task-button btn-hero-3d group inline-flex items-center gap-2"
                      onClick={createNewContentFromHome}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.6} />
                      新建任务
                    </button>
                  </div>

                  <section className="home-task-section relative z-10 mt-10 animate-fade-up [animation-delay:320ms]">
                    <div className="home-task-section-head">
                      <div>
                        <h3>历史任务</h3>
                        <p>{activeProjectName ? `项目「${activeProjectName}」中的任务` : '继续处理最近的内容创作任务'}</p>
                      </div>
                      <div className="home-task-search">
                        <Search className="h-3.5 w-3.5" />
                        <input
                          value={sessionSearch}
                          onChange={(event) => setSessionSearch(event.target.value)}
                          placeholder="搜索历史任务"
                        />
                      </div>
                    </div>

                    {homeTaskSessions.length > 0 ? (
                      <>
                      <div className="home-task-grid">
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
                                <span>{deriveSessionSubtitle(session)}</span>
                                <time>{formatSessionTime(session.updatedAt)}</time>
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
                      {homeTaskPageCount > 1 && (
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
                          {Array.from({ length: homeTaskPageCount }, (_, index) => index + 1).map(
                            (page) => (
                              <button
                                key={page}
                                type="button"
                                className={`home-task-page-number ${
                                  visibleHomeTaskPage === page ? 'active' : ''
                                }`}
                                onClick={() => setHomeTaskPage(page)}
                                aria-current={visibleHomeTaskPage === page ? 'page' : undefined}
                              >
                                {page}
                              </button>
                            )
                          )}
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
                        <Presentation className="h-6 w-6" />
                        <strong>暂无历史任务</strong>
                        <span>点击“新建任务”开始第一项内容创作</span>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </main>
        </div>
      </section>

      {/* Knowledge Library Screen */}
      <section className={`screen ${currentScreen === 'library' ? 'active' : ''}`}>
        <div className="page library-page relative z-10 px-6 pb-6 lg:px-8">
          <div className="relative mb-5 animate-fade-up">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
              onClick={goToHome}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              返回首页
            </button>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-[28px] font-semibold tracking-tight text-foreground">
                  <span className="sparkle-surface relative grid h-9 w-9 place-items-center rounded-2xl bg-hero-gradient shadow-glow animate-gradient-pan">
                    <LibraryIcon className="relative z-10 h-4 w-4 text-white" strokeWidth={2.4} />
                  </span>
                  <span>知识<span className="text-gradient">库</span></span>
                </h2>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                  管理品牌知识、合规手册与 CMS 内容，支持多选后一键带入新对话
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-hero-gradient opacity-50 blur-xl" />
                <div className="sparkle-surface relative flex items-center gap-3 rounded-2xl bg-hero-gradient px-5 py-3 shadow-glow ring-1 ring-white/40 animate-gradient-pan">
                  <div className="text-right">
                    <div className="text-[28px] font-bold leading-none text-white">{library.length}</div>
                    <div className="mt-1 text-[10.5px] font-medium tracking-wide text-white/90">知识总数</div>
                  </div>
                  <Database className="h-5 w-5 text-white/80" strokeWidth={2.2} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-5">
            <aside className="hidden">
              <div className="bg-glass hud-frame relative flex h-[calc(100vh-12rem)] flex-col rounded-3xl border border-border/60 p-3 shadow-soft">
                <div className="flex gap-2 px-1 pb-3">
                  <button
                    type="button"
                    className="group flex flex-1 items-center justify-center gap-1.5 rounded-xl btn-hero-3d py-2 text-[12px] font-semibold"
                    onClick={() => openMaterialPicker('workspace', activeCat)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    上传知识
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl glass-button py-2 text-[12px] font-medium text-foreground"
                    onClick={() => openMaterialPicker('workspace', activeCat, 'cms')}
                  >
                    <Search className="h-3.5 w-3.5" />
                    搜索 CMS
                  </button>
                </div>

                <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Filter className="h-3 w-3" />
                  分类
                </div>

                <nav className="space-y-1 px-1" aria-label="知识分类">
                  {cats.map((c) => {
                    const isActive = c === activeCat;
                    return (
                      <button
                        key={c}
                        type="button"
                        className={cn(
                          'group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition',
                          isActive
                            ? 'bg-gradient-to-r from-[#4A9EE0]/15 to-[#D8466A]/10 shadow-[inset_0_0_0_1px_rgba(74,158,224,0.3)]'
                            : 'hover:bg-background/70'
                        )}
                        onClick={() => setActiveCat(c)}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#4A9EE0] to-[#3B7FBF] shadow-[0_3px_8px_-2px_rgba(59,127,191,0.4)] ring-1 ring-white/40">
                          <FileText className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                        </span>
                        <span className={cn('flex-1 text-[12.5px]', isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground/85')}>
                          {c}
                        </span>
                        <span className="flex items-center gap-1">
                          {librarySelectedByCategory[c] > 0 && (
                            <span className="rounded-full bg-[#D8466A]/15 px-1.5 text-[10px] font-semibold text-[#a02d52]">
                              {librarySelectedByCategory[c]}
                            </span>
                          )}
                          <span
                            className={cn(
                              'grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[10.5px] font-bold',
                              isActive ? 'bg-gradient-to-br from-[#4A9EE0] to-[#D8466A] text-white shadow-[0_2px_6px_-1px_rgba(59,127,191,0.5)]' : 'bg-secondary text-muted-foreground'
                            )}
                          >
                            {libraryCategoryCounts[c]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-4 flex-1 overflow-y-auto rounded-2xl glass-card p-2.5">
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-foreground">
                      <Star className="h-3 w-3 text-[#FFB547]" fill="#FFB547" />
                      默认知识
                    </div>
                    <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-[#4A9EE0] to-[#D8466A] px-1 text-[10px] font-bold text-white">
                      {defaultCount}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cats.map((c) => {
                      const items = library.filter((x) => x.cat === c && x.def);
                      if (!items.length) return null;
                      return (
                        <div key={c}>
                          <div className="px-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            {c}
                          </div>
                          {items.map((i) => (
                            <button
                              key={i.id}
                              type="button"
                              className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] text-foreground/85 transition hover:bg-background/80"
                              onClick={() => {
                                setActiveCat(c);
                                setOnlyDefault(false);
                                setPreviewMaterial(i);
                              }}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-[#4A9EE0] to-[#D8466A]" />
                              <span className="truncate">{i.title}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {defaultCount === 0 && (
                      <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">暂无默认知识</div>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <main className="relative flex-1">
              <div className="bg-glass hud-frame scanline relative flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-3xl border border-border/60 shadow-soft">
                <SparkleField />

                <div className="relative z-10 flex items-center gap-2.5 border-b border-border/50 p-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full rounded-xl glass-input py-2.5 pl-9 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 focus:border-[#4A9EE0]/50 focus:outline-none focus:ring-2 focus:ring-[#4A9EE0]/15"
                      placeholder="搜索知识名称、来源、标签…"
                      value={libSearch}
                      onChange={(e) => setLibSearch(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl btn-hero-3d px-3 py-2 text-[12px] font-semibold"
                    onClick={() => openMaterialPicker('workspace', activeCat)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    上传知识
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl glass-button px-3 py-2 text-[12px] font-medium text-foreground"
                    onClick={() => openMaterialPicker('workspace', activeCat, 'cms')}
                  >
                    <Search className="h-3.5 w-3.5" />
                    搜索 CMS
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition',
                      onlyDefault
                        ? 'border-[#4A9EE0]/40 bg-gradient-to-r from-[#4A9EE0]/15 to-[#D8466A]/10 text-[#2d5a8a] shadow-[0_3px_10px_-3px_rgba(59,127,191,0.4)]'
                        : 'border-border/60 bg-background/60 text-foreground hover:border-primary/40'
                    )}
                    onClick={() => setOnlyDefault(!onlyDefault)}
                  >
                    <Star className={cn('h-3 w-3', onlyDefault && 'text-[#FFB547]')} fill={onlyDefault ? '#FFB547' : 'none'} />
                    仅默认
                  </button>
                </div>

                <div className="relative z-10 flex items-center justify-between px-5 pb-2.5 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[#4A9EE0] to-[#3B7FBF] shadow-[0_4px_10px_-2px_rgba(59,127,191,0.5)] ring-1 ring-white/40">
                      <FileText className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                    </span>
                    <h3 className="text-[14.5px] font-semibold text-foreground">全部知识</h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      {filteredLibrary.length} 项
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {libSelectedCount > 0 && (
                      <span className="rounded-full border border-[#D8466A]/30 bg-[#D8466A]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#a02d52]">
                        已选 {libSelectedCount}
                      </span>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-[11.5px] font-medium text-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                      disabled={filteredLibrary.length === 0}
                      onClick={toggleSelectAllVisible}
                    >
                      <Check className="h-3 w-3" />
                      {allVisibleSelected ? '取消全选' : '全选'}
                    </button>
                  </div>
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-5">
                  {filteredLibrary.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredLibrary.map((x) => (
                        <LibraryMaterialCard
                          key={x.id}
                          item={x}
                          selected={libSelectedIds.includes(x.id)}
                          onToggleSelect={() => toggleLibSelect(x.id)}
                          onToggleDefault={() => toggleDefault(x.id)}
                          onPreview={() => setPreviewMaterial(x)}
                          onDelete={() => deleteKnowledgeItem(x.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                      <div className="sparkle-surface relative mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-hero-gradient shadow-glow animate-gradient-pan">
                        <FolderOpen className="relative z-10 h-6 w-6 text-white" strokeWidth={2.2} />
                      </div>
                      <p className="text-[13px] font-semibold text-foreground">该分类暂无知识</p>
                      <p className="mt-1.5 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
                        上传本地文件，或从 CMS 搜索已审批内容加入知识库。
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl btn-hero-3d px-4 py-2 text-[12px] font-semibold"
                          onClick={() => openMaterialPicker('workspace', activeCat)}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          上传知识
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-[12px] font-medium text-foreground transition hover:border-primary/40"
                          onClick={() => openMaterialPicker('workspace', activeCat, 'cms')}
                        >
                          搜索 CMS
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {libSelectedCount > 0 && (
                  <div className="relative z-10 border-t border-border/50 bg-gradient-to-b from-transparent to-white/60 p-4 animate-fade-up">
                    <div className="flex items-center justify-between">
                      <div className="text-[12.5px] text-muted-foreground">
                        已选 <span className="font-semibold text-foreground">{libSelectedCount}</span> 项知识
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-2 text-[12px] font-medium text-foreground transition hover:border-primary/40"
                          onClick={() => setLibSelectedIds([])}
                        >
                          清空
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl btn-hero-3d px-4 py-2 text-[12.5px] font-semibold active:scale-[0.98]"
                          onClick={startChatWithSelectedMaterials}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          添加至新对话
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Asset Library Screen */}
      <section className={`screen ${currentScreen === 'assets' ? 'active' : ''}`}>
        <AssetLibraryPage onNotify={toast} />
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
                    <div className="context-sidebar-head-title">
                      <span className="context-sidebar-head-icon" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </svg>
                      </span>
                      <h3 className="section-title context-sidebar-title">引用素材</h3>
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
              <div className="chat-title">
                {isEditingTitle ? (
                  <input
                    type="text"
                    className="input"
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
                    style={{ fontSize: '16px', fontWeight: '700', padding: '4px 8px' }}
                  />
                ) : (
                  <h3 onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>
                    {taskTitle}
                  </h3>
                )}
              </div>
              <div className="compliance-agent-status" aria-label="合规智能体正在运行中">
                <span className="compliance-agent-dot" aria-hidden />
                合规智能体正在运行中
              </div>
            </div>

            {showCreatorCommentTabs && (
            <div
              className="creator-right-tabs has-comments"
              role="tablist"
              aria-label="AI 对话与查看批注"
            >
              <button
                type="button"
                role="tab"
                aria-selected={creatorRightTab === 'ai'}
                className={creatorRightTab === 'ai' ? 'active' : ''}
                onClick={() => setCreatorRightTab('ai')}
              >
                AI 对话
              </button>
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
                查看批注
                {creatorPptComments.length > 0 && <span>{creatorPptComments.length}</span>}
              </button>
            </div>
            )}

            {!showCreatorCommentTabs || creatorRightTab === 'ai' ? (
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
                    {msg.role === 'ai' && msg.model ? (
                      <div className="model-note">GPT-5.5</div>
                    ) : null}
                    <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                    {msg.imageUrl && (
                      <div className="chat-generated-image">
                        <img src={msg.imageUrl} alt={msg.imageTitle || 'AI 生成图片'} />
                        <button
                          type="button"
                          className="btn soft"
                          onClick={() =>
                            openMockImageInPreview(
                              msg.imageUrl || WORKSPACE_MOCK_IMAGE.dataUrl,
                              msg.imageTitle || WORKSPACE_MOCK_IMAGE.title
                            )
                          }
                        >
                          {msg.imageActionLabel || '图片修改'}
                        </button>
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
              {visibleQueueItems.length > 0 && (
                <div className={`task-queue-panel ${taskQueueOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="task-queue-toggle"
                    onClick={() => setTaskQueueOpen((open) => !open)}
                    aria-expanded={taskQueueOpen}
                  >
                    <span className="task-queue-toggle-left">
                      <ListTodo className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Task Queue
                      <span className="task-queue-count">{visibleQueueItems.length}</span>
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 task-queue-chevron ${taskQueueOpen ? 'is-open' : ''}`}
                    />
                  </button>
                  {taskQueueOpen && (
                    <div className="task-queue-list">
                      {visibleQueueItems.map((item) => {
                        const queuedIndex = queuedItems.findIndex((q) => q.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`task-queue-item status-${item.status}`}
                          >
                            <div className="task-queue-item-main">
                              <span className={`task-queue-status status-${item.status}`}>
                                {item.status === 'running' && (
                                  <span className="task-queue-spinner" aria-hidden />
                                )}
                                {QUEUE_STATUS_LABEL[item.status]}
                              </span>
                              <div className="task-queue-item-body">
                                <p>{item.prompt}</p>
                                {item.context && <small>{item.context}</small>}
                              </div>
                            </div>
                            <div className="task-queue-item-actions">
                              {item.status === 'queued' && (
                                <>
                                  <button
                                    type="button"
                                    className="task-queue-icon-btn"
                                    title="上移"
                                    disabled={queuedIndex <= 0}
                                    onClick={() => moveQueueItem(item.id, -1)}
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="task-queue-icon-btn"
                                    title="下移"
                                    disabled={queuedIndex < 0 || queuedIndex >= queuedItems.length - 1}
                                    onClick={() => moveQueueItem(item.id, 1)}
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="task-queue-text-btn"
                                    onClick={() => promoteQueueItem(item.id)}
                                  >
                                    立即执行
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="task-queue-icon-btn"
                                title="移除"
                                onClick={() => removeQueueItem(item.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

              <div className={`compose-shell ${composerMode === 'plan' ? 'is-plan-mode' : ''}`}>
                <div className="compose-main">
                  <button
                    className="icon-btn"
                    title="上传本地文件或搜索 CMS"
                    onClick={() => openMaterialPicker('chat')}
                  >
                    ＋
                  </button>
                  <textarea
                    placeholder={getComposerPlaceholder()}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={workspaceElementBusy}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && e.shiftKey) {
                        e.preventDefault();
                        toggleComposerMode();
                        return;
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                </div>
                <div className="compose-footer">
                  <div className="compose-footer-left">
                    <div className="composer-mode-switch" role="group" aria-label="协作模式">
                      <button
                        type="button"
                        className={composerMode === 'agent' ? 'active' : ''}
                        onClick={() => setComposerMode('agent')}
                        title="Agent 模式：直接执行"
                      >
                        Agent
                      </button>
                      <button
                        type="button"
                        className={composerMode === 'plan' ? 'active plan' : ''}
                        onClick={() => setComposerMode('plan')}
                        title="Plan 模式：先出计划再执行（Shift+Tab）"
                      >
                        <ListTodo className="h-3.5 w-3.5" strokeWidth={2.2} />
                        Plan
                      </button>
                    </div>
                    <select
                      className="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option>GPT-5.5</option>
                    </select>
                    {composerMode === 'plan' && (
                      <span className="composer-mode-hint">只规划，不直接改产出物</span>
                    )}
                  </div>
                  <button
                    className="btn primary compose-send"
                    onClick={send}
                    disabled={workspaceElementBusy}
                  >
                    {workspaceElementBusy
                      ? '修改中…'
                      : composerMode === 'plan'
                        ? '生成计划'
                        : '发送'}
                  </button>
                </div>
              </div>
            </div>
            </>
            ) : (
              <div className="creator-comments-view">
                <div className="creator-comments-summary">
                  <strong>第 {creatorPptPageIndex + 1} 页批注</strong>
                  <span>{creatorCurrentPageComments.length} 条</span>
                </div>
                <div className="creator-comments-list">
                  {creatorCurrentPageComments.length > 0 ? (
                    creatorCurrentPageComments.map(({ taskId, reviewerName, reviewerDept, comment }) => (
                      <PptCommentThread
                        key={comment.id}
                        variant="creator"
                        comment={comment}
                        metaTitle={`第 ${comment.pageNumber} 页 · ${reviewerName}`}
                        metaSubtitle={reviewerDept}
                        replyDraft={creatorReplyDrafts[comment.id] || ''}
                        onReplyDraftChange={(value) =>
                          setCreatorReplyDrafts((prev) => ({
                            ...prev,
                            [comment.id]: value,
                          }))
                        }
                        onReply={() => replyToPptComment(taskId, comment.id)}
                        replyPlaceholder="回复这条批注…"
                        showReplyComposer
                      />
                    ))
                  ) : (
                    <div className="reviewer-ppt-comments-empty">
                      当前页面暂无审阅批注。
                    </div>
                  )}
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
            pptTemplateSource={pptTemplateSource}
            richTextContent={richTextContent}
            onRichTextChange={setRichTextContent}
            creatorPptPageIndex={creatorPptPageIndex}
            onCreatorPptPageChange={handleCreatorPptPageChange}
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
            onConfirmPptDesigns={confirmPptDesigns}
            onRegeneratePptOutline={regeneratePptOutline}
            isGenerating={isGenerating}
            onSelectPptVersion={selectPptVersion}
            onStartPptFlow={() => startPptFlow()}
            insightSummary={insightSummary}
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
            taskTitle={taskTitle}
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
          {reviewFocusMode && activeReviewTask?.contentType === 'ppt' && (
            <aside className="wpanel reviewer-ppt-comments-panel">
              <div className="reviewer-ppt-comments-panel-head">
                <strong>批注</strong>
                <span>第 {reviewPptSlides[reviewPptPageIndex]?.page ?? reviewPptPageIndex + 1} 页</span>
              </div>
              <div className="reviewer-ppt-comment-list reviewer-ppt-comment-list-expanded">
                {(reviewPptNotes[reviewPptPageIndex] || []).length > 0 ? (
                  (reviewPptNotes[reviewPptPageIndex] || []).map((note) => (
                    <PptCommentThread
                      key={note.id}
                      variant="reviewer"
                      comment={note}
                      metaTitle={note.authorName}
                      replyDraft={reviewerReplyDrafts[note.id] || ''}
                      onReplyDraftChange={(value) =>
                        setReviewerReplyDrafts((prev) => ({
                          ...prev,
                          [note.id]: value,
                        }))
                      }
                      onReply={() => replyToCreatorAsReviewer(note.id)}
                      replyPlaceholder="回复内容创作者…"
                      showReplyComposer={(note.replies || []).some(
                        (reply) => reply.authorRole === 'ops'
                      )}
                    />
                  ))
                ) : (
                  <div className="reviewer-ppt-comments-empty">当前页面暂无批注</div>
                )}
              </div>
              <div className="reviewer-ppt-comment-compose">
                <textarea
                  className="reviewer-ppt-comment-input"
                  value={reviewPptNoteDraft}
                  onChange={(event) => setReviewPptNoteDraft(event.target.value)}
                  placeholder="针对当前页面添加批注…"
                />
                <button
                  type="button"
                  className="btn primary reviewer-ppt-comment-submit"
                  disabled={!reviewPptNoteDraft.trim()}
                  onClick={() => {
                    const content = reviewPptNoteDraft.trim();
                    if (!content || !activeReviewTaskId) return;
                    const note = addPptComment(activeReviewTaskId, {
                      pageIndex: reviewPptPageIndex,
                      pageNumber:
                        reviewPptSlides[reviewPptPageIndex]?.page ?? reviewPptPageIndex + 1,
                      authorRole: userRole,
                      authorName: ROLE_PROFILES[userRole].name,
                      content,
                    });
                    if (!note) return;
                    setReviewPptNoteDraft('');
                    refreshReviewTasks();
                    toast('批注已添加');
                  }}
                >
                  添加批注
                </button>
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

      <CreationMethodModal
        open={creationMethodOpen}
        onClose={() => setCreationMethodOpen(false)}
        onCreateNew={createNewContentFromHome}
        onOpenLocal={handleCreationFileSelected}
        onOpenCms={openCmsFileFromHome}
      />

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
          <h3>提交团队审阅</h3>
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
              可同时选择医学部与市场部，将分别为每位审阅人创建修改任务。
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
                  toast('请至少选择一位审阅人并设置截止时间');
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
                let reopenCount = 0;
                let createCount = 0;
                teamAssigneeRoles.forEach((role) => {
                  const assignee = ROLE_PROFILES[role];
                  const existingTask = findReviewTask(currentSessionId, target, role);
                  if (existingTask) {
                    reopenReviewTask(existingTask, {
                      title: taskTitle,
                      deadline,
                      assignerName: ROLE_PROFILES.ops.name,
                      baseCopyText: baseCopy || undefined,
                      copyRevisionBase: baseCopy || undefined,
                    });
                    reopenCount += 1;
                  } else {
                    createReviewTask({
                      sessionId: currentSessionId,
                      title: taskTitle,
                      contentType: target,
                      assigneeRole: role,
                      assigneeName: assignee.name,
                      assignerName: ROLE_PROFILES.ops.name,
                      deadline,
                      baseCopyText: baseCopy || undefined,
                      copyRevisionBase: baseCopy || undefined,
                    });
                    createCount += 1;
                  }
                  assigneeLabels.push(`${assignee.name}（${assignee.dept}）`);
                });
                refreshReviewTasks();
                const namesText = assigneeLabels.join('、');
                setShowTeamModal(false);
                setTeamAssigneeRoles([]);
                const actionLabel =
                  reopenCount > 0 && createCount === 0
                    ? '重新发起'
                    : createCount > 0 && reopenCount === 0
                      ? '创建'
                      : '分配';
                toast(
                  reopenCount > 0 && createCount === 0
                    ? `已向 ${namesText} 重新发起${label}审阅（保留历史批注）`
                    : `已向 ${namesText} 分配${label}修改任务`
                );
                addMsg(
                  'user',
                  `向 ${namesText} ${actionLabel}${label}团队修改任务（截止 ${deadline}）`,
                  selectedModel
                );
                addMsg(
                  'ai',
                  reopenCount > 0 && createCount === 0
                    ? `已重新打开原审阅任务并通知 ${assigneeLabels.length} 位审阅人。历史批注与回复已保留，他们将在首页看到「待审阅」状态并可继续在原线程中批注。`
                    : `已为 ${assigneeLabels.length} 位审阅人创建团队修改任务，他们将在各自首页任务列表中查看并修改。完成后你可在「团队修改」或「文案生成」标签查看修改详情。`,
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
  pptTemplateSource,
  richTextContent,
  onRichTextChange,
  creatorPptPageIndex,
  onCreatorPptPageChange,
  creatorPptComments,
  workspaceElementId,
  onWorkspaceElementSelect,
  onSelectPptTemplate,
  onPptOutlineChange,
  onRollbackPptSlides,
  onConfirmPptDesigns,
  onRegeneratePptOutline,
  isGenerating,
  onSelectPptVersion,
  onStartPptFlow,
  insightSummary,
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
  pptTemplateSource: 'referenced' | 'recommended';
  richTextContent: string;
  onRichTextChange: (html: string) => void;
  creatorPptPageIndex: number;
  onCreatorPptPageChange: (index: number) => void;
  creatorPptComments: PptReviewComment[];
  workspaceElementId: string | null;
  onWorkspaceElementSelect: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
  onSelectPptTemplate: (id: string | null) => void;
  onPptOutlineChange: (outline: PptOutline) => void;
  onRollbackPptSlides: (slides: PptSlide[]) => void;
  onConfirmPptDesigns: (mode?: 'template' | 'no-template') => void;
  onRegeneratePptOutline: () => void;
  isGenerating: boolean;
  onSelectPptVersion: (v: PptDesignVersion) => void;
  onStartPptFlow: () => void;
  insightSummary: string;
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewHistoryId, setPreviewHistoryId] = useState<string | null>(null);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const historyVersions = [
    { id: 'latest', label: restoredFrom ? `当前版本（回溯自 ${restoredFrom}）` : '当前版本', time: '刚刚' },
    { id: 'v2', label: '版本 V2', time: '今天 15:24' },
    { id: 'v1', label: '版本 V1', time: '今天 10:08' },
  ];
  const selectedHistory = historyVersions.find((version) => version.id === previewHistoryId);
  const historyDepth = previewHistoryId === 'v1' ? 2 : previewHistoryId === 'v2' ? 1 : 0;
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
    }
    setRestoredFrom(selectedHistory.label);
    setPreviewHistoryId(null);
    toast(`已回溯至 ${selectedHistory.label}`);
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
        {teamModificationInProgress ? '团队审阅中...' : '提交团队审阅'}
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
        <div className="preview-entry-card">
          <div className="preview-entry-icon">
            <Presentation className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <h4>开始新的内容任务</h4>
          <p>从本地文件或 CMS 内容开始，文件将在当前预览区域中打开。</p>
          <div className="preview-entry-actions">
            <button type="button" className="glass-button" onClick={onOpenLocalFile}>
              <FolderOpen className="h-4 w-4" />
              打开本地文件
            </button>
            <button type="button" className="btn-hero-3d" onClick={onOpenCmsFile}>
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
        if (!topics.length && !hotInsightReport) {
          return (
            <div className="detail-card">
              <h4>话题洞察</h4>
              <div className="small">在对话中点击「基于素材生成话题洞察」，AI 将在此展示完整洞察报告。</div>
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
          <RichTextEditor
            value={richTextContent || WORKSPACE_MOCK_RICH_TEXT}
            onChange={onRichTextChange}
            footerActions={
              <>
                <button
                  type="button"
                  className="btn soft"
                  onClick={() => {
                    const content = richTextContent || WORKSPACE_MOCK_RICH_TEXT;
                    const html = buildRichTextHtmlDocument(content, '图文内容');
                    downloadDataUrl(
                      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
                      '图文内容.html'
                    );
                    toast('图文内容已下载');
                  }}
                >
                  下载
                </button>
                {!reviewerMode && (
                  <>
                    <button
                      type="button"
                      className="btn warn"
                      disabled={teamModificationInProgress}
                      onClick={() => !teamModificationInProgress && onOpenTeamReview('rich-text')}
                    >
                      {teamModificationInProgress ? '团队审阅中...' : '提交团队审阅'}
                    </button>
                    <button
                      type="button"
                      className="btn green"
                      onClick={() => {
                        const content = richTextContent || WORKSPACE_MOCK_RICH_TEXT;
                        const plain = content
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim()
                          .slice(0, 800);
                        fillQuick(
                          `提交当前图文内容到Veeva Vault审批:\n${plain || '（当前图文正文）'}`
                        );
                      }}
                    >
                      提交 Veeva 审批
                    </button>
                  </>
                )}
              </>
            }
          />
        );

      case 'team':
        if (!teamResult) {
          return (
            <div className="detail-card">
              <h4>团队修改</h4>
              <div className="small">在对话中提交团队审阅邀请，或点击「进入团队修改」由 AI 整合反馈。</div>
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
                  ? `已生成 ${generatedImages.length} 张配图，按 ${groupImagesByCopy(generatedImages, generatedImageMeta).length} 篇文案分类。勾选后提交团队审阅；点击图片可进入编辑。`
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
              templateSource={pptTemplateSource}
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
                请先在「PPT大纲」中确认大纲并点击「生成 3 套 PPT」或「按模板生成 PPT」。
              </div>
              <button
                type="button"
                className="btn soft"
                style={{ marginTop: 12 }}
                onClick={() => setState((prev) => ({ ...prev, active: 'ppt-outline' }))}
              >
                前往 PPT 大纲
              </button>
            </div>
          );
        }
        const singleVersion = pptVersions.length <= 1;
        const activeVersion =
          pptVersions.find((v) => v.id === selectedPptVersionId) || pptVersions[0];
        const creatorActivePageIndex = Math.min(
          creatorPptPageIndex,
          Math.max(previewSlides.length - 1, 0)
        );
        const creatorActiveSlide = previewSlides[creatorActivePageIndex] || previewSlides[0];
        return (
          <>
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
                <div className="creator-ppt-thumbnails">
                  {previewSlides.map((slide, index) => {
                    const commentCount = creatorPptComments.filter(
                      (comment) => comment.pageIndex === index
                    ).length;
                    return (
                      <button
                        key={`${slide.page}-${index}`}
                        type="button"
                        className={creatorActivePageIndex === index ? 'active' : ''}
                        onClick={() => onCreatorPptPageChange(index)}
                      >
                        <span className="creator-ppt-thumbnail-page">{slide.page ?? index + 1}</span>
                        <img src={slideToPreviewUrl(slide)} alt={`第 ${slide.page ?? index + 1} 页`} />
                        {commentCount > 0 && (
                          <span className="creator-ppt-thumbnail-comments">{commentCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="creator-ppt-stage">
                  <div className="creator-ppt-stage-head">
                    <div>
                      <strong>第 {creatorActiveSlide.page ?? creatorActivePageIndex + 1} 页</strong>
                      <span>{creatorActiveSlide.title}</span>
                    </div>
                    {!selectedHistory && (
                      <button
                        type="button"
                        className="btn soft"
                        onClick={() => onOpenPptSlideEditor(creatorActivePageIndex)}
                      >
                        手动调整
                      </button>
                    )}
                  </div>
                  <div className="creator-ppt-slide-canvas">
                    <SelectableSvgPreview
                      key={`${creatorActiveSlide.page}-${creatorActivePageIndex}-${(creatorActiveSlide.svg || '').slice(0, 48)}`}
                      svgMarkup={creatorActiveSlide.svg}
                      imageSrc={slideToPreviewUrl(creatorActiveSlide)}
                      selectedId={workspaceElementId}
                      disabled={Boolean(selectedHistory)}
                      onSelect={(selection) =>
                        onWorkspaceElementSelect(selection, creatorActivePageIndex)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="ppt-design-foot-actions">
              {!singleVersion && (
                <button type="button" className="btn soft" onClick={() => fillQuick('生成设计')}>
                  重新生成设计
                </button>
              )}
            </div>
            <div className="content-submit-actions">
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
                    {teamModificationInProgress ? '团队审阅中...' : '提交团队审阅'}
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
          </>
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
        <div className="workspace-preview-title">内容预览</div>
        <div className="tabs">
          {previewFile && !isGeneratedImagePreview ? (
            <span className="tab active">文件预览</span>
          ) : visibleTabs.length > 0 ? visibleTabs.map((k) => (
              <button
                key={k}
                type="button"
                className={`tab ${state.active === k ? 'active' : ''}`}
                onClick={() => setState((prev) => ({ ...prev, active: k }))}
              >
                {tabNames[k]}
              </button>
          )) : null}
        </div>
      </div>
      <div className="detail">
        {!reviewerMode && (state.active || previewFile) && <div className="preview-history-row">
          <div className="preview-history-control">
            <button
              type="button"
              className="preview-history-trigger"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
            >
              <History className="h-3.5 w-3.5" />
              查看历史版本
              <ChevronDown className={`h-3.5 w-3.5 transition ${historyOpen ? 'rotate-180' : ''}`} />
            </button>
            {historyOpen && (
              <div className="preview-history-menu">
                {historyVersions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    className={`preview-history-option ${
                      (version.id === 'latest' && !previewHistoryId) ||
                      previewHistoryId === version.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setPreviewHistoryId(version.id === 'latest' ? null : version.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <span>{version.label}</span>
                    <small>{version.time}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>}
        {selectedHistory && (
          <div className="preview-history-banner">
            <div>
              <strong>正在预览 {selectedHistory.label}</strong>
              <span>{selectedHistory.time}</span>
            </div>
            <div className="preview-history-actions">
              <button type="button" className="btn primary" onClick={restoreHistoryVersion}>
                回溯至该版本
              </button>
            </div>
          </div>
        )}
        <div className={selectedHistory ? 'preview-history-readonly' : undefined}>
        {previewFile && (!isGeneratedImagePreview || state.active === 'visual') ? (
          <div className="workspace-file-preview">
            {previewFile.contentType === 'image' && previewFile.contentUrl ? (
              <>
                <DrawableImagePreview item={previewFile} />
                <div className="image-preview-submit-actions">
                  <button
                    type="button"
                    className="btn soft"
                    onClick={() =>
                      downloadDataUrl(
                        previewFile.contentUrl || '',
                        previewFile.fileName || `${previewFile.title}.svg`
                      )
                    }
                  >
                    下载图片
                  </button>
                  {!reviewerMode && (
                    <>
                      <button
                        type="button"
                        className="btn warn"
                        disabled={teamModificationInProgress}
                        onClick={() => !teamModificationInProgress && onOpenTeamReview('visual')}
                      >
                        {teamModificationInProgress ? '团队审阅中...' : '提交团队审阅'}
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
            {visibleTabs.length > 0 && (
              <div className="ppt-compliance-check detail-compliance-check">
                <span className="ppt-compliance-dot" aria-hidden />
                生成内容已通过智能合规校验
              </div>
            )}
            {renderDetail()}
          </>
        )}
        </div>
      </div>
    </aside>
  );
}
