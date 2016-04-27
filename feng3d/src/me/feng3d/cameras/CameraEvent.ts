module me.feng3d {

	/**
	 * 摄像机（镜头）事件
	 * @author feng 2014-10-14
	 */
    export class CameraEvent extends Event {
        static MATRIX_CHANGED: string = "matrixChanged";

        /**
         * 摄像机（镜头）
         */
        data: CameraBase;

        /**
         * 创建一个摄像机（镜头）事件。
         * @param type 事件的类型
         * @param camera 摄像机（镜头）
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, camera: CameraBase = null, bubbles: boolean = false) {
            super(type, camera, bubbles);
        }
    }
}