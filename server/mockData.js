/** DeepSeek 不可用时的演示数据，保证工作台流程可跑通 */

const SLIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#eaf7ff"/><stop offset="1" stop-color="#f4fff0"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><text x="48" y="80" font-size="36" font-weight="800" fill="#103C8F">可申达</text><text x="48" y="160" font-size="28" fill="#40536a">肾脏健康 · 疾病教育</text></svg>`;

const POSTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560"><rect width="900" height="560" fill="#f2f9ff"/><text x="60" y="120" font-size="48" font-weight="900" fill="#103C8F">肾脏健康科普</text><text x="60" y="180" font-size="22" fill="#40536a">仅供疾病教育参考</text></svg>`;

const COPY_ANGLES = ['小红书科普版', '患者教育长图版', 'HCP沟通简版', '渠道短文案版', '问答互动版'];

export function getMockCopy(topics = [], copiesPerTopic = 3, userNote = '') {
  const perTopic = Math.min(Math.max(Number(copiesPerTopic) || 3, 1), 5);
  const list =
    topics.length > 0
      ? topics
      : [{ title: userNote?.slice(0, 40) || '肾脏健康科普', reason: '', source: '演示' }];
  const copies = [];
  for (const topic of list) {
    const title = topic.title || String(topic);
    for (let i = 0; i < perTopic; i++) {
      const angle = COPY_ANGLES[i % COPY_ANGLES.length];
      copies.push({
        topicTitle: title,
        title: `${angle}`,
        body: `【话题】${title}\n\n【标题】${title} — ${angle.replace(/版$/, '')}\n\n【正文】围绕「${title}」展开公众疾病教育，强调风险认知与就医建议，避免疗效承诺。\n\n【免责声明】本文为疾病教育内容，不构成诊疗建议。${userNote ? `\n\n【备注】${userNote.slice(0, 80)}` : ''}`,
        compliance: '已弱化营销表述，补充免责声明占位。',
      });
    }
  }
  return { copies };
}

function parseCopyPrompt(note = '') {
  const perTopicMatch = note.match(/每个话题恰好 (\d+) 篇|分别生成 (\d+) 篇/);
  const perTopic = perTopicMatch
    ? Math.min(Number(perTopicMatch[1] || perTopicMatch[2]) || 3, 5)
    : 3;
  const topicSection = note.includes('选中话题')
    ? note.split('选中话题')[1]?.split('\n\n')[0] || ''
    : note;
  const lines = [...topicSection.matchAll(/^\d+\.\s*(.+?)(?:\s*—|$)/gm)].map((m) => ({
    title: m[1].trim(),
    reason: '',
    source: '演示',
  }));
  return { topics: lines, perTopic };
}

