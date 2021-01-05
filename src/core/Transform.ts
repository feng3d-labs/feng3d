import { watcher } from "@feng3d/watcher";
import { serialize } from "@feng3d/serialization";
import { oav } from "@feng3d/objectview";
import { Vector3, Matrix4x4, Box3, Ray3, Quaternion } from "@feng3d/math";
import { RenderAtomic } from "@feng3d/renderer";

import { RegisterComponent, Component } from "../component/Component";
import { Scene } from "../scene/Scene";
import { Camera } from "../cameras/Camera";

export interface GameObjectEventMap
{
    /**
     * 变换矩阵变化
     */
    transformChanged: Transform;
    /**
     * 
     */
    updateLocalToWorldMatrix: Transform;

    /**
     * 场景矩阵变化
     */
    scenetransformChanged: Transform;
}

/**
 * 变换
 * 
 * 物体的位置、旋转和比例。
 * 
 * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放
 */
@RegisterComponent()
export class Transform extends Component
{
    __class__: "feng3d.Transform";

    get single() { return true; }

    /**
     * 创建一个实体，该类为虚类
     */
    constructor()
    {
        super();

        watcher.watch(this._position, "x", this._positionChanged, this);
        watcher.watch(this._position, "y", this._positionChanged, this);
        watcher.watch(this._position, "z", this._positionChanged, this);
        watcher.watch(this._rotation, "x", this._rotationChanged, this);
        watcher.watch(this._rotation, "y", this._rotationChanged, this);
        watcher.watch(this._rotation, "z", this._rotationChanged, this);
        watcher.watch(this._scale, "x", this._scaleChanged, this);
        watcher.watch(this._scale, "y", this._scaleChanged, this);
        watcher.watch(this._scale, "z", this._scaleChanged, this);

        this._renderAtomic.uniforms.u_modelMatrix = () => this.localToWorldMatrix;
        this._renderAtomic.uniforms.u_ITModelMatrix = () => this.ITlocalToWorldMatrix;
    }

    /**
     * 世界坐标
     */
    get worldPosition()
    {
        return this.localToWorldMatrix.getPosition();
    }

    get parent()
    {
        return this.gameObject.parent && this.gameObject.parent.transform;
    }

    /**
     * X轴坐标。
     */
    @serialize
    get x() { return this._position.x; }
    set x(v) { this._position.x = v; }

    /**
     * Y轴坐标。
     */
    @serialize
    get y() { return this._position.y; }
    set y(v) { this._position.y = v; }

    /**
     * Z轴坐标。
     */
    @serialize
    get z() { return this._position.z; }
    set z(v) { this._position.z = v; }

    /**
     * X轴旋转角度。
     */
    @serialize
    get rx() { return this._rotation.x; }
    set rx(v) { this._rotation.x = v; }

    /**
     * Y轴旋转角度。
     */
    @serialize
    get ry() { return this._rotation.y; }
    set ry(v) { this._rotation.y = v; }

    /**
     * Z轴旋转角度。
     */
    @serialize
    get rz() { return this._rotation.z; }
    set rz(v) { this._rotation.z = v; }

    /**
     * X轴缩放。
     */
    @serialize
    get sx() { return this._scale.x; }
    set sx(v) { this._scale.x = v; }

    /**
     * Y轴缩放。
     */
    @serialize
    get sy() { return this._scale.y; }
    set sy(v) { this._scale.y = v; }

    /**
     * Z轴缩放。
     */
    @serialize
    get sz() { return this._scale.z; }
    set sz(v) { this._scale.z = v; }

    /**
     * 本地位移
     */
    @oav({ tooltip: "本地位移" })
    get position() { return this._position; }
    set position(v) { this._position.copy(v); }

