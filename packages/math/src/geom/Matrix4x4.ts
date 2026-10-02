import { mathUtil } from '@feng3d/polyfill';
import {
    mat4Append,
    mat4AppendRotation,
    mat4AppendScale,
    mat4AppendTranslation,
    mat4Copy,
    mat4Determinant,
    mat4Equals,
    mat4FromArray,
    mat4FromAxisRotate,
    mat4FromPosition,
    mat4FromQuaternion,
    mat4FromQuaternionRotate,
    mat4FromRotation,
    mat4FromScale,
    mat4FromTRS,
    mat4FromVectorPosition,
    mat4FromVectorScale,
    mat4GetAxisX,
    mat4GetAxisY,
    mat4GetAxisZ,
    mat4GetColumn,
    mat4GetMaxScaleOnAxis,
    mat4GetPosition,
    mat4GetRotation,
    mat4GetRow,
    mat4GetScale,
    mat4Identity,
    mat4Invert,
    mat4IsIdentity,
    mat4LookAt,
    mat4MoveForward,
    mat4MoveRight,
    mat4MoveUp,
    mat4MultiplyPoint,
    mat4MultiplyPoint3x4,
    mat4MultiplyVector,
    mat4Prepend,
    mat4PrependRotation,
    mat4PrependScale,
    mat4PrependScale1,
    mat4PrependTranslation,
    mat4Random,
    mat4SetAxisX,
    mat4SetAxisY,
    mat4SetColumn,
    mat4SetOrtho,
    mat4SetPerspective,
    mat4SetPerspectiveFromFOV,
    mat4SetPosition,
    mat4SetRotation,
    mat4SetRow,
    mat4SetScale,
    mat4ToArray,
    mat4ToMatrix3x3,
    mat4ToString,
    mat4ToTRS,
    mat4TransformPlane,
    mat4TransformPoint3,
    mat4TransformPoints,
    mat4TransformRay,
    mat4TransformRotation,
    mat4TransformVector3,
    mat4TransformVector4,
    mat4Transpose,
    quatToMatrix4x4,
} from './matrix4x4Ops';
import { Matrix3x3 } from './Matrix3x3';
import { Plane } from './Plane';
import { Quaternion } from './Quaternion';
import { Ray3 } from './Ray3';
import { Vector3, Vector3Like } from './Vector3';
import { Vector4 } from './Vector4';

declare global
{
    interface MixinsQuaternion
    {
        toMatrix(target?: Matrix4x4): Matrix4x4
    }
}

/**
 * 转换为矩阵
 *
 * 委托给 `matrix4x4Ops.ts` 的 `quatToMatrix4x4`（issue #134 阶段 A2d）。
 *
 * @param target
 */
Quaternion.prototype.toMatrix = function toMatrix(this: Quaternion, target = new Matrix4x4())
{
    return quatToMatrix4x4(this, target) as Matrix4x4;
};

type NmberArray16 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
];

/**
 * Matrix4x4 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
 * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
 * Matrix4x4 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
 * ```
 *  ---                                   ---
 *  |   scaleX      0         0       0     |   x轴
 *  |     0       scaleY      0       0     |   y轴
 *  |     0         0       scaleZ    0     |   z轴
 *  |     tx        ty        tz      1     |   平移
 *  ---                                   ---
 *
 *  ---                                   ---
 *  |     0         1         2        3    |   x轴
 *  |     4         5         6        7    |   y轴
 *  |     8         9         10       11   |   z轴
 *  |     12        13        14       15   |   平移
 *  ---                                   ---
 * ```
 *
 * > **过渡态（issue #134 阶段 A2d）**：本类的实例/静态方法体已全部**委托**给 `./matrix4x4Ops` 的纯函数，
 * > 但类本身保留（阶段 A 不删 class）。签名、返回值、就地语义与改造前一致；
 * > 纯函数层「不修改入参、结果写 `out`（`out` 传自己即就地运算）」。
 *
 * @see https://help.adobe.com/zh_CN/FlashPlatform/reference/actionscript/3/flash/geom/Matrix3D.html
 * @see https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
 * @see https://docs.unity3d.com/ScriptReference/Matrix4x4.html
 */
