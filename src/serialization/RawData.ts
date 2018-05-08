namespace feng3d
{
    export class RawData
    {
        createGameObject(raw: GameObjectRaw): GameObject
        {
            return this.create(raw);
        }

        create(raw: GameObjectRaw): GameObject
        // create(raw: TransformRaw): Transform
        // create(raw: MeshRendererRaw): MeshRenderer
        // create(raw: CubeGeometryRaw): CubeGeometry
        create(raw: Object)
        {
            var result = serialization.deserialize(raw);
            return result;
        }
    }

    export var rawData = new RawData();

    export type GeometryRaw =
        SegmentGeometryRaw
        | PlaneGeometryRaw
        | CubeGeometryRaw
        | SphereGeometryRaw
        | CapsuleGeometryRaw
        | CylinderGeometryRaw
        | ConeGeometryRaw
        | TorusGeometryRaw
        ;

    export interface TransformRaw
    {
        __class__: "feng3d.Transform";
        rx?: number;
        ry?: number;
        rz?: number;
        sx?: number;
        sy?: number;
        sz?: number;
        x?: number;
        y?: number;
        z?: number;
    }

    export interface MeshRendererRaw
    {
        __class__: "feng3d.MeshRenderer",
        geometry?: GeometryRaw,
        material?: MaterialRaw;
    }

    //-------------------------
    // 几何体
    //-------------------------

    export interface SegmentGeometryRaw
    {
        __class__: "feng3d.SegmentGeometry"
    }

    export interface CubeGeometryRaw
    {
        __class__: "feng3d.CubeGeometry";
        depth?: number,
        height?: number,
        segmentsD?: number,
        segmentsH?: number,
        segmentsW?: number,
        tile6?: boolean,
        width?: number
    }

    export interface PlaneGeometryRaw
    {
        __class__: "feng3d.PlaneGeometry",
        height?: number,
        segmentsH?: number,
        segmentsW?: number,
        width?: number,
        yUp?: boolean
    }

    export interface SphereGeometryRaw
    {
        __class__: "feng3d.SphereGeometry",
        radius?: number,
        segmentsH?: number,
        segmentsW?: number,
        yUp?: boolean
    }

    export interface CapsuleGeometryRaw
    {
        __class__: "feng3d.CapsuleGeometry",
        height?: number,
        radius?: number,
        segmentsH?: number,
        segmentsW?: number,
        yUp?: boolean
    }

    export interface CylinderGeometryRaw
    {
        __class__: "feng3d.CylinderGeometry",
        bottomClosed?: boolean,
        bottomRadius?: number,
        height?: number,
        segmentsH?: number,
        segmentsW?: number,
        surfaceClosed?: boolean,
        topClosed?: boolean,
        topRadius?: number,
        yUp?: boolean
    }

    export interface ConeGeometryRaw
    {
        __class__: "feng3d.ConeGeometry",
        bottomClosed?: boolean,
        bottomRadius?: number,
        height?: number,
        segmentsH?: number,
        segmentsW?: number,
        surfaceClosed?: boolean,
        topClosed?: boolean,
        topRadius?: number,
        yUp?: boolean
    }

    export interface TorusGeometryRaw
    {
        "__class__": "feng3d.TorusGeometry",
        radius?: 50,
        segmentsR?: 16,
        segmentsT?: 8,
        tubeRadius?: 10,
        yUp?: true
    }

    //-------------------------
    // 材质
    //-------------------------
    export interface Color3Raw
    {
        __class__: "feng3d.Color3",
        b?: number,
        g?: number,
        r?: number
    }

    export interface Color4Raw
    {
        __class__?: "feng3d.Color4",
        a?: number,
        b?: number,
        g?: number,
        r?: number
    }

    export interface Vector3DRaw
    {
        __class__: "feng3d.Vector3",
        x?: number,
        y?: number,
        z?: number,
        w?: number
    }

    export interface Texture2DRaw extends TextureInfoRaw
    {
        __class__?: "feng3d.Texture2D",
        url?: "",
    }

    export interface TerrainMethodRaw
    {
        __class__: "feng3d.TerrainMethod";
        splatRepeats?: Vector3;
        splatTexture1: Texture2DRaw
        splatTexture2: Texture2DRaw
        splatTexture3: Texture2DRaw
    }

    export interface TextureCubeRaw extends TextureInfoRaw
    {
        __class__: "feng3d.TextureCube",
        negative_x_url?: string,
        negative_y_url?: string,
        negative_z_url?: string,
        positive_x_url?: string,
        positive_y_url?: string,
        positive_z_url?: string,
    }

    export type ValueOf<T> = T[keyof T];
}