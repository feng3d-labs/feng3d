import { Box3, Euler, Matrix4x4, Quaternion, Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { batchRun, computed, effect, reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Component, RegisterComponent } from '../component/Component';
import { Scene } from '../scene/Scene';

declare global
{
    export interface MixinsComponentMap
    {
        Transform: Transform;
    }
}

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        transform: BufferBinding<TransformUniforms>;
    }
}

/**
 * 变换
 *
 * 物体的位置、旋转和比例。
 *
 * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放
 */
@RegisterComponent()
@decoratorRegisterClass()
export class Transform extends Component
{
    __class__: 'Transform';

    get single() { return true; }

    beforeRender(renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformUniforms = (bindingResources.transform ||= { value: {} as TransformUniforms }).value as TransformUniforms;
        //
        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = this.localToWorldMatrix.value;
        r_transformUniforms.u_ITModelMatrix = this.ITlocalToWorldMatrix.value;
    }

    /**
     * 创建一个实体，该类为虚类
     */
    constructor()
    {
        super();

        // 监听世界变换矩阵变化，自动派发 scenetransformChanged 事件并向下传播。
        // 响应式系统已自动处理矩阵重算（localToWorldMatrix 为 computed），
        // 此 effect 仅负责事件通知，供 Camera / AudioListener / Billboard 等组件响应。
        effect(() =>
        {
            // 读取 .value 建立响应式依赖，矩阵变化时本 effect 会重新执行
            this.localToWorldMatrix.value;
            this._invalidateSceneTransform();
        });
    }

    /**
     * 使场景变换失效。
     *
     * 派发 `scenetransformChanged` 事件并递归传播到所有子物体（父级变换改变会影响所有后代的世界变换）。
     *
     * 响应式系统已自动处理矩阵缓存失效（computed 自动重算），
     * 此方法保留是为了兼容旧代码（GameObject/Billboard/HoldSize 等通过 `transform['_invalidateSceneTransform']()` 调用），
     * 并提供事件通知。
     */
    _invalidateSceneTransform()
    {
        this.emit('scenetransformChanged');

        // 向子物体传播（父级世界变换改变会影响所有后代）
        const gameObject = this._gameObject;
        if (gameObject)
        {
            for (let i = 0, n = gameObject.numChildren; i < n; i++)
            {
                gameObject.getChildAt(i).transform._invalidateSceneTransform();
            }
        }
    }

    /**
     * 世界坐标
     */
    get worldPosition()
    {
        return this.localToWorldMatrix.value.getPosition();
    }

    get parent()
    {
        const gameObject = this._gameObject;

        return gameObject && gameObject.parent && gameObject.parent.transform;
    }

    /**
     * 本地位移
     */
    @oav({ tooltip: '本地位移' })
    get position(): { readonly x: number; readonly y: number; readonly z: number }
    {
        return this._position;
    }
    set position(v: Vector3 | { x: number; y: number; z: number })
    {
        this.setPosition(v);
    }
    private _position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 位置 x 坐标
     */
    get x() { return this.position.x; }
    set x(v: number) { reactive(this.position).x = v; }

    /**
     * 位置 y 坐标
     */
    get y() { return this.position.y; }
    set y(v: number) { reactive(this.position).y = v; }

    /**
     * 位置 z 坐标
     */
    get z() { return this.position.z; }
    set z(v: number) { reactive(this.position).z = v; }

    setPosition(v: Vector3 | { x: number; y: number; z: number })
    {
        const r_position = reactive(this.position);
        batchRun(() =>
        {
            r_position.x = v.x;
            r_position.y = v.y;
            r_position.z = v.z;
        });
    }

