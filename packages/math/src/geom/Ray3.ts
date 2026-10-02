import type { Line3 } from './line3Ops';

/**
 * 3D射线
 *
 * ## 阶段 C-d：`Ray3` 是 `Line3` 的**类型别名**
 *
 * 原实现是 `export class Ray3 extends Line3 {}`——**类体为空**（文件 9 行 = 1 行 import +
 * JSDoc + 空类体），没有任何自有成员。所以它的纯数据形态不需要 `ray3Ops.ts`：
 * 直接复用 `line3Ops` 的形状（`Line3Like` / `WritableLine3Like`）与纯函数
 * （方案 §11.7.8 的 N1 / §11.7.7 的 `Ray3` 行）。
 *
 * ⚠️ **连带后果（有意接受）**：别名意味着「射线」与「直线」是同一个类型，
 * 因此射线的判别字段也是 `'Line3'`（`{ __type__: 'Line3', origin, direction }`），
 * 而不是 `'Ray3'`。原 class 形态本来也没有 `__type__: 'Ray3'` 这种标记，
 * 仓内 `Ray3` 的全部用法都是**类型标注 + 属性读取**（`ray.origin` / `ray.direction`），
 * 没有任何按 `'Ray3'` 字面量分派的地方，所以别名化对运行时行为零影响。
 *
 * 名字仍然存在、仍然可 `import`：`camera.getRay3D(): Ray3` / `raycaster.pick(ray3D: Ray3)`
 * 这 25 个外部文件的标注**一行都不用改**（方案 §11.7.6 的 C-d 行）。
 */
export type Ray3 = Line3;
