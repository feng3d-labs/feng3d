module feng3d {

	/**
	 * 镜头事件
	 * @author feng 2014-10-14
	 */
    export class LensEvent extends Event {
        static MATRIX_CHANGED: string = "matrixChanged";

        /**
         * 镜头
         */
        data: LensBase;

        /**
         * 创建一个镜头事件。
         * @param type      事件的类型
         * @param lens      镜头
         * @param bubbles   确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, lens: LensBase = null, bubbles: boolean = false) {
            super(type, lens, bubbles);
        }
    }
}