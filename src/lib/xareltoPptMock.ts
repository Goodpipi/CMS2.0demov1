import type { PptSlide } from '@/types/content';

/** 生成 PPT 的演示数据：医学与推广内容｜拜瑞妥（房颤卒中预防），页面为原 PPT 导出的图片 */
const XARELTO_AF_SLIDE_DIR = '/demo-assets/xarelto-af-ppt';

export function xareltoAfSlideUrl(page: number, variant = ''): string {
  return `${XARELTO_AF_SLIDE_DIR}/slide-${String(page).padStart(2, '0')}${variant}.jpg`;
}

function rasterSlideSvg(url: string, overlay = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1600 900"><image data-edit-id="el-bg" href="${url}" xlink:href="${url}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid meet"/>${overlay}</svg>`;
}

type XareltoSlideSeed = Omit<PptSlide, 'svg'> & {
  /** 叠加在「已抹除文字」底图上的可编辑文字与图片，用于演示手动编辑 */
  overlay?: string;
};

const XARELTO_AF_SLIDE_TEXT: XareltoSlideSeed[] = [
  {
    page: 1,
    title: "房颤卒中预防：从风险识别到剂量管理",
    bullets: ["非瓣膜性房颤循证证据与利伐沙班临床应用", "拜瑞妥®（利伐沙班）"],
    speakerNotes: "开场点明主题：围绕非瓣膜性房颤卒中预防，从风险识别、循证证据到剂量管理逐步展开。",
  },
  {
    page: 2,
    title: "目录",
    bullets: ["01 疾病现状与卒中预防", "02 指南与核心循证：利伐沙班在非瓣膜性房颤中的证据位置", "03 复杂临床情境：从单项研究结果走向抗凝方案选择", "04 剂量管理与临床落地：把循证优势转化为可执行处方"],
    speakerNotes: "按四个章节预告汇报结构：疾病现状、指南与核心循证、复杂临床情境、剂量管理与临床落地。",
    overlay: "<text x=\"90\" y=\"134\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"35\" font-weight=\"700\" fill=\"#492c74\">目录</text><text x=\"202\" y=\"267\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"35\" font-weight=\"700\" fill=\"#482c74\">01 疾病现状与卒中预防</text><text x=\"202\" y=\"387\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"35\" font-weight=\"700\" fill=\"#74678d\">02 指南与核心循证：利伐沙班在非瓣膜性房颤中的证据位置</text><text x=\"202\" y=\"507\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"35\" font-weight=\"700\" fill=\"#74678d\">03 复杂临床情境：从单项研究结果走向抗凝方案选择</text><text x=\"202\" y=\"627\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"35\" font-weight=\"700\" fill=\"#74678d\">04 剂量管理与临床落地：把循证优势转化为可执行处方</text><image href=\"/other/platelet-antithrombotic.svg\" xlink:href=\"/other/platelet-antithrombotic.svg\" x=\"1180\" y=\"400\" width=\"340\" height=\"191\" preserveAspectRatio=\"xMidYMid meet\"/>",
  },
  {
    page: 3,
    title: "上海真实世界数据：房颤负担随年龄显著上升",
    bullets: ["上海市医保数据库研究覆盖2015—2020年超过3000万居民，纳入近全市人群的真实世界数据，用于描述房颤流行病学、管理与临床结局。"],
    speakerNotes: "上海市医保数据库研究覆盖2015—2020年超过3000万居民，纳入近全市人群的真实世界数据，用于描述房颤流行病学、管理与临床结局。",
    overlay: "<text x=\"87\" y=\"134\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"37\" font-weight=\"700\" fill=\"#482c74\">上海真实世界数据：房颤负担随年龄显著上升</text><circle cx=\"130\" cy=\"238\" r=\"3\" fill=\"#444145\"/><text x=\"172\" y=\"246\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"21.5\" font-weight=\"400\" fill=\"#46414e\">上海市医保数据库研究覆盖2015—2020年超过3000万居民，纳入近全市人群的真实世界数据，用于描述房颤流行病学、管理与临床结局。¹</text><text x=\"127\" y=\"297\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"20\" font-weight=\"700\" fill=\"#4f2e7d\">房颤患病率（按年龄分层）</text><text x=\"127\" y=\"334\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\">患病率（%）</text><rect x=\"205\" y=\"349\" width=\"615\" height=\"1\" fill=\"#e4e3e9\"/><text x=\"187\" y=\"355\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\" text-anchor=\"end\">8</text><rect x=\"205\" y=\"424\" width=\"615\" height=\"1\" fill=\"#e4e3e9\"/><text x=\"187\" y=\"430\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\" text-anchor=\"end\">6</text><rect x=\"205\" y=\"499\" width=\"615\" height=\"1\" fill=\"#e4e3e9\"/><text x=\"187\" y=\"505\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\" text-anchor=\"end\">4</text><rect x=\"205\" y=\"574\" width=\"615\" height=\"1\" fill=\"#e4e3e9\"/><text x=\"187\" y=\"580\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\" text-anchor=\"end\">2</text><text x=\"187\" y=\"655\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\" text-anchor=\"end\">0</text><rect x=\"205\" y=\"649\" width=\"615\" height=\"1.5\" fill=\"#8a8a8a\"/><rect x=\"237\" y=\"647.5\" width=\"80\" height=\"1.5\" fill=\"#4f2e7d\"/><text x=\"277\" y=\"638\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#555357\" text-anchor=\"middle\">0.002%</text><text x=\"277\" y=\"678\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#46454a\" text-anchor=\"middle\">18岁以下</text><rect x=\"395\" y=\"639.2\" width=\"80\" height=\"9.8\" fill=\"#4f2e7d\"/><text x=\"435\" y=\"629\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#555357\" text-anchor=\"middle\">0.26%</text><text x=\"435\" y=\"678\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#46454a\" text-anchor=\"middle\">18—64岁</text><rect x=\"550\" y=\"558.2\" width=\"80\" height=\"90.8\" fill=\"#4f2e7d\"/><text x=\"590\" y=\"548\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#555357\" text-anchor=\"middle\">2.42%</text><text x=\"590\" y=\"678\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#46454a\" text-anchor=\"middle\">65—80岁</text><rect x=\"707\" y=\"397.8\" width=\"80\" height=\"251.2\" fill=\"#4f2e7d\"/><text x=\"747\" y=\"388\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"700\" fill=\"#b00a0a\" text-anchor=\"middle\">6.70%</text><text x=\"747\" y=\"678\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#46454a\" text-anchor=\"middle\">80岁以上</text><text x=\"127\" y=\"726\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"17\" font-weight=\"400\" fill=\"#666468\">注：以上比例为各年龄层人群中的房颤患病率。¹</text><rect x=\"900\" y=\"270\" width=\"562\" height=\"210\" rx=\"10\" fill=\"#f6f3fa\"/><rect x=\"900\" y=\"270\" width=\"5\" height=\"210\" fill=\"#eb038d\"/><text x=\"929\" y=\"331\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"40\" font-weight=\"700\" fill=\"#b00a0a\">0.88%</text><text x=\"1081\" y=\"323\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"19\" font-weight=\"700\" fill=\"#4f2e7d\">该研究报告的成人房颤患病率¹</text><text x=\"929\" y=\"388\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"19\" font-weight=\"400\" fill=\"#46414e\">按年龄分层，65—80岁人群为2.42%，80岁以上人群</text><text x=\"929\" y=\"422\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"19\" font-weight=\"400\" fill=\"#46414e\">达到6.70%，提示房颤负担随年龄增长而明显上升。¹</text><rect x=\"900.5\" y=\"510.5\" width=\"561\" height=\"209\" rx=\"10\" fill=\"#ffffff\" stroke=\"#e4e4e6\" stroke-width=\"1.5\"/><text x=\"929\" y=\"552\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"700\" fill=\"#4f2e7d\">数据口径与解读限定</text><text x=\"929\" y=\"602\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#46414e\">该研究为医保数据库观察性分析，数据反映上海临床</text><text x=\"929\" y=\"632\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#46414e\">诊断房颤人群的区域负担，不将患病率结果解释为</text><text x=\"929\" y=\"662\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"18\" font-weight=\"400\" fill=\"#46414e\">因果效应。¹</text><text x=\"90\" y=\"783\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"12.5\" font-weight=\"400\" fill=\"#8f8a94\">¹ P3-1Chen M, et al. Lancet Reg Health West Pac. 2022 May 3;23100470. Epidemiology, management, and outcomes of atrial fibrillation among 30 million citizens in Shanghai,</text><text x=\"90\" y=\"799\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"12.5\" font-weight=\"400\" fill=\"#8f8a94\">China from 2015 to 2020: A medical insurance database study</text>",
  },
  {
    page: 4,
    title: "房颤的长期风险：卒中预防是管理核心目标",
    bullets: ["上海医保数据库研究对2015年首次诊断房颤患者随访至2020年，平均随访时间为5.5年，观察急性心肌梗死、卒中、短暂性脑缺血发作（TIA）、出血和体循环栓塞等临床事件。"],
    speakerNotes: "上海医保数据库研究对2015年首次诊断房颤患者随访至2020年，平均随访时间为5.5年，观察急性心肌梗死、卒中、短暂性脑缺血发作（TIA）、出血和体循环栓塞等临床事件。",
  },
  {
    page: 5,
    title: "卒中风险分层：从房颤诊断走向危险因素组合",
    bullets: ["2024年中国房颤指南采用CHA₂DS₂-VASc-60评分评估房颤患者血栓栓塞风险；评分因素包括心衰、高血压、年龄、糖尿病、既往卒中/TIA/体循环栓塞、血管病和女性性别。"],
    speakerNotes: "2024年中国房颤指南采用CHA₂DS₂-VASc-60评分评估房颤患者血栓栓塞风险；评分因素包括心衰、高血压、年龄、糖尿病、既往卒中/TIA/体循环栓塞、血管病和女性性别。",
  },
  {
    page: 6,
    title: "指南阈值：达到风险水平后应进入口服抗凝路径",
    bullets: ["2024年《中国房颤诊断与管理指南》建议使用CHA₂DS₂-VASc-60评分评估房颤患者血栓栓塞风险，推荐等级Ⅰ、证据等级B。"],
    speakerNotes: "2024年《中国房颤诊断与管理指南》建议使用CHA₂DS₂-VASc-60评分评估房颤患者血栓栓塞风险，推荐等级Ⅰ、证据等级B。",
  },
  {
    page: 7,
    title: "高出血风险：需要管理，不等同于放弃卒中预防",
    bullets: ["2024年中国房颤指南建议在启动及整个抗凝过程中定期评估出血风险，及时识别和处理可干预因素。"],
    speakerNotes: "2024年中国房颤指南建议在启动及整个抗凝过程中定期评估出血风险，及时识别和处理可干预因素。",
  },
  {
    page: 8,
    title: "临床问题前移：从“是否抗凝”到“如何持续管理”",
    bullets: ["入口：已确诊房颤患者，需要评估卒中/体循环栓塞预防需求。"],
    speakerNotes: "入口：已确诊房颤患者，需要评估卒中/体循环栓塞预防需求。",
  },
  {
    page: 9,
    title: "指南定位：多数非瓣膜性房颤优先考虑NOAC",
    bullets: ["2023 ACC/AHA/ACCP/HRS指南指出，DOAC在房颤患者中通常作为优先于华法林的一线口服抗凝治疗；该路径不适用于机械心脏瓣膜或中重度二尖瓣狭窄等特定情形。"],
    speakerNotes: "2023 ACC/AHA/ACCP/HRS指南指出，DOAC在房颤患者中通常作为优先于华法林的一线口服抗凝治疗；该路径不适用于机械心脏瓣膜或中重度二尖瓣狭窄等特定情形。",
  },
  {
    page: 10,
    title: "四项关键Ⅲ期研究：各自回答与华法林比较的问题",
    bullets: ["RE-LY、ROCKET AF、ARISTOTLE和ENGAGE AF-TIMI 48均以华法林为对照，围绕房颤卒中/体循环栓塞预防及出血安全性建立各自的随机对照证据。"],
    speakerNotes: "RE-LY、ROCKET AF、ARISTOTLE和ENGAGE AF-TIMI 48均以华法林为对照，围绕房颤卒中/体循环栓塞预防及出血安全性建立各自的随机对照证据。",
  },
  {
    page: 11,
    title: "ROCKET AF：高卒中风险非瓣膜性房颤的随机对照设计",
    bullets: ["研究设计问题：在高卒中风险非瓣膜性房颤人群中，利伐沙班每日1次、按肾功能调整的方案能否在卒中/体循环栓塞预防方面达到预设的非劣效标准，并同步评价出血结局。"],
    speakerNotes: "研究设计问题：在高卒中风险非瓣膜性房颤人群中，利伐沙班每日1次、按肾功能调整的方案能否在卒中/体循环栓塞预防方面达到预设的非劣效标准，并同步评价出血结局。",
  },
  {
    page: 12,
    title: "ROCKET AF：卒中和体循环栓塞预防达到非劣效",
    bullets: ["主要疗效结果的临床含义是：在ROCKET AF纳入的高卒中风险非瓣膜性房颤人群中，利伐沙班方案提供了与华法林比较的循证抗凝选择。"],
    speakerNotes: "主要疗效结果的临床含义是：在ROCKET AF纳入的高卒中风险非瓣膜性房颤人群中，利伐沙班方案提供了与华法林比较的循证抗凝选择。",
    overlay: "<text x=\"88\" y=\"134\" font-family=\"Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif\" font-size=\"37\" font-weight=\"700\" fill=\"#482c74\">ROCKET AF：卒中和体循环栓塞预防达到非劣效</text>",
  },
  {
    page: 13,
    title: "ROCKET AF：总体主要出血相近，但出血谱不同",
    bullets: ["ROCKET AF安全性分析：三类出血终点的组间比较"],
    speakerNotes: "ROCKET AF安全性分析：三类出血终点的组间比较",
  },
  {
    page: 14,
    title: "高风险亚组：关键临床特征下的疗效方向保持一致",
    bullets: ["2023 ACC/AHA/ACCP/HRS指南汇总了ROCKET AF等关键试验的事后亚组分析，指出不同基线特征下卒中或体循环栓塞预防的疗效方向总体保持一致。"],
    speakerNotes: "2023 ACC/AHA/ACCP/HRS指南汇总了ROCKET AF等关键试验的事后亚组分析，指出不同基线特征下卒中或体循环栓塞预防的疗效方向总体保持一致。",
  },
  {
    page: 15,
    title: "高龄真实世界应用：研究结果与临床处方需分开解读",
    bullets: ["高龄房颤患者常合并多病共存、多药治疗和肾功能变化；2024年中国老年房颤指南执行摘要强调，高龄患者抗栓策略应结合卒中风险、出血风险、患者因素和动态监测进行管理。"],
    speakerNotes: "高龄房颤患者常合并多病共存、多药治疗和肾功能变化；2024年中国老年房颤指南执行摘要强调，高龄患者抗栓策略应结合卒中风险、出血风险、患者因素和动态监测进行管理。",
  },
  {
    page: 16,
    title: "瓣膜病边界：非瓣膜性房颤不等于完全没有瓣膜病",
    bullets: ["“非瓣膜性房颤”在临床应用中需要进一步核对瓣膜类型；主动脉瓣狭窄、二尖瓣反流等瓣膜病与机械心脏瓣膜、中重度二尖瓣狭窄的证据边界不同。"],
    speakerNotes: "“非瓣膜性房颤”在临床应用中需要进一步核对瓣膜类型；主动脉瓣狭窄、二尖瓣反流等瓣膜病与机械心脏瓣膜、中重度二尖瓣狭窄的证据边界不同。",
  },
  {
    page: 17,
    title: "肾功能不全：同时改变卒中风险、出血风险与药物暴露",
    bullets: ["肾功能不全会同时影响房颤患者的血栓栓塞风险、出血风险和NOAC暴露量，因此肾功能评估既是风险分层环节，也是剂量选择环节。"],
    speakerNotes: "肾功能不全会同时影响房颤患者的血栓栓塞风险、出血风险和NOAC暴露量，因此肾功能评估既是风险分层环节，也是剂量选择环节。",
  },
  {
    page: 18,
    title: "房颤合并PCI：抗凝与抗血小板需要同时设计",
    bullets: ["房颤合并急性冠脉综合征或PCI时，治疗目标从单纯卒中预防扩展为同时管理房颤栓塞风险、支架血栓风险和联合抗栓出血风险。"],
    speakerNotes: "房颤合并急性冠脉综合征或PCI时，治疗目标从单纯卒中预防扩展为同时管理房颤栓塞风险、支架血栓风险和联合抗栓出血风险。",
  },
  {
    page: 19,
    title: "PCI联合抗栓剂量：研究方案不等同于长期卒中预防标准剂量",
    bullets: ["PIONEER AF-PCI中的利伐沙班剂量属于PCI联合抗栓研究方案，服务于特定的抗凝与抗血小板联合场景。"],
    speakerNotes: "PIONEER AF-PCI中的利伐沙班剂量属于PCI联合抗栓研究方案，服务于特定的抗凝与抗血小板联合场景。",
  },
  {
    page: 20,
    title: "PCI术后路径：缩短三联治疗，动态权衡缺血与出血",
    bullets: ["2025年中国房颤指南建议，房颤合并ACS或PCI时优先使用DOAC联合抗血小板的策略，并根据ACS/慢性冠脉综合征、PCI复杂程度和风险组合确定三联治疗时长。"],
    speakerNotes: "2025年中国房颤指南建议，房颤合并ACS或PCI时优先使用DOAC联合抗血小板的策略，并根据ACS/慢性冠脉综合征、PCI复杂程度和风险组合确定三联治疗时长。",
  },
  {
    page: 21,
    title: "围复律抗凝：用时间轴管理复律前后风险",
    bullets: ["围复律抗凝需要同时核对房颤持续时间、复律前抗凝、经食管超声（TEE）或其他影像学排除心房血栓、复律后抗凝和基础卒中风险。"],
    speakerNotes: "围复律抗凝需要同时核对房颤持续时间、复律前抗凝、经食管超声（TEE）或其他影像学排除心房血栓、复律后抗凝和基础卒中风险。",
  },
  {
    page: 22,
    title: "高龄与多病共存：把“高风险”转化为管理计划",
    bullets: ["高龄、心衰、既往出血、贫血、肾功能变化和多种合并用药会叠加影响房颤患者的卒中风险、出血风险和用药安全。"],
    speakerNotes: "高龄、心衰、既往出血、贫血、肾功能变化和多种合并用药会叠加影响房颤患者的卒中风险、出血风险和用药安全。",
  },
  {
    page: 23,
    title: "同类药物比较：坚持同研究、同终点、同方案",
    bullets: ["各NOAC关键Ⅲ期试验均以华法林为对照，但研究人群、剂量方案、华法林治疗质量、随访时间和终点定义并不完全相同。"],
    speakerNotes: "各NOAC关键Ⅲ期试验均以华法林为对照，但研究人群、剂量方案、华法林治疗质量、随访时间和终点定义并不完全相同。",
  },
  {
    page: 24,
    title: "复杂情境决策矩阵：先确认适用范围，再匹配证据与剂量",
    bullets: ["入口：房颤患者需要选择或调整抗凝方案，尤其是合并肾功能异常、PCI/ACS、拟复律、心衰、高龄或既往出血时。"],
    speakerNotes: "入口：房颤患者需要选择或调整抗凝方案，尤其是合并肾功能异常、PCI/ACS、拟复律、心衰、高龄或既往出血时。",
  },
  {
    page: 25,
    title: "NVAF长期卒中预防：利伐沙班房颤剂量主线清晰",
    bullets: ["对于非瓣膜性房颤长期卒中和体循环栓塞预防，利伐沙班的剂量主线按CrCl分层：CrCl≥50 mL/min为20 mg每日1次，CrCl 15—49 mL/min为15 mg每日1次。"],
    speakerNotes: "对于非瓣膜性房颤长期卒中和体循环栓塞预防，利伐沙班的剂量主线按CrCl分层：CrCl≥50 mL/min为20 mg每日1次，CrCl 15—49 mL/min为15 mg每日1次。",
  },
  {
    page: 26,
    title: "剂量判断以CrCl为核心：不把年龄或单项化验直接等同于减量",
    bullets: ["利伐沙班房颤剂量的主要肾功能分层依据为肌酐清除率（CrCl）；首次处方和随访时应结合年龄、体重、血清肌酐及临床状态重新确认剂量。"],
    speakerNotes: "利伐沙班房颤剂量的主要肾功能分层依据为肌酐清除率（CrCl）；首次处方和随访时应结合年龄、体重、血清肌酐及临床状态重新确认剂量。",
  },
  {
    page: 27,
    title: "肾功能是动态变量：急性变化后及时复核CrCl",
    bullets: ["房颤抗凝过程中应定期评估出血风险和可干预因素；肾功能变化会同时影响药物暴露、出血风险和剂量适配。"],
    speakerNotes: "房颤抗凝过程中应定期评估出血风险和可干预因素；肾功能变化会同时影响药物暴露、出血风险和剂量适配。",
  },
  {
    page: 28,
    title: "减量规则不能交叉套用：不同NOAC触发条件不同",
    bullets: ["不同NOAC的减量条件并不相同；利伐沙班房颤剂量主要按CrCl分层，其他NOAC还可能叠加年龄、体重、血清肌酐或相互作用等条件。"],
    speakerNotes: "不同NOAC的减量条件并不相同；利伐沙班房颤剂量主要按CrCl分层，其他NOAC还可能叠加年龄、体重、血清肌酐或相互作用等条件。",
  },
  {
    page: 29,
    title: "联合用药核对：先确认适应证，再缩短不必要的暴露",
    bullets: ["NOAC选择和剂量管理需要同步核对代谢途径、潜在药物相互作用、抗血小板药、非甾体抗炎药及其他增加出血风险的治疗。"],
    speakerNotes: "NOAC选择和剂量管理需要同步核对代谢途径、潜在药物相互作用、抗血小板药、非甾体抗炎药及其他增加出血风险的治疗。",
  },
  {
    page: 30,
    title: "服药与异常情况处理：用简单流程提高连续用药",
    bullets: ["20 mg或15 mg规格用于非瓣膜性房颤卒中预防时，应按中国说明书要求随餐服用，并通过每日固定时间、用药清单和复诊核对提高依从性。"],
    speakerNotes: "20 mg或15 mg规格用于非瓣膜性房颤卒中预防时，应按中国说明书要求随餐服用，并通过每日固定时间、用药清单和复诊核对提高依从性。",
  },
  {
    page: 31,
    title: "产品简处页：拜瑞妥®（利伐沙班）房颤剂量与关键信息汇总",
    bullets: ["【产品名称】拜瑞妥®为利伐沙班片；本页仅作产品信息汇总，最终以当前中国批准说明书、包装和医院处方规范为准。"],
    speakerNotes: "【产品名称】拜瑞妥®为利伐沙班片；本页仅作产品信息汇总，最终以当前中国批准说明书、包装和医院处方规范为准。",
  },
  {
    page: 32,
    title: "三个处方情境：风险分层—证据匹配—剂量核对—持续随访",
    bullets: ["共同入口：确认NOAC适用范围、计算CHA₂DS₂-VASc-60风险、排除抗凝绝对禁忌并核对CrCl。"],
    speakerNotes: "共同入口：确认NOAC适用范围、计算CHA₂DS₂-VASc-60风险、排除抗凝绝对禁忌并核对CrCl。",
  },
];

export const XARELTO_AF_SLIDES: PptSlide[] = XARELTO_AF_SLIDE_TEXT.map(({ overlay, ...slide }) => ({
  ...slide,
  imageUrl: xareltoAfSlideUrl(slide.page),
  svg: overlay
    ? rasterSlideSvg(xareltoAfSlideUrl(slide.page, '-bg'), overlay)
    : rasterSlideSvg(xareltoAfSlideUrl(slide.page)),
}));