    /**
     * 本地旋转
     */
    @oav({ tooltip: '本地旋转', component: 'OAVVector3', componentParam: { step: 0.001, stepScale: 30, stepDownup: 30 } })
    readonly rotation: { readonly x: number; readonly y: number; readonly z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 旋转 x 角度
     */
    get rx() { return this.rotation.x; }
    set rx(v: number) { reactive(this.rotation).x = v; }

    /**
     * 旋转 y 角度
     */
    get ry() { return this.rotation.y; }
    set ry(v: number) { reactive(this.rotation).y = v; }

    /**
     * 旋转 z 角度
     */
    get rz() { return this.rotation.z; }
    set rz(v: number) { reactive(this.rotation).z = v; }

    setRotation(v: Vector3 | { x: number; y: number; z: number })
    {
        const r_rotation = reactive(this.rotation);
        batchRun(() =>
        {
            r_rotation.x = v.x;
            r_rotation.y = v.y;
            r_rotation.z = v.z;
        });
    }

    /**
     * 本地缩放
     */
    @oav({ tooltip: '本地缩放' })
    readonly scale: { readonly x: number; readonly y: number; readonly z: number } = { x: 1, y: 1, z: 1 };

    setScale(v: Vector3 | { x: number; y: number; z: number })
    {
        const r_scale = reactive(this.scale);
        batchRun(() =>
        {
            r_scale.x = v.x;
            r_scale.y = v.y;
            r_scale.z = v.z;
        });
    }

    /**
     * 缩放 x 分量
     */
    get sx() { return this.scale.x; }
    set sx(v: number) { reactive(this.scale).x = v; }

    /**
     * 缩放 y 分量
     */
    get sy() { return this.scale.y; }
    set sy(v: number) { reactive(this.scale).y = v; }

    /**
     * 缩放 z 分量
     */
    get sz() { return this.scale.z; }
    set sz(v: number) { reactive(this.scale).z = v; }

    /**
     * 本地四元素旋转
     */
    readonly orientation = computed(() =>
    {
        const r_rotation = reactive(this.rotation);
        const { x, y, z } = r_rotation;

        const quaternion = new Quaternion().fromEuler(x, y, z);

        return quaternion;
    });

    setOrientation(quaternion: Quaternion)
    {
        const angles = new Euler().fromQuaternion(quaternion);

        //
        const r_rotation = reactive(this.rotation);

        batchRun(() =>
        {
            r_rotation.x = angles.x;
            r_rotation.y = angles.y;
            r_rotation.z = angles.z;
        });
    }

    /**
     * 本地变换矩阵
     */
    readonly matrix = computed(() =>
    {
        const r_position = reactive(this.position);
        const r_rotation = reactive(this.rotation);
        const r_scale = reactive(this.scale);

        const position = new Vector3(r_position.x, r_position.y, r_position.z);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);
        const scale = new Vector3(r_scale.x, r_scale.y, r_scale.z);

        const matrix = new Matrix4x4().fromTRS(position, rotation, scale);

        return matrix;
    });

    setMatrix(v: Matrix4x4)
    {
        const position = new Vector3();
        const rotation = new Vector3();
        const scale = new Vector3();
        v.toTRS(position, rotation, scale);

        //
        const r_position = reactive(this.position);
        const r_rotation = reactive(this.rotation);
        const r_scale = reactive(this.scale);

        batchRun(() =>
        {
            r_position.x = position.x;
            r_position.y = position.y;
            r_position.z = position.z;

            r_rotation.x = rotation.x;
            r_rotation.y = rotation.y;
            r_rotation.z = rotation.z;

            r_scale.x = scale.x;
            r_scale.y = scale.y;
            r_scale.z = scale.z;
        });
    }

