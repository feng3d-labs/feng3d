

/**
 * 欧拉角的旋转顺序。
 *
 * 如果顺序为XYZ，则依次按 ZYZ 轴旋转。为什么循序与定义相反？因为three.js中都这么定义，他们为什么这么定义就不清楚了。
 */
export enum RotationOrder
{
    /**
     * 依次按 ZYX 轴旋转。
     *
     * three.js默认旋转顺序。
     */
    XYZ = 0,
    /**
     * 依次按 YXZ 轴旋转。
     */
    ZXY = 1,
    /**
     * 依次按 XYZ 轴旋转。
     *
     * playcanvas默认旋转顺序。
     */
    ZYX = 2,
    /**
     * 依次按 ZXY 轴旋转。
     *
     * unity默认旋转顺序。
     */
    YXZ = 3,
    /**
     * 依次按 XZY 轴旋转。
     */
    YZX = 4,
    /**
     * 依次按 YZX 轴旋转。
     */
    XZY = 5,
}

/**
 * 引擎中使用的旋转顺序（`RotationOrder.XYZ`）。
 *
 * 原名 `mathUtil.DefaultRotationOrder`——模块级单例 `mathUtil` 上的一个**可写字段**，
 * 由本文件在模块顶层赋值。纯函数化时改成**导出常量**：全仓 22 处消费点**全是读取**
 * （`order = mathUtil.DefaultRotationOrder` 之类的默认参数），没有任何一处写入，
 * 也就是说那个「可写字段」从来没被写过第二次。用常量替掉字段，顺带消除了
 * 「模块级单例 + 顶层赋值」这对 R2 关注的形态。
 *
 * 若将来确实需要「可配置的默认旋转序」，请改成显式的 `getDefaultRotationOrder()` /
 * `setDefaultRotationOrder()`（而不是恢复可写导出），并同步更新本注释与
 * `docs/migrations/MATH_PURE_FUNCTIONS_MIGRATION.md`。
 */
export const DEFAULT_ROTATION_ORDER = RotationOrder.XYZ;
