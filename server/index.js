// 근육 정보 "수정 제안"을 받는 초경량 로컬 DB 서버 (외부 의존성 없음).
//   node server/index.js   → http://localhost:3001
// 데이터는 server/suggestions.json 파일에 저장된다(간단한 로컬 DB).
//
// API:
//   GET  /api/suggestions        제안 목록
//   POST /api/suggestions        제안 등록 { muscleId, ko, field, suggestion, note }
//   PATCH/api/suggestions/:id     상태 변경 { status: "open"|"resolved" }
import http from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB = join(__dirname, "suggestions.json");
const PORT = process.env.PORT || 3001;

if (!existsSync(DB)) {
  mkdirSync(dirname(DB), { recursive: true });
  writeFileSync(DB, "[]");
}
const load = () => { try { return JSON.parse(readFileSync(DB, "utf8")); } catch { return []; } };
const save = (rows) => writeFileSync(DB, JSON.stringify(rows, null, 2));

const send = (res, code, data) => {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
};
const body = (req) => new Promise((resolve) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") return send(res, 204, {});

  if (url.pathname === "/api/suggestions" && req.method === "GET") {
    return send(res, 200, load().sort((a, b) => b.ts - a.ts));
  }
  if (url.pathname === "/api/suggestions" && req.method === "POST") {
    const b = await body(req);
    if (!b.suggestion || !b.suggestion.trim()) return send(res, 400, { error: "suggestion 필수" });
    const rows = load();
    const row = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      muscleId: b.muscleId || null, ko: b.ko || null, field: b.field || "func",
      suggestion: String(b.suggestion).slice(0, 2000), note: String(b.note || "").slice(0, 1000),
      status: "open", ts: Date.now(),
    };
    rows.push(row); save(rows);
    return send(res, 201, row);
  }
  const m = url.pathname.match(/^\/api\/suggestions\/([\w]+)$/);
  if (m && req.method === "PATCH") {
    const b = await body(req); const rows = load();
    const row = rows.find((r) => r.id === m[1]);
    if (!row) return send(res, 404, { error: "not found" });
    if (b.status) row.status = b.status; save(rows);
    return send(res, 200, row);
  }
  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => console.log(`[suggestions] local DB server on http://localhost:${PORT}  (db: ${DB})`));