    /**
     * 本地旋转矩阵
     */
    readonly rotationMatrix = computed(() =>
    {
        const r_rotation = reactive(this.rotation);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);

        const rotationMatrix = new Matrix4x4().setRotation(rotation);

        return rotationMatrix;
    });

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
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);

        const r_position = reactive(this.position);
        batchRun(() =>
        {
            r_position.x += x * len;
            r_position.y += y * len;
            r_position.z += z * len;
        });
    }

    translateLocal(axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        const matrix = this.matrix.value.clone();
        matrix.prependTranslation(x * len, y * len, z * len);
        const p = matrix.getPosition();

        const r_position = reactive(this.position);
        batchRun(() =>
        {
            r_position.x = p.x;
            r_position.y = p.y;
            r_position.z = p.z;
        });
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
        const r_rotation = reactive(this.rotation);
        batchRun(() =>
        {
            r_rotation.x = ax;
            r_rotation.y = ay;
            r_rotation.z = az;
        });
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
        // 转换位移
        const positionMatrix = Matrix4x4.fromPosition(this.position.x, this.position.y, this.position.z);
        positionMatrix.appendRotation(axis, angle, pivotPoint);
        const position = positionMatrix.getPosition();

        // 转换旋转
        const rx = this.rotation.x;
        const ry = this.rotation.y;
        const rz = this.rotation.z;

        const rotationMatrix = Matrix4x4.fromRotation(rx, ry, rz);
        rotationMatrix.appendRotation(axis, angle, pivotPoint);
        const newrotation = rotationMatrix.toTRS()[1];
        const v = Math.round((newrotation.x - rx) / 180);
        if (v % 2 !== 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }
        //
        const toRound = (a: number, b: number, c = 360) =>
            Math.round((b - a) / c) * c + a;
        newrotation.x = toRound(newrotation.x, rx);
        newrotation.y = toRound(newrotation.y, ry);
        newrotation.z = toRound(newrotation.z, rz);

        const r_position = reactive(this.position);
        const r_rotation = reactive(this.rotation);
        batchRun(() =>
        {
            r_position.x = position.x;
            r_position.y = position.y;
            r_position.z = position.z;

            r_rotation.x = newrotation.x;
            r_rotation.y = newrotation.y;
            r_rotation.z = newrotation.z;
        });
    }

    /**
     * 看向目标位置
     *
     * @param target    目标位置
     * @param upAxis    向上朝向
     */
    lookAt(target: Vector3, upAxis?: Vector3)
    {
        const matrix = this.matrix.value.clone();
        matrix.lookAt(target, upAxis);

        this.setMatrix(matrix);
    }

    /**
     * 将一个点从局部空间变换到世界空间的矩阵。
     */
    readonly localToWorldMatrix = computed(() =>
    {
        if (this.parent)
        {
            return this.parent.localToWorldMatrix.value.clone().append(this.matrix.value);
        }

        return this.matrix.value.clone();
    });

    setLocalToWorldMatrix(value: Matrix4x4)
    {
        value = value.clone();
        this.parent && value.append(this.parent.worldToLocalMatrix.value);
        this.setMatrix(value);
    }

    /**
     * 本地转世界逆转置矩阵
     */
    readonly ITlocalToWorldMatrix = computed(() =>
    {
        const matrix = this.localToWorldMatrix.value.clone().invert().transpose();
        return matrix;
    });

    /**
     * 将一个点从世界空间转换为局部空间的矩阵。
     */
    readonly worldToLocalMatrix = computed(() =>
    {
        const matrix = this.localToWorldMatrix.value.clone().invert();

        return matrix;
    });

    readonly localToWorldRotationMatrix = computed(() =>
    {
        const matrix = this.rotationMatrix.value.clone();
        if (this.parent)
        {
            matrix.append(this.parent.localToWorldRotationMatrix.value);
        }
        return matrix;
    });

    readonly worldToLocalRotationMatrix = computed(() =>
    {
        const matrix = this.localToWorldRotationMatrix.value.clone().invert();
        return matrix;
    });

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
        {
            return direction.clone();
        }
        const matrix = this.parent.localToWorldRotationMatrix.value;
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
        {
            return out.copy(box);
        }
        const matrix = this.parent.localToWorldMatrix.value;
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
        {
            return position.clone();
        }
        position = this.parent.localToWorldMatrix.value.transformPoint3(position);

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
        {
            return vector.clone();
        }
        const matrix = this.parent.localToWorldMatrix.value;
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
        direction = this.worldToLocalDirection(direction);

        return direction;
    }

    /**
     * 将一个方向从世界空间转换到局部空间。
     */
    worldToLocalDirection(direction: Vector3)
    {
        if (!this.parent)
        {
            return direction.clone();
        }
        const matrix = this.parent.localToWorldRotationMatrix.value.clone().invert();
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
        {
            return out.copy(position);
        }
        position = this.parent.worldToLocalMatrix.value.transformPoint3(position, out);

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
        {
            return vector.clone();
        }
        vector = this.parent.worldToLocalMatrix.value.transformVector3(vector);

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
        this.worldToLocalMatrix.value.transformRay(worldRay, localRay);

        return localRay;
    }
}
