// 피드백 — 사이트 안에서 제출하면 /api/feedback(Vercel Blob)에 저장.
// 관리 페이지: 주소 뒤에 ?feedback 를 붙여 열고 관리 키 입력.
import React, { useCallback, useEffect, useRef, useState } from "react";

const API = "/api/feedback";

export function FeedbackButton({ onOpen }) {
  return (
    <button className="fb-open" onClick={onOpen} title="의견·오류 제보 보내기" aria-label="피드백 보내기">
      <span aria-hidden="true">💬</span><span className="fb-open-t">피드백</span>
    </button>
  );
}

function useEsc(onClose) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

export function FeedbackDialog({ context, onClose }) {
  const [text, setText] = useState("");
  const [about, setAbout] = useState(context || "");
  const [name, setName] = useState("");
  const [trap, setTrap] = useState(""); // 봇 방지용 숨은 칸
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const ta = useRef(null);
  useEffect(() => { ta.current?.focus(); }, []);
  useEsc(onClose);

  const send = async () => {
    if (!text.trim() || state === "sending") return;
    setState("sending");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, about, name, website: trap, page: window.location.href }),
      });
      setState(r.ok ? "done" : "error");
    } catch { setState("error"); }
  };

  return (
    <div className="fbk-overlay" onClick={onClose}>
      <div className="fbk" role="dialog" aria-label="피드백 보내기" onClick={(e) => e.stopPropagation()}>
        <div className="fbk-head">
          <h2>피드백 보내기</h2>
          <button className="x" onClick={onClose} aria-label="닫기">×</button>
        </div>
        {state === "done" ? (
          <div className="fbk-done">
            <p>보내주셔서 고마워요! 🙏<br />확인해서 반영할게요.</p>
            <button className="fbk-send" onClick={onClose}>닫기</button>
          </div>
        ) : (
          <>
            <p className="fbk-sub">틀린 정보, 불편한 점, 있었으면 하는 기능 무엇이든 좋아요.</p>
            <div className="fbk-wip">
              <span className="fbk-wip-tag">진행 중</span>
              <span>동작할 때 근육 수축·신장 표시</span>
            </div>
            <textarea ref={ta} className="fbk-text" rows={5} value={text} maxLength={4000}
              onChange={(e) => setText(e.target.value)}
              placeholder="예) 자세가 움직일 때 근육이 수축하는지 신장되는지 보여주세요" />
            <label className="fbk-row">관련 부분
              <input value={about} onChange={(e) => setAbout(e.target.value)} placeholder="근육·자세·화면 (선택)" />
            </label>
            <label className="fbk-row">이름·연락처
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="답장 받고 싶으면 (선택)" />
            </label>
            <input className="fbk-trap" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={trap} onChange={(e) => setTrap(e.target.value)} />
            {state === "error" && <p className="fbk-err">보내지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
            <div className="fbk-actions">
              <button className="fbk-send" onClick={send} disabled={!text.trim() || state === "sending"}>
                {state === "sending" ? "보내는 중…" : "보내기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 관리 페이지 (?feedback) ──────────────────────────────────────────────
const KEY_STORE = "feedbackAdminKey";
const fmt = (iso) => { try { return new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); } catch { return iso; } };
const device = (ua = "") => /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "기타";

export function FeedbackAdmin({ onClose }) {
  const [key, setKey] = useState(() => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } });
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  useEsc(onClose);

  const load = useCallback(async (k) => {
    if (!k) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}?key=${encodeURIComponent(k)}`);
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { setErr("관리 키가 맞지 않아요."); setItems(null); }
      else if (j.error === "storage_not_configured") setErr("저장소(Vercel Blob)가 아직 연결되지 않았어요.");
      else if (j.error === "admin_key_not_configured") setErr("FEEDBACK_ADMIN_KEY 환경변수가 없어요.");
      else if (!r.ok) setErr("불러오지 못했어요.");
      else { setItems(j.items || []); try { localStorage.setItem(KEY_STORE, k); } catch { /* 무시 */ } }
    } catch { setErr("불러오지 못했어요."); }
    setLoading(false);
  }, []);
  useEffect(() => { if (key) load(key); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fbk-overlay">
      <div className="fbk fbk-admin" role="dialog" aria-label="받은 피드백">
        <div className="fbk-head">
          <h2>받은 피드백 {items && <span className="fbk-count">{items.length}</span>}</h2>
          <button className="x" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <form className="fbk-keyrow" onSubmit={(e) => { e.preventDefault(); load(key); }}>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="관리 키" />
          <button className="fbk-send" type="submit" disabled={!key || loading}>{loading ? "…" : items ? "새로고침" : "열기"}</button>
        </form>
        {err && <p className="fbk-err">{err}</p>}
        {items && items.length === 0 && <p className="fbk-sub">아직 받은 피드백이 없어요.</p>}
        {items && items.length > 0 && (
          <ul className="fbk-list">
            {items.map((f) => (
              <li key={f.id}>
                <div className="fbk-meta">
                  <span>{fmt(f.at)}</span>
                  {f.about && <b>{f.about}</b>}
                  <span className="fbk-dev">{device(f.ua)}</span>
                </div>
                <p>{f.text}</p>
                {f.name && <p className="fbk-name">— {f.name}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
