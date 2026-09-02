export const SYSTEM_BASE = `你是拜耳「可申达」品牌的 AI 内容创作助手，服务于制药企业公众渠道疾病教育内容生产。
严格遵守：
- 只做疾病教育，不做疗效承诺、不夸大、不替代诊疗建议
- 公众渠道（尤其小红书）需弱化营销感
- 文案需预留免责声明位置
- 使用专业、温和、易懂的中文`;

export function promptInsight(materials, userNote = '') {
  return `基于以下素材，生成 4 个适合小红书公众疾病教育的话题方向。

引用素材：
${materials}

${userNote ? `用户补充：${userNote}` : ''}

请以 JSON 返回，格式：
{
  "topics": [
    { "title": "话题标题", "reason": "推荐理由（1-2句）", "source": "素材来源说明" }
  ],
  "summary": "整体洞察摘要（2-3句）"
}`;
}

export function promptExpandInsight(materials, seedTopics = [], userNote = '') {
  const seedText =
    seedTopics.length > 0
      ? seedTopics.map((t, i) => `${i + 1}. ${t.title}${t.reason ? `（${t.reason}）` : ''}`).join('\n')
      : '（无）';
  return `基于用户已选话题，再拓展生成 3 个相关但角度不同的小红书公众疾病教育话题。不要与已有话题标题重复或高度雷同。

已选话题：
${seedText}

引用素材：
${materials}

${userNote ? `用户补充：${userNote}` : ''}

请以 JSON 返回，topics 数组恰好 3 项，格式：
{
  "topics": [
    { "title": "话题标题", "reason": "推荐理由（1-2句）", "source": "素材来源说明" }
  ],
  "summary": "拓展说明（1-2句）"
}`;
}

export function promptCopy(materials, topics, userNote = '', copiesPerTopic = 3) {
  const perTopic = Math.min(Math.max(Number(copiesPerTopic) || 3, 1), 5);
  const topicCount = topics.length > 0 ? topics.length : 1;
  const totalCopies = topicCount * perTopic;
  const topicText =
    topics.length > 0
      ? topics.map((t, i) => `${i + 1}. ${t.title || t}${t.reason ? ` — ${t.reason}` : ''}`).join('\n')
      : '（无单独话题列表，请结合素材与用户说明自由确定角度）';
  return `基于以下每个话题，分别生成 ${perTopic} 篇不同角度的文案（角度可含：小红书科普 / 患者教育长图 / HCP沟通 / 渠道短文案 / 问答互动等，同一话题内各篇需有明显差异）。

引用素材：
${materials}

选中话题（须逐条覆盖，每个话题恰好 ${perTopic} 篇，合计 ${totalCopies} 篇）：
${topicText}

${userNote ? `用户要求：${userNote}` : ''}

请以 JSON 返回。copies 数组长度必须为 ${totalCopies}，每项必须包含 topicTitle（与上文话题标题完全一致）：
{
  "copies": [
    { "topicTitle": "话题标题", "title": "文案版本名称", "body": "完整正文（含标题、正文、免责声明占位）", "compliance": "合规处理说明" }
  ]
}`;
}

export function promptTeam(contentType = 'copy', copyBody, contentTitle = '', feedback = '') {
  const labels = {
    copy: '文案',
    visual: '图片/海报方案',
    video: '视频脚本',
    ppt: 'PPT 大纲或页面',
  };
  const label = labels[contentType] || '内容';
  const focus =
    contentType === 'visual'
      ? '画面描述、文案层级、品牌元素、合规表述（避免疗效承诺）'
      : contentType === 'video'
        ? '分镜节奏、旁白口径、画面合规、时长结构'
        : contentType === 'ppt'
          ? '结构逻辑、页面要点、演讲备注、合规表述'
          : '降低营销感、增强疾病教育、补充免责声明';

  return `对以下${label}（${contentTitle || '当前版本'}）进行团队修改整合。

原${label}：
${copyBody}

${feedback ? `团队反馈：${feedback}` : `团队反馈：${focus}`}

请以 JSON 返回：
{
  "contentType": "${contentType}",
  "contentTitle": "${contentTitle || label}",
  "before": "修改前核心表述或结构摘要",
  "after": "修改后完整内容（文案为全文；视频/PPT/图片为结构化文字稿）",
  "changes": ["变更点1", "变更点2"],
  "summary": "修改说明"
}`;
}

