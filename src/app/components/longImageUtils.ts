import type { ArticleOutline } from '@/types/content';
import { downloadDataUrl } from '@/lib/copyRevisionUtils';
import { svgToDataUrl } from '@/app/components/svgEditorUtils';
import type { ImageBuiltinTemplate } from '@/app/components/imageTemplates';
import { isBlankImageTemplate } from '@/app/components/imageTemplates';

const CANVAS_W = 900;
const SIDE = 36;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const lines: string[] = [];
  let rest = clean;
  while (rest && lines.length < maxLines) {
    lines.push(rest.slice(0, maxChars));
    rest = rest.slice(maxChars);
  }
  if (rest && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
  }
  return lines;
}

function textLines(
  x: number,
  y: number,
  lines: string[],
  attrs: string,
  lineHeight: number
): string {
  if (!lines.length) return '';
  return `<text x="${x}" y="${y}" ${attrs}>${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('')}</text>`;
}

export function buildLongImageSvg(
  outline: ArticleOutline,
  template?: ImageBuiltinTemplate | null
): string {
  const accent = isBlankImageTemplate(template) ? '#103C8F' : template?.accent || '#1d6bff';
  const title = outline.title || '长图';
  const chapters = outline.chapters || [];
  const heroSrc = !isBlankImageTemplate(template) ? template?.previewImg : undefined;
  const headerH = heroSrc ? 430 : 210;
  const cards = chapters.map((chapter) => {
    const coreLines = wrapLines(chapter.core, 30, 4);
    const tmshLines = chapter.tmsh
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .flatMap((line) => wrapLines(line, 32, 2));
    const hasThumb = Boolean(chapter.imageUrl);
    const bodyH = Math.max(coreLines.length * 24, 48) + 18 + tmshLines.length * 22;
    const height = 58 + bodyH + 28;
    return { chapter, coreLines, tmshLines, hasThumb, height };
  });
  const cardsH = cards.reduce((sum, card) => sum + card.height + 18, 0);
  const footerH = 72;
  const canvasH = headerH + cardsH + footerH + SIDE;

  let y = 0;
  const parts: string[] = [];
  parts.push(
    `<rect data-edit-id="el-bg" width="${CANVAS_W}" height="${canvasH}" fill="#f4f7fb"/>`
  );
  parts.push(
    `<rect data-edit-id="el-header-bar" x="0" y="0" width="${CANVAS_W}" height="${headerH}" fill="${escapeXml(accent)}"/>`
  );
  parts.push(
    `<circle cx="820" cy="70" r="110" fill="#fff" opacity=".12"/>`
  );
  parts.push(
    `<circle cx="70" cy="${headerH - 20}" r="90" fill="#8AD329" opacity=".16"/>`
  );
  parts.push(
    `<text data-edit-id="el-brand" x="${SIDE}" y="48" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="15" font-weight="700" fill="#fff">BAYER · 医学长图</text>`
  );
  if (heroSrc) {
    const href = escapeXml(heroSrc);
    parts.push(
      `<image data-edit-id="el-hero" href="${href}" xlink:href="${href}" x="${SIDE}" y="64" width="${CANVAS_W - SIDE * 2}" height="248" preserveAspectRatio="xMidYMid slice"/>`
    );
    parts.push(
      textLines(
        SIDE,
        344,
        wrapLines(title, 18, 2),
        `data-edit-id="el-title" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="30" font-weight="800" fill="#fff"`,
        36
      )
    );
    parts.push(
      `<text data-edit-id="el-subtitle" x="${SIDE}" y="408" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="14" fill="rgba(255,255,255,.88)">${escapeXml(template?.name || '按模板生成')}</text>`
    );
  } else {
    parts.push(
      textLines(
        SIDE,
        108,
        wrapLines(title, 16, 3),
        `data-edit-id="el-title" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="36" font-weight="800" fill="#fff"`,
        44
      )
    );
    parts.push(
      `<text data-edit-id="el-subtitle" x="${SIDE}" y="188" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="16" fill="rgba(255,255,255,.9)">按大纲结构生成 · 共 ${chapters.length} 个章节</text>`
    );
  }
  y = headerH + 20;

  cards.forEach((card, index) => {
    const x = SIDE;
    const w = CANVAS_W - SIDE * 2;
    parts.push(
      `<rect data-edit-id="el-card-${index}" x="${x}" y="${y}" width="${w}" height="${card.height}" rx="18" fill="#fff"/>`
    );
    parts.push(
      `<rect data-edit-id="el-card-accent-${index}" x="${x}" y="${y}" width="8" height="${card.height}" rx="4" fill="${escapeXml(accent)}"/>`
    );
    parts.push(
      `<text data-edit-id="el-ch-title-${index}" x="${x + 28}" y="${y + 36}" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="20" font-weight="800" fill="#18334d">${escapeXml(`${index + 1}. ${card.chapter.title}`)}</text>`
    );
    const textX = x + 28;
    parts.push(
      textLines(
        textX,
        y + 68,
        card.coreLines,
        `data-edit-id="el-ch-core-${index}" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="15" fill="#536a80"`,
        24
      )
    );
    const tmshY = y + 68 + Math.max(card.coreLines.length, 1) * 24 + 10;
    parts.push(
      textLines(
        textX,
        tmshY,
        card.tmshLines,
        `data-edit-id="el-ch-tmsh-${index}" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="13" fill="#1d5aa7"`,
        22
      )
    );
    if (card.hasThumb && card.chapter.imageUrl) {
      const href = escapeXml(card.chapter.imageUrl);
      parts.push(
        `<image data-edit-id="el-ch-img-${index}" href="${href}" xlink:href="${href}" x="${x + w - 128}" y="${y + 56}" width="104" height="78" preserveAspectRatio="xMidYMid slice"/>`
      );
    }
    y += card.height + 18;
  });

  parts.push(
    `<text data-edit-id="el-footer" x="${SIDE}" y="${canvasH - 32}" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="12" fill="#8aa0b3">内容仅用于疾病教育，需经内部合规审核</text>`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CANVAS_W} ${canvasH}" width="${CANVAS_W}" height="${canvasH}">${parts.join('')}</svg>`;
}

