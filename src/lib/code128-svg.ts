const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

function encodeCode128B(value: string): number[] {
  if (!value || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126)) {
    throw new Error("Code 128 payload must contain printable ASCII characters.");
  }

  const codes = [104];
  let checksum = 104;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }
  codes.push(checksum % 103, 106);
  return codes;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function code128Svg(value: string, options: { height?: number; module?: number } = {}): string {
  const height = options.height ?? 92;
  const moduleWidth = options.module ?? 2;
  const quiet = moduleWidth * 10;
  const bars: { x: number; width: number }[] = [];
  let x = quiet;

  for (const code of encodeCode128B(value)) {
    const pattern = CODE128_PATTERNS[code];
    for (let i = 0; i < pattern.length; i += 1) {
      const width = Number(pattern[i]) * moduleWidth;
      if (i % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }

  const width = x + quiet;
  const safeValue = escapeXml(value);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeValue}">
  <rect width="100%" height="100%" fill="#fff"/>
  ${bars.map((bar) => `<rect x="${bar.x}" y="10" width="${bar.width}" height="${height - 32}" fill="#111827"/>`).join("")}
  <text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#111827">${safeValue}</text>
</svg>`;
}
