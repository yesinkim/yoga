// ──────────────────────────────────────────────────────────────────────────
// 해부 모델 자동 스키닝 — 뼈 모델에서 관절 위치를 잡고, 모든 메시(근육·뼈·근막·피부)에
// 거리 기반 웨이트를 계산해 GPU 스키닝으로 굽힌다. 친구 리깅 전까지 쓰는 근사치.
//
// 관절 이름/각도 규칙은 SunSalutation.jsx의 마네킹과 같다(X축 회전, L = x<0 = 사람의 오른쪽).
// ──────────────────────────────────────────────────────────────────────────
import * as THREE from "three";

const D = Math.PI / 180;
export const BONE_KEYS = ["root", "spine", "chest", "neck", "shL", "shR", "elL", "elR",
  "hipL", "hipR", "kneeL", "kneeR", "ankL", "ankR", "clL", "clR", "wrL", "wrR"];
// 자세 값(도) 키 = 뼈 + 아래팔 비틀기(엎침)
export const POSE_KEYS = [...BONE_KEYS, "twL", "twR"];
// 팔을 들면 어깨뼈·빗장뼈(어깨띠)도 함께 돈다(견갑상완 리듬 ≈ 2:1) → 팔 회전을 나눠 맡겨 어깨 주변이 덜 찢어지게
const GIRDLE_SHARE = 0.3;

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _box = new THREE.Box3();

// F(기준 좌표계) 안에서 메시의 AABB
function boxInFrame(mesh, invF) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  _m.multiplyMatrices(invF, mesh.matrixWorld);
  return _box.copy(g.boundingBox).applyMatrix4(_m).clone();
}

// 이름 패턴 + 좌우(side: -1, +1, 0=가운데)로 뼈 박스를 합친다. 없으면 반대쪽을 거울상으로.
function findBox(bones, re, side) {
  const pick = (s) => {
    const out = new THREE.Box3();
    for (const b of bones) {
      if (!re.test(b.name)) continue;
      const cx = (b.box.min.x + b.box.max.x) / 2;
      if (s !== 0 && Math.sign(cx) !== s) continue;
      out.union(b.box);
    }
    return out;
  };
  let bx = pick(side);
  if (bx.isEmpty() && side !== 0) {
    const o = pick(-side);
    if (!o.isEmpty()) bx = new THREE.Box3(new THREE.Vector3(-o.max.x, o.min.y, o.min.z), new THREE.Vector3(-o.min.x, o.max.y, o.max.z));
  }
  return bx.isEmpty() ? null : bx;
}

function landmarks(boneMeshes, invF) {
  const bones = boneMeshes.map((m) => ({ name: m.name || "", box: boxInFrame(m, invF) }));
  const all = new THREE.Box3();
  bones.forEach((b) => all.union(b.box));
  const c = (b) => b.getCenter(new THREE.Vector3());
  const J = {};
  for (const [s, S] of [[-1, "L"], [1, "R"]]) {
    const femur = findBox(bones, /^femur/i, s);
    const tibia = findBox(bones, /^tibia/i, s);
    const foot = findBox(bones, /^(calcaneus|talus)/i, s);
    const hum = findBox(bones, /^humerus/i, s);
    const fore = findBox(bones, /^(radius|ulna)/i, s);
    if (!femur || !tibia || !hum || !fore) throw new Error("관절 랜드마크를 찾지 못했어요");
    const inner = (b) => Math.min(Math.abs(b.min.x), Math.abs(b.max.x));
    const w = (b) => b.max.x - b.min.x;
    J["hip" + S] = new THREE.Vector3(s * (inner(femur) + 0.35 * w(femur)), femur.max.y - 0.025, c(femur).z);
    J["knee" + S] = new THREE.Vector3(c(tibia).x, femur.min.y + 0.015, c(tibia).z);
    const ank = foot || tibia;
    J["ank" + S] = new THREE.Vector3(c(tibia).x, foot ? foot.max.y - 0.01 : tibia.min.y, c(ank).z);
    const heelY = foot ? foot.min.y : all.min.y;
    J["heel" + S] = new THREE.Vector3(c(tibia).x, heelY, foot ? foot.min.z : c(tibia).z - 0.06);
    J["toe" + S] = new THREE.Vector3(c(tibia).x + s * 0.01, heelY, J["heel" + S].z + 0.25);
    J["sh" + S] = new THREE.Vector3(s * (inner(hum) + 0.3 * w(hum)), hum.max.y - 0.03, c(hum).z);
    J["el" + S] = new THREE.Vector3(c(fore).x, hum.min.y + 0.02, c(fore).z);
    J["wr" + S] = new THREE.Vector3(c(fore).x, fore.min.y, c(fore).z);
    const dir = J["wr" + S].clone().sub(J["el" + S]).normalize();
    J["hand" + S] = J["wr" + S].clone().addScaledVector(dir, 0.19);
  }
  const vert = (re, fallbackY) => {
    const b = findBox(bones, re, 0);
    return b ? c(b) : new THREE.Vector3(0, fallbackY, -0.04);
  };
  J.pelvis = J.hipL.clone().add(J.hipR).multiplyScalar(0.5);
  J.L5 = vert(/^vertebra_l5/i, J.pelvis.y + 0.12); J.L5.x = 0;
  J.T12 = vert(/^vertebra_t12/i, J.L5.y + 0.16); J.T12.x = 0;
  J.C7 = vert(/^vertebra_c7/i, J.T12.y + 0.3); J.C7.x = 0;
  J.headTop = new THREE.Vector3(0, all.max.y, J.C7.z + 0.04);
  return J;
}

