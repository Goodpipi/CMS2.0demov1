import { EN_DICT } from './i18nDict';

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'acp_lang';
const CJK = /[\u4e00-\u9fff]/;
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const SKIP_SELECTOR = 'script, style, textarea, svg, [data-i18n-skip]';
/** 仅含全角标点的独立文本节点（常见于链接之间的分隔） */
const PUNCT: Record<string, string> = { '，': ', ', '、': ', ', '。': '. ', '；': '; ', '：': ': ' };
const TRANSLATABLE = /[\u4e00-\u9fff，、。；：]/;

const exact = new Map<string, string>();
const templates: { probe: string; re: RegExp; target: string }[] = [];

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [zh, en] of Object.entries(EN_DICT)) {
  const key = normalize(zh);
  if (!key || !en) continue;
  if (/\{\d+\}/.test(key)) {
    const parts = key.split(/(\{\d+\})/);
    const order: number[] = [];
    const pattern = parts
      .map((part) => {
        const slot = part.match(/^\{(\d+)\}$/);
        if (slot) {
          order.push(Number(slot[1]));
          return '([\\s\\S]+?)';
        }
        return escapeRe(part);
      })
      .join('');
    const probe = parts.filter((part) => !/^\{\d+\}$/.test(part)).sort((a, b) => b.length - a.length)[0] || '';
    if (!CJK.test(probe)) continue;
    const target = en.replace(/\{(\d+)\}/g, (_, n: string) => `{${order.indexOf(Number(n))}}`);
    templates.push({ probe, re: new RegExp(`^${pattern}$`), target });
  } else if (!exact.has(key)) {
    exact.set(key, en);
  }
}
templates.sort((a, b) => b.probe.length - a.probe.length);

function translateCore(text: string, depth = 0): string | null {
  if (!CJK.test(text)) return text;
  const hit = exact.get(text);
  if (hit !== undefined) return hit;
  if (depth > 1) return null;
  for (const tpl of templates) {
    if (!text.includes(tpl.probe)) continue;
    const match = text.match(tpl.re);
    if (!match) continue;
    return tpl.target.replace(/\{(\d+)\}/g, (_, n: string) => {
      const value = match[Number(n) + 1] ?? '';
      return translateCore(value, depth + 1) ?? value;
    });
  }
  for (const sep of [' · ', '·', ' / ', '：', ':']) {
    if (!text.includes(sep)) continue;
    const parts = text.split(sep);
    const translated = parts.map((part) => {
      const trimmed = part.trim();
      return trimmed ? translateCore(trimmed, depth + 1) : '';
    });
    if (translated.every((part) => part !== null)) {
      const joiner = sep === '：' ? ': ' : sep;
      return translated.join(joiner);
    }
  }
  return null;
}

/** 将界面文案翻译为英文；未收录的内容（例如 Mock 数据）原样返回 */
export function translateUi(text: string): string {
  if (!text) return text;
  const key = normalize(text);
  const punct = PUNCT[key];
  if (punct !== undefined) return punct;
  if (!CJK.test(text)) return text;
  const result = translateCore(key);
  if (result === null) return text;
  const lead = text.match(/^\s*/)?.[0] ?? '';
  const trail = text.match(/\s*$/)?.[0] ?? '';
  return `${lead}${result}${trail}`;
}

let currentLang: Lang = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
})();

const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return currentLang;
}

export function subscribeLang(listener: (lang: Lang) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface TextRecord {
  original: string;
  applied: string;
}

const textRecords = new WeakMap<Text, TextRecord>();
const attrRecords = new WeakMap<Element, Map<string, TextRecord>>();
const touchedTexts = new Set<WeakRef<Text>>();
const touchedElements = new Set<WeakRef<Element>>();

function isSkipped(el: Element | null): boolean {
  if (!el) return true;
  if (el.closest(SKIP_SELECTOR)) return true;
  const editable = el.closest('[contenteditable]');
  return Boolean(editable && editable.getAttribute('contenteditable') !== 'false');
}

function processText(node: Text) {
  const record = textRecords.get(node);
  if (record && node.data === record.applied) return;
  if (!TRANSLATABLE.test(node.data) || isSkipped(node.parentElement)) return;
  const translated = translateUi(node.data);
  if (translated === node.data) return;
  textRecords.set(node, { original: node.data, applied: translated });
  touchedTexts.add(new WeakRef(node));
  node.data = translated;
}

function processAttrs(el: Element) {
  if (el.closest('svg, [data-i18n-skip]')) return;
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (!value || !CJK.test(value)) continue;
    let records = attrRecords.get(el);
    const record = records?.get(attr);
    if (record && value === record.applied) continue;
    const translated = translateUi(value);
    if (translated === value) continue;
    if (!records) {
      records = new Map();
      attrRecords.set(el, records);
      touchedElements.add(new WeakRef(el));
    }
    records.set(attr, { original: value, applied: translated });
    el.setAttribute(attr, translated);
  }
}

function processTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    processText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element;
    processAttrs(el);
    if (el.matches(SKIP_SELECTOR)) return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(SKIP_SELECTOR)) {
        processAttrs(node as Element);
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) processText(node as Text);
    else processAttrs(node as Element);
    node = walker.nextNode();
  }
}

function restoreAll() {
  touchedTexts.forEach((ref) => {
    const node = ref.deref();
    const record = node ? textRecords.get(node) : undefined;
    if (node && record && node.data === record.applied) node.data = record.original;
    if (node) textRecords.delete(node);
  });
  touchedTexts.clear();
  touchedElements.forEach((ref) => {
    const el = ref.deref();
    const records = el ? attrRecords.get(el) : undefined;
    if (el && records) {
      records.forEach((record, attr) => {
        if (el.getAttribute(attr) === record.applied) el.setAttribute(attr, record.original);
      });
      attrRecords.delete(el);
    }
  });
  touchedElements.clear();
}

let observer: MutationObserver | null = null;
let originalTitle = '';

function startObserver() {
  if (observer || typeof document === 'undefined') return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') processText(mutation.target as Text);
      else if (mutation.type === 'attributes') processAttrs(mutation.target as Element);
      else mutation.addedNodes.forEach((node) => processTree(node));
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
  processTree(document.body);
  originalTitle = document.title;
  document.title = translateUi(document.title);
}

function stopObserver() {
  observer?.disconnect();
  observer = null;
  restoreAll();
  if (originalTitle) document.title = originalTitle;
}

function applyLang(lang: Lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.documentElement.dataset.lang = lang;
  if (lang === 'en') startObserver();
  else stopObserver();
}

export function setLang(lang: Lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyLang(lang);
  listeners.forEach((listener) => listener(lang));
}

export function initI18n() {
  applyLang(currentLang);
}
