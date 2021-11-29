import { AssetType } from "../assets/AssetType";
import { Feng3dObject } from "../core/Feng3dObject";
import { oav } from "@feng3d/objectview";
import { serialize } from "@feng3d/serialization";
import { PropertyClip } from "./PropertyClip";

export class AnimationClip extends Feng3dObject
{
    readonly assetType = AssetType.anim;

    @oav()
    @serialize
    get name()
    {
        return this._name;
    }
    set name(v)
    {
        this._name = v;
    }
    protected _name: string = null;

    /**
     * 动画时长，单位ms
     */
    @serialize
    length: number;

    @oav()
    @serialize
    loop = true;

    @serialize
    propertyClips: PropertyClip[];
}