export class Matrix4x4
{
    /**
     * 通过位移旋转缩放重组矩阵
     *
     * @param position 位移（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param rotation 旋转角度，按照指定旋转顺序旋转角度（同上）
     * @param scale 缩放（同上）
     * @param order 旋转顺序。
     */
    static fromTRS(position: Vector3Like, rotation: Vector3Like, scale: Vector3Like, order = mathUtil.DefaultRotationOrder)
    {
        // 先建 class 实例再写入：纯函数缺省 `out` 是纯字面量，没有 Matrix4x4 的原型方法
        const mat = new Matrix4x4();

        mat4FromTRS(position, rotation, scale, order, mat);

        return mat;
    }

    /**
     * 从轴与旋转角度创建矩阵
     *
     * @param axis 旋转轴（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param angle 旋转角度（弧度）
     */
    static fromAxisRotate(axis: Vector3Like, angle: number)
    {
        const mat = new Matrix4x4();

        mat4FromAxisRotate(axis, angle, mat);

        return mat;
    }

    /**
     * 从欧拉角旋转角度初始化矩阵。
     *
     * @param rx 用于沿 x 轴旋转对象的角度（弧度）。
     * @param ry 用于沿 y 轴旋转对象的角度（弧度）。
     * @param rz 用于沿 z 轴旋转对象的角度（弧度）。
     * @param order 绕轴旋转的顺序。
     */
    static fromRotation(rx: number, ry: number, rz: number, order = mathUtil.DefaultRotationOrder): Matrix4x4
    {
        const mat = new Matrix4x4();

        mat4FromRotation(rx, ry, rz, order, mat);

        return mat;
    }

    /**
     * 从四元素初始化矩阵。
     *
     * @param q 四元素
     */
    static fromQuaternion(q: Quaternion)
    {
        const mat = new Matrix4x4();

        mat4FromQuaternion(q, mat);

        return mat;
    }

    /**
     * 创建缩放矩阵
     * @param sx 用于沿 x 轴缩放对象的乘数。
     * @param sy 用于沿 y 轴缩放对象的乘数。
     * @param sz 用于沿 z 轴缩放对象的乘数。
     */
    static fromScale(sx: number, sy: number, sz: number)
    {
        const rotationMat = new Matrix4x4();

        mat4FromScale(sx, sy, sz, rotationMat);

        return rotationMat;
    }

    /**
     * 创建位移矩阵
     * @param x 沿 x 轴的增量平移。
     * @param y 沿 y 轴的增量平移。
     * @param z 沿 z 轴的增量平移。
     */
    static fromPosition(x: number, y: number, z: number)
    {
        const rotationMat = new Matrix4x4();

        mat4FromPosition(x, y, z, rotationMat);

        return rotationMat;
    }

    /**
     * 设置为位移矩阵（修改 this 并返回）
     */
    fromPosition(x: number, y: number, z: number)
    {
        mat4FromPosition(x, y, z, this);

        return this;
    }

    /**
     * 设置为缩放矩阵（修改 this 并返回）
     */
    fromScale(sx: number, sy: number, sz: number)
    {
        mat4FromScale(sx, sy, sz, this);

        return this;
    }

    /**
     * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
     */
    elements: NmberArray16;

    /**
     * 获取位移
     *
     * @param value 用于存储位移信息的向量
     */
    getPosition(value = new Vector3())
    {
        mat4GetPosition(this, value);

        return value;
    }

    /**
     * 设置位移
     *
     * @param value 位移（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     */
    setPosition(value: Vector3Like)
    {
        mat4SetPosition(this, value, this);

        return this;
    }

    /**
     * 获取欧拉旋转角度（弧度）。
     *
     * @param rotation 欧拉旋转角度（弧度）。
     * @param order 绕轴旋转的顺序。
     */
    getRotation(rotation = new Vector3(), order = mathUtil.DefaultRotationOrder)
    {
        mat4GetRotation(this, rotation, order);

        return rotation;
    }

    /**
     * 设置欧拉旋转角度（弧度）。
     *
     * @param rotation 欧拉旋转角度（弧度）。（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param order 绕轴旋转的顺序。
     */
    setRotation(rotation: Vector3Like, order = mathUtil.DefaultRotationOrder)
    {
        mat4SetRotation(this, rotation, order, this);

        return this;
    }

    /**
     * 获取缩放值。
     *
     * @param scale 用于存储缩放值的向量。
     */
    getScale(scale = new Vector3())
    {
        mat4GetScale(this, scale);

        return scale;
    }

