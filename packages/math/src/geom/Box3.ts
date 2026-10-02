import {
    box3ApplyMatrix,
    box3ClampPoint,
    box3Contains,
    box3ContainsPoint,
    box3Copy,
    box3Empty,
    box3Equals,
    box3ExpandByPoint,
    box3FormPositions,
    box3FromPoints,
    box3GetCenter,
    box3GetSize,
    box3Inflate,
    box3InflatePoint,
    box3Intersection,
    box3IntersectionTo,
    box3Intersects,
    box3IntersectsSphere,
    box3IntersectsTriangle,
    box3IsEmpty,
    box3Offset,
    box3Overlaps,
    box3RandomPoint,
    box3RayIntersection,
    box3Scale,
    box3ToPoints,
    box3ToString,
    box3ToTriangles,
    box3Translate,
    box3Union,
} from './box3Ops';
import { Matrix4x4 } from './Matrix4x4';
import { Plane } from './Plane';
import type { SphereLike } from './sphereOps';
import type { Triangle3Like, WritableTriangle3Like } from './triangle3Ops';
import { Vector3 } from './Vector3';
import type { Vector3Like } from './vector3Ops';

/**
 * 轴向对称包围盒
 */
export class Box3
{
    /**
     * 从一组顶点初始化包围盒
     * @param positions 坐标数据列表
     */
    static formPositions(positions: number[])
    {
        return new Box3().formPositions(positions);
    }

    /**
     * 从一组点初始化包围盒
     * @param ps 点列表
     */
    static fromPoints(ps: Vector3[])
    {
        return new Box3().fromPoints(ps);
    }

    /**
     * 随机包围盒
     */
    static random()
    {
        const min = Vector3.random();
        const max = Vector3.random().add(min);

        return new Box3(min, max);
    }

    /**
     * 最小点
     */
    min: Vector3;
    /**
     * 最大点
     */
    max: Vector3;

    /**
     * 获取中心点
     * @param vout 输出向量
     */
    getCenter(vout = new Vector3()): Vector3
    {
        // 先写 vout 再返回：直接 return ops 结果会把返回类型退化成 WritableVector3Like
        box3GetCenter(this, vout);

        return vout;
    }

    /**
     * 尺寸
     */
    getSize(vout = new Vector3()): Vector3
    {
        box3GetSize(this, vout);

        return vout;
    }

    /**
     * 创建包围盒
     * @param min 最小点
     * @param max 最大点
     */
    constructor(min = new Vector3(Number(Infinity), Number(Infinity), Number(Infinity)), max = new Vector3(-Infinity, -Infinity, -Infinity))
    {
        this.min = min;
        this.max = max;
    }

    /**
     * 初始化包围盒
     * @param min 最小值
     * @param max 最大值
     */
    init(min: Vector3, max: Vector3)
    {
        // 注意：原实现是**引用赋值**（`this.min = min`），纯函数 box3Init 取值语义，
        // 所以这里必须自己替换引用，不能写成 `box3Init(min, max, this)`——那样会改变
        // `box.min === min` 这一既有行为（Box3.spec.ts 有用例锁住它）。
        this.min = min;
        this.max = max;

        return this;
    }

    /**
     * 缩放包围盒
     *
     * @param s 缩放系数
     */
    scale(s: Vector3)
    {
        box3Scale(this, s, this);

        return this;
    }

    /**
     * 转换为包围盒八个角所在点列表
     */
    // 显式返回 Vector3[]：缺省 out 由本方法新建 Vector3，传入的数组元素也必须是 Vector3
    // （纯函数 box3ToPoints 只逐分量赋值，不依赖元素的 set 方法）
    toPoints(points?: Vector3[]): Vector3[]
    {
        if (!points)
        {
            points = [
                new Vector3(),
                new Vector3(),
                new Vector3(),
                new Vector3(),
                new Vector3(),
                new Vector3(),
                new Vector3(),
                new Vector3(),
            ];
        }

        box3ToPoints(this, points);

        return points;
    }

    /**
     * 从一组顶点初始化包围盒
     * @param positions 坐标数据列表
     */
    formPositions(positions: number[])
    {
        box3FormPositions(positions, this);

        return this;
    }

    /**
     * 从一组点初始化包围盒
     * @param ps 点列表
     */
    fromPoints(ps: Vector3[])
    {
        box3FromPoints(ps, this);

        return this;
    }