// 점 p와 선분 ab 사이 거리²
function segD2(p, a, b) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
  let t = (apx * abx + apy * aby + apz * abz) / (abx * abx + aby * aby + abz * abz || 1);
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return dx * dx + dy * dy + dz * dz;
}

// Blender 프록시 Bone Heat로 구운 웨이트 격자(scripts/bake_proxy_weights.py가 만듦)
// 헤더 32바이트: 'PXW1', NX NY NZ NB(uint16), lo(f32×3), H(f32) / 칸마다 뼈 4개(4비트씩) + 가중치 3개(uint8)
export async function loadProxyWeights(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const buf = await r.arrayBuffer();
  const dv = new DataView(buf);
  const magic = buf.byteLength >= 32 ? String.fromCharCode(...new Uint8Array(buf, 0, 4)) : "";
  if (magic !== "PXW1" && magic !== "PXW2") return null;
  const v2 = magic === "PXW2"; // PXW2: 뼈 번호 4개를 1바이트씩(16개 넘는 뼈 — 손목 추가)
  const NX = dv.getUint16(4, true), NY = dv.getUint16(6, true), NZ = dv.getUint16(8, true), NB = dv.getUint16(10, true);
  const lo = [dv.getFloat32(12, true), dv.getFloat32(16, true), dv.getFloat32(20, true)], H = dv.getFloat32(24, true);
  const n = NX * NY * NZ;
  const rec = v2 ? 7 : 5;
  if (buf.byteLength < 32 + n * rec) return null;
  const data = new Float32Array(n * NB);
  for (let c = 0, o = 32; c < n; c++, o += rec) {
    let b0, b1, b2, b3, w;
    if (v2) { b0 = dv.getUint8(o); b1 = dv.getUint8(o + 1); b2 = dv.getUint8(o + 2); b3 = dv.getUint8(o + 3); w = o + 4; }
    else { const idx = dv.getUint16(o, true); b0 = idx & 15; b1 = (idx >> 4) & 15; b2 = (idx >> 8) & 15; b3 = (idx >> 12) & 15; w = o + 2; }
    const w0 = dv.getUint8(w), w1 = dv.getUint8(w + 1), w2 = dv.getUint8(w + 2);
    const w3 = Math.max(0, 255 - w0 - w1 - w2), base = c * NB;
    if (b0 < NB) data[base + b0] += w0 / 255; if (b1 < NB) data[base + b1] += w1 / 255;
    if (b2 < NB) data[base + b2] += w2 / 255; if (b3 < NB) data[base + b3] += w3 / 255;
  }
  return { NX, NY, NZ, NB, lo, H, data };
}