    /**
     * 获取缩放值。
     *
     * @param scale 缩放值（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     */
    setScale(scale: Vector3Like)
    {
        mat4SetScale(this, scale, this);

        return this;
    }

    /**
     * 一个用于确定矩阵是否可逆的数字。如果值为0则不可逆。
     */
    get determinant()
    {
        return mat4Determinant(this);
    }

    /**
     * 获取X轴向量
     *
     * @param out 保存X轴向量
     */
    getAxisX(out = new Vector3())
    {
        mat4GetAxisX(this, out);

        return out;
    }

    /**
     * 设置X轴向量
     *
     * @param vector X轴向量
     */
    setAxisX(vector = new Vector3())
    {
        mat4SetAxisX(this, vector, this);

        return this;
    }

    /**
     * 获取Y轴向量
     *
     * @param out 保存Y轴向量
     */
    getAxisY(out = new Vector3())
    {
        mat4GetAxisY(this, out);

        return out;
    }

    /**
     * 设置Y轴向量
     *
     * @param vector X轴向量
     */
    setAxisY(vector = new Vector3())
    {
        mat4SetAxisY(this, vector, this);

        return this;
    }

    /**
     * 获取Z轴向量
     *
     * @param out 保存Z轴向量
     */
    getAxisZ(out = new Vector3())
    {
        mat4GetAxisZ(this, out);

        return out;
    }

    /**
     * 创建 Matrix4x4 对象。
     * @param rawData 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
     */
    constructor(rawData: NmberArray16 = [
        1, 0, 0, 0, //
        0, 1, 0, 0, //
        0, 0, 1, 0, //
        0, 0, 0, 1, //
    ])
    {
        this.elements = rawData;
    }

    /**
     * 从欧拉角旋转角度初始化矩阵。
     *
     * @param rx 用于沿 x 轴旋转对象的角度（弧度）。
     * @param ry 用于沿 y 轴旋转对象的角度（弧度）。
     * @param rz 用于沿 z 轴旋转对象的角度（弧度）。
     * @param order 绕轴旋转的顺序。
     */
    fromRotation(rx: number, ry: number, rz: number, order = mathUtil.DefaultRotationOrder)
    {
        mat4FromRotation(rx, ry, rz, order, this);

        return this;
    }

    /**
     * 从四元素初始化矩阵。
     *
     * @param q 四元素
     */
    fromQuaternion(q: Quaternion)
    {
        mat4FromQuaternion(q, this);

        return this;
    }

    /**
     * 从轴与旋转角度创建矩阵
     *
     * @param axis 旋转轴（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param angle 旋转角度（弧度）
     */
    fromAxisRotate(axis: Vector3Like, angle: number)
    {
        mat4FromAxisRotate(axis, angle, this);

        return this;
    }