    /**
     * 本地旋转
     */
    @oav({ tooltip: "本地旋转", component: "OAVVector3", componentParam: { step: 0.001, stepScale: 30, stepDownup: 30 } })
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation.copy(v); }

    /**
     * 本地四元素旋转
     */
    get orientation()
    {
        this._orientation.fromMatrix(this.matrix);
        return this._orientation;
    }

    set orientation(value)
    {
        var angles = value.toEulerAngles();
        angles.scaleNumber(Math.RAD2DEG);
        this.rotation = angles;
    }

    /**
     * 本地缩放
     */
    @oav({ tooltip: "本地缩放" })
    get scale() { return this._scale; }
    set scale(v) { this._scale.copy(v); }

    /**
     * 本地变换矩阵
     */
    get matrix()
    {
        if (this._matrixInvalid)
        {
            this._matrixInvalid = false;
            this._updateMatrix();
        }
        return this._matrix;
    }

    set matrix(v)
    {
        v.toTRS(this._position, this._rotation, this._scale);
        this._matrix.fromArray(v.rawData);
        this._matrixInvalid = false;
    }

    /**
     * 本地旋转矩阵
     */
    get rotationMatrix()
    {
        if (this._rotationMatrixInvalid)
        {
            this._rotationMatrix.setRotation(this._rotation);
            this._rotationMatrixInvalid = false;
        }
        return this._rotationMatrix;
    }

    moveForward(distance: number)
    {
        this.translateLocal(Vector3.Z_AXIS, distance);
    }

    moveBackward(distance: number)
    {
        this.translateLocal(Vector3.Z_AXIS, -distance);
    }

    moveLeft(distance: number)
    {
        this.translateLocal(Vector3.X_AXIS, -distance);
    }

    moveRight(distance: number)
    {
        this.translateLocal(Vector3.X_AXIS, distance);
    }

    moveUp(distance: number)
    {
        this.translateLocal(Vector3.Y_AXIS, distance);
    }

    moveDown(distance: number)
    {
        this.translateLocal(Vector3.Y_AXIS, -distance);
    }

    translate(axis: Vector3, distance: number)
    {
        var x = axis.x, y = axis.y, z = axis.z;
        var len = distance / Math.sqrt(x * x + y * y + z * z);
        this.x += x * len;
        this.y += y * len;
        this.z += z * len;
    }

    translateLocal(axis: Vector3, distance: number)
    {
        var x = axis.x, y = axis.y, z = axis.z;
        var len = distance / Math.sqrt(x * x + y * y + z * z);
        var matrix = this.matrix.clone();
        matrix.prependTranslation(x * len, y * len, z * len);
        var p = matrix.getPosition();
        this.x = p.x;
        this.y = p.y;
        this.z = p.z;
        this._invalidateSceneTransform();
    }

    pitch(angle: number)
    {
        this.rotate(Vector3.X_AXIS, angle);
    }

    yaw(angle: number)
    {
        this.rotate(Vector3.Y_AXIS, angle);
    }

    roll(angle: number)
    {
        this.rotate(Vector3.Z_AXIS, angle);
    }

    rotateTo(ax: number, ay: number, az: number)
    {
        this._rotation.set(ax, ay, az);
    }

    /**
     * 绕指定轴旋转，不受位移与缩放影响
     * @param    axis               旋转轴
     * @param    angle              旋转角度
     * @param    pivotPoint         旋转中心点
     * 
     */
    rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void
    {
        //转换位移
        var positionMatrix = Matrix4x4.fromPosition(this.position.x, this.position.y, this.position.z);
        positionMatrix.appendRotation(axis, angle, pivotPoint);
        this.position = positionMatrix.getPosition();
        //转换旋转
        var rotationMatrix = Matrix4x4.fromRotation(this.rx, this.ry, this.rz);
        rotationMatrix.appendRotation(axis, angle, pivotPoint);
        var newrotation = rotationMatrix.toTRS()[1];
        var v = Math.round((newrotation.x - this.rx) / 180);
        if (v % 2 != 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }
        //
        var toRound = (a: number, b: number, c = 360) =>
        {
            return Math.round((b - a) / c) * c + a;
        }
        newrotation.x = toRound(newrotation.x, this.rx);
        newrotation.y = toRound(newrotation.y, this.ry);
        newrotation.z = toRound(newrotation.z, this.rz);
        this.rotation = newrotation;
        this._invalidateSceneTransform();
    }

    /**
     * 看向目标位置
     * 
     * @param target    目标位置
     * @param upAxis    向上朝向
     */
    lookAt(target: Vector3, upAxis?: Vector3)
    {
        this._updateMatrix();
        this._matrix.lookAt(target, upAxis);
        this._matrix.toTRS(this._position, this._rotation, this._scale);
        this._matrixInvalid = false;
    }

    /**
     * 将一个点从局部空间变换到世界空间的矩阵。
     */
    get localToWorldMatrix()
    {
        if (this._localToWorldMatrixInvalid)
        {
            this._localToWorldMatrixInvalid = false;
            this._updateLocalToWorldMatrix();
        }
        return this._localToWorldMatrix;
    }

    set localToWorldMatrix(value)
    {
        value = value.clone();
        this.parent && value.append(this.parent.worldToLocalMatrix);
        this.matrix = value;
    }

    /**
     * 本地转世界逆转置矩阵
     */
    get ITlocalToWorldMatrix()
    {
        if (this._ITlocalToWorldMatrixInvalid)
        {
            this._ITlocalToWorldMatrixInvalid = false;
            this._ITlocalToWorldMatrix.copy(this.localToWorldMatrix)
            this._ITlocalToWorldMatrix.invert().transpose();
        }
        return this._ITlocalToWorldMatrix;
    }

    /**
     * 将一个点从世界空间转换为局部空间的矩阵。
     */
    get worldToLocalMatrix()
    {
        if (this._worldToLocalMatrixInvalid)
        {
            this._worldToLocalMatrixInvalid = false;
            this._worldToLocalMatrix.copy(this.localToWorldMatrix).invert();
        }
        return this._worldToLocalMatrix;
    }

    get localToWorldRotationMatrix()
    {
        if (this._localToWorldRotationMatrixInvalid)
        {
            this._localToWorldRotationMatrix.copy(this.rotationMatrix);
            if (this.parent)
                this._localToWorldRotationMatrix.append(this.parent.localToWorldRotationMatrix);

            this._localToWorldRotationMatrixInvalid = false;
        }
        return this._localToWorldRotationMatrix;
    }

    get worldToLocalRotationMatrix()
    {
        var mat = this.localToWorldRotationMatrix.clone();
        mat.invert();
        return mat;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     * 
     * @param direction 局部空间方向
     */
    transformDirection(direction: Vector3)
    {
        direction = this.localToWolrdDirection(direction);
        return direction;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     * 
     * @param direction 局部空间方向
     */
    localToWolrdDirection(direction: Vector3)
    {
        if (!this.parent)
            return direction.clone();
        var matrix = this.parent.localToWorldRotationMatrix;
        direction = matrix.transformPoint3(direction);
        return direction;
    }

    /**
     * 将包围盒从局部空间转换到世界空间
     * 
     * @param box 变换前的包围盒
     * @param out 变换之后的包围盒
     * 
     * @returns 变换之后的包围盒
     */
    localToWolrdBox(box: Box3, out = new Box3())
    {
        if (!this.parent)
            return out.copy(box);
        var matrix = this.parent.localToWorldMatrix;
        box.applyMatrixTo(matrix, out);
        return out;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     * 
     * @param position 局部空间位置
     */
    transformPoint(position: Vector3)
    {
        position = this.localToWorldPoint(position);
        return position;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     * 
     * @param position 局部空间位置
     */
    localToWorldPoint(position: Vector3)
    {
        if (!this.parent)
            return position.clone();
        position = this.parent.localToWorldMatrix.transformPoint3(position);
        return position;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     * 
     * @param vector 局部空间向量
     */
    transformVector(vector: Vector3)
    {
        vector = this.localToWorldVector(vector);
        return vector;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     * 
     * @param vector 局部空间位置
     */
    localToWorldVector(vector: Vector3)
    {
        if (!this.parent)
            return vector.clone();
        var matrix = this.parent.localToWorldMatrix;
        vector = matrix.transformVector3(vector);
        return vector;
    }

    /**
     * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
     * 
     * 将一个方向从世界空间转换到局部空间。
     */
    inverseTransformDirection(direction: Vector3)
    {
        direction = this.worldToLocalDirection(direction)
        return direction;
    }

    /**
     * 将一个方向从世界空间转换到局部空间。
     */
    worldToLocalDirection(direction: Vector3)
    {
        if (!this.parent)
            return direction.clone();
        var matrix = this.parent.localToWorldRotationMatrix.clone().invert();
        direction = matrix.transformPoint3(direction);
        return direction;
    }

    /**
     * 将位置从世界空间转换为局部空间。
     * 
     * @param position 世界坐标系中位置
     */
    worldToLocalPoint(position: Vector3, out = new Vector3())
    {
        if (!this.parent)
            return out.copy(position);
        position = this.parent.worldToLocalMatrix.transformPoint3(position, out);
        return position;
    }

    /**
     * 将向量从世界空间转换为局部空间
     * 
     * @param vector 世界坐标系中向量
     */
    worldToLocalVector(vector: Vector3)
    {
        if (!this.parent)
            return vector.clone();
        vector = this.parent.worldToLocalMatrix.transformVector3(vector);
        return vector;
    }

    /**
     * 将 Ray3 从世界空间转换为局部空间。
     * 
     * @param worldRay 世界空间射线。
     * @param localRay 局部空间射线。
     */
    rayWorldToLocal(worldRay: Ray3, localRay = new Ray3())
    {
        this.worldToLocalMatrix.transformRay(worldRay, localRay);
        return localRay;
    }

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        Object.assign(renderAtomic.uniforms, this._renderAtomic.uniforms);
    }

    private readonly _position = new Vector3();
    private readonly _rotation = new Vector3();
    private readonly _orientation = new Quaternion();
    private readonly _scale = new Vector3(1, 1, 1);

    protected readonly _matrix = new Matrix4x4();
    protected _matrixInvalid = false;

    protected readonly _rotationMatrix = new Matrix4x4();
    protected _rotationMatrixInvalid = false;

    protected readonly _localToWorldMatrix = new Matrix4x4();
    protected _localToWorldMatrixInvalid = false;

    protected readonly _ITlocalToWorldMatrix = new Matrix4x4();
    protected _ITlocalToWorldMatrixInvalid = false;

    protected readonly _worldToLocalMatrix = new Matrix4x4();
    protected _worldToLocalMatrixInvalid = false;

    protected readonly _localToWorldRotationMatrix = new Matrix4x4();
    protected _localToWorldRotationMatrixInvalid = false;

    private _renderAtomic = new RenderAtomic();

    private _positionChanged(newValue: number, oldValue: number, object: Vector3, property: string)
    {
        if (!Math.equals(newValue, oldValue))
            this._invalidateTransform();
    }

    private _rotationChanged(newValue: number, oldValue: number, object: Vector3, property: string)
    {
        if (!Math.equals(newValue, oldValue))
        {
            this._invalidateTransform();
            this._rotationMatrixInvalid = true;
        }
    }

    private _scaleChanged(newValue: number, oldValue: number, object: Vector3, property: string)
    {
        if (!Math.equals(newValue, oldValue))
            this._invalidateTransform();
    }

    private _invalidateTransform()
    {
        if (this._matrixInvalid) return;
        this._matrixInvalid = true;

        this.dispatch("transformChanged", this);
        this._invalidateSceneTransform();
    }

    private _invalidateSceneTransform()
    {
        if (this._localToWorldMatrixInvalid) return;

        this._localToWorldMatrixInvalid = true;
        this._worldToLocalMatrixInvalid = true;
        this._ITlocalToWorldMatrixInvalid = true;
        this._localToWorldRotationMatrixInvalid = true;

        this.dispatch("scenetransformChanged", this);
        //
        if (this.gameObject)
        {
            for (var i = 0, n = this.gameObject.numChildren; i < n; i++)
            {
                this.gameObject.getChildAt(i).transform._invalidateSceneTransform();
            }
        }
    }

    private _updateMatrix()
    {
        this._matrix.fromTRS(this._position, this._rotation, this._scale);
    }

    private _updateLocalToWorldMatrix()
    {
        this._localToWorldMatrix.copy(this.matrix);
        if (this.parent)
            this._localToWorldMatrix.append(this.parent.localToWorldMatrix);
        this.dispatch("updateLocalToWorldMatrix", this);
        console.assert(!isNaN(this._localToWorldMatrix.rawData[0]));
    }
}
