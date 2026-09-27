import { WebGPU } from '@feng3d/webgpu';
import { logic, loader, serialization, ticker, View } from 'feng3d';
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

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