    /**
     * 通过将另一个 Matrix4x4 对象与当前 Matrix4x4 对象相乘来后置一个矩阵。
     */
    append(lhs: Matrix4x4)
    {
        mat4Append(this, lhs, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上后置一个增量旋转。
     * @param axis 旋转轴（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param angle 旋转角度（弧度）
     * @param pivotPoint 旋转中心点（同上）
     */
    appendRotation(axis: Vector3Like, angle: number, pivotPoint?: Vector3Like)
    {
        mat4AppendRotation(this, axis, angle, pivotPoint, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上后置一个增量缩放，沿 x、y 和 z 轴改变尺寸。
     *
     * 等价于 `this.append(Matrix4x4.fromScale(sx, sy, sz))`，但**直接改写 elements**：
     * 缩放矩阵是对角阵，与它相乘只会按行（行主序下左乘 S）乘常数，
     * 因此 16 次乘法即可完成，省掉一次矩阵分配与 64 次乘加（issue #126）。
     *
     * @param sx 用于沿 x 轴缩放对象的乘数。
     * @param sy 用于沿 y 轴缩放对象的乘数。
     * @param sz 用于沿 z 轴缩放对象的乘数。
     * @param pivotPoint 缩放锚点（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）。给出时以该点为中心缩放（先平移 -pivot、缩放、再平移回 pivot），
     *                   与 {@link appendRotation} 的 pivotPoint 参数同一套语义——pivot 点是不动点。
     */
    appendScale(sx: number, sy: number, sz: number, pivotPoint?: Vector3Like)
    {
        mat4AppendScale(this, sx, sy, sz, pivotPoint, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
     * @param x 沿 x 轴的增量平移。
     * @param y 沿 y 轴的增量平移。
     * @param z 沿 z 轴的增量平移。
     */
    appendTranslation(x: number, y: number, z: number)
    {
        mat4AppendTranslation(this, x, y, z, this);

        return this;
    }

    /**
     * 返回一个新 Matrix4x4 对象，它是与当前 Matrix4x4 对象完全相同的副本。
     *
     * 显式标注返回类型：`mat4Copy` 等纯函数返回的 `WritableMatrix4x4Like` 是**结构类型**，
     * 不标注就会让本方法的返回类型退化（会让下游按 `Matrix4x4` 用的调用点报错）。
     */
    clone(): Matrix4x4
    {
        // 走 class 构造（纯函数层缺省 `out` 是纯字面量，没有 Matrix4x4 的原型方法）
        const matrix = new Matrix4x4();

        mat4Copy(this, matrix);

        return matrix;
    }

    /**
     * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
     * @param source 要从中复制数据的 Matrix4x4 对象。
     */
    copy(source: Matrix4x4)
    {
        mat4Copy(source, this);

        return this;
    }

    /**
     * 从数组中初始化
     *
     * @param array 包含矩阵数据的数组
     * @param index 数组中的起始位置
     * @param transpose 是否转置
     */
    fromArray(array: number[], index = 0, transpose = false)
    {
        mat4FromArray(array, index, transpose, this);

        return this;
    }

    /**
     * 将矩阵数据转换为数组
     *
     * @param array 保存矩阵数据的数组
     * @param index 数组中的起始位置
     * @param transpose 是否转置
     */
    toArray(array: number[] | Float32Array = [], index = 0, transpose = false)
    {
        return mat4ToArray(this, array, index, transpose);
    }

    /**
     * 随机矩阵。
     */
    random()
    {
        mat4Random(this);

        return this;
    }

    /**
     * 通过位移旋转缩放重组矩阵
     *
     * @param position 位移（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param rotation 欧拉旋转角度（弧度），按 order 指定顺序旋转。（同上）
     * @param scale 缩放。（同上）
     * @param order 旋转顺序。
     */
    fromTRS(position: Vector3Like, rotation: Vector3Like, scale: Vector3Like, order = mathUtil.DefaultRotationOrder)
    {
        mat4FromTRS(position, rotation, scale, order, this);

        return this;
    }

    /**
     * 把矩阵分解为位移旋转缩放。
     *
     * @param position 位移
     * @param rotation 欧拉旋转角度（弧度），按 order 指定顺序。
     * @param scale 缩放。
     * @param order 旋转顺序。
     */
    toTRS(position = new Vector3(), rotation = new Vector3(), scale = new Vector3(), order = mathUtil.DefaultRotationOrder)
    {
        // 不能直接 return mat4ToTRS(...)：那会让返回类型退化成 WritableVector3Like 元组，
        // editor 的 MRSToolTarget / RTool / SceneRotateTool 拿 toTRS()[1] 当 Vector3 用就会编译不过
        mat4ToTRS(this, position, rotation, scale, order);

        return [position, rotation, scale];
    }

    /**
     * 将当前矩阵转换为恒等或单位矩阵。
     */
    identity()
    {
        mat4Identity(this);

        return this;
    }

    /**
     * 反转当前矩阵。逆矩阵
     * @returns      如果成功反转矩阵，则返回 该矩阵。
     */
    invert()
    {
        mat4Invert(this, this);

        return this;
    }

    /**
     * 通过将当前 Matrix4x4 对象与另一个 Matrix4x4 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
     * @param rhs 个右侧矩阵，它与当前 Matrix4x4 对象相乘。
     */
    prepend(rhs: Matrix4x4)
    {
        mat4Prepend(this, rhs, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上前置一个增量旋转。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行旋转，然后再执行其他转换。
     * @param axis 旋转的轴或方向（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）。常见的轴为 X_AXIS (Vector3(1,0,0))、Y_AXIS (Vector3(0,1,0)) 和 Z_AXIS (Vector3(0,0,1))。此矢量的长度应为 1。
     * @param angle 旋转的角度（弧度）。
     * @param pivotPoint 一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。（同上；本实现未使用该参数）
     */
    prependRotation(axis: Vector3Like, angle: number, _pivotPoint: Vector3Like = new Vector3())
    {
        mat4PrependRotation(this, axis, angle, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行缩放更改，然后再执行其他转换。
     * @param xScale 用于沿 x 轴缩放对象的乘数。
     * @param yScale 用于沿 y 轴缩放对象的乘数。
     * @param zScale 用于沿 z 轴缩放对象的乘数。
     */
    prependScale(xScale: number, yScale: number, zScale: number)
    {
        mat4PrependScale(this, xScale, yScale, zScale, this);

        return this;
    }

    prependScale1(xScale: number, yScale: number, zScale: number)
    {
        mat4PrependScale1(this, xScale, yScale, zScale, this);

        return this;
    }

    /**
     * 在 Matrix4x4 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行平移更改，然后再执行其他转换。
     * @param x 沿 x 轴的增量平移。
     * @param y 沿 y 轴的增量平移。
     * @param z 沿 z 轴的增量平移。
     */
    prependTranslation(x: number, y: number, z: number)
    {
        mat4PrependTranslation(this, x, y, z, this);

        return this;
    }

    /**
     * X轴方向移动
     * @param distance 移动距离
     */
    moveRight(distance: number)
    {
        mat4MoveRight(this, distance, this);

        return this;
    }

    /**
     * Y轴方向移动
     * @param distance 移动距离
     */
    moveUp(distance: number)
    {
        mat4MoveUp(this, distance, this);

        return this;
    }

    /**
     * Z轴方向移动
     * @param distance 移动距离
     */
    moveForward(distance: number)
    {
        mat4MoveForward(this, distance, this);

        return this;
    }

    /**
     * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
     * @param vin 一个容纳要转换的坐标的 Vector3 对象（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）。
     * @returns  一个包含转换后的坐标的 Vector3 对象。
     */
    transformPoint3(vin: Vector3Like, vout = new Vector3())
    {
        mat4TransformPoint3(this, vin, vout);

        return vout;
    }

    /**
     * 变换Vector3向量
     *
     * 与变换点不同，并不会受到矩阵平移分量的影响。
     *
     * @param vin 被变换的向量（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param vout 变换后的向量
     */
    transformVector3(vin: Vector3Like, vout = new Vector3())
    {
        mat4TransformVector3(this, vin, vout);

        return vout;
    }

    /**
     * 变换Vector4向量
     *
     * @param vin 被变换的向量
     * @param vout 变换后的向量
     */
    transformVector4(vin: Vector4, vout = new Vector4())
    {
        mat4TransformVector4(this, vin, vout);

        return vout;
    }

    /**
     * 变换坐标数组数据
     *
     * @param vin 被变换坐标数组数据
     * @param vout 变换后的坐标数组数据
     */
    transformPoints(vin: number[], vout: number[] = [])
    {
        return mat4TransformPoints(this, vin, vout);
    }

    /**
     * 变换旋转角度（弧度）
     *
     * @param vin 被变换的旋转角度（弧度）（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param vout 变换后的旋转角度（弧度）
     */
    transformRotation(vin: Vector3Like, vout = new Vector3())
    {
        mat4TransformRotation(this, vin, vout);

        return vout;
    }

    /**
     * 使用转换矩阵将 Ray3 对象从一个空间坐标转换到另一个空间坐标。
     *
     * @param inRay 被转换的Ray3。
     * @param outRay 转换后的Ray3。
     * @returns 转换后的Ray3。
     */
    transformRay(inRay: Ray3, outRay = new Ray3())
    {
        mat4TransformRay(this, inRay, outRay);

        return outRay;
    }

    /**
     * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
     */
    transpose()
    {
        mat4Transpose(this, this);

        return this;
    }

    /**
     * 比较矩阵是否相等
     */
    equals(matrix: Matrix4x4, precision = mathUtil.PRECISION)
    {
        return mat4Equals(this, matrix, precision);
    }

    /**
     * 看向目标位置（右手系，three.js 约定）
     *
     * 使物体本地 -Z 轴指向 target（z 轴 = eye - target）。
     *
     * @param target 目标位置（任意提供 `x/y/z` 的对象，不必是 Vector3 实例）
     * @param upAxis 向上朝向（同上；缺省为 Y 轴）
     */
    lookAt(target: Vector3Like, upAxis?: Vector3Like)
    {
        mat4LookAt(this, target, upAxis, this);

        return this;
    }

    /**
     * 获取XYZ轴中最大缩放值
     */
    getMaxScaleOnAxis()
    {
        return mat4GetMaxScaleOnAxis(this);
    }

    /**
     * 初始化正射投影矩阵
     * @param left 可视空间左边界
     * @param right 可视空间右边界
     * @param top 可视空间上边界
     * @param bottom 可视空间下边界
     * @param near 可视空间近边界
     * @param far 可视空间远边界
     *
     * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
     *
     * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
     */
    setOrtho(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
        mat4SetOrtho(left, right, top, bottom, near, far, this);

        return this;
    }

    /**
     * 初始化透视投影矩阵
     * @param fov 垂直视角，视锥体顶面和底面间的夹角，必须大于0 （角度）
     * @param aspect 近裁剪面的宽高比
     * @param near 视锥体近边界
     * @param far 视锥体远边界
     *
     * 视锥体的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
     */
    setPerspectiveFromFOV(fov: number, aspect: number, near: number, far: number)
    {
        mat4SetPerspectiveFromFOV(fov, aspect, near, far, this);

        return this;
    }

    /**
     * 初始化透视投影矩阵
     * @param left 可视空间左边界
     * @param right 可视空间右边界
     * @param top 可视空间上边界
     * @param bottom 可视空间下边界
     * @param near 可视空间近边界
     * @param far 可视空间远边界
     *
     * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
     *
     * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
     */
    setPerspective(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
        mat4SetPerspective(left, right, top, bottom, near, far, this);

        return this;
    }

    /**
     * 转换为3x3矩阵
     *
     * @param out 3x3矩阵
     */
    toMatrix3x3(out = new Matrix3x3()): Matrix3x3
    {
        mat4ToMatrix3x3(this, out);

        return out;
    }

    /**
     * 以字符串返回矩阵的值
     */
    toString(): string
    {
        return mat4ToString(this);
    }

    // Get a column of the matrix.
    GetColumn(index: number): Vector4
    {
        const out = new Vector4();

        mat4GetColumn(this, index, out);

        return out;
    }

    // Returns a row of the matrix.
    GetRow(index: number): Vector4
    {
        const out = new Vector4();

        mat4GetRow(this, index, out);

        return out;
    }

    // Sets a column of the matrix.
    SetColumn(index: number, column: Vector4)
    {
        mat4SetColumn(this, index, column, this);
    }

    // Sets a row of the matrix.
    SetRow(index: number, row: Vector4)
    {
        mat4SetRow(this, index, row, this);
    }

    // Transforms a position by this matrix, with a perspective divide. (generic)
    MultiplyPoint(point: Vector3Like, res = new Vector3())
    {
        mat4MultiplyPoint(this, point, res);

        return res;
    }

    // Transforms a position by this matrix, without a perspective divide. (fast)
    MultiplyPoint3x4(point: Vector3Like, res = new Vector3())
    {
        mat4MultiplyPoint3x4(this, point, res);

        return res;
    }

    // Transforms a direction by this matrix.
    MultiplyVector(vector: Vector3Like, res = new Vector3())
    {
        mat4MultiplyVector(this, vector, res);

        return res;
    }

    // Transforms a plane by this matrix.
    TransformPlane(plane: Plane, result = new Plane()): Plane
    {
        mat4TransformPlane(this, plane, result);

        return result;
    }

    // Creates a scaling matrix.
    static Scale(vector: Vector3Like, m = new Matrix4x4())
    {
        // 写入调用方给的 class 实例（缺省新建），保证返回值带 Matrix4x4 的原型方法
        mat4FromVectorScale(vector, m);

        return m;
    }

    // Creates a translation matrix.
    static Translate(vector: Vector3Like, m = new Matrix4x4())
    {
        mat4FromVectorPosition(vector, m);

        return m;
    }

    // Creates a rotation matrix. Note: Assumes unit quaternion
    static Rotate(q: Quaternion, m = new Matrix4x4())
    {
        mat4FromQuaternionRotate(q, m);

        return m;
    }

    // Returns a matrix with all elements set to zero (RO).
    static readonly zero = new Matrix4x4(
        [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);

    // Returns the identity matrix (RO).
    static readonly identity = new Matrix4x4(
        [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);

    get rotation()
    {
        const quaternion = new Quaternion().fromMatrix(this);

        return quaternion;
    }

    get lossyScale()
    {
        return this.getScale();
    }

    get isIdentity()
    {
        return mat4IsIdentity(this);
    }
}
