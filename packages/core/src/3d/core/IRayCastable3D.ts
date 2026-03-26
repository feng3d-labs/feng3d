import { Box3 } from '@feng3d/math';
import { Ray3 } from '@feng3d/math';
import { PickingCollisionVO } from '../raycast/rayCast3D';

export interface IRayCastable3D
{
    get localBounds(): Box3;

    get globalBounds(): Box3;

    globalRayIntersection(globalRay: Ray3): PickingCollisionVO
}