export function getMockData(kind, userNote = '') {
  const fullNote = String(userNote || '');
  const note = fullNote.slice(0, 40);

  switch (kind) {
    case 'insight':
      return {
        topics: [
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
            title: note ? `围绕「${note}」的科普切入` : '夏季补水与肾脏负担：公众常见误区',
            reason: '结合用户补充方向生成。',
            source: '用户描述',
          },
        ],
        summary:
          '（演示数据）公众渠道宜采用轻科普、强共情表达，突出风险认知与就医建议，避免治疗承诺。',
      };

    case 'insight-expand': {
      const seedLabel = note.includes('1.') ? note.split('\n')[0].replace(/^\d+\.\s*/, '').slice(0, 24) : '已选话题';
      return {
        topics: [
          {
            title: `延伸：${seedLabel}相关的公众常见误区`,
            reason: '从误区澄清角度延伸，与已选话题形成互补。',
            source: '基于已选话题拓展',
          },
          {
            title: `延伸：${seedLabel}背景下的日常健康管理`,
            reason: '生活方式切入，适合小红书轻科普表达。',
            source: '基于已选话题拓展',
          },
          {
            title: `延伸：出现哪些信号应咨询专业医生`,
            reason: '强调就医建议，避免自我诊断与疗效承诺。',
            source: '基于已选话题拓展',
          },
        ],
        summary: '（演示）已基于所选话题拓展三个新方向，可与原列表一并勾选生成文案。',
      };
    }

    case 'copy': {
      const { topics, perTopic } = parseCopyPrompt(fullNote);
      return getMockCopy(topics.length ? topics : undefined, perTopic, fullNote);
    }

    case 'team':
      return {
        contentType: 'copy',
        contentTitle: '文案',
        before: '原内容（演示）：表述偏营销，公众渠道风险较高。',
        after:
          '修改后：强化疾病教育属性，减少营销形容词，补充「请咨询专业医生」类表述；画面/脚本/PPT 结构按合规口径调整。',
        changes: ['降低营销感', '补充免责声明', '优化结构与可读性'],
        summary: '（演示）已整合团队反馈，可在「团队修改」标签查看前后对比。',
      };

    case 'video-render': {
      const title = note || '可申达科普短视频';
      return {
        versions: [
          {
            id: 'vv1',
            name: '方案 A · 清新科普',
            styleTag: '蓝绿品牌 · 轻快',
            description: `基于脚本「${title}」合成的竖版短视频（演示占位）`,
            duration: '0:30',
            videoUrl: '',
            isDemo: true,
          },
          {
            id: 'vv2',
            name: '方案 B · 稳重叙述',
            styleTag: '横版 · 沉稳',
            description: '备用节奏与字幕样式（演示占位）',
            duration: '0:30',
            videoUrl: '',
            isDemo: true,
          },
        ],
      };
    }

    case 'video':
      return {
        title: '肾脏健康科普短视频（演示）',
        coverSuggestion: '蓝绿品牌色 + 肾脏健康主题插画',
        segments: [
          { time: '0:00-0:05', scene: '开场：问题引入', narration: '你知道肾脏健康和小信号的关系吗？', compliance: '无疗效承诺' },
          { time: '0:05-0:20', scene: '风险因素简述', narration: '慢性肾病风险与多种因素相关…', compliance: '科普口径' },
          { time: '0:20-0:28', scene: '结尾', narration: '有疑虑请咨询专业医生。', compliance: '就医建议' },
        ],
      };

    case 'ppt':
      return {
        title: '可申达疾病教育 PPT（演示）',
        slides: [
          { page: 1, title: '封面', bullets: ['肾脏健康疾病教育'] },
          { page: 2, title: '疾病负担', bullets: ['公众认知现状', '早期信号'] },
          { page: 3, title: '总结', bullets: ['请咨询专业医生'] },
        ],
      };

    case 'ppt-outline':
      return {
        title: note ? `可申达｜${note}` : '可申达｜肾脏健康疾病教育',
        audience: '公众',
        scenario: '疾病教育',
        chapters: [
          {
            id: 'ch1',
            title: '认识肾脏健康',
            pages: [
              { id: 'p1', title: '封面与议题', bullets: ['品牌与议题', '免责声明'] },
              { id: 'p2', title: '为什么重要', bullets: ['生理功能简述', '公众常见误区'] },
            ],
          },
          {
            id: 'ch2',
            title: '风险与就医',
            pages: [
              { id: 'p3', title: '风险因素', bullets: ['生活方式', '筛查意识'] },
              { id: 'p4', title: '总结', bullets: ['就医建议', '教育信息来源'] },
            ],
          },
        ],
      };

    case 'ppt-designs':
      return {
        versions: [
          {
            id: 'v1',
            name: '方案 A · 专业蓝',
            styleTag: '拜耳蓝 · 稳重',
            description: '稳重商务，强调专业可信',
            slides: [],
          },
          {
            id: 'v2',
            name: '方案 B · 清新绿',
            styleTag: '蓝绿渐变 · 亲和',
            description: '清新亲和，适合公众科普',
            slides: [],
          },
          {
            id: 'v3',
            name: '方案 C · 简约白',
            styleTag: '留白 · 科普',
            description: '留白简约，信息层次清晰',
            slides: [],
          },
        ],
      };

    case 'ppt-designs-template':
      return {
        versions: [
          {
            id: 'template',
            name: '按模板生成',
            styleTag: '拜耳蓝绿',
            description: '（演示）按所选内置模板生成单套 PPT',
            slides: [],
          },
        ],
      };

    case 'poster':
    case 'poster-template':
      return {
        title: note.includes('模板') ? '按模板生成的配图（演示）' : '肾脏健康科普海报（演示）',
        svg: POSTER_SVG,
      };

    case 'poster-edit':
      return {
        title: '编辑后海报（演示）',
        svg: POSTER_SVG,
      };

    case 'session-title':
      return note ? `可申达｜${note.slice(0, 18)}` : '可申达｜肾脏健康科普';

    case 'chat':
      return '（演示模式）我可以帮你生成话题洞察、文案、图片、视频或 PPT。DeepSeek 恢复后将使用真实 AI 生成。';

    default:
      return { message: '演示数据' };
  }
}