export function buildPoseRig(layers, options = {}) {
  const F = layers.muscle.scene;           // 기준 좌표계 = 근육 glb 씬
  let top = F; while (top.parent) top = top.parent;
  top.updateMatrixWorld(true);
  const invF = F.matrixWorld.clone().invert();
  const J = landmarks(layers.skeleton.meshes, invF);

  // ── 뼈대 ──
  const pos = {
    root: J.pelvis, spine: J.L5, chest: J.T12, neck: J.C7,
    shL: J.shL, shR: J.shR, elL: J.elL, elR: J.elR, wrL: J.wrL, wrR: J.wrR,
    clL: new THREE.Vector3(-0.04, J.shL.y - 0.03, J.shL.z),  // 어깨띠 회전축(어깨 깊이 — 등 쪽이 크게 휘둘리지 않게)
    clR: new THREE.Vector3(0.04, J.shR.y - 0.03, J.shR.z),
    hipL: J.hipL, hipR: J.hipR, kneeL: J.kneeL, kneeR: J.kneeR, ankL: J.ankL, ankR: J.ankR,
  };
  const parent = {
    root: null, spine: "root", chest: "spine", neck: "chest", shL: "clL", shR: "clR", clL: "chest", clR: "chest",
    elL: "shL", elR: "shR", wrL: "elL", wrR: "elR", hipL: "root", hipR: "root", kneeL: "hipL", kneeR: "hipR", ankL: "kneeL", ankR: "kneeR",
  };
  const B = {};
  // 부모가 먼저 만들어지도록 깊이 순으로 생성(스켈레톤 인덱스 순서는 BONE_KEYS 그대로)
  const depth = (k) => (parent[k] ? 1 + depth(parent[k]) : 0);
  for (const k of [...BONE_KEYS].sort((a, b) => depth(a) - depth(b))) {
    const b = new THREE.Bone(); b.name = "pose_" + k; B[k] = b;
    const p = pos[k].clone();
    if (parent[k]) p.sub(pos[parent[k]]);
    b.position.copy(p);
    if (/^wr/.test(k)) b.rotation.order = "YXZ"; // 손목: 굽힌 뒤 비틀기 → 엎친 아래팔에서도 손이 옆으로 꺾이지 않게
    (parent[k] ? B[parent[k]] : F).add(b);
  }
  F.updateMatrixWorld(true);
  const bones = BONE_KEYS.map((k) => B[k]);
  const skeleton = new THREE.Skeleton(bones); // 지금(선 자세) 기준으로 역행렬 계산 — 이후 다시 계산하지 않는다

  // ── 웨이트용 선분 (뼈 인덱스별) ──
  const idx = Object.fromEntries(BONE_KEYS.map((k, i) => [k, i]));
  const mid = (a, b, t) => a.clone().lerp(b, t);
  const segs = [
    [idx.root, J.hipL, J.hipR], [idx.root, J.pelvis, J.L5],
    [idx.spine, J.L5, J.T12],
    [idx.chest, J.T12, J.C7],
    [idx.clL, mid(J.C7, J.shL, 0.3), J.shL], [idx.clR, mid(J.C7, J.shR, 0.3), J.shR],
    [idx.neck, J.C7, J.headTop],
  ];
  for (const S of ["L", "R"]) {
    segs.push([idx["sh" + S], J["sh" + S], J["el" + S]]);
    segs.push([idx["el" + S], J["el" + S], J["wr" + S]]);
    segs.push([idx["wr" + S], J["wr" + S], J["hand" + S]]);
    segs.push([idx["hip" + S], J["hip" + S], J["knee" + S]]);
    segs.push([idx["knee" + S], J["knee" + S], J["ank" + S]]);
    segs.push([idx["ank" + S], J["ank" + S], J["toe" + S]], [idx["ank" + S], J["ank" + S], J["heel" + S]]);
  }
  const armX = Math.abs(J.shR.x) * 0.72;     // 이보다 안쪽은 팔에 붙지 않음(몸통 찢어짐 방지)
  const legTop = J.pelvis.y + 0.07;
  const handZoneY = J.pelvis.y + 0.05;          // 골반 아래에선 손 부위(바깥쪽)만 팔에 붙는다
  const handX = Math.abs(J.elR.x) * 0.8;
  const girdleLow = J.T12.y + (J.C7.y - J.T12.y) * 0.35;
  const side = new Int8Array(BONE_KEYS.length);
  const kind = new Int8Array(BONE_KEYS.length); // 0 몸통, 1 팔, 2 다리
  BONE_KEYS.forEach((k, i) => {
    side[i] = k.endsWith("L") ? -1 : k.endsWith("R") ? 1 : 0;
    kind[i] = /^(sh|el|wr)/.test(k) ? 1 : /^(hip|knee|ank)/.test(k) ? 2 : /^cl/.test(k) ? 3 : 0;
  });

  const best = new Float32Array(BONE_KEYS.length);
  const NB = BONE_KEYS.length;
  const acc = new Float32Array(NB);
  const gated = (k, s, v) =>
    (k === 1 && (v.x * s < armX || (v.y < handZoneY && v.x * s < handX))) ||   // 허벅지가 손을 따라가지 않게
    (k === 2 && (v.x * s < -0.01 || v.y > legTop)) ||
    // 어깨띠: 같은 쪽 위쪽만. 등 한가운데(승모근 안쪽)는 몸통에 남긴다
    (k === 3 && (v.x * s < 0.015 || v.y < girdleLow || (v.z < J.C7.z + 0.03 && v.x * s < armX)));
  // 한 점의 거리 기반 웨이트(가까운 세 뼈를 1/d³로) → out[NB]
  function pointWeights(v, out) {
    best.fill(Infinity);
    for (const [bi, a, b] of segs) {
      if (gated(kind[bi], side[bi], v)) continue;
      const d2 = segD2(v, a, b);
      if (d2 < best[bi]) best[bi] = d2;
    }
    out.fill(0);
    const top = [-1, -1, -1];
    for (let b = 0; b < NB; b++) {
      if (best[b] === Infinity) continue;
      if (top[0] < 0 || best[b] < best[top[0]]) { top[2] = top[1]; top[1] = top[0]; top[0] = b; }
      else if (top[1] < 0 || best[b] < best[top[1]]) { top[2] = top[1]; top[1] = b; }
      else if (top[2] < 0 || best[b] < best[top[2]]) top[2] = b;
    }
    let sum = 0;
    for (const b of top) if (b >= 0) { out[b] = 1 / Math.pow(best[b] + 2e-5, 1.5); sum += out[b]; }
    if (sum > 0) for (let b = 0; b < NB; b++) out[b] /= sum;
  }
  // 흐린 뒤 섞여 들어온 '허용 안 되는 뼈'(반대쪽 다리 등)는 지운다
  function allowMask(v, out) {
    let sum = 0;
    for (let b = 0; b < NB; b++) { if (out[b] > 0 && gated(kind[b], side[b], v)) out[b] = 0; sum += out[b]; }
    if (sum > 0) for (let b = 0; b < NB; b++) out[b] /= sum;
  }

  // ── 공통 웨이트 장: 몸 전체 격자에서 한 번 계산하고 흐려, 모든 메시가 같은 장에서 읽는다 ──
  // (붙어 있는 근육이 서로 다른 뼈를 따라가 찢어지는 걸 막고, 관절 둘레를 매끄럽게)
  const H = 0.015, BLUR = 2;
  const lo = new THREE.Vector3(Math.min(J.handL.x, J.shL.x) - 0.12, J.heelL.y - 0.05, -0.28);
  const hi = new THREE.Vector3(Math.max(J.handR.x, J.shR.x) + 0.12, J.headTop.y + 0.05, 0.3);
  const NX = Math.ceil((hi.x - lo.x) / H) + 1, NY = Math.ceil((hi.y - lo.y) / H) + 1, NZ = Math.ceil((hi.z - lo.z) / H) + 1;
  let field = null;
  // Blender에서 구운 웨이트 격자(같은 격자 배치)가 오면 그걸 쓰고 살짝만 흐린다
  // 구운 격자는 관절 위치에서 만든 격자와 배치가 같을 때만 쓴다(모델이 바뀌면 다시 구워야 함)
  const g = options.grid;
  const same = g && g.NX === NX && g.NY === NY && g.NZ === NZ && g.NB === NB && Math.abs(g.H - H) < 1e-6 &&
    g.lo.every((v, i) => Math.abs(v - lo.getComponent(i)) < 2e-3);
  const baked = same ? g.data : null;
  if (g && !same) console.warn("[poseRig] baked weights don't match this model — using computed weights");
  if (baked) {
    field = new Float32Array(baked);
    const tmp = new Float32Array(field.length);
    blur3(field, tmp, 1, 1);
  } else if (options.smooth !== false) {
    field = new Float32Array(NX * NY * NZ * NB);
    const c = new THREE.Vector3();
    for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      c.set(lo.x + x * H, lo.y + y * H, lo.z + z * H);
      pointWeights(c, acc);
      field.set(acc, ((z * NY + y) * NX + x) * NB);
    }
    // 축별 상자 흐림(BLUR칸 반경) 두 번 ≈ 부드러운 가우시안
    blur3(field, new Float32Array(field.length), BLUR, 2);
  }
  // 축별 상자 흐림(radius칸) rounds번 — 근사 가우시안
  function blur3(f, tmp, radius, rounds) {
    const pass = (src, dst, axis) => {
      const st = axis === 0 ? 1 : axis === 1 ? NX : NX * NY, L = axis === 0 ? NX : axis === 1 ? NY : NZ;
      for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
        const i0 = (z * NY + y) * NX + x, p = axis === 0 ? x : axis === 1 ? y : z;
        const o = i0 * NB;
        for (let b = 0; b < NB; b++) {
          let s2 = 0, cnt = 0;
          for (let d = -radius; d <= radius; d++) {
            const q = p + d; if (q < 0 || q >= L) continue;
            s2 += src[(i0 + d * st) * NB + b]; cnt++;
          }
          dst[o + b] = s2 / cnt;
        }
      }
    };
    for (let r = 0; r < rounds; r++) { pass(f, tmp, 0); pass(tmp, f, 1); pass(f, tmp, 2); f.set(tmp); }
  }
  // 격자 장에서 삼선형 보간
  function sampleField(v, out) {
    const fx = Math.min(Math.max((v.x - lo.x) / H, 0), NX - 1.001);
    const fy = Math.min(Math.max((v.y - lo.y) / H, 0), NY - 1.001);
    const fz = Math.min(Math.max((v.z - lo.z) / H, 0), NZ - 1.001);
    const x0 = fx | 0, y0 = fy | 0, z0 = fz | 0, tx = fx - x0, ty = fy - y0, tz = fz - z0;
    out.fill(0);
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const w = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
      if (w === 0) continue;
      const o = (((z0 + dz) * NY + (y0 + dy)) * NX + (x0 + dx)) * NB;
      for (let b = 0; b < NB; b++) out[b] += field[o + b] * w;
    }
  }
  // 손목: 격자 웨이트는 흐림 때문에 손바닥까지 아래팔(el)이 반쯤 섞여 손이 덜 꺾이고 비틀 때 찌그러진다.
  // 아래팔·손에 속한 점(el+wr 웨이트가 큰 점)은 팔꿈치→손끝 축 위 위치로 손목 앞뒤 ±WRIST_BLEND만 섞고 나눈다.
  const WRIST_BLEND = 0.02, WRIST_SHIFT = 0.01; // 손목뼈(손목관절 바로 아래)부터 손으로 — 축 위 관절보다 1cm 몸쪽에서 섞기 시작
  const wristAxis = {};
  for (const S of ["L", "R"]) {
    const a = J["el" + S], d = J["hand" + S].clone().sub(a), len = d.length();
    d.normalize();
    wristAxis[S] = { a, d, tw: J["wr" + S].clone().sub(a).dot(d), len, el: idx["el" + S], wr: idx["wr" + S] };
  }
  function wristSplit(v, out) {
    for (const S of ["L", "R"]) {
      const w = wristAxis[S], fw = out[w.el] + out[w.wr];
      if (fw < 0.5) continue;
      const t = _v2.copy(v).sub(w.a).dot(w.d);
      const u = Math.min(1, Math.max(0, (t - w.tw + WRIST_SHIFT + WRIST_BLEND) / (2 * WRIST_BLEND)));
      const k = u * u * (3 - 2 * u);
      out[w.wr] = fw * k; out[w.el] = fw * (1 - k);
    }
  }
  const done = new Map(); // geometry → matrix(중복 공유 지오메트리 처리)
  const all = [];
  // 아직 스키닝 안 된 메시에 웨이트를 계산해 붙인다(나중에 로드된 피부도 여기로)
  function skinNew(ls) {
    const fresh = [];
    for (const key of ["muscle", "skeleton", "surface", "fascia"]) {
      for (const m of ls[key]?.meshes || []) if (!m.isSkinnedMesh) fresh.push(m);
    }
    if (!fresh.length) return;
    // 막 추가된 레이어는 아직 렌더 전이라 부모 오프셋이 월드 행렬에 안 들어가 있다 → 맨 위부터 갱신
    const roots = new Set();
    for (const m of fresh) { let t = m; while (t.parent) t = t.parent; roots.add(t); }
    roots.forEach((r) => r.updateMatrixWorld(true));
    skinMeshes(fresh);
    all.push(...fresh);
  }
  function skinMeshes(list) {
  for (const m of list) {
    _m.multiplyMatrices(invF, m.matrixWorld);
    if (done.has(m.geometry) && !done.get(m.geometry).equals(_m)) m.geometry = m.geometry.clone();
    const g = m.geometry;
    done.set(g, _m.clone());
    const P = g.attributes.position;
    const n = P.count;
    const si = new Uint8Array(n * 4), sw = new Uint8Array(n * 4);
    const votes = new Uint32Array(BONE_KEYS.length);
    for (let i = 0; i < n; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(_m);
      if (field) sampleField(_v, acc); else pointWeights(_v, acc);
      allowMask(_v, acc); // 좌우·팔다리 구분은 흐린 뒤에도 지킨다
      wristSplit(_v, acc);
      // 가장 큰 네 뼈만 남겨 정규화
      const top = [-1, -1, -1, -1];
      for (let b = 0; b < NB; b++) {
        if (acc[b] <= 0) continue;
        for (let t = 0; t < 4; t++) {
          if (top[t] < 0 || acc[b] > acc[top[t]]) { for (let u = 3; u > t; u--) top[u] = top[u - 1]; top[t] = b; break; }
        }
      }
      if (top[0] < 0) { top[0] = 0; acc[0] = 1; }
      let sum = 0; for (const b of top) if (b >= 0) sum += acc[b];
      let used = 0;
      for (let t = 0; t < 4; t++) {
        const b = top[t];
        si[i * 4 + t] = b < 0 ? 0 : b;
        const q = t === 3 ? Math.max(0, 255 - used) : b < 0 ? 0 : Math.round((255 * acc[b]) / sum);
        sw[i * 4 + t] = q; used += q;
      }
      votes[top[0]]++;
    }
    g.setAttribute("skinIndex", new THREE.Uint8BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.Uint8BufferAttribute(sw, 4, true));
    if (!g.boundingSphere) g.computeBoundingSphere();
    let dom = 0; for (let b = 1; b < votes.length; b++) if (votes[b] > votes[dom]) dom = b;
    makeSkinned(m, skeleton, dom);
  }
  }
  skinNew(layers);

  // ── 부피 보존 근육 변형 ──
  // 근육마다 긴 방향(주축)과 양 끝 정점을 찾아 두고, 자세가 바뀔 때 양 끝 사이 길이를 잰다.
  // 근육은 부피가 거의 일정하므로 짧아지면(수축) 근복이 굵어지고, 늘어나면(신장) 가늘어진다.
  // 단면 배율 = √(L0/L) — 셰이더가 근복(가운데)일수록 크게, 힘줄 쪽 끝은 그대로 둔다.
  const musc = [];
  const GAIN = 1.6;          // 눈에 보이도록 실제보다 조금 과장
  const ACTIVE_BULGE = 0.07; // 수축 역할 근육은 길이 변화가 없어도 힘이 들어간 듯 살짝 부풂
  const STRETCH_THIN = 0.06; // 신장 역할 근육은 길게 늘어난 듯 살짝 가늘게
  const END_ZONE = 0.1;      // 길이를 잴 양 끝 구간(주축 비율)
  const END_SAMPLES = 24;    // 끝 구간에서 고르게 뽑을 정점 수
  const SHEET_RATIO = 0.4;   // 단면 두께/폭이 이보다 작으면 '넓적한 근육'(전거근·외복사근·광배근 등)
  const sampleEnd = (aT, inZone) => {
    const all = []; for (let i = 0; i < aT.length; i++) if (inZone(aT[i])) all.push(i);
    if (all.length <= END_SAMPLES) return all;
    const out = []; for (let k = 0; k < END_SAMPLES; k++) out.push(all[Math.floor((k * all.length) / END_SAMPLES)]);
    return out;
  };
  const meanRest = (P, ids) => { const o = new THREE.Vector3(); for (const i of ids) o.add(_v.fromBufferAttribute(P, i)); return o.multiplyScalar(1 / ids.length); };
  const _pp = new THREE.Vector3();
  const meanPosed = (m, ids, out) => { out.set(0, 0, 0); for (const i of ids) out.add(m.getVertexPosition(i, _pp)); return out.multiplyScalar(1 / ids.length); };
  function setupMuscleDeform(list) {
    const c = new THREE.Vector3(), e = new THREE.Vector3(), t3 = new THREE.Vector3();
    for (const m of list || []) {
      if (!m.isSkinnedMesh || m.userData.mus) continue;
      const P = m.geometry.attributes.position, n = P.count;
      if (n < 12) continue;
      c.set(0, 0, 0);
      for (let i = 0; i < n; i++) c.x += P.getX(i), c.y += P.getY(i), c.z += P.getZ(i);
      c.multiplyScalar(1 / n);
      // 공분산 → 거듭제곱법으로 주축
      let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
      for (let i = 0; i < n; i++) {
        const x = P.getX(i) - c.x, y = P.getY(i) - c.y, z = P.getZ(i) - c.z;
        xx += x * x; xy += x * y; xz += x * z; yy += y * y; yz += y * z; zz += z * z;
      }
      e.set(1, 0.7, 0.4).normalize();
      for (let k = 0; k < 24; k++) {
        t3.set(xx * e.x + xy * e.y + xz * e.z, xy * e.x + yy * e.y + yz * e.z, xz * e.x + yz * e.y + zz * e.z);
        if (t3.lengthSq() < 1e-20) break;
        e.copy(t3).normalize();
      }
      // 주축에 수직인 단면의 두께(가장 얇은 방향 표준편차) — 넓적하거나 몸을 감싸는 근육은 법선 방향으로 굵기를 바꾼다
      const ev = (v) => (xx * v.x * v.x + yy * v.y * v.y + zz * v.z * v.z + 2 * (xy * v.x * v.y + xz * v.x * v.z + yz * v.y * v.z)) / n;
      const u1 = new THREE.Vector3(1, 0, 0); if (Math.abs(e.x) > 0.9) u1.set(0, 1, 0);
      u1.sub(t3.copy(e).multiplyScalar(u1.dot(e))).normalize();
      const u2 = new THREE.Vector3().crossVectors(e, u1);
      // 단면 2×2 공분산의 고유값
      const a11 = ev(u1), a22 = ev(u2), a12 = (xx * u1.x * u2.x + yy * u1.y * u2.y + zz * u1.z * u2.z +
        xy * (u1.x * u2.y + u1.y * u2.x) + xz * (u1.x * u2.z + u1.z * u2.x) + yz * (u1.y * u2.z + u1.z * u2.y)) / n;
      const tr = (a11 + a22) / 2, det = Math.sqrt(Math.max(0, ((a11 - a22) / 2) ** 2 + a12 * a12));
      const thin = Math.sqrt(Math.max(tr - det, 0)), wide = Math.sqrt(tr + det);
      let dMin = Infinity, dMax = -Infinity, ia = 0, ib = 0;
      const d = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        d[i] = (P.getX(i) - c.x) * e.x + (P.getY(i) - c.y) * e.y + (P.getZ(i) - c.z) * e.z;
        if (d[i] < dMin) { dMin = d[i]; ia = i; }
        if (d[i] > dMax) { dMax = d[i]; ib = i; }
      }
      const span = dMax - dMin;
      if (span < 1e-4) continue;
      const aT = new Float32Array(n);
      for (let i = 0; i < n; i++) aT[i] = (d[i] - dMin) / span;
      m.geometry.setAttribute("aMusT", new THREE.BufferAttribute(aT, 1));
      // 양 끝 길이는 정점 하나가 아니라 끝 구간(주축 10%) 정점 여럿의 평균으로 잰다
      // → 끝 정점 하나에 팔·목 웨이트가 섞여 있어도 길이가 크게 틀어지지 않게
      const endA = sampleEnd(aT, (t) => t <= END_ZONE), endB = sampleEnd(aT, (t) => t >= 1 - END_ZONE);
      if (!endA.length || !endB.length) { endA.push(ia); endB.push(ib); }
      const A = meanRest(P, endA), Bv = meanRest(P, endB);
      // 넓적한(단면이 납작한) 근육은 직선 축 기준 확대가 근육을 통째로 밀어내거나 꺼뜨리므로 표면 법선 방향으로
      const sheet = thin < SHEET_RATIO * wide;
      const mus = { endA, endB, L0: A.distanceTo(Bv), uA: { value: A.clone() }, uB: { value: Bv.clone() }, uS: { value: 0 },
        uSheet: { value: sheet ? 1 : 0 }, uThick: { value: Math.min(thin * 1.5, shellHalfThickness(m.geometry), 0.008) } };
      m.userData.mus = mus;
      patchMaterial(m.material, mus);
      musc.push(m);
    }
  }
  setupMuscleDeform(layers.muscle.meshes);
  // 매 프레임(자세 보간 중) 호출: roles = Map(근육 id → "c"|"s"), act 0~1 = 수축 힘 표시 세기
  function updateMuscles(roles, act = 0) {
    for (const m of musc) {
      const u = m.userData.mus;
      meanPosed(m, u.endA, u.uA.value);
      meanPosed(m, u.endB, u.uB.value);
      const L = u.uA.value.distanceTo(u.uB.value);
      let k = (Math.sqrt(u.L0 / Math.max(L, 1e-6)) - 1) * GAIN;
      k = Math.min(0.5, Math.max(-0.35, k));
      // 동작별 역할(해부학 기준)로 방향을 바로잡는다: 단순 회전 관절이라 관절 바로 옆 근육(대둔근·햄스트링 등)은
      // 길이 변화가 틀리게 잡힐 수 있음. 수축 → 굵어지는 쪽만, 신장 → 가늘어지는 쪽만.
      const role = roles && act > 0 ? roles.get(m.userData.muscleId) : null;
      if (role === "c") k = Math.max(k, 0) + ACTIVE_BULGE * act;
      else if (role === "s") k = Math.min(k, 0) - STRETCH_THIN * act;
      u.uS.value = k;
    }
  }

  // ── 접지용 표면 탐침(뼈에 붙은 점) ──
  const probes = [];
  const probe = (bone, p) => { const o = new THREE.Object3D(); o.position.copy(p).sub(pos[bone]); B[bone].add(o); probes.push(o); };
  for (const S of ["L", "R"]) {
    probe("ank" + S, J["heel" + S]); probe("ank" + S, J["toe" + S]);
    probe("wr" + S, J["hand" + S]); probe("wr" + S, J["wr" + S]); // 손끝·손목(손바닥 뒤꿈치)
    probe("el" + S, J["el" + S].clone().add(new THREE.Vector3(0, 0, -0.04)));
    probe("knee" + S, J["knee" + S].clone().add(new THREE.Vector3(0, 0, 0.06)));
    probe("hip" + S, mid(J["hip" + S], J["knee" + S], 0.5).add(new THREE.Vector3(0, 0, 0.07)));
    probe("sh" + S, J["sh" + S].clone().add(new THREE.Vector3(0, 0.03, 0)));
  }
  probe("root", J.pelvis.clone().add(new THREE.Vector3(0, -0.06, -0.14)));
  probe("spine", mid(J.L5, J.T12, 0.5).setZ(J.L5.z + 0.16));
  probe("chest", mid(J.T12, J.C7, 0.6).setZ(J.T12.z + 0.19));
  probe("neck", J.headTop.clone().add(new THREE.Vector3(0, -0.02, 0)));
  probe("neck", J.headTop.clone().add(new THREE.Vector3(0, -0.12, 0.11)));
  F.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  const measure = () => {
    let minY = Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const o of probes) {
      o.getWorldPosition(wp).applyMatrix4(invF);
      if (wp.y < minY) minY = wp.y;
      if (wp.z < minZ) minZ = wp.z; if (wp.z > maxZ) maxZ = wp.z;
    }
    return { minY, cz: (minZ + maxZ) / 2 };
  };
  const rest = measure();

  // raw(도) → 뼈 회전, 발바닥을 원래 바닥 높이에, 앞뒤 중심 유지
  function apply(raw) {
    for (const k of BONE_KEYS) B[k].rotation.set((raw[k] || 0) * D, 0, 0);
    // 아래팔 엎침(손바닥을 바닥으로): 팔꿈치·손목에 반씩 나눠 비틀어 한 관절에서 꼬이며 찌그러지지 않게
    for (const S of ["L", "R"]) {
      const tw = (raw["tw" + S] || 0) * D;
      B["el" + S].rotation.y = tw * 0.5;
      B["wr" + S].rotation.y = tw * 0.5;
    }
    for (const S of ["L", "R"]) { // 팔 회전을 어깨띠와 어깨 관절에 나눠 준다
      const a = (raw["sh" + S] || 0) * D;
      B["cl" + S].rotation.x = a * GIRDLE_SHARE;
      B["sh" + S].rotation.x = a * (1 - GIRDLE_SHARE);
    }
    B.root.position.copy(pos.root);
    F.updateMatrixWorld(true);
    const m = measure();
    B.root.position.y += rest.minY - m.minY;
    B.root.position.z += rest.cz - m.cz;
    F.updateMatrixWorld(true);
    for (const mm of all) mm.boundingSphere = null; // 클릭 판정용 구 다시 계산(저렴한 근사)
  }
  // 현재 자세의 월드 중심(카메라 추적용)
  const center = new THREE.Vector3();
  function worldCenter() {
    const bb = new THREE.Box3();
    for (const o of probes) bb.expandByPoint(o.getWorldPosition(wp));
    return bb.getCenter(center);
  }
  return { apply, worldCenter, skinNew, updateMuscles, skeleton, joints: J, restPos: pos, parent, grid: { lo: lo.toArray(), H, NX, NY, NZ, NB } };
}

