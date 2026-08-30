export type EditorAssetGroup = 'logo' | 'official' | 'other';

export interface EditorPageAsset {
  id: string;
  title: string;
  meta: string;
  group: EditorAssetGroup;
  href: string;
  width: number;
  height: number;
}

function svgHref(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const BAYER_CROSS = svgHref(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="38" fill="#103c8f"/>
  <path d="M40 12l6 22h22l-18 13 7 22-17-12-17 12 7-22-18-13h22z" fill="#fff"/>
</svg>`);

const BAYER_WORDMARK = svgHref(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 72">
  <circle cx="36" cy="36" r="28" fill="#103c8f"/>
  <path d="M36 14l4.4 16h16.6l-13.4 9.6 5.1 16-12.7-8.8-12.7 8.8 5.1-16-13.4-9.6h16.6z" fill="#fff"/>
  <text x="78" y="46" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#103c8f">Bayer</text>
</svg>`);

const MEDICAL_ICON = svgHref(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="18" fill="#e8f5ff"/>
  <path d="M28 18h24v12h12v24H52v12H28V54H16V30h12z" fill="#3BA6E8"/>
</svg>`);

const TRUST_ICON = svgHref(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="18" fill="#eef8e8"/>
  <path d="M40 14l22 10v18c0 14-9.5 24-22 28-12.5-4-22-14-22-28V24z" fill="#8AD329"/>
  <path d="M28 40l8 8 16-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

export const EDITOR_PAGE_ASSET_GROUPS: { id: EditorAssetGroup; title: string; items: EditorPageAsset[] }[] = [
  {
    id: 'logo',
    title: 'LOGO与图标',
    items: [
      { id: 'logo-cross', title: 'Bayer Cross 正色标志', meta: 'SVG · Logo', group: 'logo', href: BAYER_CROSS, width: 80, height: 80 },
      { id: 'logo-wordmark', title: 'Bayer Cross + Logotype', meta: 'SVG · Logo', group: 'logo', href: BAYER_WORDMARK, width: 220, height: 72 },
      { id: 'icon-medical', title: '医学传播十字图标', meta: 'SVG · Icon', group: 'logo', href: MEDICAL_ICON, width: 80, height: 80 },
      { id: 'icon-trust', title: '可信与合规标识', meta: 'SVG · Icon', group: 'logo', href: TRUST_ICON, width: 80, height: 80 },
    ],
  },
  {
    id: 'official',
    title: '官方图片',
    items: [
      { id: 'official-beijing', title: '拜耳北京园区外景', meta: '官方图 · 16:9', group: 'official', href: '/official/bayer-beijing-campus.png', width: 320, height: 180 },
      { id: 'official-cropscience', title: '拜耳作物科学中国园区', meta: '官方图 · 16:9', group: 'official', href: '/official/bayer-cropscience-china.png', width: 320, height: 180 },
    ],
  },
  {
    id: 'other',
    title: '其他素材',
    items: [
      { id: 'other-vegf', title: 'VEGF 血管新生机制图', meta: '机制图 · 16:9', group: 'other', href: '/other/vegf-pathway.svg', width: 320, height: 180 },
      { id: 'other-her2', title: 'HER2 信号通路机制图', meta: '机制图 · 16:9', group: 'other', href: '/other/her2-signaling.svg', width: 320, height: 180 },
      { id: 'other-platelet', title: '血小板聚集与抗栓机制图', meta: '机制图 · 16:9', group: 'other', href: '/other/platelet-antithrombotic.svg', width: 320, height: 180 },
      { id: 'other-retina', title: 'nAMD 视网膜 CNV 机制图', meta: '机制图 · 16:9', group: 'other', href: '/other/retina-cnv.svg', width: 320, height: 180 },
    ],
  },
];
