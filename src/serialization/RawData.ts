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

    export interface MeshRendererRaw
    {
        __class__: "feng3d.MeshRenderer",
        geometry?: GeometryRaw,
        material?: MaterialRaw;
    }

    //-------------------------
    // 几何体
    //-------------------------



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



    export type ValueOf<T> = T[keyof T];
}