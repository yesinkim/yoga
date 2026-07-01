import React, {
  Suspense, useCallback, useEffect, useMemo, useRef, useState, memo,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { MUSCLES, matchMuscle, musclesForAsana, BREATHING_IDS, isConnectiveTissue } from "./muscles.js";

const HIGHLIGHT = new THREE.Color("#5d8a72");
// three는 visible=false 여도 raycast 하므로, 숨긴 메시는 raycast 자체를 꺼서
// 클릭이 통과해 안쪽 근육이 잡히게 한다. 복원 시 원래 raycast로 되돌린다.
const NOOP_RAYCAST = () => {};
const MESH_RAYCAST = THREE.Mesh.prototype.raycast;

// Draco 압축 glb 디코더 경로 (public/draco/, 로컬 호스팅 → 오프라인 동작)
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

// 레이어별 아틀라스 톤 틴트 (실제 모델 머티리얼이 창백해 레이어 구분이 약함 → 덧입힘)
const LAYER_TINT = {
  muscle: "#b0463c",   // 생크림빛 근육
  skeleton: "#e8dcc1", // 아이보리 뼈
  surface: "#d8a98c",  // 피부
};
// 메시 이름 기반 미세한 명도 변화 → 단색 덩어리로 안 보이게
function shade(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return 0.84 + (h % 1000) / 1000 * 0.30; // 0.84 ~ 1.14
}

// 바깥 → 안쪽 순서. surface(피부)는 있으면 쓰고 없으면 건너뜀.
const LAYER_ORDER = ["surface", "muscle", "skeleton"];
const LAYER_FILES = {
  surface: "/models/surface.glb",   // 선택 (없어도 됨)
  muscle: "/models/muscles.glb",    // 필수
  skeleton: "/models/skeleton.glb", // 필수
};

// ── 레이어 하나를 로드하는 컴포넌트 (없는 파일이면 조용히 패스) ──────────────
class LayerBoundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onMissing?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function LayerLoader({ url, layerKey, isMuscle, register, onPick, onHover }) {
  const gltf = useGLTF(url, DRACO_PATH);
  const cloned = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const meshes = [];
    const tint = LAYER_TINT[layerKey];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      // 근육 레이어의 근막·널힘줄·인대는 숨기고 클릭도 막음
      // (visible=false 만으로는 three가 여전히 raycast 하므로 raycast 자체를 비활성화)
      if (isMuscle && isConnectiveTissue(o.name)) {
        o.visible = false;
        o.raycast = () => {};
        return;
      }
      // 뼈 레이어엔 근육·근막·힘줄·인대가 섞여 몸을 감싼다 → 숨겨 실제 뼈만 남김 (연골은 유지)
      if (layerKey === "skeleton" && (/muscle|bursa/i.test(o.name) || isConnectiveTissue(o.name))) {
        o.visible = false;
        o.raycast = () => {};
        return;
      }
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.depthWrite = true;
      // Z-Anatomy 재질엔 흰색 emissive가 구워져 있어 색을 덮어씀 → 끔
      if (o.material.emissive) {
        o.material.emissive.set(0x000000);
        o.material.emissiveIntensity = 0;
      }
      if (tint && o.material.color) {
        o.material.color.set(tint).multiplyScalar(shade(o.name || layerKey));
        if ("roughness" in o.material) o.material.roughness = 0.72;
        if ("metalness" in o.material) o.material.metalness = 0.0;
      }
      o.userData.baseColor = o.material.color.clone();
      o.userData.baseEmissive = new THREE.Color(0x000000);
      const matched = isMuscle ? matchMuscle(o.name) : null;
      o.userData.muscleId = matched ? matched.id : null;
      meshes.push(o);
    });
    return { scene, meshes };
  }, [gltf, isMuscle, layerKey]);

  useEffect(() => {
    register(layerKey, cloned);
  }, [cloned, layerKey, register]);

  const handlers = isMuscle
    ? {
        onClick: (e) => { e.stopPropagation(); onPick(e.object); },
        onPointerOver: (e) => { e.stopPropagation(); onHover(true); },
        onPointerOut: () => onHover(false),
      }
    : {};

  return <primitive object={cloned.scene} {...handlers} />;
}

