namespace feng3d
{
    /**
     * 噪音
     */
    export var noise: Noise;

    /**
     * 柏林噪音
     * 
     * 用于生产随机的噪音贴图
     * 
     * @see http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
     * @see https://mrl.nyu.edu/~perlin/noise/
     * @see https://gitee.com/feng3d_admin/noise
     */
    export class Noise
    {
        /**
         * 构建柏林噪音
         * 
         * @param seed 随机种子
         */
        constructor(seed = 0)
        {
            this.seed = seed;
        }

        /**
         * 1D 经典噪音
         * 
         * @param x X轴数值
         */
        perlin1(x: number)
        {
            const perm = this._p;

            // Find unit grid cell containing point
            var X = Math.floor(x);

            // Get relative xyz coordinates of point within that cell
            x = x - X;

            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255;
            // Calculate a set of eight hashed gradient indices
            var gi00 = perm[X] % 2;
            var gi10 = perm[X + 1] % 2;

            // Calculate noise contributions from each of the eight corners
            var n00 = dot1(grad1[gi00], x);
            var n10 = dot1(grad1[gi10], x - 1);
            // Compute the fade curve value for each of x, y
            var u = fade(x);
            // Interpolate along x the contributions from each of the corners
            var nx0 = mix(n00, n10, u);

            return nx0;
        }

        /**
         * 2D 经典噪音
         * 
         * @param x X轴数值
         * @param y Y轴数值
         */
        perlin2(x: number, y: number)
        {
            const perm = this._p;

            // Find unit grid cell containing point
            var X = Math.floor(x);
            var Y = Math.floor(y);

            // Get relative xyz coordinates of point within that cell
            x = x - X;
            y = y - Y;

            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255;
            Y = Y & 255;
            // Calculate a set of eight hashed gradient indices
            var gi00 = perm[X + perm[Y]] % 4;
            var gi10 = perm[X + 1 + perm[Y]] % 4;
            var gi01 = perm[X + perm[Y + 1]] % 4;
            var gi11 = perm[X + 1 + perm[Y + 1]] % 4;

            // Calculate noise contributions from each of the eight corners
            var n00 = dot2(grad2[gi00], x, y);
            var n10 = dot2(grad2[gi10], x - 1, y);
            var n01 = dot2(grad2[gi01], x, y - 1);
            var n11 = dot2(grad2[gi11], x - 1, y - 1);
            // Compute the fade curve value for each of x, y
            var u = fade(x);
            var v = fade(y);
            // Interpolate along x the contributions from each of the corners
            var nx0 = mix(n00, n10, u);
            var nx1 = mix(n01, n11, u);
            // Interpolate the four results along y
            var nxy = mix(nx0, nx1, v);

            return nxy;
        }

        /**
         * 3D 经典噪音
         * 
         * @param x X轴数值
         * @param y Y轴数值
         * @param z Z轴数值
         */
        perlin3(x: number, y: number, z: number)
        {
            const perm = this._p;

            // Find unit grid cell containing point
            var X = Math.floor(x);
            var Y = Math.floor(y);
            var Z = Math.floor(z);

            // Get relative xyz coordinates of point within that cell
            x = x - X;
            y = y - Y;
            z = z - Z;

            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255;
            Y = Y & 255;
            Z = Z & 255;
            // Calculate a set of eight hashed gradient indices
            var gi000 = perm[X + perm[Y + perm[Z]]] % 12;
            var gi100 = perm[X + 1 + perm[Y + perm[Z]]] % 12;
            var gi010 = perm[X + perm[Y + 1 + perm[Z]]] % 12;
            var gi110 = perm[X + 1 + perm[Y + 1 + perm[Z]]] % 12;
            var gi001 = perm[X + perm[Y + perm[Z + 1]]] % 12;
            var gi101 = perm[X + 1 + perm[Y + perm[Z + 1]]] % 12;
            var gi011 = perm[X + perm[Y + 1 + perm[Z + 1]]] % 12;
            var gi111 = perm[X + 1 + perm[Y + 1 + perm[Z + 1]]] % 12;

            // Calculate noise contributions from each of the eight corners
            var n000 = dot(grad3[gi000], x, y, z);
            var n100 = dot(grad3[gi100], x - 1, y, z);
            var n010 = dot(grad3[gi010], x, y - 1, z);
            var n110 = dot(grad3[gi110], x - 1, y - 1, z);
            var n001 = dot(grad3[gi001], x, y, z - 1);
            var n101 = dot(grad3[gi101], x - 1, y, z - 1);
            var n011 = dot(grad3[gi011], x, y - 1, z - 1);
            var n111 = dot(grad3[gi111], x - 1, y - 1, z - 1);
            // Compute the fade curve value for each of x, y, z
            var u = fade(x);
            var v = fade(y);
            var w = fade(z);
            // Interpolate along x the contributions from each of the corners
            var nx00 = mix(n000, n100, u);
            var nx01 = mix(n001, n101, u);
            var nx10 = mix(n010, n110, u);
            var nx11 = mix(n011, n111, u);
            // Interpolate the four results along y
            var nxy0 = mix(nx00, nx10, v);
            var nxy1 = mix(nx01, nx11, v);
            // Interpolate the two last results along z
            var nxyz = mix(nxy0, nxy1, w);

            return nxyz;
        }

