declare namespace feng3d {
    /**
     * 轴对其包围盒
     * @author feng 2014-4-27
     */
    class AxisAlignedBoundingBox extends BoundingVolumeBase {
        private _centerX;
        private _centerY;
        private _centerZ;
        private _halfExtentsX;
        private _halfExtentsY;
        private _halfExtentsZ;
        /**
         * 创建轴对其包围盒
         */
        constructor();
        /**
         * 测试轴对其包围盒是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @return 				true：出现在视锥体内
         * @see me.feng3d.cameras.Camera3D.updateFrustum()
         */
        isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * @inheritDoc
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * @inheritDoc
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * @inheritDoc
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
         */
        transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): void;
    }
}