export function buildLongImageDataUrl(
  outline: ArticleOutline,
  template?: ImageBuiltinTemplate | null
): string {
  return svgToDataUrl(buildLongImageSvg(outline, template));
}

function safeFilename(name: string, ext: string): string {
  const base = (name || '长图')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || '长图';
  return `${base}.${ext}`;
}

export async function rasterizeToPngDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:image/png') || src.startsWith('data:image/jpeg')) return src;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, img.naturalWidth || CANVAS_W);
      canvas.height = Math.max(1, img.naturalHeight || 1600);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建画布'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

export async function exportLongImageAsPng(src: string, title: string): Promise<void> {
  try {
    const png = await rasterizeToPngDataUrl(src);
    downloadDataUrl(png, safeFilename(title, 'png'));
  } catch {
    downloadDataUrl(src, safeFilename(title, src.includes('svg') ? 'svg' : 'png'));
  }
}

export async function exportImageAsPsd(src: string, title: string): Promise<void> {
  try {
    const png = await rasterizeToPngDataUrl(src);
    downloadDataUrl(png, safeFilename(title, 'psd'));
  } catch {
    downloadDataUrl(src, safeFilename(title, 'psd'));
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function zipStore(
  files: Array<{ name: string; data: Uint8Array }>,
  mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = concatBytes([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.data,
    ]);
    const central = concatBytes([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDir = concatBytes(centrals);
  const eocd = concatBytes([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);
  return new Blob([concatBytes([...locals, centralDir, eocd])], { type: mime });
}

export function xmlBytes(xml: string): Uint8Array {
  return new TextEncoder().encode(xml);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportLongImageAsPptx(src: string, title: string): Promise<void> {
  const png = await rasterizeToPngDataUrl(src);
  const pngBytes = dataUrlToBytes(png);
  const probe = await new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || CANVAS_W, h: img.naturalHeight || 1600 });
    img.onerror = () => reject(new Error('无法读取图片尺寸'));
    img.src = png;
  });
  const emuPerPx = 9525;
  const cx = Math.round(probe.w * emuPerPx);
  const cy = Math.round(probe.h * emuPerPx);
  const safeTitle = escapeXml(title || '长图');

  const files = [
    {
      name: '[Content_Types].xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`),
    },
    {
      name: '_rels/.rels',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
    },
    {
      name: 'docProps/core.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${safeTitle}</dc:title>
  <dc:creator>Bayidea</dc:creator>
  <cp:lastModifiedBy>Bayidea</cp:lastModifiedBy>
</cp:coreProperties>`),
    },
    {
      name: 'docProps/app.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Bayidea</Application>
  <Slides>1</Slides>
</Properties>`),
    },
    {
      name: 'ppt/_rels/presentation.xml.rels',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`),
    },
    {
      name: 'ppt/presentation.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
  <p:sldSz cx="${cx}" cy="${cy}"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`),
    },
    {
      name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`),
    },
    {
      name: 'ppt/slideMasters/slideMaster1.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`),
    },
    {
      name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`),
    },
    {
      name: 'ppt/slideLayouts/slideLayout1.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`),
    },
    {
      name: 'ppt/theme/theme1.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="4F81BD"/></a:accent1>
      <a:accent2><a:srgbClr val="C0504D"/></a:accent2>
      <a:accent3><a:srgbClr val="9BBB59"/></a:accent3>
      <a:accent4><a:srgbClr val="8064A2"/></a:accent4>
      <a:accent5><a:srgbClr val="4BACC6"/></a:accent5>
      <a:accent6><a:srgbClr val="F79646"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink>
      <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs><a:gs pos="35000"><a:schemeClr val="phClr"><a:tint val="37000"/><a:satMod val="300000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="15000"/><a:satMod val="350000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="16200000" scaled="1"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:shade val="51000"/><a:satMod val="130000"/></a:schemeClr></a:gs><a:gs pos="80000"><a:schemeClr val="phClr"><a:shade val="93000"/><a:satMod val="130000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="94000"/><a:satMod val="135000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="16200000" scaled="0"/></a:gradFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="40000"/><a:satMod val="350000"/></a:schemeClr></a:gs><a:gs pos="40000"><a:schemeClr val="phClr"><a:tint val="45000"/><a:shade val="99000"/><a:satMod val="350000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="20000"/><a:satMod val="255000"/></a:schemeClr></a:gs></a:gsLst><a:path path="circle"><a:fillToRect l="50000" t="-80000" r="50000" b="180000"/></a:path></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="80000"/><a:satMod val="300000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="30000"/><a:satMod val="200000"/></a:schemeClr></a:gs></a:gsLst><a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`),
    },
    {
      name: 'ppt/slides/_rels/slide1.xml.rels',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
</Relationships>`),
    },
    {
      name: 'ppt/slides/slide1.xml',
      data: xmlBytes(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="Picture 1"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`),
    },
    { name: 'ppt/media/image1.png', data: pngBytes },
  ];

  downloadBlob(zipStore(files), safeFilename(title, 'pptx'));
}
