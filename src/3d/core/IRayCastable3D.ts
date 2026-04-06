import { Box3 } from '../../math/geom/Box3';
import { Ray3 } from '../../math/geom/Ray3';
import { PickingCollisionVO } from '../raycast/rayCast3D';

export interface IRayCastable3D
{
    get localBounds(): Box3;

    get globalBounds(): Box3;

    globalRayIntersection(globalRay: Ray3): PickingCollisionVO
}
