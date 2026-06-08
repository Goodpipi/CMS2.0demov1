import type { TopicItem } from '@/types/content';
import { loadDemoScenario, type DemoScenario } from '@/lib/demoMode';

const SLIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#eaf7ff"/><stop offset="1" stop-color="#f4fff0"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><text x="48" y="80" font-size="36" font-weight="800" fill="#103C8F">可申达</text><text x="48" y="160" font-size="28" fill="#40536a">演示脚本 · 固定输出</text></svg>`;

const POSTER_SVGS: Record<DemoScenario, string> = {
  'patient-education': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560"><rect width="900" height="560" fill="#f2f9ff"/><text x="60" y="120" font-size="48" font-weight="900" fill="#103C8F">肾脏健康科普</text><text x="60" y="180" font-size="22" fill="#40536a">患者教育 · 演示脚本</text></svg>`,
  academic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560"><rect width="900" height="560" fill="#eef4ff"/><text x="60" y="120" font-size="44" font-weight="900" fill="#103C8F">学术会议壁报</text><text x="60" y="180" font-size="22" fill="#40536a">临床证据 · 演示脚本</text></svg>`,
  hcp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560"><rect width="900" height="560" fill="#f0f7f4"/><text x="60" y="120" font-size="44" font-weight="900" fill="#103C8F">HCP 沟通要点</text><text x="60" y="180" font-size="22" fill="#40536a">科室会 · 演示脚本</text></svg>`,
};

const INSIGHT_TOPICS: Record<DemoScenario, TopicItem[]> = {
  'patient-education': [
    {
      title: '肾脏健康：早期症状公众易忽视什么',
      reason: '贴近小红书科普习惯，适合疾病教育而非疗效宣传。',
      source: '默认热点洞察、渠道特色',
    },
    {
      title: '慢性肾病风险因素：生活方式与筛查',
      reason: '可申达公众教育常见角度，合规表达空间充足。',
      source: '参考知识包、合规手册',
    },
    {
      title: '出现哪些信号应咨询专业医生',
      reason: '强调就医建议，避免自我诊断承诺。',
      source: '合规手册',
    },
    {
      title: '夏季补水与肾脏负担：公众常见误区',
      reason: '季节化切入，便于渠道传播。',
      source: '热点洞察',
    },
  ],
  academic: [
    {
      title: '慢性肾病管理：最新临床证据概览',
      reason: '适合学术会议开场与壁报摘要。',
      source: 'Clinical Data Pack',
    },
    {
      title: '真实世界研究：患者长期管理路径',
      reason: '突出 RWE 价值，便于 HCP 讨论。',
      source: 'RWE 摘要',
    },
    {
      title: '多学科协作在 CKD 管理中的实践',
      reason: '会议圆桌/卫星会常见议题。',
      source: '学术幻灯库',
    },
    {
      title: '未来研究方向与未满足临床需求',
      reason: '收尾页引导 Q&A，合规表述稳妥。',
      source: 'Congress Brief',
    },
  ],
  hcp: [
    {
      title: 'HCP 拜访：核心临床信息如何结构化表达',
      reason: '科室会 10 分钟版本，信息密度适中。',
      source: 'HCP Core Deck',
    },
    {
      title: '患者分型与个体化管理沟通要点',
      reason: '便于一线代表与医师对话。',
      source: 'Medical Affairs',
    },
    {
      title: '常见临床问题与循证回应框架',
      reason: 'Q&A 场景预设，降低合规风险。',
      source: 'FAQ Library',
    },
    {
      title: '后续跟进：学术邮件与会议邀约话术',
      reason: '延伸 HCP 关系维护动作。',
      source: 'CRM Playbook',
    },
  ],
};

const INSIGHT_SUMMARY: Record<DemoScenario, string> = {
  'patient-education':
    '（演示脚本）公众渠道宜采用轻科普、强共情表达，突出风险认知与就医建议，避免治疗承诺。',
  academic:
    '（演示脚本）学术场景强调证据层级、研究设计与临床意义，避免夸大疗效，保留完整参考文献占位。',
  hcp: '（演示脚本）HCP 沟通聚焦临床价值、患者获益与管理路径，用语专业克制，便于科室会现场讲解。',
};

