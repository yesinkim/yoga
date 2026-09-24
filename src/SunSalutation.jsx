// ──────────────────────────────────────────────────────────────────────────
// 수리야나마스카라 A(아쉬탕가 태양 경배) — 관절 마네킹 애니메이션
//
// 같은 관절 각도로 해부 모델 자체도 굽힌다(poseRig.js). 이 마네킹은 옆모습 참고용 미니 뷰이고,
// App은 동작별 동원 근육(ids)을 해부 모델에 강조한다.
// ──────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const D = Math.PI / 180;

// 읽기 쉬운 각도(굴곡 +) → 관절 rotation.x(도).
// 모든 관절은 옆면(X축 회전)만 쓴다. foot = 발의 월드 각도(0 평평, 90 발끝 세움, 180 발등 바닥).
export function toRaw(p) {
  const r = {
    root: p.lean, spine: p.spine, chest: p.chest, neck: p.neck,
    shL: -p.armL, shR: -p.armR, elL: -p.elbowL, elR: -p.elbowR,
    hipL: -p.hipL, hipR: -p.hipR, kneeL: p.kneeL, kneeR: p.kneeR,
  };
  r.ankL = p.footL - (r.root + r.hipL + r.kneeL);
  r.ankR = p.footR - (r.root + r.hipR + r.kneeR);
  return r;
}
const sym = (o) => ({
  lean: o.lean, spine: o.spine, chest: o.chest, neck: o.neck,
  armL: o.arm, armR: o.arm, elbowL: o.elbow, elbowR: o.elbow,
  hipL: o.hip, hipR: o.hip, kneeL: o.knee, kneeR: o.knee, footL: o.foot, footR: o.foot,
});

const SAMA = sym({ lean: 0, spine: 0, chest: 0, neck: 0, arm: 3, elbow: 5, hip: 0, knee: 0, foot: 0 });
const URDHVA_HASTA = sym({ lean: 0, spine: -5, chest: -8, neck: -20, arm: 167, elbow: 0, hip: 0, knee: 0, foot: 0 });
const UTTANA = sym({ lean: 95, spine: 25, chest: 20, neck: 10, arm: 150, elbow: 0, hip: 95, knee: 0, foot: 0 });
// 무릎은 펴고 골반을 깊게 접어 등은 평평하게, 손끝은 발 옆 바닥에
const ARDHA_UTTANA = sym({ lean: 117, spine: 0, chest: 0, neck: -45, arm: 117, elbow: 0, hip: 117, knee: 0, foot: 0 });
const CHATURANGA = sym({ lean: 88, spine: 0, chest: 0, neck: -5, arm: 8, elbow: 80, hip: 0, knee: 0, foot: 80 });
const URDHVA_MUKHA = sym({ lean: 75, spine: -30, chest: -25, neck: -20, arm: 25, elbow: 0, hip: -5, knee: 0, foot: 170 });
const ADHO_MUKHA = sym({ lean: 125, spine: 5, chest: 5, neck: 5, arm: 180, elbow: 0, hip: 85, knee: 0, foot: 0 });

const IDS = {
  sama: ["rectus_femoris", "vastus_medialis", "gluteus_med", "transversus", "longissimus"],
  urdhvaHasta: ["deltoid", "latissimus", "serratus", "trapezius", "rectus_abdominis", "longissimus"],
  uttana: ["biceps_femoris", "semitendinosus", "semimembranosus", "gastrocnemius", "gluteus_max", "longissimus"],
  ardha: ["longissimus", "iliocostalis", "multifidus", "biceps_femoris", "semitendinosus", "gastrocnemius"],
  chaturanga: ["triceps", "pectoralis", "serratus", "deltoid", "rectus_abdominis", "transversus", "rectus_femoris"],
  urdhvaMukha: ["triceps", "longissimus", "iliocostalis", "gluteus_max", "trapezius", "rectus_abdominis", "iliopsoas"],
  adhoMukha: ["deltoid", "latissimus", "triceps", "serratus", "gastrocnemius", "soleus", "biceps_femoris", "semitendinosus"],
};

