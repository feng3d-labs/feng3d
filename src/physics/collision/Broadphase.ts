namespace CANNON
{
    export abstract class Broadphase
    {

        world: World = null;

        useBoundingBoxes = false;

        dirty = true;

        /**
         * Get the collision pairs from the world
         * 
         * @param world The world to search in
         * @param p1 Empty array to be filled with body objects
         * @param p2 Empty array to be filled with body objects
         */
        abstract collisionPairs(world: World, p1: any[], p2: any[]): void;

        /**
         * Check if a body pair needs to be intersection tested at all.
         * 
         * @param bodyA
         * @param bodyB
         */
        needBroadphaseCollision(bodyA: Body, bodyB: Body)
        {
            // Check collision filter masks
            if ((bodyA.collisionFilterGroup & bodyB.collisionFilterMask) === 0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask) === 0)
            {
                return false;
            }

            // Check types
            if (((bodyA.type & Body.STATIC) !== 0 || bodyA.sleepState === Body.SLEEPING) &&
                ((bodyB.type & Body.STATIC) !== 0 || bodyB.sleepState === Body.SLEEPING))
            {
                // Both bodies are static or sleeping. Skip.
                return false;
            }

            return true;
        }

        /**
         * Check if the bounding volumes of two bodies intersect.
          * 
          * @param bodyA 
          * @param bodyB 
          * @param pairs1 
          * @param pairs2 
          */
        intersectionTest(bodyA: Body, bodyB: Body, pairs1: any[], pairs2: any[])
        {
            if (this.useBoundingBoxes)
            {
                this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
            } else
            {
                this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
        }

        /**
         * Check if the bounding spheres of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1 bodyA is appended to this array if intersection
         * @param pairs2 bodyB is appended to this array if intersection
         */
        doBoundingSphereBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
        {
            var r = bodyB.position.subTo(bodyA.position);
            var boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
            var norm2 = r.lengthSquared;
            if (norm2 < boundingRadiusSum2)
            {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        }

        /**
         * Check if the bounding boxes of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1
         * @param pairs2
         */
        doBoundingBoxBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
        {
            if (bodyA.aabbNeedsUpdate)
            {
                bodyA.computeAABB();
            }
            if (bodyB.aabbNeedsUpdate)
            {
                bodyB.computeAABB();
            }

            // Check AABB / AABB
            if (bodyA.aabb.intersects(bodyB.aabb))
            {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        }

        /**
         * Removes duplicate pairs from the pair arrays.
         * @param pairs1
         * @param pairs2
         */
        makePairsUnique(pairs1: any[], pairs2: any[])
        {
            var t: { keys: string[] } = { keys: [] };
            var p1 = pairs1.concat();
            var p2 = pairs2.concat();
            var N = pairs1.length;

            pairs1.length = 0;
            pairs2.length = 0;

            for (var i = 0; i !== N; i++)
            {
                var id1 = p1[i].id,
                    id2 = p2[i].id;
                var key = id1 < id2 ? id1 + "," + id2 : id2 + "," + id1;
                t[key] = i;
                t.keys.push(key);
            }

            for (var i = 0; i !== t.keys.length; i++)
            {
                var key = t.keys.pop();
                var pairIndex = t[key];
                pairs1.push(p1[pairIndex]);
                pairs2.push(p2[pairIndex]);
                delete t[key];
            }
        }

        /**
         * To be implemented by subcasses
         * @method setWorld
         * @param {World} world
         */
        setWorld(world: World)
        {
        }

        /**
         * Returns all the bodies within the AABB.
         * 
         * @param world 
         * @param aabb 
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: feng3d.AABB, result: any[])
        {
            console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
            return [];
        }

    }
}