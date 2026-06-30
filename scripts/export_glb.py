#!/usr/bin/env python
# Z-Anatomy Startup.blend → 레이어별 Draco glb 변환 (헤드리스, Blender GUI 불필요)
#
#   pip install bpy
#   python scripts/export_glb.py path/to/Startup.blend public/models
#
# Muscular system / Skeletal system 컬렉션만 골라 muscles.glb / skeleton.glb 로 내보낸다.
# 다른 시스템(혈관·신경 등)을 추가하려면 아래 TARGETS 에 한 줄 더 넣으면 된다.

import bpy, sys, os

blend = sys.argv[-2]
outdir = sys.argv[-1]
os.makedirs(outdir, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=blend)
print("Opened:", blend, flush=True)

# 출력파일명(확장자 제외) -> .blend 안의 컬렉션 이름
TARGETS = {
    "muscles":  "4: Muscular system",
    "skeleton": "1: Skeletal system",
}

def find_collection(name):
    for c in bpy.data.collections:
        if c.name == name:
            return c
    return None

for key, cname in TARGETS.items():
    coll = find_collection(cname)
    if not coll:
        print(f"!! collection not found: {cname}", flush=True)
        continue

    meshes = [o for o in coll.all_objects if o.type == 'MESH']
    print(f"[{key}] '{cname}': mesh objects = {len(meshes)}", flush=True)

    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        try:
            o.select_set(True)
        except Exception:
            pass
    bpy.context.view_layer.objects.active = meshes[0]

    out = os.path.join(outdir, f"{key}.glb")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_apply=True,                        # 모디파이어 적용
        export_yup=True,
        export_draco_mesh_compression_enable=True,  # 앱에 public/draco 디코더 동봉됨
        export_draco_mesh_compression_level=6,
        export_materials='EXPORT',
    )
    print(f"==> wrote {out}  ({os.path.getsize(out)/1e6:.1f} MB)", flush=True)

print("DONE", flush=True)
