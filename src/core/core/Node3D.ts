import { Euler } from '../../math/geom/Euler';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Quaternion } from '../../math/geom/Quaternion';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { mathUtil } from '../../polyfill/MathUtil';
import { gPartial } from '../../polyfill/Types';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Serializable } from '../../serialization/Serializable';
import { serialization } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { watcher } from '../../watcher/watcher';
import { AssetType } from '../assets/AssetType';
import { Camera } from '../cameras/Camera';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Scene } from '../scene/Scene';
import { BoundingBox } from './BoundingBox';
import { Node, NodeEventMap } from './Node';
import { HideFlags } from './HideFlags';
import { MeshRenderer } from './MeshRenderer';
import { MouseEventMap } from './Mouse3DManager';
import { ScriptComponent } from './ScriptComponent';

declare global
{
    interface MixinsNode3DEventMap { }
    interface MixinsPrimitiveNode3D { }
}

export interface Node3DEventMap extends NodeEventMap, MixinsNode3DEventMap, MouseEventMap
{
    /**
     * 本地矩阵发生变化
     */
    matrixChanged: Node3D;

    /**
     *
     */
    updateGlobalMatrix: Node3D;

    /**
     * 全局矩阵发生变化
     */
    globalMatrixChanged: Node3D;

    /**
     * 当Object3D的scene属性被设置是由Scene派发
     */
    addedToScene: Node3D;

    /**
     * 当Object3D的scene属性被清空时由Scene派发
     */
    removedFromScene: Node3D;

    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;
}

export interface Node3D
{
    /**
     * 父对象
     */
    get parent(): Node3D;

    /**
     * 子对象列表
     */
    get children(): Node3D[];
    set children(v: Node3D[]);

    /**
     * 获取指定位置的子对象
     *
     * @param index 子对象位置。
     */
    getChildAt(index: number): Node3D;

    /**
     * 根据名称查找对象
     *
     * @param name 对象名称
     */
    find(name: string): Node3D;
}

/**
 * 3D结点
 * 
 * 用于构建3D场景树结构，处理3D对象的位移旋转缩放等空间数据。
 */
@Serializable()
export class Node3D extends Node<Node3DEventMap>
{
    __class__: 'Node3D';

    declare protected _parent: Node3D;
    declare protected _children: Node3D[];

    /**
     * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
     */
    @SerializeProperty()
    hideFlags = HideFlags.None;

    assetType = AssetType.node3d;

    /**
     * The tag of this game object.
     */
    @SerializeProperty()
    tag: string;

    /**
     * 预设资源编号
     */
    @SerializeProperty()
    prefabId: string;

    /**
     * 资源编号
     */
    @SerializeProperty()
    assetId: string;

    /**
     * 世界坐标
     */
    get worldPosition()
    {
        return this.globalMatrix.getPosition();
    }

    /**
     * X轴坐标。
     */
    @SerializeProperty()
    get x() { return this._position.x; }
    set x(v) { this._position.x = v; }

    /**
     * Y轴坐标。
     */
    @SerializeProperty()
    get y() { return this._position.y; }
    set y(v) { this._position.y = v; }

    /**
     * Z轴坐标。
     */
    @SerializeProperty()
    get z() { return this._position.z; }
    set z(v) { this._position.z = v; }

    /**
     * X轴旋转角度。
     */
    @SerializeProperty()
    get rx() { return this._rotation.x; }
    set rx(v) { this._rotation.x = v; }

    /**
     * Y轴旋转角度。
     */
    @SerializeProperty()
    get ry() { return this._rotation.y; }
    set ry(v) { this._rotation.y = v; }

    /**
     * Z轴旋转角度。
     */
    @SerializeProperty()
    get rz() { return this._rotation.z; }
    set rz(v) { this._rotation.z = v; }

    /**
     * X轴缩放。
     */
    @SerializeProperty()
    get sx() { return this._scale.x; }
    set sx(v) { this._scale.x = v; }

    /**
     * Y轴缩放。
     */
    @SerializeProperty()
    get sy() { return this._scale.y; }
    set sy(v) { this._scale.y = v; }

    /**
     * Z轴缩放。
     */
    @SerializeProperty()
    get sz() { return this._scale.z; }
    set sz(v) { this._scale.z = v; }

    /**
     * 本地位移
     */
    @oav({ priority: -1, tooltip: '本地位移' })
    get position() { return this._position; }
    set position(v) { this._position.copy(v); }

