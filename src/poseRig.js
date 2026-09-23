// ──────────────────────────────────────────────────────────────────────────
// 해부 모델 자동 스키닝 — 뼈 모델에서 관절 위치를 잡고, 모든 메시(근육·뼈·근막·피부)에
// 거리 기반 웨이트를 계산해 GPU 스키닝으로 굽힌다. 친구 리깅 전까지 쓰는 근사치.
//
// 관절 이름/각도 규칙은 SunSalutation.jsx의 마네킹과 같다(X축 회전, L = x<0 = 사람의 오른쪽).
// ──────────────────────────────────────────────────────────────────────────
import * as THREE from "three";

const D = Math.PI / 180;
export const BONE_KEYS = ["root", "spine", "chest", "neck", "shL", "shR", "elL", "elR",
  "hipL", "hipR", "kneeL", "kneeR", "ankL", "ankR"];

const _v = new THREE.Vector3();
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

export function buildPoseRig(layers) {
  const F = layers.muscle.scene;           // 기준 좌표계 = 근육 glb 씬
  let top = F; while (top.parent) top = top.parent;
  top.updateMatrixWorld(true);
  const invF = F.matrixWorld.clone().invert();
  const J = landmarks(layers.skeleton.meshes, invF);

  // ── 뼈대 ──
  const pos = {
    root: J.pelvis, spine: J.L5, chest: J.T12, neck: J.C7,
    shL: J.shL, shR: J.shR, elL: J.elL, elR: J.elR,
    hipL: J.hipL, hipR: J.hipR, kneeL: J.kneeL, kneeR: J.kneeR, ankL: J.ankL, ankR: J.ankR,
  };
  const parent = {
    root: null, spine: "root", chest: "spine", neck: "chest", shL: "chest", shR: "chest",
    elL: "shL", elR: "shR", hipL: "root", hipR: "root", kneeL: "hipL", kneeR: "hipR", ankL: "kneeL", ankR: "kneeR",
  };
  const B = {};
  for (const k of BONE_KEYS) {
    const b = new THREE.Bone(); b.name = "pose_" + k; B[k] = b;
    const p = pos[k].clone();
    if (parent[k]) p.sub(pos[parent[k]]);
    b.position.copy(p);
    (parent[k] ? B[parent[k]] : F).add(b);
  }
  const bones = BONE_KEYS.map((k) => B[k]);
  const skeleton = new THREE.Skeleton(bones);
  F.updateMatrixWorld(true);

  // ── 웨이트용 선분 (뼈 인덱스별) ──
  const idx = Object.fromEntries(BONE_KEYS.map((k, i) => [k, i]));
  const mid = (a, b, t) => a.clone().lerp(b, t);
  const segs = [
    [idx.root, J.hipL, J.hipR], [idx.root, J.pelvis, J.L5],
    [idx.spine, J.L5, J.T12],
    [idx.chest, J.T12, J.C7], [idx.chest, J.C7, mid(J.C7, J.shL, 0.6)], [idx.chest, J.C7, mid(J.C7, J.shR, 0.6)],
    [idx.neck, J.C7, J.headTop],
  ];
  for (const S of ["L", "R"]) {
    segs.push([idx["sh" + S], J["sh" + S], J["el" + S]]);
    segs.push([idx["el" + S], J["el" + S], J["hand" + S]]);
    segs.push([idx["hip" + S], J["hip" + S], J["knee" + S]]);
    segs.push([idx["knee" + S], J["knee" + S], J["ank" + S]]);
    segs.push([idx["ank" + S], J["ank" + S], J["toe" + S]], [idx["ank" + S], J["ank" + S], J["heel" + S]]);
  }
  const armX = Math.abs(J.shR.x) * 0.72;     // 이보다 안쪽은 팔에 붙지 않음(몸통 찢어짐 방지)
  const legTop = J.pelvis.y + 0.07;
  const handZoneY = J.pelvis.y + 0.05;          // 골반 아래에선 손 부위(바깥쪽)만 팔에 붙는다
  const handX = Math.abs(J.elR.x) * 0.8;
  const side = new Int8Array(BONE_KEYS.length);
  const kind = new Int8Array(BONE_KEYS.length); // 0 몸통, 1 팔, 2 다리
  BONE_KEYS.forEach((k, i) => {
    side[i] = k.endsWith("L") ? -1 : k.endsWith("R") ? 1 : 0;
    kind[i] = /^(sh|el)/.test(k) ? 1 : /^(hip|knee|ank)/.test(k) ? 2 : 0;
  });

  const best = new Float32Array(BONE_KEYS.length);
  const done = new Map(); // geometry → matrix(중복 공유 지오메트리 처리)
  const all = [];
  for (const key of ["muscle", "skeleton", "surface", "fascia"]) {
    for (const m of layers[key]?.meshes || []) all.push(m);
  }
  for (const m of all) {
    if (m.isSkinnedMesh) continue;
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
      best.fill(Infinity);
      for (const [bi, a, b] of segs) {
        const k = kind[bi], s = side[bi];
        if (k === 1 && (_v.x * s < armX || (_v.y < handZoneY && _v.x * s < handX))) continue; // 허벅지가 손을 따라가지 않게
        if (k === 2 && (_v.x * s < -0.01 || _v.y > legTop)) continue;
        const d2 = segD2(_v, a, b);
        if (d2 < best[bi]) best[bi] = d2;
      }
      // 가장 가까운 두 뼈를 1/d⁴로 섞는다
      let i1 = 0, i2 = -1;
      for (let b = 1; b < best.length; b++) if (best[b] < best[i1]) i1 = b;
      for (let b = 0; b < best.length; b++) if (b !== i1 && (i2 < 0 || best[b] < best[i2])) i2 = b;
      const w1 = 1 / Math.pow(best[i1] + 1e-5, 2);
      const w2 = best[i2] === Infinity ? 0 : 1 / Math.pow(best[i2] + 1e-5, 2);
      const a1 = Math.round((255 * w1) / (w1 + w2));
      si[i * 4] = i1; si[i * 4 + 1] = i2 < 0 ? 0 : i2;
      sw[i * 4] = a1; sw[i * 4 + 1] = 255 - a1;
      votes[i1]++;
    }
    g.setAttribute("skinIndex", new THREE.Uint8BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.Uint8BufferAttribute(sw, 4, true));
    if (!g.boundingSphere) g.computeBoundingSphere();
    let dom = 0; for (let b = 1; b < votes.length; b++) if (votes[b] > votes[dom]) dom = b;
    makeSkinned(m, skeleton, dom);
  }

  // ── 접지용 표면 탐침(뼈에 붙은 점) ──
  const probes = [];
  const probe = (bone, p) => { const o = new THREE.Object3D(); o.position.copy(p).sub(pos[bone]); B[bone].add(o); probes.push(o); };
  for (const S of ["L", "R"]) {
    probe("ank" + S, J["heel" + S]); probe("ank" + S, J["toe" + S]);
    probe("el" + S, J["hand" + S]); probe("el" + S, J["el" + S].clone().add(new THREE.Vector3(0, 0, -0.04)));
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
    for (const k of BONE_KEYS) B[k].rotation.x = (raw[k] || 0) * D;
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
  return { apply, worldCenter, skeleton, joints: J };
}

// 기존 Mesh를 그대로(참조 유지) SkinnedMesh로 바꾼다 — 강조/벗기기/클릭 로직이 같은 객체를 계속 쓰게
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
  m.bind(skeleton);
}