export function promptVideo(copyBody, userNote = '') {
  return `基于以下内容 Brief（可为完整文案、话题要点或用户描述），生成 30 秒短视频分镜脚本。

内容 Brief：
${copyBody}

${userNote ? `要求：${userNote}` : ''}

请以 JSON 返回：
{
  "title": "视频标题",
  "segments": [
    { "time": "0-5s", "scene": "画面描述", "narration": "旁白/字幕", "compliance": "合规提示" }
  ],
  "coverSuggestion": "封面图建议"
}`;
}

export function promptPptOutline(materials, brief, audience, scenario, userNote = '') {
  return `为拜耳「可申达」品牌生成 PPT 大纲（章节 + 页面结构），受众：${audience}，场景：${scenario}。

引用素材：
${materials}

内容 Brief：
${brief}

${userNote ? `用户要求：${userNote}` : ''}

要求：
- 按 PowerPoint 节组织：先封面节、目录节，再 2-4 个内容节，最后封底节
- 封面、目录、封底各只有 1 页
- 每个内容节的第一页必须是章节标题页：title 与节标题相同，bullets 为空数组
- 内容节随后再给 2-3 页正文，每页有标题和 2-4 条要点
- 符合制药合规，疾病教育导向
- 每个正文页必须给出当前页面参考文献 references（字符串数组）；封面、目录、章节标题页、封底可为空数组
- 每条参考文献必须精确到页码，例如：
  "Lancet Diabetes Endocrinol, 2024, 12(6): 412-414. SGLT2 inhibitors and kidney outcomes."
  "中华肾脏病杂志, 2024, 40(3): 18. 早期筛查路径真实世界研究."
  "KDIGO 2024 CKD Guideline, pp. 45-47. Clinical Practice Guideline for CKD."

只返回 JSON：
{
  "title": "PPT总标题",
  "audience": "${audience}",
  "scenario": "${scenario}",
  "chapters": [
    {
      "title": "封面",
      "kind": "cover",
      "pages": [{ "title": "PPT总标题", "bullets": [], "kind": "cover" }]
    },
    {
      "title": "目录",
      "kind": "toc",
      "pages": [{ "title": "目录", "bullets": ["节1", "节2"], "kind": "toc" }]
    },
    {
      "title": "章节名",
      "kind": "section",
      "pages": [
        { "title": "章节名", "bullets": [], "kind": "section-title" },
        { "title": "页面标题", "bullets": ["要点1", "要点2"], "kind": "content", "speakerNotes": "备注", "visualSuggestion": "可视化建议", "references": ["Lancet Diabetes Endocrinol, 2024, 12(6): 412-414. SGLT2 inhibitors and kidney outcomes."] }
      ]
    },
    {
      "title": "封底",
      "kind": "back",
      "pages": [{ "title": "谢谢", "bullets": [], "kind": "back" }]
    }
  ]
}`;
}

export function promptPptDesigns(outlineJson, audience, scenario, pageCount = 5) {
  return `根据已确认 PPT 大纲，生成 3 套不同视觉风格的设计方案（拜耳蓝 #103C8F、绿 #69BE28）。

受众：${audience}
场景：${scenario}
大纲共 ${pageCount} 页（见下方 JSON）。

大纲：
${outlineJson}

重要：不要生成 SVG 代码。每套方案只需返回全部 ${pageCount} 页的 title、bullets（可与大纲一致或优化表述），服务端会自动排版。

只返回 JSON（勿包含 svg 字段）：
{
  "versions": [
    {
      "id": "v1",
      "name": "方案名称",
      "styleTag": "商务简约",
      "description": "一句风格说明",
      "slides": [
        { "page": 1, "title": "页标题", "bullets": ["要点1", "要点2"] }
      ]
    }
  ]
}
生成恰好 3 个 versions，slides 数组长度必须为 ${pageCount}，风格互有明显差异。`;
}

/** 按选定内置模板生成单套 PPT */
export function promptPptDesignsWithTemplate(
  outlineJson,
  audience,
  scenario,
  pageCount,
  templateName,
  templateStyleTag
) {
  return `根据已确认 PPT 大纲，按内置模板「${templateName}」（${templateStyleTag}）生成**一套** PPT 页面内容。

受众：${audience}
场景：${scenario}
大纲共 ${pageCount} 页（见下方 JSON）。

大纲：
${outlineJson}

重要：不要生成 SVG。只返回 1 个 version，slides 长度必须为 ${pageCount}，表述符合制药合规与疾病教育场景。

只返回 JSON：
{
  "versions": [
    {
      "id": "template",
      "name": "${templateName}",
      "styleTag": "${templateStyleTag}",
      "description": "按模板生成的演示文稿",
      "slides": [
        { "page": 1, "title": "页标题", "bullets": ["要点1", "要点2"] }
      ]
    }
  ]
}`;
}

