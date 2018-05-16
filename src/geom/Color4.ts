namespace feng3d
{
    export interface Color4Raw
    {
        __class__?: "feng3d.Color4",
        a?: number,
        b?: number,
        g?: number,
        r?: number
    }

    /**
     * 颜色（包含透明度）
     * @author feng 2016-09-24
     */
    export class Color4
    {
        static WHITE = new Color4();
        static BLACK = new Color4(0, 0, 0);

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
        toHexString(): string
        {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;

            return "#" + Color3.ToHex(intA) + Color3.ToHex(intR) + Color3.ToHex(intG) + Color3.ToHex(intB);
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
         * 拷贝
         */
        copyFrom(color: Color4)
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
    }
}