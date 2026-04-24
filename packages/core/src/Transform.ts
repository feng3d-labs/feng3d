import { reactive } from "@feng3d/reactivity";
import { Component } from "./Component";

export class Transform extends Component
{
    readonly position: { readonly x: number, readonly y: number, readonly z: number } = { x: 0, y: 0, z: 0 };

    /** 旋转角度（使用弧度表示） */
    readonly rotation: { readonly x: number, readonly y: number, readonly z: number } = { x: 0, y: 0, z: 0 };
}

const t = new Transform();
reactive(t.position).x = 1;