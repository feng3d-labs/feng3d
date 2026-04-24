namespace feng3d
{

    /**
     * Representation of 2D vectors and points.
     */
    /**
     * 二维向量和点的表示。
     */
    export class Vector2 implements Vector
    {
        __class__: 'Vector2';

        /**
         * X component of the vector.
         */
        /**
         * 向量的X分量。
         */
        @oav()
        @serialize
        x: number;

        /**
         * Y component of the vector.
         */
        /**
         * 向量的Y分量。
         */
        @oav()
        @serialize
        y: number;

        /**
         * The length of this vector.
         */
        /**
         * 向量的长度。
         */
        get length(): number
        {
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        }

        /**
         * The squared length of this vector.
         */
        /**
         * 向量长度的平方。
         */
        get lengthSquared(): number
        {
            return (this.x * this.x) + (this.y * this.y);
        }

        /**
         * The length of this vector.
         */
        /**
         * 向量的长度。
         */
        get magnitude()
        {
            return this.length;
        }

        /**
         * The squared length of this vector.
         */
        /**
         * 向量长度的平方。
         */
        get sqrMagnitude(): number
        {
            return (this.x * this.x) + (this.y * this.y);
        }

        /**
         * 返回大小为 1 的此向量（只读）。
         *
         * 归一化后，向量保持相同的方向，但其长度为 1.0。
         *
         * 请注意，当前向量不变，并返回一个新的归一化向量。如果要对当前向量进行归一化，请使用Normalize函数。
         *
         * 如果向量太小而无法归一化，则将返回零向量。
         */
        /**
         * Returns this vector with a magnitude of 1 (Read Only).
         *
         * When normalized, a vector keeps the same direction but its length is 1.0.
         *
         * Note that the current vector is unchanged and a new normalized vector is returned. If you want to normalize the current vector, use Normalize function.
         *
         * If the vector is too small to be normalized a zero vector will be returned.
         */
        get normalized()
        {
            const v = new Vector2(this.x, this.y);
            v.normalize();

            return v;
        }

        /**
         * Constructs a new vector with given x, y components.
         *
         * @param x X component of the vector.
         * @param y Y component of the vector.
         */
        /**
         * 用给定的 x, y 分量构造一个新向量。
         *
         * @param x 向量的X分量。
         * @param y 向量的Y分量。
         */
        constructor(x = 0, y = 0)
        {
            this.x = x;
            this.y = y;
        }

        /**
         * Set x and y components of an existing Vector2.
         *
         * @param x The new X component of the vector
         * @param y The new Y component of the vector
         */
        /**
         * 设置现有Vector2的x和y分量。
         *
         * @param x 向量的新的X分量
         * @param y 向量的新的Y分量
         */
        set(x: number, y: number)
        {
            this.x = x;
            this.y = y;

            return this;
        }

        /**
         * Determine if it is equal to the given vector.
         *
         * @param other the given vector.
         * @param precision comparative precision.
         * @returns Returns true if the given vector is exactly equal to this vector.
         */
        /**
         * 判断与给定向量是否相等。
         *
         * @param other 给定的向量。
         * @param precision 比较精度。
         * @returns 如果给定向量完全等于该向量，则返回 true。
         */
        equals(other: Vector2, precision = mathUtil.PRECISION)
        {
            if (!mathUtil.equals(this.x - other.x, 0, precision))
            {
                return false;
            }
            if (!mathUtil.equals(this.y - other.y, 0, precision))
            {
                return false;
            }

            return true;
        }

        /**
         * Makes this vector have a magnitude of 1.
         *
         * When normalized, a vector keeps the same direction but its length is 1.0.
         *
         * Note that this function will change the current vector. If you want to keep the current vector unchanged, use normalized variable.
         *
         * If this vector is too small to be normalized it will be set to zero.
         *
         */
        /**
         * 使该向量的大小为 1。
         *
         * 归一化后，向量保持相同的方向，但其长度为 1.0。
         *
         * 请注意，此函数将更改当前向量。如果要保持当前向量不变，请使用归一化变量。
         *
         * 如果这个向量太小而无法归一化，它将被设置为零。
         */
        normalize()
        {
            const length = this.length;
            if (this.length > Vector2.kEpsilon)
            {
                this.x /= length;
                this.y /= length;
            }
            else
            {
                this.x = 0;
                this.y = 0;
            }
        }

        /**
         * 克隆点对象
         */
        clone(): Vector2
        {
            return new Vector2(this.x, this.y);
        }

        /**
         * 返回此向量的格式化字符串。
         */
        /**
         * Returns a formatted string for this vector.
         */
        toString(): string
        {
            return `(${this.x}, ${this.y})`;
        }

        /**
         * Shorthand for writing Vector2(0, 0).
         */
        /**
         * 零向量`Vector2(0, 0)`。
         */
        static readonly zero = Object.freeze(new Vector2());

        /**
         * Shorthand for writing Vector2(1, 1).
         */
        /**
         * 单元向量`Vector2(1, 1)`。
         */
        static readonly one = Object.freeze(new Vector2(1, 1));

        /**
         * Shorthand for writing Vector2(0, 1).
         */
        static readonly up = Object.freeze(new Vector2(0, 1));

        /**
         * Shorthand for writing Vector2(0, -1).
         */
        static readonly down = Object.freeze(new Vector2(0, -1));

        /**
         * Shorthand for writing Vector2(-1, 0).
         */
        static readonly left = Object.freeze(new Vector2(-1, 0));

        /**
         * Shorthand for writing Vector2(1, 0).
         */
        static readonly right = Object.freeze(new Vector2(1, 0));

        /**
         * Shorthand for writing Vector2(Infinity, Infinity).
         */
        static readonly positiveInfinity = Object.freeze(new Vector2(Infinity, Infinity));

        /**
         * Shorthand for writing Vector2(-Infinity, -Infinity).
         */
        static readonly negativeInfinity = Object.freeze(new Vector2(-Infinity, -Infinity));

        /**
         * 可允许误差。
         */
        static readonly kEpsilon = 0.00001;

        /**
         * 可允许误差平方。
         */
        static readonly kEpsilonNormalSqrt = 1e-15;

        /**
         * Linearly interpolates between vectors a and b by t.
         *
         * The parameter t is clamped to the range [0, 1].
         *
         * When t = 0 returns a.
         * When t = 1 return b.
         * When t = 0.5 returns the midpoint of a and b.
         *
         * @param a Start point.
         * @param b End point.
         * @param t Interpolated coefficient.
         */
        /**
         * 返回起始向量`a`与终止向量`b`在`t`位置的线性插值。
         *
         * 参数`t`将被裁减到[0, 1]的范围内。
         *
         * 当 t = 0 时返回`a`.
         * 当 t = 1 时返回`b`.
         * 当 t = 0.5 时返回`a`与`b`的中间值.
         *
         * @param a 起始点。
         * @param b 终止点。
         * @param t 插值系数。
         */
        static Lerp(a: Vector2, b: Vector2, t: number)
        {
            t = mathUtil.clamp(t, 0, 1);

            return new Vector2(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t
            );
        }

        /**
         * Linearly interpolates between vectors a and b by t.
         *
         * When t = 0 returns a.
         * When t = 1 return b.
         * When t = 0.5 returns the midpoint of a and b.
         *
         * @param a Start point.
         * @param b End point.
         * @param t Interpolated coefficient.
         */
        /**
         * 返回起始向量`a`与终止向量`b`在`t`位置的线性插值。
         *
         * 当 t = 0 时返回`a`.
         * 当 t = 1 时返回`b`.
         * 当 t = 0.5 时返回`a`与`b`的中间值.
         *
         * @param a 起始点。
         * @param b 终止点。
         * @param t 插值系数。
         */
        static LerpUnclamped(a: Vector2, b: Vector2, t: number)
        {
            return new Vector2(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t
            );
        }

        // Moves a point /current/ towards /target/.
        static MoveTowards(current: Vector2, target: Vector2, maxDistanceDelta: number)
        {
            // avoid vector ops because current scripting backends are terrible at inlining
            const toVectorX = target.x - current.x;
            const toVectorY = target.y - current.y;

            const sqDist = toVectorX * toVectorX + toVectorY * toVectorY;

            if (sqDist === 0 || (maxDistanceDelta >= 0 && sqDist <= maxDistanceDelta * maxDistanceDelta))
            {
                return target;
            }

            const dist = Math.sqrt(sqDist);

            return new Vector2(current.x + toVectorX / dist * maxDistanceDelta,
                current.y + toVectorY / dist * maxDistanceDelta);
        }

        // Multiplies two vectors component-wise.
        static Scale(a: Vector2, b: Vector2)
        {
            return new Vector2(a.x * b.x, a.y * b.y);
        }

        static Reflect(inDirection: Vector2, inNormal: Vector2)
        {
            const factor = -2 * Vector2.Dot(inNormal, inDirection);

            return new Vector2(factor * inNormal.x + inDirection.x, factor * inNormal.y + inDirection.y);
        }

        static Perpendicular(inDirection: Vector2)
        {
            return new Vector2(-inDirection.y, inDirection.x);
        }

        /**
         * Dot Product of two vectors.
         *
         * For normalized vectors Dot returns 1 if they point in exactly the same direction; -1 if they point in completely opposite directions; and a number in between for other cases (e.g. Dot returns zero if vectors are perpendicular).
         *
         * @param lhs The left-hand vector.
         * @param rhs The right-hand vector.
         * @returns Dot Product of two vectors.
         */
        /**
         * 两个向量的点乘值。
         *
         * 对于归一化向量，如果它们指向完全相同的方向，则 Dot 返回 1；如果它们指向完全相反的方向则返回 -1；其他情况返回-1与1之间的数字（例如，如果向量垂直，则 Dot 返回零）。
         *
         * @param lhs 左侧向量。
         * @param rhs 右侧向量。
         * @returns 两个向量的点乘值。
         */
        static Dot(lhs: Vector2, rhs: Vector2)
        {
            return lhs.x * rhs.x + lhs.y * rhs.y;
        }

        /**
         * Gets the unsigned angle in degrees between from and to.
         *
         * The angle returned is the unsigned angle between the two vectors.
         * Note: The angle returned will always be between 0 and 180 degrees, because the method returns the smallest angle between the vectors. That is, it will never return a reflex angle. Angles are calculated from world origin point (0,0,0) as the vertex.
         *
         * @param from 	The vector from which the angular difference is measured.
         * @param to The vector to which the angular difference is measured.
         * @returns The unsigned angle in degrees between the two vectors.
         */
        /**
         * 获取从起始向量和终止向量之间的无符号角度。
         *
         * 返回的角度是两个向量之间的无符号角度。
         * 注意：返回的角度总是在 0 到 180 度之间，因为该方法返回向量之间的最小角度。也就是说，它永远不会返回反射角。角度是从世界原点 (0,0,0) 作为顶点计算的。
         *
         * @param from 测量角度差的起始向量。
         * @param to 测量角度差的终止向量。
         * @returns 两个向量之间的无符号角度，以度为单位。
         */
        static Angle(from: Vector2, to: Vector2)
        {
            // sqrt(a) * sqrt(b) = sqrt(a * b) -- valid for real numbers
            const denominator = Math.sqrt(from.sqrMagnitude * to.sqrMagnitude);
            if (denominator < Vector2.kEpsilonNormalSqrt)
            {
                return 0;
            }

            const dot = mathUtil.clamp(Vector2.Dot(from, to) / denominator, -1, 1);

            return Math.acos(dot) * mathUtil.RAD2DEG;
        }

        static SignedAngle(from: Vector2, to: Vector2)
        {
            const unsignedAngle = Vector2.Angle(from, to);
            const sign = Mathf.Sign(from.x * to.y - from.y * to.x);

            return unsignedAngle * sign;
        }

        /**
         * Returns the distance between a and b.
         *
         * @param a Start point.
         * @param b End point.
         * @returns The distance between a and b.
         */
        /**
         * 返回两点的距离。
         *
         * @param a 起始点。
         * @param b 终止点。
         * @returns 两点的距离。
         */
        static Distance(a: Vector2, b: Vector2)
        {
            return a.distance(b);
        }

        /**
         * Returns a copy of vector with its magnitude clamped to maxLength.
         *
         * @param vector Restricted vector.
         * @param maxLength The maximum length to be restricted.
         * @returns A copy of vector with its magnitude clamped to maxLength.
         */
        /**
         * 返回其长度被限制最大值为`maxLength`的向量副本。
         *
         * @param vector 被限制的向量。
         * @param maxLength 被限制的最大长度。
         * @returns 限制后的向量副本。
         */
        static ClampMagnitude(vector: Vector2, maxLength: number)
        {
            const sqrMagnitude = vector.sqrMagnitude;
            if (sqrMagnitude > maxLength * maxLength)
            {
                const mag = Math.sqrt(sqrMagnitude);

                // these intermediate variables force the intermediate result to be
                // of float precision. without this, the intermediate result can be of higher
                // precision, which changes behavior.
                const normalizedX = vector.x / mag;
                const normalizedY = vector.y / mag;

                return new Vector2(normalizedX * maxLength, normalizedY * maxLength);
            }

            return vector.clone();
        }

        // Returns a vector that is made from the smallest components of two vectors.
        static Min(lhs: Vector2, rhs: Vector2)
        {
            return new Vector2(Mathf.Min(lhs.x, rhs.x), Mathf.Min(lhs.y, rhs.y));
        }

        // Returns a vector that is made from the largest components of two vectors.
        static Max(lhs: Vector2, rhs: Vector2)
        {
            return new Vector2(Mathf.Max(lhs.x, rhs.x), Mathf.Max(lhs.y, rhs.y));
        }

        static SmoothDamp(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed: number)
        {
            const deltaTime = Time.deltaTime;

            return Vector2.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        static SmoothDamp1(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number)
        {
            const deltaTime = Time.deltaTime;
            const maxSpeed = Mathf.Infinity;

            return Vector2.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        static SmoothDamp2(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed = Mathf.Infinity, deltaTime = Time.deltaTime)
        {
            // Based on Game Programming Gems 4 Chapter 1.10
            smoothTime = Mathf.Max(0.0001, smoothTime);
            const omega = 2 / smoothTime;

            const x = omega * deltaTime;
            const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

            let changeX = current.x - target.x;
            let changeY = current.y - target.y;
            const originalTo = target;

            // Clamp maximum speed
            const maxChange = maxSpeed * smoothTime;

            const maxChangeSq = maxChange * maxChange;
            const sqDist = changeX * changeX + changeY * changeY;
            if (sqDist > maxChangeSq)
            {
                const mag = Mathf.Sqrt(sqDist);
                changeX = changeX / mag * maxChange;
                changeY = changeY / mag * maxChange;
            }

            target.x = current.x - changeX;
            target.y = current.y - changeY;

            const tempX = (currentVelocity.x + omega * changeX) * deltaTime;
            const tempY = (currentVelocity.y + omega * changeY) * deltaTime;

            currentVelocity.x = (currentVelocity.x - omega * tempX) * exp;
            currentVelocity.y = (currentVelocity.y - omega * tempY) * exp;

            let outputX = target.x + (changeX + tempX) * exp;
            let outputY = target.y + (changeY + tempY) * exp;

            // Prevent overshooting
            const origMinusCurrentX = originalTo.x - current.x;
            const origMinusCurrentY = originalTo.y - current.y;
            const outMinusOrigX = outputX - originalTo.x;
            const outMinusOrigY = outputY - originalTo.y;

            if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY > 0)
            {
                outputX = originalTo.x;
                outputY = originalTo.y;

                currentVelocity.x = (outputX - originalTo.x) / deltaTime;
                currentVelocity.y = (outputY - originalTo.y) / deltaTime;
            }

            return new Vector2(outputX, outputY);
        }

        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Vector2
        {
            return new Vector2(len * Math.cos(angle * mathUtil.RAD2DEG), len * Math.sin(angle * mathUtil.RAD2DEG));
        }

        /**
         * 将另一个点的坐标添加到此点的坐标。
         * @param v 要添加的点。
         */
        add(v: Vector2): Vector2
        {
            this.x += v.x;
            this.y += v.y;

            return this;
        }

        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        addTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x + v.x;
            vout.y = this.y + v.y;

            return vout;
        }

        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        sub(v: Vector2)
        {
            this.x -= v.x;
            this.y -= v.y;

            return this;
        }

        /**
         * 减去向量返回新向量
         * @param v 减去的向量
         * @returns 返回的新向量
         */
        subTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x - v.x;
            vout.y = this.y - v.y;

            return vout;
        }

        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector2)
        {
            this.x *= v.x;
            this.y *= v.y;

            return this;
        }

        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x * v.x;
            vout.y = this.y * v.y;

            return vout;
        }

        /**
         * 除以向量
         * @param v 向量
         */
        divide(v: Vector2)
        {
            this.x /= v.x;
            this.y /= v.y;

            return this;
        }

        /**
         * 除以向量
         * @param v 向量
         * @param vout 输出向量
         */
        divideTo(v: Vector2, vout = new Vector2())
        {
            vout.x = this.x / v.x;
            vout.y = this.y / v.y;

            return vout;
        }

        /**
         * 将源 Vector2 对象中的所有点数据复制到调用方 Vector2 对象中。
         * @param source 要从中复制数据的 Vector2 对象。
         */
        copy(source: Vector2)
        {
            this.x = source.x;
            this.y = source.y;

            return this;
        }

        /**
         * 返回与目标点之间的距离。
         * @param p 目标点
         * @returns 与目标点之间的距离。
         */
        distance(p: Vector2)
        {
            const dx = this.x - p.x;
            const dy = this.y - p.y;

            return Math.sqrt((dx * dx) + (dy * dy));
        }

        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector3)
        {
            const dx = this.x - p.x;
            const dy = this.y - p.y;

            return (dx * dx) + (dy * dy);
        }

        /**
         * 负向量
         */
        negate()
        {
            this.x *= -1;
            this.y *= -1;

            return this;
        }

        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocal()
        {
            this.x = 1 / this.x;
            this.y = 1 / this.y;

            return this;
        }

        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocalTo(out = new Vector2())
        {
            out.copy(this).reciprocal();

            return out;
        }

        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumber(s: number): Vector2
        {
            this.x *= s;
            this.y *= s;

            return this;
        }
        /**
         * 按标量（大小）缩放当前的 Vector2 对象。
         */
        scaleNumberTo(s: number, vout = new Vector2())
        {
            return vout.copy(this).scaleNumber(s);
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scale(s: Vector2)
        {
            this.x *= s.x;
            this.y *= s.y;

            return this;
        }

        /**
         * 缩放
         * @param s 缩放量
         */
        scaleTo(s: Vector2, vout = new Vector2())
        {
            if (s === vout) s = s.clone();

            return vout.copy(this).scale(s);
        }

        /**
         * 按指定量偏移 Vector2 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): Vector2
        {
            this.x += dx;
            this.y += dy;

            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @returns 返回自身
         */
        lerp(p: Vector2, alpha: Vector2): Vector2
        {
            this.x += (p.x - this.x) * alpha.x;
            this.y += (p.y - this.y) * alpha.y;

            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @returns 返回新向量
         */
        lerpTo(v: Vector2, alpha: Vector2, vout = new Vector2())
        {
            return vout.copy(this).lerp(v, alpha);
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @returns 返回自身
         */
        lerpNumber(v: Vector2, alpha: number)
        {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;

            return this;
        }

        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @returns 返回自身
         */
        lerpNumberTo(v: Vector2, alpha: number, vout = new Vector2())
        {
            return vout.copy(this).lerpNumber(v, alpha);
        }

        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector2, max: Vector2)
        {
            this.x = mathUtil.clamp(this.x, min.x, max.x);
            this.y = mathUtil.clamp(this.y, min.y, max.y);

            return this;
        }

        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clampTo(min: Vector2, max: Vector2, vout = new Vector2())
        {
            return vout.copy(this).clamp(min, max);
        }

        /**
         * 取最小元素
         * @param v 向量
         */
        min(v: Vector2)
        {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);

            return this;
        }

        /**
         * 取最大元素
         * @param v 向量
         */
        max(v: Vector2)
        {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);

            return this;
        }

        /**
         * 各分量均取最近的整数
         */
        round()
        {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);

            return this;
        }

        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         * @returns 返回数组
         */
        toArray(array: number[] = [], offset = 0)
        {
            array[offset] = this.x;
            array[offset + 1] = this.y;

            return array;
        }
    }
}