// 아쉬탕가 수리야나마스카라 A — 빈야사 카운트(에캄~나바)와 호흡
const P = (ko, sa, note, breath, pose, ids) => ({ ko, sa, note, breath, pose, ids });
export const SUN_POSES = [
  P("사마스티티", "Samasthitih", "준비 · 바르게 서기", "자연 호흡", SAMA, IDS.sama),
  P("우르드바 하스타사나", "Urdhva Hastasana", "에캄 · 팔 들어 올리기", "들숨", URDHVA_HASTA, IDS.urdhvaHasta),
  P("우타나사나", "Uttanasana", "드베 · 앞으로 숙이기", "날숨", UTTANA, IDS.uttana),
  P("아르다 우타나사나", "Ardha Uttanasana", "트리니 · 등 펴고 반쯤 들기", "들숨", ARDHA_UTTANA, IDS.ardha),
  P("차투랑가 단다아사나", "Chaturanga Dandasana", "차트바리 · 뒤로 점프, 팔 굽혀 내려가기", "날숨", CHATURANGA, IDS.chaturanga),
  P("우르드바 무카 스바나사나", "Urdhva Mukha Svanasana", "판차 · 업독", "들숨", URDHVA_MUKHA, IDS.urdhvaMukha),
  P("아도 무카 스바나사나", "Adho Mukha Svanasana", "샷 · 다운독, 5호흡", "날숨", ADHO_MUKHA, IDS.adhoMukha),
  P("아르다 우타나사나", "Ardha Uttanasana", "삽타 · 앞으로 점프, 등 펴기", "들숨", ARDHA_UTTANA, IDS.ardha),
  P("우타나사나", "Uttanasana", "아쉬타우 · 앞으로 숙이기", "날숨", UTTANA, IDS.uttana),
  P("우르드바 하스타사나", "Urdhva Hastasana", "나바 · 팔 들며 일어서기", "들숨", URDHVA_HASTA, IDS.urdhvaHasta),
  P("사마스티티", "Samasthitih", "마무리 · 바르게 서기", "날숨", SAMA, IDS.sama),
];

// ── 마네킹 ───────────────────────────────────────────────────────────────
function buildRig() {
  const near = new THREE.MeshStandardMaterial({ color: "#eadcc4", roughness: 0.6 }); // 카메라 쪽(오른쪽)
  const far = new THREE.MeshStandardMaterial({ color: "#8f8270", roughness: 0.7 });  // 반대쪽(왼쪽)
  const body = new THREE.MeshStandardMaterial({ color: "#dccdb4", roughness: 0.6 });

  const seg = (len, r, mat, up = false) => { // 관절에서 위(+Y) 또는 아래(−Y)로 뻗는 캡슐
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 4, 12), mat);
    m.position.y = up ? len / 2 : -len / 2;
    g.add(m);
    return g;
  };
  const at = (parent, child, x, y, z = 0) => { child.position.set(x, y, z); parent.add(child); return child; };

  const outer = new THREE.Group();
  const j = {};
  j.root = at(outer, new THREE.Group(), 0, 0);
  at(j.root, new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 4, 10), body), 0, 0).rotation.z = Math.PI / 2;
  j.spine = at(j.root, seg(0.24, 0.085, body, true), 0, 0);
  j.chest = at(j.spine, seg(0.28, 0.1, body, true), 0, 0.24);
  j.neck = at(j.chest, seg(0.08, 0.04, body, true), 0, 0.28);
  at(j.neck, new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), body), 0, 0.17);
  for (const [s, x, mat] of [["L", -0.18, far], ["R", 0.18, near]]) {
    j["sh" + s] = at(j.chest, seg(0.32, 0.042, mat), x, 0.25);
    j["el" + s] = at(j["sh" + s], seg(0.28, 0.036, mat), 0, -0.32);
    at(j["el" + s], new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), mat), 0, -0.31);
    j["hip" + s] = at(j.root, seg(0.43, 0.06, mat), x * 0.5, -0.02);
    j["knee" + s] = at(j["hip" + s], seg(0.42, 0.048, mat), 0, -0.43);
    j["ank" + s] = at(j["knee" + s], new THREE.Group(), 0, -0.42);
    for (const [jn, r] of [["sh", 0.05], ["el", 0.042], ["hip", 0.065], ["knee", 0.055], ["ank", 0.045]])
      j[jn + s].add(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat));
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.14, 4, 10), mat);
    foot.rotation.x = Math.PI / 2;
    at(j["ank" + s], foot, 0, -0.02, 0.07);
  }
  return { outer, j };
}