// 기존 Mesh를 그대로(참조 유지) SkinnedMesh로 바꾼다 — 강조/벗기기/클릭 로직이 같은 객체를 계속 쓰게
// 근육 재질에 부피 보존 변형을 끼워 넣는다(스키닝 직후, 근육 주축에서 반지름 방향으로 늘이고 줄임)
// 넓적한 근육의 반두께 ≈ 부피/겉넓이 (얇은 닫힌 껍데기: 부피 ≈ 넓이/2 × 두께)
// PCA 두께는 몸을 감싸며 휜 근육에서 휜 정도까지 두께로 잡아 과대 → 법선 이동이 반대편 면을 넘어가 깜빡임(겹침)이 생긴다
function shellHalfThickness(g) {
  const P = g.attributes.position, I = g.index, n = I ? I.count : P.count;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), t = new THREE.Vector3();
  let area = 0, vol = 0;
  for (let i = 0; i + 2 < n; i += 3) {
    const i0 = I ? I.getX(i) : i, i1 = I ? I.getX(i + 1) : i + 1, i2 = I ? I.getX(i + 2) : i + 2;
    a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2);
    vol += a.dot(t.crossVectors(b, c)) / 6;
    area += t.crossVectors(b.sub(a), c.sub(a)).length() / 2;
  }
  if (area <= 0) return Infinity;
  return Math.abs(vol) / area; // = 두께/2
}

