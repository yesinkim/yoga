// 모델 경량화: 앱에서 숨기는 메시 제거(뼈 모델의 근육·근막) + 폴리곤 줄이기 + Draco 재압축
// 사용: npm i -D @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions draco3dgltf meshoptimizer
//   node scripts/slim_models.mjs <입력.glb> <출력.glb> <남길 비율 0~1> <숨김 메시 제거 1|0>
//   예) skeleton 0.5 1 · muscles 0.5 0 · surface 0.6 0
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';
import { isConnectiveTissue } from '../src/muscles.js';
const [src, out, ratio, dropHidden] = [process.argv[2], process.argv[3], +process.argv[4], process.argv[5] === '1'];
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(src);
let dropped = 0;
if (dropHidden) for (const n of doc.getRoot().listNodes()) {
  const nm = n.getName() || '';
  if (n.getMesh() && (/muscle|bursa/i.test(nm) || isConnectiveTissue(nm))) { n.setMesh(null); dropped++; }
}
const tf = [dedup(), prune()];
if (ratio < 1) tf.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0008 }));
tf.push(prune(), draco({ quantizePosition: 14, quantizeNormal: 10 }));
await doc.transform(...tf);
await io.write(out, doc);
let v = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) v += p.getAttribute('POSITION').getCount();
console.log(out, 'dropped', dropped, 'verts', v);
