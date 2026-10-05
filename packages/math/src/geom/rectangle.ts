import { vec2Clamp } from './vector2Ops';
import type { Vector2Like, WritableVector2Like } from './vector2Ops';

/**
 * `Rectangle` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2m）。
 *
 * ## 约定（方案 §3.3）
 *
 * - **不修改入参**：结果写进 `out`（缺省时新建普通字面量）；
 * - `out` 传自己就是「就地运算」，所以原 class 上的 `xxx`（就地改 `this`）与 `xxxTo`（写 `vout`）
 *   通常是**同一个函数**，只是 `out` 实参不同；
 * - 依赖只有 `./vector2Ops` 的 `vec2*` 纯函数（`vector2Ops.ts` 已就绪），
 *   跨类型的 `Vector2Like` 用 **type-only import**（编译后完全擦除），
 *   所以运行时依赖只有 `vector2Ops.ts` 一个方向，不会形成模块环
 *   （阶段 C-a 之前还有一条 `Rectangle.ts → rectangleOps.ts`，class 已删除）。
 *
 * ## 命名：`rect2` 前缀 + PascalCase 动作
 *
 * 与 `vec2*` / `line3*` / `mat4*` 同构。作为矩形四个字段只是 `x / y / width / height`
 * 的**派生视图**，getter / setter 一律显式成对给出（这是本文件与前述文件最大的不同）：
 *
 * | 原 class 成员 | 纯函数 | 语义（逐字搬运，**不是**简单字段读写） |
 * |---|---|---|
 * | `get right()` | `rect2GetRight(a)` | `x + width` |
 * | `set right(v)` | `rect2SetRight(a, v, out?)` / `rect2Right(...)` | **只改 `width`**：`width = v - x` |
 * | `get bottom()` | `rect2GetBottom(a)` | `y + height` |
 * | `set bottom(v)` | `rect2SetBottom(a, v, out?)` / `rect2Bottom(...)` | **只改 `height`**：`height = v - y` |
 * | `get left()` | `rect2GetLeft(a)` | `x` |
 * | `set left(v)` | `rect2SetLeft(a, v, out?)` / `rect2Left(...)` | **同时改 `x` 与 `width`**（`width += x - v` 先算，再 `x = v`） |
 * | `get top()` | `rect2GetTop(a)` | `y` |
 * | `set top(v)` | `rect2SetTop(a, v, out?)` / `rect2Top(...)` | **同时改 `y` 与 `height`**（`height += y - v` 先算，再 `y = v`） |
 * | `get topLeft()` | `rect2GetTopLeft(a, out?)` | `(left, top)` |
 * | `set topLeft(v)` | `rect2SetTopLeft(a, v, out?)` / `rect2TopLeft(...)` | 等价于先 `top = v.y` 再 `left = v.x` |
 * | `get bottomRight()` | `rect2GetBottomRight(a, out?)` | `(right, bottom)` |
 * | `set bottomRight(v)` | `rect2SetBottomRight(a, v, out?)` / `rect2BottomRight(...)` | 等价于先 `bottom = v.y` 再 `right = v.x` |
 * | `get center()` | `rect2GetCenter(a, out?)` | `(x + width / 2, y + height / 2)` |
 * | `get size()` | `rect2GetSize(a, out?)` | `(width, height)` |
 *
 * ### 为什么 `Set*` 成对提供 `rect2Right` 这类别名
 *
 * 两种命名各有出处，且**已在别处落地**，为避免二选一造成「同一仓库两种风格」而同时导出：
 *
 * - `rect2SetRight` / `rect2GetRight` 是**仓库既有惯例**——`matrix4x4Ops.ts` 里
 *   `mat4GetPosition` / `mat4SetPosition`、`mat4GetAxisX` / `mat4SetAxisX`、`mat4GetScale` / `mat4SetScale`
 *   就是「getter / setter 成对」的写法，本文件与本批任务（阶段 A2m）都按它命名；
 * - `rect2Right` / `rect2Bottom` 是 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §3.2 的**紧凑前缀**风格
 *   （「动作取 PascalCase、前缀与动作之间不加下划线」），`vec2Add` / `line3GetPoint` 都是这个风格。
 *
 * 两者实现**只有一份**（别名是转发入口，与 `vec2Scale` → `vec2Multiply` 同构），
 * 所以不存在行为分叉。`rect2SetRight` 的 `out` 缺省即入参矩形，于是 `rect2Right(a, v)` 与
 * `rect2SetRight(a, v)` 逐字等价。
 *
 * ## 缺省 `out` 的初值（方案 §10.1 的 P6）
 *
 * 纯数据矩形的默认四字段是 `(0, 0, 0, 0)`（原 `new Rectangle()` 的构造默认），所以缺省 `out` 取同值。
 * 但本文件里 **`out` 缺省的写函数一律以「入参矩形」为缺省目标**（`out: WritableRectangleLike = a`），
 * 而不是新建字面量——这正是 setter 的就地语义（`rect.right = v` 改的是 `r` 自己）。
 * 于是：
 *
 * - 「就地」写 `rect2SetRight(r, 100)`；
 * - 「返回新对象」写 `rect2SetRight(r, 100, { x: 0, y: 0, width: 0, height: 0 })`（或用 `rect2Copy` 先占位）。
 *
 * `defaultOut()` 只服务于 `rect2Copy` / `rect2From` / `rect2Union` / `rect2Intersection` 这类
 * **语义上就是「产生一个新矩形」**的函数，其初值与默认矩形（`(0, 0, 0, 0)`）一致。
 *
 * ## 跨分量依赖：先算局部变量再写 `out`（方案 §10.1 的 P2）
 *
 * 矩形只有四个字段，`out` 与入参同一对象是常态，所以**凡是「写多个字段」的函数都先把新值算进局部变量**
 * （`rect2SetLeft` / `rect2SetTopLeft` / `rect2SetBottomRight` / `rect2Inflate` / `rect2Intersection` /
 * `rect2Union` 都是），避免第二个字段读到已被改写的第一个字段。
 *
 * ## 文件命名（踩坑记录 P1）
 *
 * 与 `color3Ops.ts` / `vector2Ops.ts` / `line3Ops.ts` 同构：Like 类型 + 纯函数同文件。
 * 阶段 C-a 删掉 class 后，数据定义（`Rectangle` / `IRectangle`）就落在本文件里。
 * **不要再新建 `rectangle.ts`**：P1 当年正是把数据定义写进了 `rectangle.ts`，
 * 而在 Windows / macOS 这类**大小写不敏感**的文件系统上它与 class 文件 `Rectangle.ts`
 * 是同一个文件，结果**静默覆盖**了 417 行的 class。
 */