function patchMaterial(mat, mus) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uMusA = mus.uA; shader.uniforms.uMusB = mus.uB; shader.uniforms.uMusS = mus.uS;
    shader.uniforms.uMusSheet = mus.uSheet; shader.uniforms.uMusThick = mus.uThick;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aMusT;\nuniform vec3 uMusA;\nuniform vec3 uMusB;\nuniform float uMusS;\nuniform float uMusSheet;\nuniform float uMusThick;")
      .replace("#include <skinning_vertex>", `#include <skinning_vertex>
      {
        float musBelly = sin(3.14159265 * clamp(aMusT, 0.0, 1.0));
        if (uMusSheet > 0.5) {
          // 넓적한 근육: 겉면은 바깥으로, 안쪽 면은 안으로(법선 방향) 근육 두께만큼만 → 제자리에서 두꺼워지고 얇아진다
          transformed += normalize(objectNormal) * (uMusS * musBelly * uMusThick);
        } else {
          vec3 musAB = uMusB - uMusA;
          float musLL = max(dot(musAB, musAB), 1e-10);
          vec3 musP = uMusA + musAB * (dot(transformed - uMusA, musAB) / musLL);
          transformed = musP + (transformed - musP) * (1.0 + uMusS * musBelly);
        }
      }`);
  };
  mat.customProgramCacheKey = () => "muscle-volume-v2";
  mat.needsUpdate = true;
}

