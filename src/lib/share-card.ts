import { categoryMeta, formatDate, type Post } from "@/lib/blog";
import { plainExcerpt } from "@/components/blog/Markdown";

const W = 1080;
const H = 1920;

function resolveColor(value: string, fallback = "#1a1a1a") {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith("var(")) return v;
  const name = v.slice(4, -1).trim();
  if (typeof window === "undefined") return fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return resolved || fallback;
}

function mix(hex: string, amount: number, target = "255,255,255") {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const [tr, tg, tb] = target.split(",").map(Number) as [number, number, number];
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (c: number, t: number) => Math.round(c + (t - c) * amount);
  return `rgb(${f(r, tr)}, ${f(g, tg)}, ${f(b, tb)})`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]!;
    if (ctx.measureText(last).width > maxWidth * 0.98) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 2))}…`;
    }
  }
  return lines;
}

/** Draws the story card and returns it as a PNG blob. */
export async function renderShareCard(post: Post): Promise<Blob> {
  const cat = categoryMeta(post.category);
  const accent = resolveColor(cat.dot, "#b4763c");
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  // paper base tinted by the category
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, mix(accent, 0.9));
  bg.addColorStop(1, mix(accent, 0.72));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // soft blurred photo backdrop
  const photo = post.bannerUrl ?? post.photoUrls[0] ?? null;
  if (photo) {
    const img = await loadImage(photo);
    if (img) {
      const scale = Math.max(W / img.width, H / img.height) * 1.15;
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.filter = "blur(42px) saturate(1.1)";
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // paper grain
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = i % 2 ? "#000" : "#fff";
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.restore();

  // note sheet
  const nx = 96;
  const ny = 300;
  const nw = W - nx * 2;
  const nh = 1180;
  ctx.save();
  ctx.shadowColor = "rgba(40,30,15,0.28)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = "rgba(255,253,246,0.95)";
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.lineTo(nx + nw, ny);
  ctx.lineTo(nx + nw, ny + nh - 60);
  // torn bottom edge
  const steps = 22;
  for (let i = steps; i >= 0; i--) {
    const x = nx + (nw / steps) * i;
    const y = ny + nh - 60 + (i % 2 === 0 ? 34 : 6) + Math.sin(i) * 8;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(nx, ny);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // pin
  ctx.save();
  const pinX = W / 2;
  const pinY = ny + 6;
  ctx.shadowColor = "rgba(40,30,15,0.4)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  const pin = ctx.createRadialGradient(pinX - 8, pinY - 10, 4, pinX, pinY, 34);
  pin.addColorStop(0, mix(accent, 0.55));
  pin.addColorStop(1, accent);
  ctx.fillStyle = pin;
  ctx.beginPath();
  ctx.arc(pinX, pinY, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";

  // category + date in mono caps
  ctx.fillStyle = accent;
  ctx.font = "600 34px 'Space Grotesk', ui-monospace, monospace";
  ctx.letterSpacing = "8px";
  ctx.fillText(cat.label.toUpperCase(), W / 2, ny + 150);

  ctx.fillStyle = "rgba(40,34,24,0.62)";
  ctx.font = "500 30px ui-monospace, 'SFMono-Regular', monospace";
  ctx.letterSpacing = "6px";
  ctx.fillText(formatDate(post.log_date, post.log_time).toUpperCase(), W / 2, ny + 212);
  ctx.letterSpacing = "0px";

  // title
  ctx.fillStyle = "#221d14";
  const titleSize = post.title.length > 46 ? 86 : post.title.length > 24 ? 104 : 128;
  ctx.font = `700 ${titleSize}px 'Space Grotesk', system-ui, sans-serif`;
  const titleLines = wrap(ctx, post.title, nw - 140, 4);
  let ty = ny + 400;
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, ty);
    ty += titleSize * 1.1;
  }

  // rule
  ctx.strokeStyle = "rgba(40,34,24,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90, ty + 24);
  ctx.lineTo(W / 2 + 90, ty + 24);
  ctx.stroke();

  // excerpt
  ctx.fillStyle = "rgba(40,34,24,0.72)";
  ctx.font = "400 42px 'Space Grotesk', system-ui, sans-serif";
  const excerptLines = wrap(ctx, plainExcerpt(post.body), nw - 160, 4);
  let ey = ty + 116;
  for (const line of excerptLines) {
    ctx.fillText(line, W / 2, ey);
    ey += 62;
  }

  // footer wordmark
  ctx.fillStyle = "rgba(40,34,24,0.55)";
  ctx.font = "600 32px 'Space Grotesk', system-ui, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("BRYAN'S SUPER INTERESTING ADVENTURES", W / 2, H - 120);
  ctx.letterSpacing = "0px";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png");
  });
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entry";
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Renders the card, then shares it natively or downloads it as a fallback. */
export async function sharePost(post: Post): Promise<"shared" | "downloaded"> {
  const blob = await renderShareCard(post);
  const filename = `${slug(post.title)}-share.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: post.title, text: plainExcerpt(post.body) });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "shared";
    }
  }
  download(blob, filename);
  return "downloaded";
}