        /**
         * N阶经典噪音
         * 
         * 如果是1D，2D，3D噪音，最好选用对于函数，perlinN中存在for循环因此效率比perlin3等性能差3到5（8）倍！
         * 
         * 满足以下运算
         * perlinN(x) == perlin1(x)
         * perlinN(x,y) == perlin2(x,y)
         * perlinN(x,y,z) == perlin3(x,y,z)
         * 
         * @param ps 每个轴的数值
         */
        perlinN(...ps: number[])
        {
            const perm = this._p;

            var n = ps.length;

            // 在格子内对应每个轴的位置
            var pp: number[] = [];
            // 所属格子对应每个轴的索引
            var PS: number[] = [];
            // 在格子内对应每个轴的混合权重
            var PF: number[] = [];
            for (var i = 0; i < n; i++)
            {
                var p = ps[i];
                // 找到所属单元格
                var P = Math.floor(p);

                // 获取所在单元格内的位置
                p = p - P;

                // 单元格以255为周期
                P = P & 255;

                //
                pp[i] = p;
                PS[i] = P;

                // 分别计算每个轴的混合度
                PF[i] = fade(p);
            }

            //
            var gradN = createGrad(n);
            // 边的数量
            var numEdge = gradN.length;
            // if (n > 1)
            // {
            //     console.assert(numEdge == Math.pow(2, n - 1) * n, `边的数量不对！`)
            // }
            //
            var bits = getBits(n);
            var dns: number[] = [];
            //
            for (var i = 0, len = bits.length; i < len; i++)
            {
                var bit = bits[i];
                var bitn = bit.length;
                // 计算索引
                var gi = 0;
                while (bitn > 0)
                {
                    bitn--;
                    gi = perm[PS[bitn] + bit[bitn] + gi];
                    // if (isNaN(gi))
                    //     debugger;
                }
                // 获取 grad
                var grad = gradN[gi % numEdge];
                bitn = bit.length;
                // 计算点乘 dot运算
                var dn = 0;
                while (bitn > 0)
                {
                    bitn--;
                    dn += grad[bitn] * (pp[bitn] - bit[bitn]);
                }
                dns[i] = dn;
            }
            // 进行插值
            for (var i = 0; i < n; i++)
            {
                // 每次前后两个插值
                for (var j = 0, len = dns.length; j < len; j += 2)
                {
                    dns[j / 2] = mix(dns[j], dns[j + 1], PF[i])
                }
                // 每波插值后 长度减半
                dns.length = dns.length >> 1;
            }
            // console.assert(dns.length == 1, `结果长度不对！`)

            return dns[0];
        }

        /**
         * This isn't a very good seeding function, but it works ok. It supports 2^16
         * different seed values. Write something better if you need more seeds.
         */
        get seed()
        {
            return this._seed;
        }
        set seed(v)
        {
            this._seed = v;

            var p = this._p;
            if (v > 0 && v < 1)
            {
                // Scale the seed out
                v *= 65536;
            }

            v = Math.floor(v);
            if (v < 256)
            {
                v |= v << 8;
            }

            for (var i = 0; i < 256; i++)
            {
                var v0;
                if (i & 1)
                {
                    v0 = permutation[i] ^ (v & 255);
                } else
                {
                    v0 = permutation[i] ^ ((v >> 8) & 255);
                }

                p[i] = p[i + 256] = v0;
            }
        }
        private _seed: number = 0;
        private _p: number[] = [];
    }

    /**
     * 
     * @param n 
     * 
     * len = 2^(n-1) * n
     */
    export function createGrad(n: number): number[][]
    {
        if (createGradCache[n]) return createGradCache[n];

        var gradBase = createGradBase(n - 1);
        var grad: number[][] = [];
        if (n > 1)
        {
            for (let i = n - 1; i >= 0; i--)
            {
                for (let j = 0; j < gradBase.length; j++)
                {
                    var item = gradBase[j].concat();
                    item.splice(i, 0, 0);
                    grad.push(item);
                }
            }
        } else 
        {
            grad = gradBase
        }
        createGradCache[n] = grad;
        return grad;
    }

    var createGradCache: { [n: number]: number[][] } = {};

    function createGradBase(n: number): number[][]
    {
        if (n < 2) return [
            [1], [- 1],
        ];
        var grad = createGradBase(n - 1);

        for (var i = 0, len = grad.length; i < len; i++)
        {
            var item = grad[i];
            grad[i] = item.concat(1);
            grad[i + len] = item.concat(-1);
        }
        return grad;
    }

    export function getBits(n: number): number[][]
    {
        if (getBitsChace[n]) return getBitsChace[n];

        if (n < 2) return [
            [0], [1],
        ];
        var grad = getBits(n - 1);

        for (var i = 0, len = grad.length; i < len; i++)
        {
            var item = grad[i];
            grad[i] = item.concat(0);
            grad[i + len] = item.concat(1);
        }
        getBitsChace[n] = grad;
        return grad;
    }
    var getBitsChace: { [n: number]: number[][] } = {};

    var grad1 = [
        [1], [- 1],
    ];
    var grad2 = [
        [1, 0], [- 1, 0],
        [0, 1], [0, -1],
    ];
    var grad3 = [
        [1, 1, 0], [- 1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    var permutation = [
        151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];

    function dot(g: number[], x: number, y: number, z: number)
    {
        return g[0] * x + g[1] * y + g[2] * z;
    }
    function dot2(g: number[], x: number, y: number)
    {
        return g[0] * x + g[1] * y;
    }
    function dot1(g: number[], x: number)
    {
        return g[0] * x;
    }
    function mix(a: number, b: number, t: number)
    {
        return (1 - t) * a + t * b;
    }
    function fade(t: number)
    {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    noise = new Noise();
}