import * as _feng3d_plugins_cannon from '@feng3d-plugins/cannon';
import { Shape, Box, Trimesh, Body, DistanceConstraint, Cylinder, World, Plane, Sphere } from '@feng3d-plugins/cannon';
import { Component, Renderable, RunEnvironment, Behaviour, Vector3, GameObject } from 'feng3d';

declare global {
    export interface MixinsComponentMap {
        Collider: Collider;
    }
}
/**
 * 碰撞体
 */
declare class Collider extends Component {
    get shape(): Shape;
    protected _shape: Shape;
}

declare global {
    export interface MixinsComponentMap {
        BoxCollider: BoxCollider;
    }
}
interface BoxCollider {
    get shape(): Box;
}
/**
 * 长方体碰撞体
 */
declare class BoxCollider extends Collider {
    /**
     * 宽度
     */
    width: number;
    /**
     * 高度
     */
    height: number;
    /**
     * 深度
     */
    depth: number;
    protected _shape: Box;
    init(): void;
}

declare global {
    export interface MixinsComponentMap {
        CapsuleCollider: CapsuleCollider;
    }
}
interface CapsuleCollider {
    get shape(): Trimesh;
}
/**
 * 胶囊体碰撞体
 */
declare class CapsuleCollider extends Collider {
    /**
     * 胶囊体半径
     */
    get radius(): number;
    set radius(v: number);
    private _radius;
    /**
     * 胶囊体高度
     */
    get height(): number;
    set height(v: number);
    private _height;
    /**
     * 横向分割数
     */
    get segmentsW(): number;
    set segmentsW(v: number);
    private _segmentsW;
    /**
     * 纵向分割数
     */
    get segmentsH(): number;
    set segmentsH(v: number);
    private _segmentsH;
    /**
     * 正面朝向 true:Y+ false:Z+
     */
    get yUp(): boolean;
    set yUp(v: boolean);
    private _yUp;
    init(): void;
    private invalidateGeometry;
}

declare global {
    export interface MixinsComponentMap {
        Cloth: Cloth;
    }
}
declare class Cloth extends Renderable {
    runEnvironment: RunEnvironment;
    particles: Body[][];
    constraints: DistanceConstraint[];
    init(): void;
    update(): void;
}

declare global {
    export interface MixinsComponentMap {
        CylinderCollider: CylinderCollider;
    }
}
interface CylinderCollider {
    get shape(): Cylinder;
}
/**
 * 圆柱体碰撞体
 */
declare class CylinderCollider extends Collider {
    /**
     * 顶部半径
     */
    topRadius: number;
    /**
     * 底部半径
     */
    bottomRadius: number;
    /**
     * 高度
     */
    height: number;
    /**
     * 横向分割数
     */
    segmentsW: number;
    init(): void;
}

declare global {
    export interface MixinsComponentMap {
        PhysicsWorld: PhysicsWorld;
    }
}
/**
 * 物理世界组件
 */
declare class PhysicsWorld extends Behaviour {
    runEnvironment: RunEnvironment;
    /**
     * 物理世界
     */
    world: World<_feng3d_plugins_cannon.WorldEventMap>;
    /**
     * 重力加速度
     */
    gravity: Vector3;
    init(): void;
    private _isInit;
    private initWorld;
    private onAddComponent;
    private onRemovedComponent;
    private onAddChild;
    private onRemoveChild;
    update(interval?: number): void;
}

declare global {
    export interface MixinsComponentMap {
        PlaneCollider: PlaneCollider;
    }
}
interface PlaneCollider {
    get shape(): Plane;
}
/**
 * 平面碰撞体
 */
declare class PlaneCollider extends Collider {
    init(): void;
}

declare global {
    export interface MixinsComponentMap {
        Rigidbody: Rigidbody;
    }
}
/**
 * 刚体
 */
declare class Rigidbody extends Behaviour {
    __class__: 'physics.Rigidbody';
    body: Body<_feng3d_plugins_cannon.BodyEventMap>;
    runEnvironment: RunEnvironment;
    get mass(): number;
    set mass(v: number);
    init(): void;
    private _onTransformChanged;
    /**
     * 每帧执行
     */
    update(_interval?: number): void;
}

declare global {
    export interface MixinsComponentMap {
        SphereCollider: SphereCollider;
    }
}
interface SphereCollider {
    get shape(): Sphere;
}
/**
 * 球形碰撞体
 */
declare class SphereCollider extends Collider {
    /**
     * 半径
     */
    get radius(): number;
    set radius(v: number);
    private _radius;
    init(): void;
}

interface PrimitiveGameObject {
    Cloth: GameObject;
}

export { BoxCollider, CapsuleCollider, Cloth, Collider, CylinderCollider, PhysicsWorld, PlaneCollider, PrimitiveGameObject, Rigidbody, SphereCollider };
export as namespace feng3d;
