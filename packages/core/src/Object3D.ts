export interface Object3D
{
    readonly position?: { readonly x: number, readonly y: number, readonly z: number };
    /** 旋转角度（使用弧度表示） */
    readonly rotation: { readonly x: number, readonly y: number, readonly z: number };
}