    /**
     * 包围盒内随机点
     */
    randomPoint(pout = new Vector3()): Vector3
    {
        box3RandomPoint(this, Vector3.random(), pout);

        return pout;
    }

    /**
     * 将当前包围盒初始化为随机包围盒（随机 min/max，修改 this 并返回）
     */
    random()
    {
        this.min = Vector3.random(-1);
        this.max = Vector3.random(1);

        return this;
    }

    /**
     * 使用点扩张包围盒
     * @param point 点
     */
    expandByPoint(point: Vector3)
    {
        box3ExpandByPoint(this, point, this);

        return this;
    }

    /**
     * 应用矩阵
     * @param mat 矩阵
     *
     * @todo 优化
     * @see 3D数学基础：图形与游戏开发 P288 AABB::setToTransformedBox
     */
    applyMatrix(mat: Matrix4x4)
    {
        box3ApplyMatrix(this, mat, this);

        return this;
    }

    /**
     * 应用矩阵
     * @param mat 矩阵
     */
    applyMatrixTo(mat: Matrix4x4, out = new Box3())
    {
        return out.copy(this).applyMatrix(mat);
    }

    /**
     *
     */
    clone(): Box3
    {
        return new Box3(this.min.clone(), this.max.clone());
    }

    /**
     * 是否包含指定点
     * @param p 点
     */
    containsPoint(p: Vector3)
    {
        return box3ContainsPoint(this, p);
    }

    /**
     * 是否包含包围盒
     * @param aabb 包围盒
     */
    contains(aabb: Box3)
    {
        return box3Contains(this, aabb);
    }

    /**
     * 拷贝
     * @param aabb 包围盒
     */
    copy(aabb: Box3)
    {
        box3Copy(aabb, this);

        return this;
    }

    /**
     * 比较包围盒是否相等
     * @param aabb 包围盒
     */
    equals(aabb: Box3)
    {
        return box3Equals(this, aabb);
    }

    /**
     * 平移
     *
     * @param offset 偏移量
     */
    translate(offset: Vector3)
    {
        box3Translate(this, offset, this);

        return this;
    }

    /**
     * 膨胀包围盒
     * @param dx x方向膨胀量
     * @param dy y方向膨胀量
     * @param dz z方向膨胀量
     */
    inflate(dx: number, dy: number, dz: number)
    {
        // 原方法没有返回值（undefined），委托时不 return——保持既有签名
        box3Inflate(this, dx, dy, dz, this);
    }

    /**
     * 膨胀包围盒
     * @param delta 膨胀量
     */
    inflatePoint(delta: Vector3)
    {
        box3InflatePoint(this, delta, this);
    }

    /**
     * 与包围盒相交
     * @param aabb 包围盒
     */
    intersection(aabb: Box3): Box3 | null
    {
        // box3Intersection 把两个盒都当**可读入参**（结果只写 out），所以直接 out 传 this：
        // 不相交时它返回 null 且不改动 this，与既有行为一致。
        // 显式标注返回类型：委托后不标注会推断成 WritableBox3Like | null，消费方（feng3d /
        // editor）拿到的类型就退化了，而 tsc -p packages/math 查不出来（方案 §10.1 的 P10）
        return box3Intersection(this, aabb, this);
    }

    /**
     * 与包围盒相交
     * @param aabb 包围盒
     */
    intersectionTo(aabb: Box3, out = new Box3()): Box3 | null
    {
        return box3IntersectionTo(this, aabb, out);
    }

    /**
     * 包围盒是否相交
     * @param aabb 包围盒
     */
    intersects(aabb: Box3)
    {
        return box3Intersects(this, aabb);
    }

    /**
     * 与射线相交
     * @param position 射线起点
     * @param direction 射线方向
     * @param outTargetNormal 相交处法线
     * @returns 起点到包围盒距离
     *
     * **阶段 C-d 起 `position` / `direction` 放宽为最小形状 `Vector3Like`**：
     * `Ray3` 的 `origin` / `direction` 现在是纯数据字段（`Line3` 的 class 已删除），
     * 消费方（`Raycaster` / `Renderable` / editor 的 `SceneView.vue`）传进来的不再保证是 `Vector3` 实例。
     * `outTargetNormal` 仍是 `Vector3`（本批无放宽需求）。
     * @todo 可用以下方法优化？
     * @see 3D数学基础：图形与游戏开发 P290
     */
    rayIntersection(position: Vector3Like, direction: Vector3Like, outTargetNormal?: Vector3)
    {
        // 六个面的判定与法线写入全部委托给纯函数；法线先在函数内攒好、命中后才写 outTargetNormal
        return box3RayIntersection(this, position, direction, outTargetNormal);
    }