const COPY_ANGLES: Record<DemoScenario, string[]> = {
  'patient-education': ['小红书科普版', '患者教育长图版', '问答互动版', '渠道短文案版', '社群转发版'],
  academic: ['学术摘要版', '壁报说明版', '会议发言版', '卫星会提纲版', 'Poster 文案版'],
  hcp: ['HCP 拜访简版', '科室会讲稿', '学术邮件版', 'FAQ 回应版', '跟进话术版'],
};

const CHAT_REPLIES: Record<DemoScenario, string[]> = {
  'patient-education': [
    '（演示脚本 · 患者教育）我已按预设流程就绪。您可以继续：基于素材生成话题洞察 → 生成文案 → 生成图片 / PPT / 视频。每次输出均为固定脚本，便于售前演示。',
    '（演示）公众疾病教育要点已整理：强调风险认知、生活方式与就医建议，不含疗效承诺。如需下一步，请使用「生成文案」快捷按钮。',
    '（演示）当前为演示模式，您的输入仅用于界面展示。系统将返回与「患者教育」场景一致的固定结果。',
  ],
  academic: [
    '（演示脚本 · 学术会议）已加载学术会议演示流程。可体验话题洞察、文案、PPT 大纲与设计稿生成，输出内容与Congress场景脚本一致。',
    '（演示）建议结构：研究背景 → 方法 → 主要结果 → 临床意义 → 局限与展望。所有生成内容为固定脚本。',
    '（演示）演示模式下不调用真实 AI 与后端，便于学术场景方案汇报时稳定展示。',
  ],
  hcp: [
    '（演示脚本 · HCP沟通）HCP 场景脚本已就绪。可演示拜访话术、科室会提纲与 FAQ 回应等固定输出。',
    '（演示）沟通框架：临床问题 → 循证信息 → 患者管理建议 → 后续学术支持。内容每次一致。',
    '（演示）当前为 HCP 沟通演示脚本，输入不参与业务处理，仅保留完整交互与 Loading 体验。',
  ],
};

const SESSION_TITLES: Record<DemoScenario, string> = {
  'patient-education': '可申达｜患者教育演示',
  academic: '可申达｜学术会议演示',
  hcp: '可申达｜HCP 沟通演示',
};

