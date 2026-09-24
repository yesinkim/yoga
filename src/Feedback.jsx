// 피드백 — 메일 앱으로 보내기(서버 없음). 메일 앱이 없으면 내용 복사 후 직접 보내게 안내.
import React, { useEffect, useRef, useState } from "react";

const TO = "bailando.ys@gmail.com";

export function FeedbackButton({ onOpen }) {
  return (
    <button className="fb-open" onClick={onOpen} title="의견·오류 제보 보내기" aria-label="피드백 보내기">
      <span aria-hidden="true">💬</span><span className="fb-open-t">피드백</span>
    </button>
  );
}

export function FeedbackDialog({ context, onClose }) {
  const [text, setText] = useState("");
  const [about, setAbout] = useState(context || "");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const ta = useRef(null);
  useEffect(() => { ta.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const subject = `[요가 해부학 뷰어] ${about ? about + " · " : ""}${text.trim().slice(0, 30) || "피드백"}`;
  const body = [
    text.trim(),
    "",
    "──",
    about && `관련: ${about}`,
    name && `보낸 사람: ${name}`,
    `페이지: ${window.location.href}`,
    `기기: ${navigator.userAgent}`,
  ].filter(Boolean).join("\n");
  const mailto = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(`받는 사람: ${TO}\n제목: ${subject}\n\n${body}`); setCopied(true); }
    catch { setCopied(false); }
  };

  return (
    <div className="fbk-overlay" onClick={onClose}>
      <div className="fbk" role="dialog" aria-label="피드백 보내기" onClick={(e) => e.stopPropagation()}>
        <div className="fbk-head">
          <h2>피드백 보내기</h2>
          <button className="x" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <p className="fbk-sub">틀린 정보, 불편한 점, 있었으면 하는 기능 무엇이든 좋아요.</p>
        <textarea ref={ta} className="fbk-text" rows={5} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="예) 대퇴직근 기시가 교재와 달라요 / 모바일에서 버튼이 작아요" />
        <label className="fbk-row">관련 부분
          <input value={about} onChange={(e) => setAbout(e.target.value)} placeholder="근육·자세·화면 (선택)" />
        </label>
        <label className="fbk-row">이름·연락처
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="답장 받고 싶으면 (선택)" />
        </label>
        <div className="fbk-actions">
          <button className="fbk-copy" onClick={copy} disabled={!text.trim()}>{copied ? "복사됨 ✓" : "내용 복사"}</button>
          <a className={"fbk-send" + (text.trim() ? "" : " off")} href={text.trim() ? mailto : undefined}
            onClick={(e) => { if (!text.trim()) e.preventDefault(); }}>메일로 보내기</a>
        </div>
        <p className="fbk-note">메일 앱이 열리지 않으면 ‘내용 복사’ 후 <b>{TO}</b> 로 보내주세요.</p>
      </div>
    </div>
  );
}