export function promptPpt(copyBody, audience = '公众', userNote = '') {
  return `基于以下内容 Brief（可为文案、素材摘要或用户需求），生成 5 页 PPT 结构（受众：${audience}）。

内容 Brief：
${copyBody}

${userNote ? `要求：${userNote}` : ''}

请以 JSON 返回：
{
  "slides": [
    { "page": 1, "title": "页标题", "bullets": ["要点1", "要点2"], "speakerNotes": "演讲备注" }
  ]
}`;
}

export function promptPoster(copyBody, userNote = '', template = null) {
  const styleBlock = template
    ? `【内置模板】${template.name}
版式：${template.layoutHint}
风格：${template.styleHint}
请严格按该模板的版式与气质生成 SVG，品牌色仍为拜耳蓝 #103C8F、绿 #69BE28。`
    : userNote
      ? `风格要求：${userNote}`
      : '风格：清爽、少营销感、蓝绿渐变背景';

  return `为拜耳「可申达」疾病教育渠道生成海报 SVG（viewBox="0 0 900 560"）。
含 Bayer 标识区域、主标题、副文案、底部免责声明条。不要包含外部图片链接，纯 SVG。

内容 Brief（文案、话题或用户描述均可）：
${copyBody}

${styleBlock}
${userNote && template ? `\n补充说明：${userNote}` : ''}

只返回 JSON：
{
  "title": "海报标题",
  "svg": "<svg>...</svg>"
}`;
}

export function promptPosterEdit(svg, editPrompt, maskBounds, layers = []) {
  const maskDesc = maskBounds
    ? `用户圈选区域（相对画布百分比）：x=${maskBounds.x.toFixed(1)}%, y=${maskBounds.y.toFixed(1)}%, 宽=${maskBounds.w.toFixed(1)}%, 高=${maskBounds.h.toFixed(1)}%`
    : '用户未圈选具体区域，请按整体指令调整。';

  const layerDesc =
    layers.length > 0
      ? '\n拖拽后的文字图层位置（viewBox 900x560 坐标）：\n' +
        layers.map((l) => `- ${l.id}: "${l.text.replace(/\n/g, ' ')}" @ (${Math.round(l.x)}, ${Math.round(l.y)})`).join('\n')
      : '';

  return `请修改以下 SVG 海报。${maskDesc}
修改要求：${editPrompt}
${layerDesc}

当前 SVG：
${svg || '（无，请生成新的拜耳蓝绿风格 900x560 疾病教育海报 SVG）'}

保持 viewBox="0 0 900 560"，不要外链图片，拜耳蓝 #103C8F、绿 #69BE28。

只返回 JSON：
{
  "title": "海报标题",
  "svg": "<svg viewBox=\\"0 0 900 560\\" ...>...</svg>"
}`;
}

export function promptSessionTitle(conversationSnippet) {
  return `根据以下可申达（慢性肾病/肾脏健康）内容创作对话片段，为这次会话生成一个简短中文标题。

要求：
- 15 字以内（不含品牌前缀）
- 概括用户核心目标或主题
- 不要引号、不要句号
- 只返回标题正文，不要 JSON

对话片段：
${conversationSnippet}`;
}

export const SYSTEM_CHAT = `${SYSTEM_BASE}

你是对话引导助手，帮助用户推进可申达内容生产（洞察 → 文案 → 配图/视频/PPT → 提交）。
严格遵守：
- 用户或历史对话里已给出的受众、渠道、场景、主题，不要重复追问
- 每次最多补问 1 个关键缺失信息；否则直接给出可执行的下一步（如「生成文案」「生成PPT」）
- 回复 2～4 句，专业简洁，不要长清单式盘问
- 结合默认素材推断合理默认值，勿反复确认`;

export function promptChat(materials, history, userMessage) {
  const hist = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? '用户' : '助手'}: ${m.content.replace(/<[^>]+>/g, '')}`)
    .join('\n');

  return `引用素材：
${materials}

近期对话：
${hist || '（无）'}

用户消息：${userMessage}

请简洁回复。若信息已足够，直接建议用户发送或点击对应生成指令；不要重复确认已知信息。直接返回纯文本，不要 JSON。`;
}
