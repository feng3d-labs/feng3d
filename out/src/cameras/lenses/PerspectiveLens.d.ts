declare namespace feng3d {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends LensBase {
        /**
         * 视野
         */
        fieldOfView: number;
        /**
         * 坐标系类型
         */
        coordinateSystem: number;
        _focalLength: number;
        private _yMax;
        private _xMax;
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView?: number, coordinateSystem?: number);
        private fieldOfViewChange();
        private coordinateSystemChange();
        /**
         * 焦距
         */
        focalLength: number;
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        protected updateMatrix(): void;
    }
}
