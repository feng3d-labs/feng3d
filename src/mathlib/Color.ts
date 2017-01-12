module feng3d {

    /**
     * 颜色
     * @author feng 2016-09-24
     */
    export class Color {

        /**
         * 红[0,1]
         */
        r: number = 1;
        /**
         * 绿[0,1]
         */
        g: number = 1;
        /**
         * 蓝[0,1]
         */
        b: number = 1;
        /**
         * 透明度[0,1]
         */
        a: number = 1;

        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {

            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        /**
         * 从RGBA整型初始化颜色
         * @param r     红[0,255]
         * @param g     绿[0,255]
         * @param b     蓝[0,255]
         * @param a     透明度[0,255]
         */
        public fromInts(r: number, g: number, b: number, a: number) {

            this.r = r / 0xff;
            this.g = g / 0xff;
            this.b = b / 0xff;
            this.a = a / 0xff;
        }

        public fromUnit(color: number, hasAlpha: boolean = true) {

            this.a = (hasAlpha ? (color >> 24) & 0xff : 0xff) / 0xff;
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
        }

        /**
         * 转换为数组
         */
        public asArray(): number[] {

            var result = [];
            this.toArray(result);
            return result;
        }

        /**
         * 输出到数组
         * @param array     数组
         * @param index     存储在数组中的位置
         */
        public toArray(array: number[], index: number = 0): Color {

            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            array[index + 3] = this.a;
            return this;
        }

        /**
         * 输出为向量
         */
        public toVector3D() {

            return new Vector3D(this.r, this.g, this.b, this.a);
        }

        /**
         * 输出16进制字符串
         */
        public toHexString(): string {

            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;

            return "#" + Color.ToHex(intA) + Color.ToHex(intR) + Color.ToHex(intG) + Color.ToHex(intB);
        }

        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        public mix(color: Color, rate: number = 0.5) {

            this.r = this.r * (1 - rate) + color.r * rate;
            this.g = this.g * (1 - rate) + color.g * rate;
            this.b = this.b * (1 - rate) + color.b * rate;
            this.a = this.a * (1 - rate) + color.a * rate;
            return this;
        }

        /**
         * 输出字符串
         */
        public toString(): string {

            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }

        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        public static ToHex(i: number): string {

            var str = i.toString(16);
            if (i <= 0xf) {
                return ("0" + str).toUpperCase();
            }
            return str.toUpperCase();
        }

    }
}