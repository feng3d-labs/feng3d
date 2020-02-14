namespace feng3d
{
    /**
     * 颜色（包含透明度）
     */
    export class Color4
    {

        __class__: "feng3d.Color4";

        static readonly WHITE = Object.freeze(new Color4(1, 1, 1, 1));
        static readonly BLACK = Object.freeze(new Color4(0, 0, 0, 1));

        static fromUnit(color: number)
        {
            return new Color4().fromUnit(color);
        }

        static fromUnit24(color: number, a = 1)
        {
            return Color4.fromColor3(Color3.fromUnit(color), a);
        }

        static fromColor3(color3: Color3, a = 1)
        {
            return new Color4(color3.r, color3.g, color3.b, a);
        }

        /**
         * 红[0,1]
         */
        @oav()
        @serialize
        r = 1;
        /**
         * 绿[0,1]
         */
        @oav()
        @serialize
        g = 1;
        /**
         * 蓝[0,1]
         */
        @oav()
        @serialize
        b = 1;
        /**
         * 透明度[0,1]
         */
        @oav()
        @serialize
        a = 1;

        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        constructor(r = 1, g = 1, b = 1, a = 1)
        {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        setTo(r: number, g: number, b: number, a = 1)
        {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            return this;
        }

        /**
         * 通过
         * @param color 
         */
        fromUnit(color: number)
        {
            this.a = ((color >> 24) & 0xff) / 0xff;
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
            return this;
        }

        toInt()
        {
            var value = ((this.a * 0xff) << 24) + ((this.r * 0xff) << 16) + ((this.g * 0xff) << 8) + (this.b * 0xff);
            return value;
        }

        /**
         * 输出16进制字符串
         */
        toHexString()
        {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;

            return "#" + Color3.ToHex(intA) + Color3.ToHex(intR) + Color3.ToHex(intG) + Color3.ToHex(intB);
        }

        /**
         * 输出 RGBA 颜色值，例如 rgba(255,255,255,1)
         */
        toRGBA()
        {
            return `rgba(${this.r * 255},${this.g * 255},${this.b * 255},${this.a})`;
        }

        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mix(color: Color4, rate = 0.5)
        {
            this.r = this.r * (1 - rate) + color.r * rate;
            this.g = this.g * (1 - rate) + color.g * rate;
            this.b = this.b * (1 - rate) + color.b * rate;
            this.a = this.a * (1 - rate) + color.a * rate;
            return this;
        }

        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mixTo(color: Color4, rate: number, vout = new Color4())
        {
            return vout.copy(this).mix(color, rate);
        }

        /**
         * 乘以指定颜色
         * @param c 乘以的颜色
         * @return 返回自身
         */
        multiply(c: Color4)
        {
            this.r *= c.r;
            this.g *= c.g;
            this.b *= c.b;
            this.a *= c.a;
            return this;
        }

        /**
         * 乘以指定颜色
         * @param v 乘以的颜色
         * @return 返回新颜色
         */
        multiplyTo(v: Color4, vout = new Color4())
        {
            return vout.copy(this).multiply(v);
        }

        /**
         * 乘以指定常量
         * 
         * @param scale 缩放常量
         * @return 返回自身
         */
        multiplyNumber(scale: number)
        {
            this.r *= scale;
            this.g *= scale;
            this.b *= scale;
            this.a *= scale;
            return this;
        }

        /**
         * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Color4, precision = Math.PRECISION)
        {
            if (!Math.equals(this.r - object.r, 0, precision))
                return false;
            if (!Math.equals(this.g - object.g, 0, precision))
                return false;
            if (!Math.equals(this.b - object.b, 0, precision))
                return false;
            if (!Math.equals(this.a - object.a, 0, precision))
                return false;
            return true;
        }

        /**
         * 拷贝
         */
        copy(color: Color4)
        {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
            return this;
        }

        /**
         * 输出字符串
         */
        toString(): string
        {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }

        toColor3(color = new Color3())
        {
            color.r = this.r;
            color.g = this.g;
            color.b = this.b;
            return color;
        }

        toVector4(vector4 = new Vector4())
        {
            vector4.x = this.r;
            vector4.y = this.g;
            vector4.z = this.b;
            vector4.w = this.a;
            return vector4;
        }

        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array: number[] = [], offset = 0)
        {
            array[offset] = this.r;
            array[offset + 1] = this.g;
            array[offset + 2] = this.b;
            array[offset + 3] = this.a;
            return array;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new Color4(this.r, this.g, this.b, this.a);
        }
    }
}