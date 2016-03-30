module feng3d {


	/**
	 * 3d直线
	 * @author feng 2013-6-13
	 */
    export class Line3D {
        /** 直线上某一点 */
        public position: Vector3D;

        /** 直线方向 */
        public direction: Vector3D;

		/**
		 * 根据直线某点与方向创建直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        constructor(position: Vector3D = null, direction: Vector3D = null) {
            this.position = position ? position : new Vector3D();
            this.direction = direction ? direction : new Vector3D(0, 0, 1);
        }

		/**
		 * 根据直线上两点初始化直线
		 * @param p0 Vector3D
		 * @param p1 Vector3D
		 */
        public fromPoints(p0: Vector3D, p1: Vector3D) {
            this.position = p0;
            this.direction = p1.subtract(p0);
        }

		/**
		 * 根据直线某点与方向初始化直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        public fromPosAndDir(position: Vector3D, direction: Vector3D) {
            this.position = position;
            this.direction = direction;
        }

		/**
		 * 获取直线上的一个点
		 * @param length 与原点距离
		 */
        public getPoint(length: number = 0): Vector3D {
            var lengthDir: Vector3D = this.direction.clone();
            lengthDir.scaleBy(length);
            var newPoint: Vector3D = this.position.add(lengthDir);
            return newPoint;
        }
    }
}