const DELAY_MS: Record<string, [number, number]> = {
  '/generate/session-title': [350, 550],
  '/chat': [750, 1150],
  '/generate/video-render': [1100, 1700],
  '/generate/ppt-designs': [1300, 1900],
  default: [900, 1450],
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getScenario(): DemoScenario {
  return loadDemoScenario();
}

function getMockCopy(topics: TopicItem[] | undefined, copiesPerTopic: number, scenario: DemoScenario) {
  const perTopic = Math.min(Math.max(Number(copiesPerTopic) || 3, 1), 5);
  const angles = COPY_ANGLES[scenario];
  const list =
    topics && topics.length > 0
      ? topics
      : [{ title: INSIGHT_TOPICS[scenario][0].title, reason: '', source: '演示脚本' }];
  const copies = [];
  for (const topic of list) {
    const title = topic.title || String(topic);
    for (let i = 0; i < perTopic; i++) {
      const angle = angles[i % angles.length];
      copies.push({
        topicTitle: title,
        title: angle,
        body: `【演示脚本 · ${scenario}】\n\n【话题】${title}\n【角度】${angle}\n\n围绕「${title}」输出固定演示文案，强调合规表述与场景化结构。用户输入不参与生成逻辑。\n\n【免责声明】本文为演示内容，不构成诊疗建议。`,
        compliance: '演示脚本：已预设合规表述与免责声明占位。',
      });
    }
  }
  return { copies };
}

function expandTopics(seedTopics: TopicItem[] | undefined, scenario: DemoScenario) {
  const seedLabel = seedTopics?.[0]?.title?.slice(0, 24) || INSIGHT_TOPICS[scenario][0].title.slice(0, 16);
  return {
    topics: [
      {
        title: `延伸：${seedLabel}相关的补充角度`,
        reason: '与已选话题形成互补，演示脚本固定输出。',
        source: '基于已选话题拓展',
      },
      {
        title: `延伸：${seedLabel}场景下的内容组合建议`,
        reason: '便于串联文案、视觉与 PPT 演示步骤。',
        source: '基于已选话题拓展',
      },
      {
        title: `延伸：合规审查与发布前检查清单`,
        reason: '强调审批与免责声明，适合售前流程演示。',
        source: '基于已选话题拓展',
      },
    ],
    summary: '（演示脚本）已基于所选话题拓展三个固定方向，可与原列表一并勾选生成文案。',
  };
}

export async function simulateDemoDelay(path: string): Promise<void> {
  const [min, max] = DELAY_MS[path] ?? DELAY_MS.default;
  await sleep(min + Math.floor(Math.random() * (max - min)));
}

export function getDemoResponse(path: string, body: Record<string, unknown> = {}): unknown {
  const scenario = getScenario();
  const userNote = String(body.userNote ?? body.brief ?? body.editPrompt ?? '');

  switch (path) {
    case '/generate/insight': {
      const seedTopics = body.seedTopics as TopicItem[] | undefined;
      if (seedTopics?.length) return expandTopics(seedTopics, scenario);
      return {
        topics: INSIGHT_TOPICS[scenario],
        summary: INSIGHT_SUMMARY[scenario],
      };
    }

    case '/generate/copy': {
      const topics = (body.topics as TopicItem[] | undefined) ?? [];
      const copiesPerTopic = Number(body.copiesPerTopic) || 3;
      return getMockCopy(topics.length ? topics : undefined, copiesPerTopic, scenario);
    }

    case '/generate/team': {
      const type = (body.contentType as string) || 'copy';
      const labels: Record<string, string> = {
        copy: '文案',
        visual: '配图',
        video: '视频',
        ppt: 'PPT',
      };
      return {
        contentType: type,
        contentTitle: labels[type] || '内容',
        before: '（演示脚本）修改前：表述偏营销，场景化不足。',
        after:
          '（演示脚本）修改后：按团队反馈优化结构与合规表述，补充免责声明，适配目标受众沟通习惯。',
        changes: ['降低营销感', '补充免责声明', '优化结构与可读性'],
        summary: '（演示脚本）团队修改结果固定，可在「团队修改」标签查看前后对比。',
      };
    }

    case '/generate/video':
      return {
        title:
          scenario === 'academic'
            ? '学术会议短视频（演示脚本）'
            : scenario === 'hcp'
              ? 'HCP 沟通短视频（演示脚本）'
              : '患者教育科普短视频（演示脚本）',
        coverSuggestion: '拜耳蓝绿品牌色 + 场景化主题插画（固定）',
        segments: [
          {
            time: '0:00-0:05',
            scene: '开场',
            narration: '演示脚本开场：引入议题与受众关注点。',
            compliance: '无疗效承诺',
          },
          {
            time: '0:05-0:22',
            scene: '主体',
            narration: '演示脚本主体：按场景展开 2–3 个核心信息点。',
            compliance: '合规口径',
          },
          {
            time: '0:22-0:30',
            scene: '结尾',
            narration: '演示脚本结尾：就医/学术支持/后续行动号召（按场景固定）。',
            compliance: '免责声明',
          },
        ],
      };

    case '/generate/video-render':
      return {
        versions: [
          {
            id: 'vv1',
            name: '方案 A · 演示脚本',
            styleTag: scenario === 'hcp' ? '科室会 · 专业' : '蓝绿品牌 · 轻快',
            description: `固定演示视频方案 A（${scenario}）`,
            duration: '0:30',
            videoUrl: '/demo-assets/1488265506.mp4',
            posterDataUrl: '',
            isDemo: true,
          },
          {
            id: 'vv2',
            name: '方案 B · 演示脚本',
            styleTag: '备用节奏',
            description: `固定演示视频方案 B（${scenario}）`,
            duration: '0:30',
            videoUrl: '/demo-assets/1488265506.mp4',
            posterDataUrl: '',
            isDemo: true,
          },
        ],
      };

    case '/generate/ppt':
      return {
        title:
          scenario === 'academic'
            ? '学术会议 PPT（演示脚本）'
            : scenario === 'hcp'
              ? 'HCP 科室会 PPT（演示脚本）'
              : '患者教育 PPT（演示脚本）',
        slides: [
          { page: 1, title: '封面', bullets: [SESSION_TITLES[scenario]] },
          { page: 2, title: '核心议题', bullets: INSIGHT_TOPICS[scenario].slice(0, 2).map((t) => t.title) },
          { page: 3, title: '总结', bullets: ['演示脚本固定页', '请咨询专业医生 / 参见完整研究资料'] },
        ],
      };

    case '/generate/ppt-outline':
      return {
        title: SESSION_TITLES[scenario],
        audience: scenario === 'hcp' ? 'HCP' : scenario === 'academic' ? '学术会议听众' : '公众/患者',
        scenario:
          scenario === 'hcp' ? 'HCP沟通' : scenario === 'academic' ? '学术会议' : '患者教育',
        chapters: [
          {
            id: 'ch1',
            title: INSIGHT_TOPICS[scenario][0].title.slice(0, 12),
            pages: [
              { id: 'p1', title: '封面与议题', bullets: ['品牌与议题', '免责声明'] },
              { id: 'p2', title: '背景与意义', bullets: ['场景化痛点', '沟通目标'] },
            ],
          },
          {
            id: 'ch2',
            title: '核心内容与总结',
            pages: [
              { id: 'p3', title: '关键信息', bullets: INSIGHT_TOPICS[scenario].slice(1, 3).map((t) => t.title) },
              { id: 'p4', title: '总结', bullets: ['行动建议', '合规提示'] },
            ],
          },
        ],
      };

    case '/generate/ppt-designs': {
      const templateId = body.templateId as string | undefined;
      if (templateId) {
        return {
          versions: [
            {
              id: 'template',
              name: '按模板生成 · 演示脚本',
              styleTag: '拜耳蓝绿',
              description: '（演示脚本）按所选内置模板生成单套 PPT',
              slides: [],
            },
          ],
        };
      }
      return {
        versions: [
          {
            id: 'v1',
            name: '方案 A · 专业蓝',
            styleTag: '拜耳蓝 · 稳重',
            description: '（演示脚本）稳重商务，强调专业可信',
            slides: [],
          },
          {
            id: 'v2',
            name: '方案 B · 清新绿',
            styleTag: '蓝绿渐变 · 亲和',
            description: '（演示脚本）清新亲和，适合场景化科普',
            slides: [],
          },
          {
            id: 'v3',
            name: '方案 C · 简约白',
            styleTag: '留白 · 清晰',
            description: '（演示脚本）留白简约，信息层次清晰',
            slides: [],
          },
        ],
      };
    }

    case '/generate/poster':
    case '/generate/poster-edit': {
      const svg = POSTER_SVGS[scenario];
      return {
        title:
          path === '/generate/poster-edit'
            ? '编辑后海报（演示脚本）'
            : `${SESSION_TITLES[scenario]} · 配图`,
        svg,
        dataUrl: svgToDataUrl(svg),
      };
    }

    case '/generate/session-title':
      return { title: SESSION_TITLES[scenario] };

    case '/chat': {
      const history = (body.history as { role: string; content: string }[]) ?? [];
      const userTurns = history.filter((m) => m.role === 'user').length;
      const replies = CHAT_REPLIES[scenario];
      return { reply: replies[userTurns % replies.length] };
    }

    default:
      return { message: '演示脚本数据' };
  }
}

export { SLIDE_SVG, POSTER_SVGS };
