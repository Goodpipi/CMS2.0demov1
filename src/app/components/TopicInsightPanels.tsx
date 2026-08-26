import type { TopicItem } from '@/types/content';
import type {
  HotInsightReport,
  TopicRecommendationItem,
} from '@/lib/topicInsightAgent';
import { isDemoMode, loadDemoScenario, type DemoScenario } from '@/lib/demoMode';

type OpenDetail = (title: string, body: string) => void;

type HotInsightReportPanelProps = {
  report: HotInsightReport;
  insightSummary: string;
  topics: TopicItem[];
  selectedTopics: boolean[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<boolean[]>>;
  copyCountPerTopic: number;
  setCopyCountPerTopic: (n: number) => void;
  onDownload: () => void;
  onRunCopy: () => void;
  onExpandTopics: () => void;
  openDetail: OpenDetail;
  fillQuick: (text: string) => void;
};

const DEMO_REPORT_TITLES: Record<DemoScenario, string> = {
  'patient-education': '肾脏健康 C 端用户洞察报告',
  academic: '学术会议受众洞察报告',
  hcp: 'HCP 沟通洞察报告',
};

const DEMO_METRICS = [
  {
    value: '30%',
    label: '评论提及「早期信号不明显 / 风险被忽视」相关认知冲突',
  },
  {
    value: '+120%',
    label: '「筛查 / 早期信号」搜索量同比增速，流量上行通道',
  },
  {
    value: '71%',
    label: '咨询集中在风险因素 / 筛查 / 就医建议三类主诉',
  },
  {
    value: '2.3x',
    label: '「健康管理」话题互动率高于赛道均值，蓝海机会',
  },
];

export function HotInsightReportPanel({
  report,
  insightSummary,
  topics,
  selectedTopics,
  setSelectedTopics,
  copyCountPerTopic,
  setCopyCountPerTopic,
  onDownload,
  onRunCopy,
  onExpandTopics,
  openDetail,
  fillQuick,
}: HotInsightReportPanelProps) {
  if (isDemoMode()) {
    return (
      <DemoHotInsightReportPanel
        report={report}
        insightSummary={insightSummary}
        topics={topics}
        selectedTopics={selectedTopics}
        setSelectedTopics={setSelectedTopics}
        copyCountPerTopic={copyCountPerTopic}
        setCopyCountPerTopic={setCopyCountPerTopic}
        onDownload={onDownload}
        onRunCopy={onRunCopy}
        onExpandTopics={onExpandTopics}
        openDetail={openDetail}
        fillQuick={fillQuick}
      />
    );
  }

  return (
    <>
      <div className="detail-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h4>话题洞察报告</h4>
            <div className="small">{insightSummary || report.summary}</div>
          </div>
          <button type="button" className="btn soft" onClick={onDownload}>
            下载洞察报告
          </button>
        </div>
      </div>

      <div className="detail-card">
        <h4>洞察摘要</h4>
        <div className="small">{report.summary}</div>
      </div>

      <div className="detail-card">
        <h4>使用素材</h4>
        <div className="small">
          <strong>热点洞察：</strong>
          {report.usedHotMaterials.join('、')}
        </div>
        {report.usedDefaultMaterials.length > 0 && (
          <div className="small" style={{ marginTop: 6 }}>
            <strong>其他任务素材：</strong>
            {report.usedDefaultMaterials.join('、')}
          </div>
        )}
      </div>

      <div className="detail-card">
        <h4>热点趋势</h4>
        <ul className="insight-bullet-list">
          {report.hotTrends.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="detail-card">
        <h4>关键受众关注点</h4>
        <ul className="insight-bullet-list">
          {report.audienceFocus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="detail-card">
        <h4>推荐话题方向</h4>
        <label className="option" style={{ marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={selectedTopics.length > 0 && selectedTopics.every(Boolean)}
            onChange={(e) => setSelectedTopics(topics.map(() => e.target.checked))}
          />
          <div>
            <strong>全选</strong>
          </div>
        </label>
        {report.topics.map((topic, i) => (
          <label
            key={topic.title}
            className="option content-tile"
            onClick={() =>
              openDetail(
                topic.title,
                `来源：${topic.source}<br>推荐理由：${topic.reason}<br>推荐受众：${topic.audience}<br>推荐渠道：${topic.channel}<br>建议下一步：${topic.nextActions.join('、')}`
              )
            }
          >
            <input
              type="checkbox"
              onClick={(e) => e.stopPropagation()}
              checked={selectedTopics[i] ?? false}
              onChange={(e) => {
                setSelectedTopics((prev) => {
                  const next = [...prev];
                  next[i] = e.target.checked;
                  return next;
                });
              }}
            />
            <div>
              <strong>{topic.title}</strong>
              <div className="small">{topic.reason}</div>
              <div className="small">
                受众：{topic.audience} · 渠道：{topic.channel}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="detail-card">
        <h4>推荐下一步</h4>
        <div className="quick-row">
          {['生成文案', '生成图片', '生成PPT大纲', '直接生成视频'].map((action) => (
            <button key={action} type="button" className="btn soft" onClick={() => fillQuick(action)}>
              {action}
            </button>
          ))}
        </div>
      </div>

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
        <button type="button" className="btn primary" onClick={onRunCopy}>
          基于选中话题生成文案
        </button>
        <button type="button" className="btn" onClick={onExpandTopics}>
          拓展话题
        </button>
      </div>
    </>
  );
}

function DemoHotInsightReportPanel({
  report,
  insightSummary,
  topics,
  selectedTopics,
  setSelectedTopics,
  copyCountPerTopic,
  setCopyCountPerTopic,
  onDownload,
  onRunCopy,
  onExpandTopics,
  openDetail,
  fillQuick,
}: HotInsightReportPanelProps) {
  const scenario = loadDemoScenario();
  const reportTitle = DEMO_REPORT_TITLES[scenario];
  const selectedCount = selectedTopics.filter(Boolean).length;

  return (
    <div className="demo-insight-report">
      <section className="demo-module-block">
        <div className="demo-module-title">
          <span className="demo-module-marker" aria-hidden />
          <span>模块 1 / 2 · 洞察报告</span>
        </div>

        <div className="demo-download-card">
          <div>
            <h4>洞察报告已生成</h4>
            <p>可下载完整 PDF 留档（含数据来源 / 核心信号明细）</p>
          </div>
          <button type="button" className="demo-download-btn" onClick={onDownload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            下载本份 PDF
          </button>
        </div>

        <div className="demo-highlight-card">
          <div className="demo-highlight-kicker">HIGHLIGHT</div>
          <h4>{reportTitle}</h4>
          <p>{insightSummary || report.summary}</p>
          <div className="demo-metric-grid">
            {DEMO_METRICS.map((metric) => (
              <div key={metric.value} className="demo-metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-module-block">
        <div className="demo-module-title">
          <span className="demo-module-marker" aria-hidden />
          <span>模块 2 / 2 · 选题建议</span>
        </div>

        <div className="demo-topic-toolbar">
          <div className="demo-topic-count">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.91-1.74 1.65-2.53A6 6 0 1 0 7.26 11.47c.74.79 1.47 1.55 1.65 2.53" />
            </svg>
            <strong>共 {report.topics.length} 条选题</strong>
          </div>
          <label className="demo-select-all">
            <input
              type="checkbox"
              checked={selectedTopics.length > 0 && selectedTopics.every(Boolean)}
              onChange={(e) => setSelectedTopics(topics.map(() => e.target.checked))}
            />
            全选
          </label>
        </div>

        <div className="demo-topic-list">
          {report.topics.map((topic, i) => {
            return (
              <label
                key={topic.title}
                className="demo-topic-card"
                onClick={() =>
                  openDetail(
                    topic.title,
                    `来源：${topic.source}<br>推荐理由：${topic.reason}<br>推荐受众：${topic.audience}<br>推荐渠道：${topic.channel}<br>建议下一步：${topic.nextActions.join('、')}`
                  )
                }
              >
                <input
                  type="checkbox"
                  className="demo-topic-check"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedTopics[i] ?? false}
                  onChange={(e) => {
                    setSelectedTopics((prev) => {
                      const next = [...prev];
                      next[i] = e.target.checked;
                      return next;
                    });
                  }}
                />
                <div className="demo-topic-main">
                  <div className="demo-topic-head">
                    <span className="demo-priority-badge">P{i === 0 ? '0' : i}</span>
                    <strong>{topic.title}</strong>
                  </div>
                  <p>
                    {topic.audience} / {topic.channel} · {topic.source}
                  </p>
                  <div className="demo-topic-reason">{topic.reason}</div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <div className="demo-topic-actions">
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
        <div className="quick-row">
          <button type="button" className="btn primary" onClick={onRunCopy}>
            基于已选 {selectedCount || 0} 条生成文案
          </button>
          <button type="button" className="btn soft" onClick={onExpandTopics}>
            拓展话题
          </button>
          {['生成图片', '生成PPT大纲', '直接生成视频'].map((action) => (
            <button key={action} type="button" className="btn soft" onClick={() => fillQuick(action)}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopicRecommendationPanel({
  items,
  selectedTopics,
  setSelectedTopics,
  onRunCopy,
  onStartPptFlow,
  onStartVisualFlow,
  openDetail,
}: {
  items: TopicRecommendationItem[];
  selectedTopics: boolean[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<boolean[]>>;
  onRunCopy: () => void;
  onStartPptFlow: () => void;
  onStartVisualFlow: () => void;
  openDetail: OpenDetail;
}) {
  return (
    <>
      <div className="detail-card">
        <h4>话题推荐</h4>
        <div className="small">
          本次未使用专门的热点洞察素材，推荐话题基于品牌 briefing、参考知识、合规手册与渠道特色生成。
        </div>
      </div>

      <label className="option" style={{ marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={selectedTopics.length > 0 && selectedTopics.every(Boolean)}
          onChange={(e) => setSelectedTopics(items.map(() => e.target.checked))}
        />
        <div>
          <strong>全选</strong>
        </div>
      </label>

      {items.map((item, i) => (
        <label
          key={item.title}
          className="option content-tile"
          onClick={() =>
            openDetail(
              item.title,
              `推荐理由：${item.reason}<br>适合受众：${item.audience}<br>适合渠道：${item.channel}<br>可生成：${item.contentTypes.join('、')}`
            )
          }
        >
          <input
            type="checkbox"
            onClick={(e) => e.stopPropagation()}
            checked={selectedTopics[i] ?? false}
            onChange={(e) => {
              setSelectedTopics((prev) => {
                const next = [...prev];
                next[i] = e.target.checked;
                return next;
              });
            }}
          />
          <div>
            <strong>{item.title}</strong>
            <div className="small">{item.reason}</div>
            <div className="small">
              受众：{item.audience} · 渠道：{item.channel}
            </div>
            <div className="small">可生成：{item.contentTypes.join('、')}</div>
          </div>
        </label>
      ))}

      <div className="quick-row">
        <button type="button" className="btn primary" onClick={onRunCopy}>
          基于所选话题生成文案
        </button>
        <button type="button" className="btn soft" onClick={onStartPptFlow}>
          基于所选话题生成PPT大纲
        </button>
        <button type="button" className="btn soft" onClick={onStartVisualFlow}>
          基于所选话题生成图片
        </button>
      </div>
    </>
  );
}
