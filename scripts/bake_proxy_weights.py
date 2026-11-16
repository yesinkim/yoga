# ──────────────────────────────────────────────────────────────────────────
# 태양경배용 웨이트 굽기 — Blender 프록시 Bone Heat → public/models/proxy_weights.bin
#
# 근육 하나하나에 Bone Heat를 돌리면 실패하거나(지저분한 메시) 붙은 근육끼리 따로 놀아 찢어진다.
# 그래서 피부를 구멍 없는 껍데기 하나로 다시 만들고(복셀 리메시) 거기에만 Bone Heat를 돌린 뒤,
# 앱이 쓰는 웨이트 격자(poseRig.js의 lo/H/NX…)에 '가장 가까운 껍데기 지점'의 웨이트를 굽는다.
# 모든 근육·뼈·피부가 이 격자 하나에서 웨이트를 읽으므로 같이 움직인다.
#
# 준비: joints.json — 앱(개발 모드)에서 태양경배를 켠 뒤 브라우저 콘솔에서
#   const R = __poser.rig.current, o = {}; for (const k in R.restPos) o[k] = R.restPos[k].toArray();
#   copy(JSON.stringify({ pos: o, parent: R.parent, grid: R.grid }))
# 실행: pip install bpy 후
#   python bake_proxy_weights.py -- public/models/surface.glb joints.json public/models/proxy_weights.bin 0.008
# 모델이나 관절 계산(poseRig.js)이 바뀌면 다시 구워야 한다. 격자가 안 맞으면 앱은 계산 웨이트로 대체한다.
# ──────────────────────────────────────────────────────────────────────────
import bpy, bmesh, sys, json, time
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
args = sys.argv[sys.argv.index('--') + 1:]
glb, jfile, out, voxel = args[0], args[1], args[2], float(args[3])
SC = 10.0  # Bone Heat은 작은 모델에서 수치 계산이 실패하므로 10배로 키워서 계산
KEYS = ["root","spine","chest","neck","shL","shR","elL","elR","hipL","hipR","kneeL","kneeR","ankL","ankR","clL","clR"]
J = json.load(open(jfile)); P = {k: Vector(v) for k, v in J['pos'].items()}; G = J['grid']
g2b = lambda v: Vector((v[0], -v[2], v[1])) * SC  # glTF(Y-up) → Blender(Z-up), ×SC
tail = {'root':P['spine'],'spine':P['chest'],'chest':P['neck'],'neck':P['neck']+Vector((0,.25,0)),
 'clL':P['shL'],'clR':P['shR'],'shL':P['elL'],'shR':P['elR'],
 'elL':P['elL']+(P['elL']-P['shL'])*1.1,'elR':P['elR']+(P['elR']-P['shR'])*1.1,
 'hipL':P['kneeL'],'hipR':P['kneeR'],'kneeL':P['ankL'],'kneeR':P['ankR'],
 'ankL':P['ankL']+Vector((0,-.05,.15)),'ankR':P['ankR']+Vector((0,-.05,.15))}
t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
bpy.ops.object.join(); skin = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):  # 빈 부모 정리 후 변환 적용
  if o is not skin and o.type != 'MESH': o.select_set(False)
mwk = skin.matrix_world.copy(); skin.parent = None; skin.matrix_world = mwk  # 위치 유지한 채 부모 떼기
bpy.ops.object.select_all(action='DESELECT'); skin.select_set(True); bpy.context.view_layer.objects.active = skin
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)  # 원점을 세계 원점으로 먼저 확정
skin.scale = (SC, SC, SC)  # 그다음 세계 원점 기준으로 키움
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
v0 = len(skin.data.vertices)
rm = skin.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel * SC; rm.adaptivity = 0.0
bpy.ops.object.modifier_apply(modifier='rm')
# 가장 큰 덩어리만 남기기(작은 파편이 있으면 Bone Heat가 실패)
bm = bmesh.new(); bm.from_mesh(skin.data); bm.verts.ensure_lookup_table()
seen = set(); islands = []
for v in bm.verts:
  if v.index in seen: continue
  stack = [v]; isl = []
  seen.add(v.index)
  while stack:
    u = stack.pop(); isl.append(u)
    for e in u.link_edges:
      w = e.other_vert(u)
      if w.index not in seen: seen.add(w.index); stack.append(w)
  islands.append(isl)
