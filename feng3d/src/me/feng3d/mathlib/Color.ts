module me.feng3d {

    /**
     * 颜色
     * @author feng 2016-09-24
     */
    export class Color {

        /**
         * 红色，0-1
         */
        r: number = 1;
        /**
         * 绿色，0-1
         */
        g: number = 1;
        /**
         * 蓝色，0-1
         */
        b: number = 1;
        /**
         * 透明度，0-1
         */
        a: number = 1;

        private _color: number;

        /**
         * 构建颜色
         */
        constructor(color = 0xffffffff) {

            this.color = color;
        }

        /**
         * 颜色值，32位整数值
         */
        get color(): number {

            return this._color;
        }

        set color(value: number) {

            this._color = value;
            this.a = ((this._color >> 24) & 0xff) / 0xff;
            this.r = ((this._color >> 16) & 0xff) / 0xff;
            this.g = ((this._color >> 8) & 0xff) / 0xff;
            this.b = (this._color & 0xff) / 0xff;
        }

        get x(): number {
            return this.r;
        }
        get y(): number {
            return this.g;
        }
        get z(): number {
            return this.b;
        }
        get w(): number {
            return this.a;
        }
    }
}