const box = new THREE.Box3();
function applyPose({ outer, j }, r) {
  for (const k in r) if (j[k]) j[k].rotation.x = r[k] * D;
  // 가장 낮은 점을 바닥(y=0)에, 앞뒤 중앙을 화면 중앙에
  outer.position.set(0, 0, 0);
  outer.updateMatrixWorld(true);
  box.setFromObject(outer);
  outer.position.set(0, -box.min.y, -(box.min.z + box.max.z) / 2);
}

export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function Mannequin({ pose }) {
  const rig = useMemo(buildRig, []);
  const cur = useRef(null);
  const from = useRef(null);
  const to = useRef(toRaw(pose));
  const t = useRef(1);
  useEffect(() => {
    from.current = cur.current || toRaw(pose);
    to.current = toRaw(pose);
    t.current = 0;
  }, [pose]);
  useFrame((_, dt) => {
    t.current = Math.min(1, t.current + dt / 1.1);
    const e = ease(t.current);
    const a = from.current || to.current, b = to.current, c = {};
    for (const k in b) c[k] = a[k] + (b[k] - a[k]) * e;
    cur.current = c;
    applyPose(rig, c);
  });
  return <primitive object={rig.outer} />;
}

// 옆에서 보는 정사영 카메라 — 패널 크기에 맞춰 줌
function SideCam() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.position.set(5, 0.85, 0);
    camera.lookAt(0, 0.85, 0);
    camera.zoom = Math.min(size.width / 2.5, size.height / 2.05);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export function SunPanel({ step, setStep, playing, setPlaying, onClose }) {
  const s = SUN_POSES[step];
  const n = SUN_POSES.length;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((i) => (i + 1) % n), 3200);
    return () => clearInterval(id);
  }, [playing, setStep, n]);
  const go = (d) => { setPlaying(false); setStep((i) => (i + d + n) % n); };
  const breathCls = s.breath === "들숨" ? "in" : s.breath === "날숨" ? "out" : "hold";

  return (
    <div className="sun-panel">
      <div className="sun-stage">
        <Canvas orthographic dpr={[1, 2]} camera={{ position: [5, 0.85, 0], zoom: 80, near: 0.1, far: 50 }}>
          <hemisphereLight args={["#f3ecdf", "#2a2520", 0.9]} />
          <directionalLight position={[4, 5, 3]} intensity={1.1} />
          <SideCam />
          <Mannequin pose={s.pose} />
          <mesh position={[0, -0.006, 0]}>
            <boxGeometry args={[0.01, 0.012, 3.2]} />
            <meshBasicMaterial color="#5d6b76" />
          </mesh>
        </Canvas>
      </div>
      <div className="sun-info">
        <span className="sun-step">{step + 1}/{n}</span>
        <span className={"sun-breath " + breathCls}>{s.breath}</span>
        <b>{s.ko}</b>
        <i>{s.sa} · {s.note}</i>
      </div>
      <div className="sun-ctrl">
        <button onClick={() => go(-1)} aria-label="이전 동작">‹</button>
        <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "일시정지" : "재생"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => go(1)} aria-label="다음 동작">›</button>
        <button className="sun-x" onClick={onClose} aria-label="수리야나마스카라 닫기">✕</button>
      </div>
    </div>
  );
}
