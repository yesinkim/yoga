import React, {
  Suspense, useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Bounds, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MUSCLES, matchMuscle } from "./muscles.js";

const HIGHLIGHT = new THREE.Color("#5d8a72");

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
  const gltf = useGLTF(url);
  const cloned = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const meshes = [];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.depthWrite = true;
      o.userData.baseColor = o.material.color.clone();
      o.userData.baseEmissive = o.material.emissive
        ? o.material.emissive.clone()
        : new THREE.Color(0x000000);
      const matched = isMuscle ? matchMuscle(o.name) : null;
      o.userData.muscleId = matched ? matched.id : null;
      meshes.push(o);
    });
    return { scene, meshes };
  }, [gltf, isMuscle]);

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

function Scene({ register, onPick, onHover, present }) {
  return (
    <Bounds fit clip observe margin={1.15}>
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
    </Bounds>
  );
}

// ── 깊이 슬라이더 → 레이어별 불투명도 ───────────────────────────────────────
function applyDepth(layers, depth, selectedId) {
  const order = LAYER_ORDER.filter((k) => layers[k]);
  const L = order.length;
  if (L === 0) return;
  const pos = depth * (L - 1);

  order.forEach((key, i) => {
    const isLast = i === L - 1;
    const reveal = clamp(pos - (i - 1), 0, 1);
    const peel = isLast ? 0 : clamp(pos - i, 0, 1);
    let op = reveal * (1 - peel);
    if (key === "surface") op *= 0.55;

    layers[key].meshes.forEach((m) => {
      const sel = key === "muscle" && m.userData.muscleId === selectedId && selectedId;
      const o = sel ? Math.max(op, 0.92) : op;
      m.material.opacity = o;
      m.visible = o > 0.02;
      m.material.depthWrite = o > 0.6;
      if (m.material.emissive) {
        if (sel) {
          m.material.emissive.copy(HIGHLIGHT);
          m.material.emissiveIntensity = 0.55;
        } else {
          m.material.emissive.copy(m.userData.baseEmissive);
          m.material.emissiveIntensity = m.userData.baseEmissive.getHex() ? 1 : 0;
        }
      }
    });
  });
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ── 메인 ────────────────────────────────────────────────────────────────────
export default function App() {
  const layersRef = useRef({});           // key -> {scene, meshes}
  const [present, setPresent] = useState({ surface: true, muscle: true, skeleton: true });
  const [ready, setReady] = useState(0);  // 레이어 등록될 때마다 +1
  const [depth, setDepth] = useState(0);  // 0..1
  const [selected, setSelected] = useState(null); // muscle obj | {raw} | null
  const [hovering, setHovering] = useState(false);

  const register = useCallback((key, payload) => {
    layersRef.current[key] = payload;
    setReady((n) => n + 1);
  }, []);
  const markAbsent = useCallback((key, val) => {
    setPresent((p) => (p[key] === val ? p : { ...p, [key]: val }));
  }, []);

  const onPick = useCallback((obj) => {
    console.log("[picked mesh]", obj.name);
    const m = matchMuscle(obj.name);
    setSelected(m || { raw: obj.name });
  }, []);

  // depth / selected / 레이어 변동 시 머티리얼 갱신
  useEffect(() => {
    applyDepth(layersRef.current, depth, selected?.id);
  }, [depth, selected, ready]);

  const layerCount = LAYER_ORDER.filter((k) => layersRef.current[k]).length;
  const anyLoaded = layerCount > 0;

  return (
    <div className="wrap" style={{ cursor: hovering ? "pointer" : "default" }}>
      <Canvas camera={{ position: [0, 1.2, 4], fov: 38, near: 0.01, far: 5000 }} gl={{ alpha: true }}>
        <hemisphereLight args={["#cdd9e6", "#1a1f27", 0.85]} />
        <directionalLight position={[4, 7, 6]} intensity={1.15} />
        <directionalLight position={[-5, 3, -6]} intensity={0.5} color="#8fbfe0" />
        <Suspense fallback={null}>
          <Scene register={register} onPick={onPick} onHover={setHovering} present={markAbsent} />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>

      <div className="masthead">
        <span className="plate">Atlas of Movement</span>
        <h1>요가 해부학 레이어 뷰어</h1>
      </div>

      {!anyLoaded && <EmptyState present={present} />}

      <div className="console">
        <span className="lab">표층</span>
        <div className="depthwrap">
          <input
            className="depth" type="range" min={0} max={1000} value={Math.round(depth * 1000)}
            onChange={(e) => setDepth(+e.target.value / 1000)}
            aria-label="깊이 — 피부에서 뼈까지"
          />
        </div>
        <span className="lab">심층</span>
        <div className="chips">
          {[["피부", 0, "#d9a88c"], ["근육", 0.5, "#a8413a"], ["뼈", 1, "#ece3cf"]].map(([t, d, c]) => (
            <button key={t} className={"chip" + (Math.abs(d - depth) < 0.18 ? " active" : "")}
              onClick={() => setDepth(d)}>
              <span className="dot" style={{ background: c }} />{t}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <aside className="card">
          <button className="x" onClick={() => setSelected(null)} aria-label="닫기">×</button>
          {selected.id ? (
            <>
              <p className="la">{selected.la}</p>
              <h2>{selected.ko}</h2>
              <span className="group">{selected.group}</span>
              <div className="sec"><div className="h">기능</div><p>{selected.func}</p></div>
              <div className="sec">
                <div className="h">관련 아사나</div>
                <div className="asanas">
                  {selected.asanas.map(([ko, sa]) => (
                    <span className="asana" key={sa}>{ko}<i>{sa}</i></span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="la">매핑 데이터 없음</p>
              <h2 style={{ fontSize: 18 }}>{selected.raw}</h2>
              <div className="sec"><p>이 메시 이름에 연결된 한글 정보가 없어요. <code>src/muscles.js</code>의
                해당 근육 <code>matchers</code>에 <b>{selected.raw}</b> 키워드를 추가하면 다음부터 인식됩니다.</p></div>
            </>
          )}
        </aside>
      )}
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