    /**
     * 本地旋转
     */
    @oav({ priority: -1, tooltip: '本地旋转', component: 'OAVVector3', componentParam: { step: 0.001, stepScale: 30, stepDownUp: 30 } })
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation.copy(v); }

    /**
     * 本地缩放
     */
    @oav({ priority: -1, tooltip: '本地缩放' })
    get scale() { return this._scale; }
    set scale(v) { this._scale.copy(v); }

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
        const angles = new Euler().fromQuaternion(value);
        this.rotation = new Vector3(angles.x, angles.y, angles.z);
    }

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
        this._matrix.fromArray(v.elements);
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

    /**
     * 看向目标位置
     *
     * @param target    目标位置
     * @param upAxis    向上朝向
     */
    lookAt(target: Vector3, upAxis?: Vector3)
    {
        const matrix = this.matrix;
        matrix.lookAt(target, upAxis);
        this.matrix = matrix;
    }

    /**
     * 全局矩阵，表示3D对象相对于全局空间的变换。
     */
    get globalMatrix()
    {
        if (this._globalMatrixInvalid)
        {
            this._globalMatrixInvalid = false;
            this._updateGlobalMatrix();
        }

        return this._globalMatrix;
    }

    set globalMatrix(value)
    {
        value = value.clone();
        this.parent && value.append(this.parent.globalInvertMatrix);
        this.matrix = value;
    }

    /**
     * 全局法线矩阵，全局矩阵的逆矩阵的转置矩阵。
     */
    get globalNormalMatrix()
    {
        if (this._globalNormalMatrixInvalid)
        {
            this._globalNormalMatrixInvalid = false;
            this._globalNormalMatrix.copy(this.globalMatrix);
            this._globalNormalMatrix.invert().transpose();
        }

        return this._globalNormalMatrix;
    }

    /**
     * 全局逆变换矩阵。
     */
    get globalInvertMatrix()
    {
        if (this._globalInvertMatrixInvalid)
        {
            this._globalInvertMatrixInvalid = false;
            this._globalInvertMatrix.copy(this.globalMatrix).invert();
        }

        return this._globalInvertMatrix;
    }

    /**
     * 全局旋转矩阵。
     */
    get globalRotationMatrix()
    {
        if (this._globalRotationMatrixInvalid)
        {
            this._globalRotationMatrix.copy(this.rotationMatrix);
            if (this.parent)
            {
                this._globalRotationMatrix.append(this.parent.globalRotationMatrix);
            }

            this._globalRotationMatrixInvalid = false;
        }

        return this._globalRotationMatrix;
    }

    /**
     * 全局旋转矩阵的逆矩阵。
     */
    get globalRotationInvertMatrix()
    {
        const mat = this.globalRotationMatrix.clone();
        mat.invert();

        return mat;
    }

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.u_modelMatrix = () => this.globalMatrix;
        renderAtomic.uniforms.u_ITModelMatrix = () => this.globalNormalMatrix;
    }

    private readonly _position = new Vector3();
    private readonly _rotation = new Vector3();
    private readonly _orientation = new Quaternion();
    private readonly _scale = new Vector3(1, 1, 1);

    protected readonly _matrix = new Matrix4x4();
    protected _matrixInvalid = false;

    protected readonly _rotationMatrix = new Matrix4x4();
    protected _rotationMatrixInvalid = false;

    protected readonly _globalMatrix = new Matrix4x4();
    protected _globalMatrixInvalid = false;

    protected readonly _globalNormalMatrix = new Matrix4x4();
    protected _globalNormalMatrixInvalid = false;

    protected readonly _globalInvertMatrix = new Matrix4x4();
    protected _globalInvertMatrixInvalid = false;

    protected readonly _globalRotationMatrix = new Matrix4x4();
    protected _globalRotationMatrixInvalid = false;

    private _positionChanged(newValue: number, oldValue: number, _object: Vector3, _property: string)
    {
        if (!mathUtil.equals(newValue, oldValue))
        {
            this._invalidateMatrix();
        }
    }

    private _rotationChanged(newValue: number, oldValue: number, _object: Vector3, _property: string)
    {
        if (!mathUtil.equals(newValue, oldValue))
        {
            this._invalidateMatrix();
            this._rotationMatrixInvalid = true;
        }
    }

    private _scaleChanged(newValue: number, oldValue: number, _object: Vector3, _property: string)
    {
        if (!mathUtil.equals(newValue, oldValue))
        {
            this._invalidateMatrix();
        }
    }

    private _invalidateMatrix()
    {
        if (this._matrixInvalid) return;
        this._matrixInvalid = true;

        this.emit('matrixChanged', this);
        this._invalidateGlobalMatrix();
    }

    private _invalidateGlobalMatrix()
    {
        if (this._globalMatrixInvalid) return;

        this._globalMatrixInvalid = true;
        this._globalInvertMatrixInvalid = true;
        this._globalNormalMatrixInvalid = true;
        this._globalRotationMatrixInvalid = true;

        this.emit('globalMatrixChanged', this);
        //
        for (let i = 0, n = this.numChildren; i < n; i++)
        {
            this.getChildAt(i)._invalidateGlobalMatrix();
        }
    }

    private _updateMatrix()
    {
        this._matrix.fromTRS(this._position, this._rotation, this._scale);
    }

    private _updateGlobalMatrix()
    {
        this._globalMatrix.copy(this.matrix);
        if (this.parent)
        {
            this._globalMatrix.append(this.parent.globalMatrix);
        }
        this.emit('updateGlobalMatrix', this);
        console.assert(!isNaN(this._globalMatrix.elements[0]));
    }

    /**
     * 轴对称包围盒
     */
    get boundingBox()
    {
        if (!this._boundingBox)
        {
            this._boundingBox = new BoundingBox(this);
        }

        return this._boundingBox;
    }
    private _boundingBox: BoundingBox;

    get scene()
    {
        return this._scene;
    }

    // ------------------------------------------
    // Functions
    // ------------------------------------------
    /**
     * 构建3D对象
     */
    constructor()
    {
        super();
        this.name = 'Object3D';

        watcher.watch(this._position, 'x', this._positionChanged, this);
        watcher.watch(this._position, 'y', this._positionChanged, this);
        watcher.watch(this._position, 'z', this._positionChanged, this);
        watcher.watch(this._rotation, 'x', this._rotationChanged, this);
        watcher.watch(this._rotation, 'y', this._rotationChanged, this);
        watcher.watch(this._rotation, 'z', this._rotationChanged, this);
        watcher.watch(this._scale, 'x', this._scaleChanged, this);
        watcher.watch(this._scale, 'y', this._scaleChanged, this);
        watcher.watch(this._scale, 'z', this._scaleChanged, this);
    }

    /**
     * 添加脚本
     * @param scriptName   脚本路径
     */
    addScript(scriptName: string)
    {
        const scriptComponent = new ScriptComponent();
        scriptComponent.scriptName = scriptName;
        this.addComponentAt(scriptComponent, this._components.length);

        return scriptComponent;
    }

    /**
     * 是否加载完成
     */
    get isSelfLoaded()
    {
        const model = this.getComponent(MeshRenderer);
        if (model) return model.isLoaded;

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onSelfLoadCompleted(callback: () => void)
    {
        if (this.isSelfLoaded)
        {
            callback();

            return;
        }
        const model = this.getComponent(MeshRenderer);
        if (model)
        {
            model.onLoadCompleted(callback);
        }
        else callback();
    }

    /**
     * 是否加载完成
     */
    get isLoaded()
    {
        if (!this.isSelfLoaded) return false;
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i] as Node3D;
            if (!element.isLoaded) return false;
        }

        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        let loadingNum = 0;
        if (!this.isSelfLoaded)
        {
            loadingNum++;
            this.onSelfLoadCompleted(() =>
            {
                loadingNum--;
                if (loadingNum === 0) callback();
            });
        }
        for (let i = 0; i < this.children.length; i++)
        {
            const element = this.children[i];
            if (!element.isLoaded)
            {
                loadingNum++;
                // eslint-disable-next-line no-loop-func
                element.onLoadCompleted(() =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }

    protected _scene: Scene;

    protected _setParent(value: Node3D | null)
    {
        super._setParent(value);
        this.updateScene();
        this._invalidateGlobalMatrix();
    }

    private updateScene()
    {
        const newScene = this._parent ? this._parent._scene : null;
        if (this._scene === newScene)
        {
            return;
        }
        if (this._scene)
        {
            this.emit('removedFromScene', this);
        }
        this._scene = newScene;
        if (this._scene)
        {
            this.emit('addedToScene', this);
        }
        this.updateChildrenScene();
    }

    private updateChildrenScene()
    {
        for (let i = 0, n = this._children.length; i < n; i++)
        {
            this._children[i].updateScene();
        }
    }

    /**
     * 创建指定类型的游戏对象。
     *
     * @param type 游戏对象类型。
     * @param param 游戏对象参数。
     */
    static createPrimitive<K extends keyof PrimitiveObject3D>(type: K, param?: gPartial<Node3D>)
    {
        const g = new Node3D();
        g.name = type;

        const createHandler = this._registerPrimitives[type];
        if (createHandler) createHandler(g);

        serialization.setValue(g, param);

        return g;
    }

    /**
     * 注册原始游戏对象，被注册后可以使用 Object3D.createPrimitive 进行创建。
     *
     * @param type 原始游戏对象类型。
     * @param handler 构建原始游戏对象的函数。
     */
    static registerPrimitive<K extends keyof PrimitiveObject3D>(type: K, handler: (object3D: Node3D) => void)
    {
        if (this._registerPrimitives[type])
        {
            console.warn(`重复注册原始游戏对象 ${type} ！`);
        }
        this._registerPrimitives[type] = handler;
    }
    static _registerPrimitives: { [type: string]: (object3D: Node3D) => void } = {};
}

/**
 * 原始游戏对象，可以通过Object3D.createPrimitive进行创建。
 */
export interface PrimitiveObject3D extends MixinsPrimitiveNode3D
{
}

// 在 Hierarchy 界面右键创建游戏
createNodeMenu.push(
    {
        path: 'Create Empty',
        click: () =>
            new Node3D()
    },
);
