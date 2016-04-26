module me.feng3d {

    /**
     * 矩形
     * @author feng 2016-04-27
     */
    export class Rectangle {
        /**
         * X坐标
         */
        x = 0;
        /**
         * Y坐标
         */
        y = 0;
        /**
         * 宽度
         */
        width = 0;
        /**
         * 高度
         */
        height = 0;

        /**
         * 是否包含指定点
         * @param x 点的X坐标
         * @param y 点的Y坐标
         */
        contains(x: number, y: number): boolean {
            return this.x <= x && x < this.x + this.width && this.y <= y && y < this.y + this.height;
        }
    }
}