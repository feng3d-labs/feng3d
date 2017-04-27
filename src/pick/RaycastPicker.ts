module feng3d
{
    export class RaycastPicker implements IPicker
    {
        public static tempRayPosition: Vector3D;
        public static tempRayDirection: Vector3D;
        private _findClosestCollision: boolean = false;
        private _raycastCollector: RaycastCollector = new RaycastCollector();
        private _ignoredEntities: Array<any> = new Array();
        private _onlyMouseEnabled: boolean = true;
        protected _entities: Array<GameObject>;
        protected _numEntities: number = 0;
        protected _hasCollisions: boolean = false;
        public get onlyMouseEnabled(): boolean
        {
            return this._onlyMouseEnabled;
        }

        public set onlyMouseEnabled(value: boolean)
        {
            this._onlyMouseEnabled = value;
        }


        public constructor(findClosestCollision: boolean)
        {
            this._findClosestCollision = findClosestCollision;
            this._entities = new Array<GameObject>();
        }

        public getViewCollision(x: number, y: number, view: View3D): PickingCollisionVO
        {
            var collector: EntityCollector = <any>view.entityCollector;
            if (collector.numMouseEnableds == 0)
                return null;
            var rayPosition: Vector3D = view.unproject(x, y, 0, RaycastPicker.tempRayPosition);
            var rayDirection: Vector3D = view.unproject(x, y, 1, RaycastPicker.tempRayDirection);
            rayDirection.x = rayDirection.x - rayPosition.x;
            rayDirection.y = rayDirection.y - rayPosition.y;
            rayDirection.z = rayDirection.z - rayPosition.z;
            this._numEntities = 0;
            var node: EntityListItem = <any>collector.entityHead;
            var entity: GameObject;
            while (node)
            {
                entity = node.entity;
                if (this.isIgnored(entity))
                {
                    node = node.next;
                    continue;
                }
                if (entity.isVisible && entity.isIntersectingRay(rayPosition, rayDirection))
                    this._entities[this._numEntities++] = entity;
                node = node.next;
            }
            if (<any>!this._numEntities)
                return null;
            return this.getPickingCollisionVO();
        }

        public getSceneCollision(position: Vector3D, direction: Vector3D, scene: Scene3D): PickingCollisionVO
        {
            this._raycastCollector.clear();
            this._raycastCollector.rayPosition = position;
            this._raycastCollector.rayDirection = direction;
            scene.traversePartitions(this._raycastCollector);
            this._numEntities = 0;
            var node: EntityListItem = <any>this._raycastCollector.entityHead;
            var entity: GameObject;
            while (node)
            {
                entity = node.entity;
                if (this.isIgnored(entity))
                {
                    node = node.next;
                    continue;
                }
                this._entities[this._numEntities++] = entity;
                node = node.next;
            }
            if (<any>!this._numEntities)
                return null;
            return this.getPickingCollisionVO();
        }

        public getEntityCollision(position: Vector3D, direction: Vector3D, entities: Array<GameObject>): PickingCollisionVO
        {
            position = position;
            direction = direction;
            this._numEntities = 0;
            var entity: GameObject;
            var entity_key_a;
            for (entity_key_a in entities)
            {
                entity = entities[entity_key_a];
                if (entity.isIntersectingRay(position, direction))
                    this._entities[this._numEntities++] = entity;
            }
            return this.getPickingCollisionVO();
        }

        public setIgnoreList(entities: Array<any>)
        {
            this._ignoredEntities = entities;
        }

        private isIgnored(entity: GameObject): boolean
        {
            if (this._onlyMouseEnabled && (<any>!entity._ancestorsAllowMouseEnabled || <any>!entity.mouseEnabled))
                return true;
            var ignoredEntity: GameObject;
            var ignoredEntity_key_a;
            for (ignoredEntity_key_a in this._ignoredEntities)
            {
                ignoredEntity = this._ignoredEntities[ignoredEntity_key_a];
                if (ignoredEntity == entity)
                    return true;
            }
            return false;
        }

        private sortOnNearT(entity1: GameObject, entity2: GameObject): number
        {
            return entity1.pickingCollisionVO["rayEntryDistance"] > entity2.pickingCollisionVO["rayEntryDistance"] ? 1 : -1;
        }

        private getPickingCollisionVO(): PickingCollisionVO
        {
            this._entities.length = this._numEntities;
            this._entities = this._entities.sort(this.sortOnNearT.bind(this));
            var shortestCollisionDistance: number = Number.MAX_VALUE;
            var bestCollisionVO: PickingCollisionVO;
            var pickingCollisionVO: PickingCollisionVO;
            var entity: GameObject;
            var i: number;
            for (i = 0; i < this._numEntities; ++i)
            {
                entity = this._entities[i];
                pickingCollisionVO = entity._pickingCollisionVO;
                if (entity.pickingCollider)
                {
                    if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && entity.collidesBefore(shortestCollisionDistance, this._findClosestCollision))
                    {
                        shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                        bestCollisionVO = pickingCollisionVO;
                        if (<any>!this._findClosestCollision)
                        {
                            this.updateLocalPosition(pickingCollisionVO);
                            return pickingCollisionVO;
                        }
                    }
                }
                else if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance)
                {
                    if (<any>!pickingCollisionVO.rayOriginIsInsideBounds)
                    {
                        this.updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }
            return bestCollisionVO;
        }

        private updateLocalPosition(pickingCollisionVO: PickingCollisionVO)
        {
            var collisionPos: Vector3D = pickingCollisionVO.localPosition = pickingCollisionVO.localPosition || new Vector3D();
            var rayDir: Vector3D = pickingCollisionVO.localRayDirection;
            var rayPos: Vector3D = pickingCollisionVO.localRayPosition;
            var t: number = pickingCollisionVO.rayEntryDistance;
            collisionPos.x = rayPos.x + t * rayDir.x;
            collisionPos.y = rayPos.y + t * rayDir.y;
            collisionPos.z = rayPos.z + t * rayDir.z;
        }

        public dispose()
        {
        }
    }
    RaycastPicker.tempRayPosition = new Vector3D();
    RaycastPicker.tempRayDirection = new Vector3D();
}
