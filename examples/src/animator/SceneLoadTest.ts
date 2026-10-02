import { WebGPU } from '@feng3d/webgpu';
import { logic, loader, reactive, serialization, ticker, View } from 'feng3d';
import type { Object3D } from 'feng3d';

/**
 * 从场景文件加载（**纯数据格式**）。
 *
 * `resources/scene/Untitled.scene.json` 由 `scripts/migrate-scene-json.mjs` 从旧格式
 * （`__class__` + `GameObject` / `Transform`）迁移而来，见 docs/SERIALIZATION_MIGRATION.md。
 * 反序列化得到的就是纯数据对象树，可以直接作为 `View.root` —— 不需要任何构造器。
 *
 * 注：本文件原先用的是已删除的 API（`GameObject`、`new View()`、`getComponent(Scene)`、
 * `view3D.scene = ...`），既编译不过也不再反映当前范式，故按 `Container3DTest.ts` 的写法重写。
 */
const webgpu = await new WebGPU().init();

const content = await loader.loadText('../../resources/scene/Untitled.scene.json');
const root = serialization.deserialize<Object3D>(JSON.parse(content) as never);

const view: View = {
    __type__: 'View',
    canvas: document.getElementById('webgpu') as HTMLCanvasElement,
    root,
};
const viewLogic = logic(view);

// 场景文件里的相机在原点（编辑器导出的编辑视角，与模型中心重合 → 在模型内部，看不到东西）。
// 这里把相机挪到模型（旋转工具，量级 ~20）之外并看向原点。
const cameraNode = root.children?.find((child) => child.name === 'Main Camera') as Object3D | undefined;
if (cameraNode)
{
    reactive(cameraNode).position = { x: 0, y: 40, z: 120 };
    logic(cameraNode).lookAt({ x: 0, y: 0, z: 0 });
}

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