function makeSkinned(m, skeleton, dom) {
  Object.setPrototypeOf(m, THREE.SkinnedMesh.prototype);
  m.isSkinnedMesh = true;
  m.type = "SkinnedMesh";
  m.bindMode = THREE.AttachedBindMode;
  m.bindMatrix = new THREE.Matrix4();
  m.bindMatrixInverse = new THREE.Matrix4();
  m.boundingBox = null;
  m.boundingSphere = null;
  m.frustumCulled = false;
  m.userData.domBone = dom;
  m.computeBoundingSphere = function () { // 주 뼈 하나로 옮긴 근사 구(정점 전체 스키닝은 너무 느림)
    const b = skeleton.bones[this.userData.domBone];
    _m.multiplyMatrices(b.matrixWorld, skeleton.boneInverses[this.userData.domBone]);
    _m2.copy(this.bindMatrixInverse).multiply(_m).multiply(this.bindMatrix);
    this.boundingSphere = (this.boundingSphere || new THREE.Sphere()).copy(this.geometry.boundingSphere).applyMatrix4(_m2);
    this.boundingSphere.radius *= 1.25;
    return this;
  };
  m.bind(skeleton, m.matrixWorld); // 행렬을 넘겨 뼈 역행렬 재계산(자세 중이면 틀어짐)을 막는다
}