    /**
     * 获取包围盒上距离指定点最近的点
     *
     * @param point 指定点
     * @param target 存储最近的点
     */
    closestPointToPoint(point: Vector3, target = new Vector3()): Vector3
    {
        return this.clampPoint(point, target);
    }

    /**
     * 清空包围盒
     */
    empty()
    {
        box3Empty(this);

        return this;
    }

    /**
     * 是否为空
     * 当体积为0时为空
     */
    isEmpty()
    {
        return box3IsEmpty(this);
    }

    /**
     * 偏移
     * @param dx x轴偏移
     * @param dy y轴偏移
     * @param dz z轴偏移
     */
    offset(dx: number, dy: number, dz: number)
    {
        box3Offset(this, dx, dy, dz, this);

        return this;
    }

    /**
     * 偏移
     * @param position 偏移量
     */
    offsetPosition(position: Vector3)
    {
        box3Translate(this, position, this);

        return this;
    }

    toString(): string
    {
        return box3ToString(this);
    }

    /**
     * 联合包围盒
     * @param aabb 包围盒
     */
    union(aabb: Box3)
    {
        box3Union(this, aabb, this);

        return this;
    }

    /**
     * 是否与球相交
     * @param sphere 球
     *
     * **阶段 C-c 起委托给纯函数 `box3IntersectsSphere`**：`Sphere` 的 class 已删除，
     * 形参也随之放宽为最小形状 `SphereLike`（原有的 `Sphere` 实例仍然满足它）。
     */
    intersectsSphere(sphere: SphereLike)
    {
        return box3IntersectsSphere(this, sphere);
    }

    /**
     * 夹紧？
     *
     * @param point 点
     * @param out 输出点
     */
    clampPoint(point: Vector3, out = new Vector3()): Vector3
    {
        box3ClampPoint(this, point, out);

        return out;
    }

    /**
     * 是否与平面相交
     * @param plane 平面
     */
    // 跨类型：待 Plane 的 ops 落地后改为委托
    intersectsPlane(plane: Plane)
    {
        let min = Infinity;
        let max = -Infinity;

        this.toPoints().forEach((p) =>
        {
            const d = plane.distanceWithPoint(p);

            min = d < min ? d : min;
            // 取最大值必须与 max 比较：写成 `d > min ? d : min` 时，`max` 拿到的是
            // "刚更新的 min"或 d 本身，一旦后续角点的距离更小就会被重置为负值，
            // 结果依赖遍历顺序（#485）。
            max = d > max ? d : max;
        });

        return min < 0 && max > 0;
    }

    /**
     * 是否与三角形相交
     * @param triangle 三角形
     *
     * **阶段 C-c 起委托给纯函数 `box3IntersectsTriangle`**（含原来的私有 `satForAxes`）：
     * `Triangle3` 的 class 已删除，形参放宽为最小形状 `Triangle3Like`。
     * 实现本身不修改入参（SAT 用的是临时向量），所以纯数据顶点也不会有副作用。
     */
    intersectsTriangle(triangle: Triangle3Like)
    {
        return box3IntersectsTriangle(this, triangle);
    }

    /**
    * 是否与指定长方体相交
    *
    * @param box3 长方体
    */
    overlaps(box3: Box3)
    {
        return box3Overlaps(this, box3);
    }

    /**
     * 转换为三角形列表
     *
     * **阶段 C-a 起委托给纯函数 `box3ToTriangles`**；**C-c 起不再装配回 `Triangle3` 实例**
     * （那个 class 已删除，`Triangle3` 现在是纯数据接口）——直接把纯数据三角形**追加**进入参数组并返回它，
     * 语义与「追加进 `triangles` 再返回 `triangles`」逐字一致，也因此**返回类型放宽**为
     * `WritableTriangle3Like[]`（原实现返回的 `Triangle3[]` 只是它的一个子集）。
     */
    toTriangles(triangles: WritableTriangle3Like[] = []): WritableTriangle3Like[]
    {
        return box3ToTriangles(this, triangles);
    }
}
