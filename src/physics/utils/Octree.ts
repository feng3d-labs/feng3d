namespace CANNON
{
    export class OctreeNode
    {
        /**
         * The root node
         */
        root: OctreeNode = null;

        /**
         * Boundary of this node
         */
        aabb = new feng3d.AABB();
        /**
         * Contained data at the current node level.
         */
        data: number[];

        /**
         * Children to this node
         */
        children: OctreeNode[] = [];
        maxDepth: number;

        /**
         * 
         * @param options 
         */
        constructor(root: Octree = null, aabb = new feng3d.AABB())
        {
            this.root = root;
            this.aabb = aabb.clone();
            this.data = [];
            this.children = [];
        }

        reset()
        {
            this.children.length = this.data.length = 0;
        }

        /**
         * Insert data into this node
         * 
         * @param aabb
         * @param elementData
         * @return True if successful, otherwise false
         */
        insert(aabb: feng3d.AABB, elementData: number, level = 0)
        {
            var nodeData = this.data;

            // Ignore objects that do not belong in this node
            if (!this.aabb.contains(aabb))
            {
                return false; // object cannot be added
            }

            var children = this.children;

            if (level < (this.maxDepth || this.root.maxDepth))
            {
                // Subdivide if there are no children yet
                var subdivided = false;
                if (!children.length)
                {
                    this.subdivide();
                    subdivided = true;
                }

                // add to whichever node will accept it
                for (var i = 0; i !== 8; i++)
                {
                    if (children[i].insert(aabb, elementData, level + 1))
                    {
                        return true;
                    }
                }

                if (subdivided)
                {
                    // No children accepted! Might as well just remove em since they contain none
                    children.length = 0;
                }
            }

            // Too deep, or children didnt want it. add it in current node
            nodeData.push(elementData);

            return true;
        }

        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        subdivide()
        {
            var aabb = this.aabb;
            var l = aabb.min;
            var u = aabb.max;

            var children = this.children;

            children.push(
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(0, 0, 0))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(1, 0, 0))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(1, 1, 0))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(1, 1, 1))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(0, 1, 1))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(0, 0, 1))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(1, 0, 1))),
                new OctreeNode(null, new feng3d.AABB(new feng3d.Vector3(0, 1, 0)))
            );

            var halfDiagonal = new feng3d.Vector3();
            u.subTo(l, halfDiagonal);
            halfDiagonal.scaleNumberTo(0.5, halfDiagonal);

            var root = this.root || this;

            for (var i = 0; i !== 8; i++)
            {
                var child = children[i];

                // Set current node as root
                child.root = root;

                // Compute bounds
                var lowerBound = child.aabb.min;
                lowerBound.x *= halfDiagonal.x;
                lowerBound.y *= halfDiagonal.y;
                lowerBound.z *= halfDiagonal.z;

                lowerBound.addTo(l, lowerBound);

                // Upper bound is always lower bound + halfDiagonal
                lowerBound.addTo(halfDiagonal, child.aabb.max);
            }
        }

        /**
         * Get all data, potentially within an AABB
         * 
         * @param aabb
         * @param result
         * @return The "result" object
         */
        aabbQuery(aabb: feng3d.AABB, result: number[])
        {
            var queue = [this];
            while (queue.length)
            {
                var node = queue.pop();
                if (node.aabb.intersects(aabb))
                {
                    Array.prototype.push.apply(result, node.data);
                }
                Array.prototype.push.apply(queue, node.children);
            }

            return result;
        }

        /**
         * Get all data, potentially intersected by a ray.
         * 
         * @param ray
         * @param treeTransform
         * @param result
         * @return The "result" object
         */
        rayQuery(ray: Ray, treeTransform: Transform, result: number[])
        {
            var tmpAABB = new feng3d.AABB();
            ray.getAABB(tmpAABB);

            var mat = treeTransform.toMatrix3D();
            mat.invert();
            tmpAABB.applyMatrix3D(mat);

            this.aabbQuery(tmpAABB, result);
            return result;
        }

        removeEmptyNodes()
        {
            var queue = [this];
            while (queue.length)
            {
                var node = queue.pop();
                for (var i = node.children.length - 1; i >= 0; i--)
                {
                    if (!node.children[i].data.length)
                    {
                        node.children.splice(i, 1);
                    }
                }
                Array.prototype.push.apply(queue, node.children);
            }
        }
    }

    /**
     * 八叉树
     */
    export class Octree extends OctreeNode
    {
        /**
         * 最大细分深度
         */
        maxDepth = 8;

        /**
         * 
         */
        constructor()
        {
            super();
        }
    }
}