islands.sort(key=len, reverse=True)
bmesh.ops.delete(bm, geom=[v for isl in islands[1:] for v in isl], context='VERTS')
bm.to_mesh(skin.data); bm.free()
print(f'islands {len(islands)} kept largest {len(islands[0])}', flush=True)
dc = skin.modifiers.new('dc', 'DECIMATE'); dc.ratio = 0.35
bpy.ops.object.modifier_apply(modifier='dc')
tri = skin.modifiers.new('tri', 'TRIANGULATE'); bpy.ops.object.modifier_apply(modifier='tri')
bb = [skin.matrix_world @ v.co for v in skin.data.vertices]
zs = [v.z / SC for v in bb]; xs = [v.x / SC for v in bb]
print(f'proxy bbox (glTF y) {min(zs):.3f}..{max(zs):.3f}  x {min(xs):.3f}..{max(xs):.3f}  | joints ankle y {P["ankL"].y:.3f} neck y {P["neck"].y:.3f}', flush=True)
print(f'proxy: {v0} → {len(skin.data.vertices)} verts, {len(skin.data.polygons)} tris ({time.time()-t0:.1f}s)', flush=True)

arm_data = bpy.data.armatures.new('A'); arm = bpy.data.objects.new('A', arm_data); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
eb = {}
for k in KEYS:
  b = arm_data.edit_bones.new(k); b.head = g2b(P[k]); b.tail = g2b(tail[k]); eb[k] = b
for k in KEYS:
  pk = J['parent'].get(k)
  if pk: eb[k].parent = eb[pk]
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); skin.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
nv = len(skin.data.vertices); W = np.zeros((nv, len(KEYS)), np.float32)
gi = {vg.index: KEYS.index(vg.name) for vg in skin.vertex_groups if vg.name in KEYS}
for v in skin.data.vertices:
  for g in v.groups:
    if g.group in gi: W[v.index, gi[g.group]] = g.weight
s = W.sum(1); empty = int((s < 1e-4).sum())
print(f'bone heat: {nv-empty}/{nv} verts weighted ({100*(nv-empty)/nv:.1f}%) ({time.time()-t0:.1f}s)', flush=True)
W[s >= 1e-4] /= s[s >= 1e-4, None]

# 격자 굽기: 셀 중심(glTF 좌표) → 가장 가까운 껍데기 면 → 무게중심 보간
mw = skin.matrix_world
verts = [mw @ v.co for v in skin.data.vertices]
polys = [tuple(p.vertices) for p in skin.data.polygons]
bvh = BVHTree.FromPolygons(verts, polys)
NX, NY, NZ, NB, H = G['NX'], G['NY'], G['NZ'], G['NB'], G['H']; lo = G['lo']
grid = np.zeros((NZ, NY, NX, NB), np.float32); miss = 0
for z in range(NZ):
  for y in range(NY):
    for x in range(NX):
      c = g2b((lo[0] + x * H, lo[1] + y * H, lo[2] + z * H))
      loc, nrm, fi, d = bvh.find_nearest(c)
      if fi is None: miss += 1; continue
      a, b2, c2 = polys[fi]
      A, B, C = verts[a], verts[b2], verts[c2]
      # 무게중심 좌표
      v0_, v1_, v2_ = B - A, C - A, loc - A
      d00, d01, d11 = v0_.dot(v0_), v0_.dot(v1_), v1_.dot(v1_)
      d20, d21 = v2_.dot(v0_), v2_.dot(v1_)
      den = d00 * d11 - d01 * d01 or 1e-12
      wb = (d11 * d20 - d01 * d21) / den; wc = (d00 * d21 - d01 * d20) / den; wa = 1 - wb - wc
      grid[z, y, x] = W[a] * wa + W[b2] * wb + W[c2] * wc
print(f'grid baked {NX}x{NY}x{NZ} miss {miss} ({time.time()-t0:.1f}s)', flush=True)
grid = np.clip(grid, 0, None)
# 압축 저장: 칸마다 상위 4개 뼈(4비트×4 = 2바이트) + 가중치 3개(uint8, 넷째는 나머지)
# 헤더 32바이트: 'PXW1', NX NY NZ NB(uint16), lo(f32×3), H(f32), 0
flat = grid.reshape(-1, NB)
top = np.argsort(-flat, axis=1)[:, :4]
tw = np.take_along_axis(flat, top, 1)
tw = tw / np.maximum(tw.sum(1, keepdims=True), 1e-9)
q = np.round(tw[:, :3] * 255).astype(np.int32)
q[:, 2] = np.minimum(q[:, 2], 255 - q[:, 0] - q[:, 1]).clip(0)
idx = (top[:, 0] | (top[:, 1] << 4) | (top[:, 2] << 8) | (top[:, 3] << 12)).astype('<u2')
rec = np.zeros(len(flat), dtype=[('i', '<u2'), ('w', 'u1', 3)])
rec['i'] = idx; rec['w'] = q.astype('u1')
head = b'PXW1' + np.array([NX, NY, NZ, NB], '<u2').tobytes() + np.array([lo[0], lo[1], lo[2], H, 0], '<f4').tobytes()
with open(out, 'wb') as f: f.write(head); f.write(rec.tobytes())
print(f'packed {len(head) + rec.nbytes} bytes', flush=True)
