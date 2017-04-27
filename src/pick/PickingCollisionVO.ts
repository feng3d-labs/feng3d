module feng3d
{
    export class PickingCollisionVO
    {
        public entity: GameObject;
        public localPosition: Vector3D;
        public localNormal: Vector3D;
        public uv: Point;
        public index: number = 0;
        public subGeometryIndex: number = 0;
        public localRayPosition: Vector3D;
        public localRayDirection: Vector3D;
        public rayPosition: Vector3D;
        public rayDirection: Vector3D;
        public rayOriginIsInsideBounds: boolean = false;
        public rayEntryDistance: number = NaN;
        public renderable: Model;

        public constructor(entity: GameObject)
        {
            this.entity = entity;
        }

    }
}