/** 纯函数可接受的矩形形状（只读）：纯数据字面量与带判别字段的 `Rectangle` 都满足。 */
export interface RectangleLike
{
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** 可写出的矩形目标（纯函数的 `out` 参数用；普通字面量与带判别字段的 `Rectangle` 都满足）。 */
export interface WritableRectangleLike
{
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 纯数据矩形（issue #134 阶段 C-a）：**取代原 `Rectangle` class**。
 *
 * `RectangleLike` 是纯函数层的最小只读形状（`readonly x/y/width/height`，**不带**判别字段），
 * 纯数据形态在它之上加一个 `__type__` 字面量，做法与 `feng3d` 的 `core/Color3` / `core/Color4`
 * 一致（方案 §5.9 的 D1 决策：纯数据接口一律声明 `readonly __type__: '<字面量>'`）。
 *
 * 两级形状是有意的分工（方案 §11.7.7 的 P4）：
 *
 * - `RectangleLike` / `WritableRectangleLike` 给 `rect2*` 纯函数与「放宽入参」的消费方用
 *   （如 `feng3d` 的 `ImageUtil.fillRect` / `Mouse3DManager.viewport`）——**不要求**判别字段；
 * - `Rectangle` 是**数据声明**用的形状，带判别字段后 `obj.__type__ === 'Rectangle'`
 *   可判别、可挂到编辑器面板上。
 *
 * ⚠️ **`rect2*` 纯函数的缺省 `out` 是新建的 `WritableRectangleLike`，不带 `__type__`**：
 * 它们返回的是「算出来的值」而不是「被声明的数据」。需要判别字段时由调用方显式写字面量
 * `{ __type__: 'Rectangle', x, y, width, height }`（或把它写进已有的带标记对象）。
 * 这条边界是 C-a 的实测结论：若要求 `out` 也带判别字段，`rect2*` 的普通字面量
 * 消费方（含 `rect2Intersection(a, b)` 这类缺省 out 的返回值）会全部编译不过。
 */
export interface Rectangle extends RectangleLike
{
    readonly __type__: 'Rectangle';
}

/**
 * 旧的只读矩形形状名（阶段 A2m 引入的别名）。
 *
 * `Rectangle` class 删除后它仍然保留：`IRectangle` 原先由 `index.ts` 的 `./geom/Rectangle`
 * 导出，属于**已经公开的包入口类型名**，删掉会让 `import { IRectangle } from '@feng3d/math'`
 * 直接编译不过。语义与 `RectangleLike` 完全相同（只读四字段、**不带**判别字段）。
 */
export type IRectangle = RectangleLike;

/**
 * 缺省输出目标：四字段全为 `0`——与原 `new Rectangle()` 的构造默认一致（方案 §10.1 的 P6）。
 */
function defaultOut(): WritableRectangleLike
{
    return { x: 0, y: 0, width: 0, height: 0 };
}

// ---------------------------------------------------------------------------
// 派生视图的读取（原 class 的 getter）
// ---------------------------------------------------------------------------

/** `Rectangle.get right` 的纯函数形式：`x + width`。 */
export function rect2GetRight(a: RectangleLike): number
{
    return a.x + a.width;
}

/** `Rectangle.get bottom` 的纯函数形式：`y + height`。 */
export function rect2GetBottom(a: RectangleLike): number
{
    return a.y + a.height;
}

/** `Rectangle.get left` 的纯函数形式：就是 `x`。 */
export function rect2GetLeft(a: RectangleLike): number
{
    return a.x;
}

/** `Rectangle.get top` 的纯函数形式：就是 `y`。 */
export function rect2GetTop(a: RectangleLike): number
{
    return a.y;
}

/** `Rectangle.get topLeft` 的纯函数形式：`(left, top)`，结果写进 `out`（缺省新建）。 */
export function rect2GetTopLeft(a: RectangleLike, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const x = a.x;
    const y = a.y;

    out.x = x;
    out.y = y;

    return out;
}

/** `Rectangle.get bottomRight` 的纯函数形式：`(right, bottom)`，结果写进 `out`（缺省新建）。 */
export function rect2GetBottomRight(a: RectangleLike, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const x = a.x + a.width;
    const y = a.y + a.height;

    out.x = x;
    out.y = y;

    return out;
}

/** `Rectangle.get center` 的纯函数形式：`(x + width / 2, y + height / 2)`，结果写进 `out`（缺省新建）。 */
export function rect2GetCenter(a: RectangleLike, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const x = a.x + (a.width / 2);
    const y = a.y + (a.height / 2);

    out.x = x;
    out.y = y;

    return out;
}

/** `Rectangle.get size` 的纯函数形式：`(width, height)`，结果写进 `out`（缺省新建）。 */
export function rect2GetSize(a: RectangleLike, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    const x = a.width;
    const y = a.height;

    out.x = x;
    out.y = y;

    return out;
}

// ---------------------------------------------------------------------------
// 派生视图的写入（原 class 的 setter）
// ---------------------------------------------------------------------------

/**
 * `Rectangle.set right` 的纯函数形式：**只改 `width`**（`width = value - x`），`x` / `y` / `height` 不动。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetRight(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    out.x = a.x;
    out.y = a.y;
    out.width = value - a.x;
    out.height = a.height;

    return out;
}

/**
 * `Rectangle.set bottom` 的纯函数形式：**只改 `height`**（`height = value - y`），`x` / `y` / `width` 不动。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetBottom(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    out.x = a.x;
    out.y = a.y;
    out.width = a.width;
    out.height = value - a.y;

    return out;
}

/**
 * `Rectangle.set left` 的纯函数形式：**同时改 `x` 与 `width`**——
 * 原实现是 `this.width += this.x - value; this.x = value;`（保持右边界 `right` 不动）。
 *
 * 两个字段先算进局部变量再写 `out`：`out === a` 时若先写 `out.x`，`width` 就会读到新的 `x`
 * （方案 §10.1 的 P2）。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetLeft(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    const width = a.width + (a.x - value);
    const y = a.y;
    const height = a.height;

    out.x = value;
    out.y = y;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.set top` 的纯函数形式：**同时改 `y` 与 `height`**——
 * 原实现是 `this.height += this.y - value; this.y = value;`（保持下边界 `bottom` 不动）。
 *
 * 同 `rect2SetLeft`，先算局部变量再写 `out`。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetTop(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    const height = a.height + (a.y - value);
    const x = a.x;
    const width = a.width;

    out.x = x;
    out.y = value;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.set topLeft` 的纯函数形式：等价于先 `top = value.y` 再 `left = value.x`
 * （**保持 `right` / `bottom` 不动**，因此 `width` / `height` 会随之变化）。
 *
 * 四个字段全部先算进局部变量：`top` 与 `left` 的写入相互依赖原值，且 `out` 可能与 `value` 同一对象。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetTopLeft(a: RectangleLike, value: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    const height = a.height + (a.y - value.y);
    const width = a.width + (a.x - value.x);

    out.x = value.x;
    out.y = value.y;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.set bottomRight` 的纯函数形式：等价于先 `bottom = value.y` 再 `right = value.x`
 * （**只改 `width` / `height`**，左上角 `x` / `y` 不动）。
 *
 * `out` 缺省为入参矩形本身（setter 的就地语义）。
 */
export function rect2SetBottomRight(a: RectangleLike, value: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    const width = value.x - a.x;
    const height = value.y - a.y;

    out.x = a.x;
    out.y = a.y;
    out.width = width;
    out.height = height;

    return out;
}

/** `Rectangle.set right` 的紧凑前缀别名（见文件头「为什么 Set* 成对提供别名」）。 */
export function rect2Right(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetRight(a, value, out);
}

/** `Rectangle.set bottom` 的紧凑前缀别名。 */
export function rect2Bottom(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetBottom(a, value, out);
}

/** `Rectangle.set left` 的紧凑前缀别名。 */
export function rect2Left(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetLeft(a, value, out);
}

/** `Rectangle.set top` 的紧凑前缀别名。 */
export function rect2Top(a: RectangleLike, value: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetTop(a, value, out);
}

/** `Rectangle.set topLeft` 的紧凑前缀别名。 */
export function rect2TopLeft(a: RectangleLike, value: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetTopLeft(a, value, out);
}

/** `Rectangle.set bottomRight` 的紧凑前缀别名。 */
export function rect2BottomRight(a: RectangleLike, value: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2SetBottomRight(a, value, out);
}

// ---------------------------------------------------------------------------
// 整体赋值与复制
// ---------------------------------------------------------------------------

/**
 * `Rectangle.init` 的纯函数形式：四字段整体赋值，结果写进 `out`（缺省新建，与默认矩形 `(0, 0, 0, 0)` 同初值）。
 */
export function rect2From(x: number, y: number, width: number, height: number, out: WritableRectangleLike = defaultOut()): WritableRectangleLike
{
    out.x = x;
    out.y = y;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.copyFrom` / `Rectangle.clone` 的纯函数形式：复制 `a` 的四个字段。
 *
 * 入参是 `RectangleLike`——比原 `copyFrom(sourceRect: IRectangle)` 更宽（只读结构类型），
 * 纯数据字面量与带判别字段的 `Rectangle` 都满足（`IRectangle` 现在是它的别名）。
 */
export function rect2Copy(a: RectangleLike, out: WritableRectangleLike = defaultOut()): WritableRectangleLike
{
    out.x = a.x;
    out.y = a.y;
    out.width = a.width;
    out.height = a.height;

    return out;
}

/**
 * `Rectangle.setEmpty` 的纯函数形式：四字段置 `0`，结果写进 `out`（缺省新建）。
 */
export function rect2SetEmpty(out: WritableRectangleLike = defaultOut()): WritableRectangleLike
{
    out.x = 0;
    out.y = 0;
    out.width = 0;
    out.height = 0;

    return out;
}

// ---------------------------------------------------------------------------
// 判定
// ---------------------------------------------------------------------------

/**
 * `Rectangle.contains` 的纯函数形式：**闭区间**判定（边界上的点算包含）。
 *
 * 注意与 `rect2ContainsPoint` 的区别：那个是**开区间**（见其实现）。
 */
export function rect2Contains(a: RectangleLike, x: number, y: number): boolean
{
    return a.x <= x
        && a.x + a.width >= x
        && a.y <= y
        && a.y + a.height >= y;
}

/** `Rectangle.containsPoint` 的纯函数形式：**开区间**判定（正好落在边上算不包含）。 */
export function rect2ContainsPoint(a: RectangleLike, point: Vector2Like): boolean
{
    if (a.x < point.x
        && a.x + a.width > point.x
        && a.y < point.y
        && a.y + a.height > point.y)
    {
        return true;
    }

    return false;
}

/**
 * `Rectangle.containsRect` 的纯函数形式：`rect` 是否完全落在本矩形内。
 *
 * 八个比较逐字搬运：注意同时存在 `<` 与 `<=`、`>` 与 `>=`（上边界闭、下边界开的混用是既有行为，
 * 用 100×100 与 10×10 之类的整数矩形看不出差别，不要"顺手统一"）。
 */
export function rect2ContainsRect(a: RectangleLike, rect: RectangleLike): boolean
{
    const r1 = rect.x + rect.width;
    const b1 = rect.y + rect.height;
    const r2 = a.x + a.width;
    const b2 = a.y + a.height;

    return (rect.x >= a.x) && (rect.x < r2) && (rect.y >= a.y) && (rect.y < b2) && (r1 > a.x) && (r1 <= r2) && (b1 > a.y) && (b1 <= b2);
}

/**
 * `Rectangle.intersects` 的纯函数形式：两矩形是否相交（含仅接触边界的情形，闭区间比较）。
 */
export function rect2Intersects(a: RectangleLike, toIntersect: RectangleLike): boolean
{
    return Math.max(a.x, toIntersect.x) <= Math.min(rect2GetRight(a), rect2GetRight(toIntersect))
        && Math.max(a.y, toIntersect.y) <= Math.min(rect2GetBottom(a), rect2GetBottom(toIntersect));
}

/** `Rectangle.isEmpty` 的纯函数形式：宽或高 `<= 0` 即为空。 */
export function rect2IsEmpty(a: RectangleLike): boolean
{
    return a.width <= 0 || a.height <= 0;
}

/**
 * `Rectangle.equals` 的纯函数形式：四字段严格相等（`===`，无精度参数）。
 *
 * 保留了原实现的**身份快速通道**（`this === toCompare` 直接 `true`）：
 * 对 self 恒真，即便该对象带着 `NaN` 字段（`NaN === NaN` 为 `false`）——这是既有行为，不改。
 */
export function rect2Equals(a: RectangleLike, toCompare: RectangleLike): boolean
{
    if (a === toCompare)
    {
        return true;
    }

    return a.x === toCompare.x && a.y === toCompare.y
        && a.width === toCompare.width && a.height === toCompare.height;
}

// ---------------------------------------------------------------------------
// 变换
// ---------------------------------------------------------------------------

/**
 * `Rectangle.inflate` 的纯函数形式：四边各外扩 `dx` / `dy`（`x -= dx`、`y -= dy`、
 * `width += 2 * dx`、`height += 2 * dy`），中心点不动。
 *
 * 先算局部变量再写 `out`（`out === a` 时避免自污染，方案 §10.1 的 P2）。
 * `out` 缺省为入参矩形本身（原方法就地改 `this`）。
 */
export function rect2Inflate(a: RectangleLike, dx: number, dy: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    const x = a.x - dx;
    const y = a.y - dy;
    const width = a.width + (2 * dx);
    const height = a.height + (2 * dy);

    out.x = x;
    out.y = y;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.inflatePoint` 的纯函数形式：按点 `(point.x, point.y)` 外扩，等价于 `rect2Inflate(a, point.x, point.y, out)`。
 */
export function rect2InflatePoint(a: RectangleLike, point: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2Inflate(a, point.x, point.y, out);
}

/**
 * `Rectangle.offset` 的纯函数形式：只平移左上角（`x += dx`、`y += dy`），尺寸不变。
 *
 * `out` 缺省为入参矩形本身（原方法就地改 `this`）。
 */
export function rect2Offset(a: RectangleLike, dx: number, dy: number, out: WritableRectangleLike = a): WritableRectangleLike
{
    const x = a.x + dx;
    const y = a.y + dy;

    out.x = x;
    out.y = y;
    out.width = a.width;
    out.height = a.height;

    return out;
}

/**
 * `Rectangle.offsetPoint` 的纯函数形式：按点偏移，等价于 `rect2Offset(a, point.x, point.y, out)`。
 */
export function rect2OffsetPoint(a: RectangleLike, point: Vector2Like, out: WritableRectangleLike = a): WritableRectangleLike
{
    return rect2Offset(a, point.x, point.y, out);
}

/**
 * `Rectangle.intersection` 的纯函数形式：交集矩形，写进 `out`（缺省新建）。
 *
 * **不相交时 `out` 被置为全 `0`**（与原 class 返回 `new Rectangle()` 的语义一致）——这是刻意的：
 * 原 class 侧靠返回一个全新空矩形来保持既有行为，所以纯函数层也必须把 `out` 写空，
 * 而不是「什么都不做」（否则 `out` 传自己时会留下原矩形）。
 *
 * 四个字段先算局部变量再写 `out`（`out` 可能与 `a` 或 `toIntersect` 同一对象，方案 §10.1 的 P2）。
 */
export function rect2Intersection(a: RectangleLike, toIntersect: RectangleLike, out: WritableRectangleLike = defaultOut()): WritableRectangleLike
{
    if (!rect2Intersects(a, toIntersect))
    {
        return rect2SetEmpty(out);
    }

    let x: number;
    let width: number;
    let y: number;
    let height: number;

    if (a.x > toIntersect.x)
    {
        x = a.x;
        width = toIntersect.x - a.x + toIntersect.width;

        if (width > a.width)
        { width = a.width; }
    }
    else
    {
        x = toIntersect.x;
        width = a.x - toIntersect.x + a.width;

        if (width > toIntersect.width)
        { width = toIntersect.width; }
    }

    if (a.y > toIntersect.y)
    {
        y = a.y;
        height = toIntersect.y - a.y + toIntersect.height;

        if (height > a.height)
        { height = a.height; }
    }
    else
    {
        y = toIntersect.y;
        height = a.y - toIntersect.y + a.height;

        if (height > toIntersect.height)
        { height = toIntersect.height; }
    }

    out.x = x;
    out.y = y;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.union` 的纯函数形式：合并两个矩形的包围盒，写进 `out`（缺省新建）。
 *
 * 三条分支逐字搬运（`toUnion` 为空 → 保持本矩形；本矩形为空 → 取 `toUnion`；
 * 否则取两边界的最小 / 最大）。原实现先 `clone()` 出一份再改，这里直接算进局部变量再写 `out`
 * ——`out` 可能与 `a` / `toUnion` 同一对象，所以**必须在写之前把四个字段全部算完**（方案 §10.1 的 P2）。
 */
export function rect2Union(a: RectangleLike, toUnion: RectangleLike, out: WritableRectangleLike = defaultOut()): WritableRectangleLike
{
    if (rect2IsEmpty(toUnion))
    {
        return rect2Copy(a, out);
    }
    if (rect2IsEmpty(a))
    {
        return rect2Copy(toUnion, out);
    }

    const l = Math.min(a.x, toUnion.x);
    const t = Math.min(a.y, toUnion.y);
    const width = Math.max(rect2GetRight(a), rect2GetRight(toUnion)) - l;
    const height = Math.max(rect2GetBottom(a), rect2GetBottom(toUnion)) - t;

    out.x = l;
    out.y = t;
    out.width = width;
    out.height = height;

    return out;
}

/**
 * `Rectangle.clampPoint` 的纯函数形式：把点夹取到矩形范围内，结果写进 `out`（缺省新建）。
 *
 * 原实现是 `pout.copy(point).clamp(this.topLeft, this.bottomRight)`，
 * 这里用 `rect2GetTopLeft` / `rect2GetBottomRight` + `vec2Clamp` 复现（无需中间 Vector2）。
 */
export function rect2ClampPoint(a: RectangleLike, point: Vector2Like, out: WritableVector2Like = { x: 0, y: 0 }): WritableVector2Like
{
    return vec2Clamp(point, rect2GetTopLeft(a), rect2GetBottomRight(a), out);
}

// ---------------------------------------------------------------------------
// 字符串
// ---------------------------------------------------------------------------

/**
 * `Rectangle.toString` 的纯函数形式。
 *
 * 模板逐字照抄：分隔符是 `, `（逗号 + 空格）。
 */
export function rect2ToString(a: RectangleLike): string
{
    return `(x=${a.x}, y=${a.y}, width=${a.width}, height=${a.height})`;
}
