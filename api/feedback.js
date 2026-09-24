// 피드백 저장/조회 — Vercel 서버 함수 + Vercel Blob
//  POST /api/feedback            { text, about?, name?, page?, website? }  → 저장
//  GET  /api/feedback?key=관리키  → 최근 피드백 목록 (FEEDBACK_ADMIN_KEY 환경변수와 일치해야 함)
//
// 필요한 환경변수 (Vercel 프로젝트):
//  BLOB_READ_WRITE_TOKEN  — Storage에서 Blob 저장소를 만들어 프로젝트에 연결하면 자동으로 들어감
//  FEEDBACK_ADMIN_KEY     — 목록을 볼 때 쓸 비밀 키(직접 정함)
import { put, list, get } from "@vercel/blob";

const PREFIX = "feedback/";
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

// 저장소가 비공개(private)면 private, 공개로 만들었으면 public으로 자동 대응
async function putJson(pathname, data) {
  const body = JSON.stringify(data);
  const opts = { contentType: "application/json", addRandomSuffix: true };
  try { return await put(pathname, body, { ...opts, access: "private" }); }
  catch { return await put(pathname, body, { ...opts, access: "public" }); }
}
async function readJson(url) {
  for (const access of ["private", "public"]) {
    try {
      const r = await get(url, { access });
      if (r?.statusCode === 200) return JSON.parse(await new Response(r.stream).text());
    } catch { /* 다른 access로 재시도 */ }
  }
  return null;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "storage_not_configured" });
  }

  if (req.method === "POST") {
    const b = await readBody(req);
    if (b.website) return res.status(201).json({ ok: true }); // 봇이 채우는 숨은 칸(스팸 방지)
    const text = clip(b.text, 4000);
    if (!text) return res.status(400).json({ error: "empty" });
    const at = new Date().toISOString();
    const item = {
      text, at,
      about: clip(b.about, 200),
      name: clip(b.name, 200),
      page: clip(b.page, 300),
      ua: clip(req.headers["user-agent"], 300),
    };
    try {
      await putJson(`${PREFIX}${at.replace(/[:.]/g, "-")}.json`, item);
      return res.status(201).json({ ok: true });
    } catch (e) {
      console.error("feedback save failed", e);
      return res.status(500).json({ error: "save_failed" });
    }
  }

  if (req.method === "GET") {
    const key = process.env.FEEDBACK_ADMIN_KEY;
    if (!key) return res.status(503).json({ error: "admin_key_not_configured" });
    if (clip(req.query?.key, 200) !== key) return res.status(401).json({ error: "unauthorized" });
    const blobs = [];
    let cursor;
    do {
      const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
      blobs.push(...r.blobs);
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const items = (await Promise.all(blobs.slice(0, 300).map(async (bl) => {
      const j = await readJson(bl.url);
      return j ? { ...j, id: bl.pathname } : null;
    }))).filter(Boolean);
    return res.status(200).json({ items, total: blobs.length });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method_not_allowed" });
}
