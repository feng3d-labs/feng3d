import { Box3 } from '../../math/geom/Box3';
import { Ray3 } from '../../math/geom/Ray3';
import { PickingCollisionVO } from '../../3d/raycast/rayCast3D';

export interface IRayCastable
{
    get localBounds(): Box3;

    get worldBounds(): Box3;

    worldRayIntersection(worldRay: Ray3): PickingCollisionVO
}
