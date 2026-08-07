import type { TerminologyDraft, TerminologyEntry } from '@/types/terminology';

export const TERMINOLOGY_CSV_HEADERS = [
  '源术语',
  '标准译文',
  '源语言',
  '目标语言',
  '领域',
  '备注',
] as const;

const TEMPLATE_ROWS: string[][] = [
  ['慢性肾脏病', 'Chronic Kidney Disease (CKD)', 'zh', 'en', '肾病', '正式医学名称'],
  ['蛋白尿', 'proteinuria', 'zh', 'en', '肾病', ''],
  ['Healthcare Professional', '医疗卫生专业人士（HCP）', 'en', 'zh', '传播', '对内可保留 HCP'],
];

function escapeCsvCell(value: string): string {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTerminologyTemplate(): void {
  const csv = rowsToCsv([
    [...TERMINOLOGY_CSV_HEADERS],
    ...TEMPLATE_ROWS,
  ]);
  downloadCsv('专业术语库-导入模板.csv', csv);
}

export function exportTerminologyCsv(entries: TerminologyEntry[]): void {
  const rows = [
    [...TERMINOLOGY_CSV_HEADERS],
    ...entries.map((item) => [
      item.source,
      item.target,
      item.sourceLang,
      item.targetLang,
      item.domain,
      item.note,
    ]),
  ];
  downloadCsv(`专业术语库-导出-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(rows));
}

/** 简易 CSV 行解析，支持引号转义 */
export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    const next = normalized[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function headerIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseTerminologyCsv(text: string): TerminologyDraft[] {
  const rows = parseCsvText(text).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) return [];

  const headers = rows[0].map((cell) => cell.trim());
  const looksLikeHeader =
    headerIndex(headers, ['源术语', 'source', '原文', 'term']) >= 0 ||
    headerIndex(headers, ['标准译文', 'target', '译文', 'translation']) >= 0;

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const sourceIdx = looksLikeHeader
    ? Math.max(0, headerIndex(headers, ['源术语', 'source', '原文', 'term']))
    : 0;
  const targetIdx = looksLikeHeader
    ? Math.max(1, headerIndex(headers, ['标准译文', 'target', '译文', 'translation']))
    : 1;
  const sourceLangIdx = looksLikeHeader
    ? headerIndex(headers, ['源语言', 'sourceLang', 'source_lang', 'from'])
    : 2;
  const targetLangIdx = looksLikeHeader
    ? headerIndex(headers, ['目标语言', 'targetLang', 'target_lang', 'to'])
    : 3;
  const domainIdx = looksLikeHeader
    ? headerIndex(headers, ['领域', '分类', 'domain', 'category'])
    : 4;
  const noteIdx = looksLikeHeader
    ? headerIndex(headers, ['备注', '说明', 'note', 'comment'])
    : 5;

  return dataRows
    .map((row) => ({
      source: (row[sourceIdx] || '').trim(),
      target: (row[targetIdx] || '').trim(),
      sourceLang: (sourceLangIdx >= 0 ? row[sourceLangIdx] : 'zh')?.trim() || 'zh',
      targetLang: (targetLangIdx >= 0 ? row[targetLangIdx] : 'en')?.trim() || 'en',
      domain: (domainIdx >= 0 ? row[domainIdx] : '')?.trim() || '',
      note: (noteIdx >= 0 ? row[noteIdx] : '')?.trim() || '',
    }))
    .filter((item) => item.source && item.target);
}

export async function importTerminologyFromFile(file: File): Promise<TerminologyDraft[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    throw new Error('暂不支持 Excel 二进制格式，请先下载 CSV 模板填写后上传（.csv）');
  }
  const text = await file.text();
  const drafts = parseTerminologyCsv(text);
  if (!drafts.length) {
    throw new Error('未解析到有效术语，请检查是否按模板填写「源术语 / 标准译文」');
  }
  return drafts;
}