// 로드된 레이어 전체를 원점에 재중심화 + 카메라를 정면 중앙으로 맞춤
// (자동 프레이밍이 모델을 화면 위쪽에 잡던 문제 해결)
function Rig({ children, ready }) {
  const ref = useRef();
  const { camera, controls } = useThree();
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.position.set(0, 0, 0);
    g.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    g.position.set(-center.x, -center.y, -center.z); // bbox 중심 → 원점
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (Math.max(size.y, size.x * 1.4) / 2) / Math.tan(fov / 2) * 1.28;
    camera.position.set(0, 0, dist);
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();
    if (controls) { controls.target.set(0, 0, 0); controls.update(); }
  }, [ready, camera, controls]);
  return <group ref={ref}>{children}</group>;
}

function Scene({ register, onPick, onHover, present, ready }) {
  return (
    <Rig ready={ready}>
      {LAYER_ORDER.map((key) => (
        <Suspense key={key} fallback={null}>
          <LayerBoundary onMissing={() => present(key, false)}>
            <LayerLoader
              url={LAYER_FILES[key]}
              layerKey={key}
              isMuscle={key === "muscle"}
              register={register}
              onPick={onPick}
              onHover={onHover}
            />
          </LayerBoundary>
        </Suspense>
      ))}
    </Rig>
  );
}

// ── 레이어 체크박스(피부/근육/뼈) + 하이라이트 → 불투명도 ────────────────────
// vis = {surface, muscle, skeleton} 각 레이어 표시 여부.
// 겹칠 때 바깥 레이어는 반투명하게 해서 안쪽이 비쳐 보이게 한다.
// focusIds(Set)가 있으면 그 근육들만 강조, selectedId 하나면 단일 강조.
function applyView(layers, vis, selectedId, focusIds, hidden) {
  const focusing = focusIds && focusIds.size > 0;
  const deeperThanSurface = vis.muscle || vis.skeleton;

  for (const key of LAYER_ORDER) {
    const layer = layers[key];
    if (!layer) continue;
    let base = vis[key] ? 1 : 0;
    if (key === "surface" && vis.surface && deeperThanSurface) base = 0.35; // 피부는 반투명
    if (key === "muscle" && vis.muscle && vis.skeleton) base = 0.55;        // 근육+뼈 → x-ray

    layer.meshes.forEach((m) => {
      if (key === "muscle" && hidden && hidden.has(m)) { // 개별 벗기기
        m.material.opacity = 0; m.visible = false; m.material.depthWrite = false;
        m.raycast = NOOP_RAYCAST;
        return;
      }
      if (key === "muscle") m.raycast = MESH_RAYCAST;
      let op = base;
      let hl = false;
      if (key === "muscle") {
        const id = m.userData.muscleId;
        if (focusing) {
          if (id && focusIds.has(id)) { op = Math.max(base, 0.95); hl = true; }
          else { op = base * 0.07; }
        } else if (selectedId && id === selectedId) {
          op = Math.max(base, 0.92); hl = true;
        }
      }
      m.material.opacity = op;
      m.visible = op > 0.02;
      m.material.depthWrite = op > 0.6;
      if (m.material.emissive) {
        if (hl) {
          m.material.emissive.copy(HIGHLIGHT);
          m.material.emissiveIntensity = 0.6;
        } else {
          m.material.emissive.copy(m.userData.baseEmissive);
          m.material.emissiveIntensity = m.userData.baseEmissive.getHex() ? 1 : 0;
        }
      }
    });
  }
}

// ── 메인 ────────────────────────────────────────────────────────────────────
export default function App() {
  const layersRef = useRef({});           // key -> {scene, meshes}
  const [present, setPresent] = useState({ surface: true, muscle: true, skeleton: true });
  const [ready, setReady] = useState(0);  // 레이어 등록될 때마다 +1
  const [surfaceOn, setSurfaceOn] = useState(false); // 피부 표시
  const [muscleOn, setMuscleOn] = useState(true);    // 근육 표시
  const [boneOn, setBoneOn] = useState(false);       // 뼈 표시
  const [selected, setSelected] = useState(null); // muscle obj | {raw} | null
  const [focus, setFocus] = useState(null); // { kind, title, sub, ids:Set, list:[muscle] } | null
  const [hovering, setHovering] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false); // 받은 제안 목록 패널
  // 수정 제안 기능은 기본 숨김. URL ?edit 또는 단축키(Alt+Shift+E)로만 노출.
  const [editMode, setEditMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("edit"));
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.shiftKey && (e.key === "E" || e.key === "e")) setEditMode((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [peelMode, setPeelMode] = useState(false);   // 클릭으로 근육 벗기기
  const peelRef = useRef(false);                      // onPick 안정 콜백용
  const controlsRef = useRef();                       // OrbitControls
  const [panHeld, setPanHeld] = useState(false);      // Spacebar 이동 모드

  // Spacebar 누르는 동안 좌드래그 = 위치 이동(pan), 떼면 회전으로 복귀
  useEffect(() => {
    const setLeft = (mode) => {
      const c = controlsRef.current;
      if (c && c.mouseButtons) c.mouseButtons.LEFT = mode;
    };
    const down = (e) => {
      if (e.code === "Space" && !e.repeat &&
          !(e.target instanceof HTMLElement && e.target.matches("input,textarea,select"))) {
        e.preventDefault();
        setPanHeld(true);
        setLeft(THREE.MOUSE.PAN);
      }
    };
    const up = (e) => {
      if (e.code === "Space") { setPanHeld(false); setLeft(THREE.MOUSE.ROTATE); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  const hiddenRef = useRef(new Set());                // 벗겨진(숨긴) 메시들
  const [hiddenCount, setHiddenCount] = useState(0);  // 재렌더 + 복원 버튼용

  const register = useCallback((key, payload) => {
    layersRef.current[key] = payload;
    setReady((n) => n + 1);
  }, []);
  const markAbsent = useCallback((key, val) => {
    setPresent((p) => (p[key] === val ? p : { ...p, [key]: val }));
  }, []);

  const onPick = useCallback((obj) => {
    if (peelRef.current) {                 // 벗기기 모드: 클릭한 메시 숨김
      hiddenRef.current.add(obj);
      setHiddenCount((c) => c + 1);
      return;
    }
    console.log("[picked mesh]", obj.name);
    const m = matchMuscle(obj.name);
    setSelected(m || { raw: obj.name });
  }, []);

  // 벗기기 모드 토글
  const togglePeel = useCallback(() => {
    setPeelMode((p) => {
      const next = !p;
      peelRef.current = next;
      if (next) { setSelected(null); setMuscleOn(true); setBoneOn(false); } // 근육 전체 불투명하게
      return next;
    });
  }, []);
  // 벗긴 근육 전체 복원
  const restorePeeled = useCallback(() => {
    hiddenRef.current.clear();
    setHiddenCount(0);
  }, []);

  // 아사나 클릭 → 그 아사나에 동원되는 근육 전체 하이라이트(역방향)
  const focusAsana = useCallback((ko, sa) => {
    const list = musclesForAsana(sa);
    if (!list.length) return;
    setFocus({ kind: "asana", title: ko, sub: sa, ids: new Set(list.map((m) => m.id)), list });
  }, []);

  // 호흡근 모드 토글
  const toggleBreathing = useCallback(() => {
    setFocus((f) => {
      if (f?.kind === "breath") return null;
      const list = MUSCLES.filter((m) => BREATHING_IDS.includes(m.id))
        .sort((a, b) => BREATHING_IDS.indexOf(a.id) - BREATHING_IDS.indexOf(b.id));
      return { kind: "breath", title: "호흡근", sub: "", ids: new Set(BREATHING_IDS), list };
    });
    setMuscleOn(true); // 근육이 보이도록
  }, []);

  // 레이어 토글 / selected / focus / 벗기기 / 레이어 변동 시 머티리얼 갱신
  useEffect(() => {
    applyView(layersRef.current, { surface: surfaceOn, muscle: muscleOn, skeleton: boneOn },
      selected?.id, focus?.ids, hiddenRef.current);
  }, [surfaceOn, muscleOn, boneOn, selected, focus, hiddenCount, ready]);

  const layerCount = LAYER_ORDER.filter((k) => layersRef.current[k]).length;
  const anyLoaded = layerCount > 0;
  // 필수 두 레이어가 모두 "없음"으로 확정된 경우에만 안내(그 전엔 로딩 중)
  const bothMissing = present.muscle === false && present.skeleton === false;

  return (
    <div className="wrap" style={{ cursor: panHeld ? "grab" : hovering ? (peelMode ? "crosshair" : "pointer") : "default" }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 38, near: 0.01, far: 5000 }} gl={{ alpha: true }}>
        <hemisphereLight args={["#cdd9e6", "#1a1f27", 0.85]} />
        <directionalLight position={[4, 7, 6]} intensity={1.15} />
        <directionalLight position={[-5, 3, -6]} intensity={0.5} color="#8fbfe0" />
        <Suspense fallback={null}>
          <Scene register={register} onPick={onPick} onHover={setHovering} present={markAbsent} ready={ready} />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>

      {panHeld && <div className="pan-hint">✥ 이동 모드 — 드래그로 위치 이동</div>}

      <div className="masthead">
        <span className="plate">Atlas of Movement</span>
        <h1>요가 해부학 레이어 뷰어</h1>
      </div>

      <MuscleSearch muscles={MUSCLES} onSelect={(m) => { setSelected(m); }} />

      {focus && (
        <div className={"focus-bar" + (focus.kind === "breath" ? " breath" : "")}>
          <div className="fb-head">
            <span className="fb-kind">{focus.kind === "breath" ? "호흡근 모드" : "아사나 동원 근육"}</span>
            <strong>{focus.title}</strong>
            {focus.sub && <i>{focus.sub}</i>}
            <span className="fb-count">{focus.list.length}</span>
            <button className="fb-x" onClick={() => setFocus(null)} aria-label="강조 해제">✕ 해제</button>
          </div>
          <div className="fb-muscles">
            {focus.list.map((m) => (
              <button key={m.id} className={"fb-chip" + (selected?.id === m.id ? " on" : "")}
                onClick={() => setSelected(m)}>{m.ko}</button>
            ))}
          </div>
        </div>
      )}

      {!anyLoaded && !bothMissing && <LoadingOverlay />}
      {bothMissing && <EmptyState present={present} />}

      <div className="console">
        <span className="lab">레이어</span>
        <div className="layers">
          {[["surface", "피부", "#d9a88c", surfaceOn, setSurfaceOn],
            ["muscle", "근육", "#a8413a", muscleOn, setMuscleOn],
            ["skeleton", "뼈", "#ece3cf", boneOn, setBoneOn]]
            .filter(([k]) => present[k] !== false)
            .map(([k, t, c, on, set]) => (
              <label key={k} className={"layer-check" + (on ? " on" : "")}>
                <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
                <span className="dot" style={{ background: c }} />{t}
              </label>
            ))}
        </div>
        <button className={"mode-breath" + (focus?.kind === "breath" ? " active" : "")}
          onClick={toggleBreathing} title="호흡근만 강조 — 횡격막·늑간근·사각근·복부">
          🫁 호흡근
        </button>
        <button className={"mode-peel" + (peelMode ? " active" : "")}
          onClick={togglePeel} title="켜고 근육을 클릭하면 벗겨내 아래 근육이 보입니다">
          🔪 벗기기
        </button>
        {hiddenCount > 0 && (
          <button className="restore" onClick={restorePeeled} title="벗긴 근육 모두 되돌리기">
            ↺ 복원 {hiddenCount}
          </button>
        )}
      </div>

      <footer className="attribution">
        3D 데이터:{" "}
        <a href="https://www.z-anatomy.com/" target="_blank" rel="noreferrer">Z-Anatomy</a>
        {" / "}
        <a href="http://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">BodyParts3D</a>
        {" "}— CC BY-SA 4.0
      </footer>

      {selected && (
        <aside className="card">
          <button className="x" onClick={() => setSelected(null)} aria-label="닫기">×</button>
          {selected.id ? (
            <>
              <p className="la">{selected.la}</p>
              <h2>{selected.ko}</h2>
              <span className="group">{selected.group}</span>
              <div className="sec"><div className="h">기능</div><p>{selected.func}</p></div>
              {selected.asanas?.length > 0 && (
                <div className="sec">
                  <div className="h">관련 아사나 <em className="hint-tap">탭하면 동원 근육 강조</em></div>
                  <div className="asanas">
                    {selected.asanas.map(([ko, sa]) => (
                      <button className="asana" key={sa} onClick={() => focusAsana(ko, sa)}
                        title={`${ko}에 동원되는 근육 강조`}>{ko}<i>{sa}</i></button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="la">매핑 데이터 없음</p>
              <h2 style={{ fontSize: 18 }}>{selected.raw}</h2>
              <div className="sec"><p>이 메시 이름에 연결된 한글 정보가 없어요. <code>src/muscles.js</code>의
                해당 근육 <code>matchers</code>에 <b>{selected.raw}</b> 키워드를 추가하면 다음부터 인식됩니다.</p></div>
            </>
          )}
          {editMode && <SuggestBox muscle={selected} />}
        </aside>
      )}

      {editMode && (
        <button className="review-btn" onClick={() => setReviewOpen(true)} title="접수된 수정 제안 보기">
          ✎ 받은 제안
        </button>
      )}
      {editMode && reviewOpen && <SuggestionsPanel onClose={() => setReviewOpen(false)} />}
    </div>
  );
}

// ── 정보 수정 제안 (카드 안) ────────────────────────────────────────────
const FIELDS = [
  ["func", "기능 설명"], ["ko", "한글명"], ["la", "라틴명"],
  ["group", "부위"], ["asanas", "관련 아사나"], ["other", "기타"],
];
function SuggestBox({ muscle }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState("func");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  // 근육이 바뀌면 폼 초기화
  useEffect(() => { setOpen(false); setText(""); setNote(""); setSent(false); setErr(null); }, [muscle]);

  const submit = async () => {
    if (!text.trim()) return;
    setErr(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleId: muscle.id || null, ko: muscle.ko || muscle.raw || null,
          field, suggestion: text, note,
        }),
      });
      if (!res.ok) throw new Error("서버 응답 " + res.status);
      setSent(true); setText(""); setNote("");
    } catch (e) {
      setErr("전송 실패 — 로컬 DB 서버가 켜져 있나요? (npm run server)");
    }
  };

  if (!open) {
    return (
      <button className="suggest-open" onClick={() => setOpen(true)}>✎ 정보 수정 제안</button>
    );
  }
  return (
    <div className="suggest">
      <div className="h">정보 수정 제안</div>
      {sent ? (
        <div className="suggest-done">
          제안이 접수됐어요. 감사합니다! 🙏
          <button className="suggest-again" onClick={() => setSent(false)}>다른 제안 더 하기</button>
        </div>
      ) : (
        <>
          <label className="suggest-row">
            <span>항목</span>
            <select value={field} onChange={(e) => setField(e.target.value)}>
              {FIELDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <textarea className="suggest-text" rows={3} placeholder="수정/추가할 내용을 적어주세요"
            value={text} onChange={(e) => setText(e.target.value)} />
          <input className="suggest-note" placeholder="근거·출처 (선택)" value={note}
            onChange={(e) => setNote(e.target.value)} />
          {err && <div className="suggest-err">{err}</div>}
          <div className="suggest-actions">
            <button className="suggest-cancel" onClick={() => setOpen(false)}>취소</button>
            <button className="suggest-send" onClick={submit} disabled={!text.trim()}>제안 보내기</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── 받은 제안 목록 패널 ─────────────────────────────────────────────────
function SuggestionsPanel({ onClose }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const fieldLabel = (f) => (FIELDS.find(([v]) => v === f)?.[1] || f);

  const load = async () => {
    try {
      const res = await fetch("/api/suggestions");
      if (!res.ok) throw new Error();
      setRows(await res.json());
    } catch { setErr("목록을 못 불러왔어요 — 로컬 DB 서버(npm run server)를 확인하세요."); }
  };
  useEffect(() => { load(); }, []);

  const toggleStatus = async (r) => {
    const status = r.status === "resolved" ? "open" : "resolved";
    await fetch(`/api/suggestions/${r.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    load();
  };

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review" onClick={(e) => e.stopPropagation()}>
        <div className="review-head">
          <h2>받은 수정 제안 {rows ? `(${rows.length})` : ""}</h2>
          <button className="x" onClick={onClose} aria-label="닫기">×</button>
        </div>
        {err && <p className="review-err">{err}</p>}
        {rows && rows.length === 0 && <p className="review-empty">아직 접수된 제안이 없어요.</p>}
        <ul className="review-list">
          {rows?.map((r) => (
            <li key={r.id} className={r.status === "resolved" ? "done" : ""}>
              <div className="rl-top">
                <b>{r.ko || "(미매핑)"}</b>
                <span className="rl-field">{fieldLabel(r.field)}</span>
                <span className="rl-date">{new Date(r.ts).toLocaleString("ko-KR")}</span>
                <button className="rl-status" onClick={() => toggleStatus(r)}>
                  {r.status === "resolved" ? "✓ 처리됨" : "미처리"}
                </button>
              </div>
              <p className="rl-sug">{r.suggestion}</p>
              {r.note && <p className="rl-note">근거: {r.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── 근육 검색 패널 ─────────────────────────────────────────────────────
const MuscleSearch = memo(function MuscleSearch({ muscles, onSelect }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "/" || e.key === "f") && !e.target.matches("input")) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return muscles;
    const lo = q.toLowerCase();
    return muscles.filter((m) =>
      m.ko.includes(lo) || m.la.toLowerCase().includes(lo) ||
      m.group.includes(lo) || m.id.includes(lo)
    );
  }, [q, muscles]);

  if (!open) {
    return (
      <button className="search-trigger" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        title="근육 검색 (단축키: /)">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="8.5" cy="8.5" r="5.5"/><path d="m14 14 3 3"/>
        </svg>
        근육 검색
        <kbd>/</kbd>
      </button>
    );
  }

  return (
    <div className="search-panel">
      <div className="search-header">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="8.5" cy="8.5" r="5.5"/><path d="m14 14 3 3"/>
        </svg>
        <input ref={inputRef} className="search-input" type="text" placeholder="한글명·라틴명·부위 검색…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="search-close" onClick={() => { setOpen(false); setQ(""); }} aria-label="닫기">×</button>
      </div>
      <ul className="search-list">
        {results.map((m) => (
          <li key={m.id}>
            <button className="search-item" onClick={() => { onSelect(m); setOpen(false); setQ(""); }}>
              <span className="si-ko">{m.ko}</span>
              <span className="si-meta">
                <i>{m.la}</i>
                <span className="si-group">{m.group}</span>
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="search-empty">일치하는 근육이 없어요</li>}
      </ul>
    </div>
  );
});

function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <div className="loading">
      <div className="loading-card">
        <div className="spinner" />
        <p>해부 모델 불러오는 중… {Math.round(progress)}%</p>
        <span>근육·골격 약 12MB (Draco 압축)</span>
      </div>
    </div>
  );
}

function EmptyState({ present }) {
  return (
    <div className="empty">
      <div className="empty-card">
        <h2>모델 파일을 넣어주세요</h2>
        <p><code>public/models/</code> 폴더에 아래 파일을 두면 자동으로 로드됩니다.</p>
        <ul>
          <li><b>muscles.glb</b> — 근육 레이어 (필수){present.muscle ? "" : " · 못 찾음"}</li>
          <li><b>skeleton.glb</b> — 골격 레이어 (필수){present.skeleton ? "" : " · 못 찾음"}</li>
          <li><b>surface.glb</b> — 피부 레이어 (선택)</li>
        </ul>
        <p className="hint">Z-Anatomy(.blend)에서 각 시스템을 glb로 export하는 방법은 <code>README.md</code> 참고.</p>
      </div>
    </div>
  );
}
