namespace feng3d
{

    export class Mathf
    {
        /**
         * Returns the sine of angle `f` in radians.
         */
        static Sin(f: number)
        {
            return Math.sin(f);
        }

        /**
         * Returns the cosine of angle `f` in radians.
         */
        static Cos(f: number)
        {
            return Math.cos(f);
        }

        // Returns the tangent of angle /f/ in radians.
        static Tan(f: number) { return Math.tan(f); }

        // Returns the arc-sine of /f/ - the angle in radians whose sine is /f/.
        static Asin(f: number) { return Math.asin(f); }

        // Returns the arc-cosine of /f/ - the angle in radians whose cosine is /f/.
        static Acos(f: number) { return Math.acos(f); }

        // Returns the arc-tangent of /f/ - the angle in radians whose tangent is /f/.
        static Atan(f: number) { return Math.atan(f); }

        // Returns the angle in radians whose ::ref::Tan is @@y/x@@.
        static Atan2(y: number, x: number) { return Math.atan2(y, x); }

        // Returns square root of /f/.
        static Sqrt(f: number) { return Math.sqrt(f); }

        // Returns the absolute value of /f/.
        static Abs(f: number) { return Math.abs(f); }

        static Min(a: number, b: number): number;
        // Returns the smallest of two or more values.
        static Min(values: number[]): number;
        static Min(...args: any[])
        {
            if (Array.isArray(args[0]))
            {
                const values = args[0];
                const len = values.length;
                if (len === 0)
                {
                    return 0;
                }
                let m = values[0];
                for (let i = 1; i < len; i++)
                {
                    if (values[i] < m)
                    { m = values[i]; }
                }

                return m;
            }
            const a: number = args[0];
            const b: number = args[1];

            return a < b ? a : b;
        }

        static Max(a: number, b: number): number;
        // Returns largest of two or more values.
        static Max(values: number[]): number;
        static Max(...args: any[])
        {
            if (Array.isArray(args[0]))
            {
                const values = args[0];
                const len = values.length;
                if (len === 0)
                { return 0; }
                let m = values[0];
                for (let i = 1; i < len; i++)
                {
                    if (values[i] > m)
                    { m = values[i]; }
                }

                return m;
            }
            const a: number = args[0];
            const b: number = args[1];

            return a > b ? a : b;
        }

        // Returns /f/ raised to power /p/.
        static Pow(f: number, p: number) { return Math.pow(f, p); }

        // Returns e raised to the specified power.
        static Exp(power: number) { return Math.exp(power); }

        // Returns the natural (base e) logarithm of a specified number.
        static Log(f: number) { return Math.log(f); }

        // Returns the base 10 logarithm of a specified number.
        static Log10(f: number) { return Math.log10(f); }

        // Returns the smallest integer greater to or equal to /f/.
        static Ceil(f: number) { return Math.ceil(f); }

        // Returns the largest integer smaller to or equal to /f/.
        static Floor(f: number) { return Math.floor(f); }

        // Returns /f/ rounded to the nearest integer.
        static Round(f: number) { return Math.round(f); }

        // Returns the smallest integer greater to or equal to /f/.
        static CeilToInt(f: number) { return Math.ceil(f); }

        // Returns the largest integer smaller to or equal to /f/.
        static FloorToInt(f: number) { return Math.floor(f); }

        // Returns /f/ rounded to the nearest integer.
        static RoundToInt(f: number) { return Math.round(f); }

        // Returns the sign of /f/.
        static Sign(f: number) { return f >= 0 ? 1 : -1; }

        // The infamous ''3.14159265358979...'' value (RO).
        static readonly PI = Math.PI;

        // A representation of positive infinity (RO).
        static readonly Infinity = Infinity;

        // A representation of negative infinity (RO).
        static readonly NegativeInfinity = -Infinity;

        // Degrees-to-radians conversion constant (RO).
        static readonly Deg2Rad = Mathf.PI * 2 / 360;

        // Radians-to-degrees conversion constant (RO).
        static readonly Rad2Deg = 1 / Mathf.Deg2Rad;

        // We cannot round to more decimals than 15 according to docs for System.Math.Round.
        private static readonly kMaxDecimals = 15;

        // A tiny floating point value (RO).
        static readonly Epsilon = 1.401298e-45;

        // Clamps a value between a minimum float and maximum float value.
        static Clamp(value: number, min: number, max: number)
        {
            if (value < min)
            { value = min; }
            else if (value > max)
            { value = max; }

            return value;
        }

        // Clamps value between 0 and 1 and returns value
        static Clamp01(value: number)
        {
            if (value < 0)
            { return 0; }
            else if (value > 1)
            { return 1; }

            return value;
        }

        // Interpolates between /a/ and /b/ by /t/. /t/ is clamped between 0 and 1.
        static Lerp(a: number, b: number, t: number)
        {
            return a + (b - a) * Mathf.Clamp01(t);
        }

        // Interpolates between /a/ and /b/ by /t/ without clamping the interpolant.
        static LerpUnclamped(a: number, b: number, t: number)
        {
            return a + (b - a) * t;
        }

        // Same as ::ref::Lerp but makes sure the values interpolate correctly when they wrap around 360 degrees.
        static LerpAngle(a: number, b: number, t: number)
        {
            let delta = Mathf.Repeat((b - a), 360);
            if (delta > 180)
            { delta -= 360; }

            return a + delta * Mathf.Clamp01(t);
        }

        // Moves a value /current/ towards /target/.
        static MoveTowards(current: number, target: number, maxDelta: number)
        {
            if (Mathf.Abs(target - current) <= maxDelta)
            { return target; }

            return current + Mathf.Sign(target - current) * maxDelta;
        }

        // Same as ::ref::MoveTowards but makes sure the values interpolate correctly when they wrap around 360 degrees.
        static MoveTowardsAngle(current: number, target: number, maxDelta: number)
        {
            const deltaAngle = Mathf.DeltaAngle(current, target);
            if (-maxDelta < deltaAngle && deltaAngle < maxDelta)
            { return target; }
            target = current + deltaAngle;

            return Mathf.MoveTowards(current, target, maxDelta);
        }

        // Interpolates between /min/ and /max/ with smoothing at the limits.
        static SmoothStep(from: number, to: number, t: number)
        {
            t = Mathf.Clamp01(t);
            t = -2.0 * t * t * t + 3.0 * t * t;

            return to * t + from * (1 - t);
        }

        //* undocumented
        static Gamma(value: number, absmax: number, gamma: number)
        {
            const negative = value < 0;
            const absval = Mathf.Abs(value);
            if (absval > absmax)
            { return negative ? -absval : absval; }

            const result = Mathf.Pow(absval / absmax, gamma) * absmax;

            return negative ? -result : result;
        }

        // Compares two floating point values if they are similar.
        static Approximately(a: number, b: number)
        {
            // If a or b is zero, compare that the other is less or equal to epsilon.
            // If neither a or b are 0, then find an epsilon that is good for
            // comparing numbers at the maximum magnitude of a and b.
            // Floating points have about 7 significant digits, so
            // 1.000001f can be represented while 1.0000001f is rounded to zero,
            // thus we could use an epsilon of 0.000001f for comparing values close to 1.
            // We multiply this epsilon by the biggest magnitude of a and b.
            return Mathf.Abs(b - a) < Mathf.Max(0.000001 * Mathf.Max(Mathf.Abs(a), Mathf.Abs(b)), Mathf.Epsilon * 8);
        }

        static SmoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number)
        {
            const deltaTime = Time.deltaTime;

            return Mathf.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        static SmoothDamp1(current: number, target: number, currentVelocity: number, smoothTime: number)
        {
            const deltaTime = Time.deltaTime;
            const maxSpeed = Mathf.Infinity;

            return Mathf.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        // Gradually changes a value towards a desired goal over time.
        static SmoothDamp2(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed = Mathf.Infinity, deltaTime = Time.deltaTime)
        {
            // Based on Game Programming Gems 4 Chapter 1.10
            smoothTime = Mathf.Max(0.0001, smoothTime);
            const omega = 2 / smoothTime;

            const x = omega * deltaTime;
            const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
            let change = current - target;
            const originalTo = target;

            // Clamp maximum speed
            const maxChange = maxSpeed * smoothTime;
            change = Mathf.Clamp(change, -maxChange, maxChange);
            target = current - change;

            const temp = (currentVelocity + omega * change) * deltaTime;
            currentVelocity = (currentVelocity - omega * temp) * exp;
            let output = target + (change + temp) * exp;

            // Prevent overshooting
            if (originalTo - current > 0.0 === output > originalTo)
            {
                output = originalTo;
                currentVelocity = (output - originalTo) / deltaTime;
            }

            return output;
        }

        static SmoothDampAngle(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number)
        {
            const deltaTime = Time.deltaTime;

            return Mathf.SmoothDampAngle2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        static SmoothDampAngle1(current: number, target: number, currentVelocity: number, smoothTime: number)
        {
            const deltaTime = Time.deltaTime;
            const maxSpeed = Mathf.Infinity;

            return Mathf.SmoothDampAngle2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        // Gradually changes an angle given in degrees towards a desired goal angle over time.
        static SmoothDampAngle2(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed = Mathf.Infinity, deltaTime = Time.deltaTime)
        {
            target = current + Mathf.DeltaAngle(current, target);

            return Mathf.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
        }

        // Loops the value t, so that it is never larger than length and never smaller than 0.
        static Repeat(t: number, length: number)
        {
            return Mathf.Clamp(t - Mathf.Floor(t / length) * length, 0.0, length);
        }

        // PingPongs the value t, so that it is never larger than length and never smaller than 0.
        static PingPong(t: number, length: number)
        {
            t = Mathf.Repeat(t, length * 2);

            return length - Mathf.Abs(t - length);
        }

        // Calculates the ::ref::Lerp parameter between of two values.
        static InverseLerp(a: number, b: number, value: number)
        {
            if (a !== b)
            {
                return Mathf.Clamp01((value - a) / (b - a));
            }

            return 0.0;
        }

        // Calculates the shortest difference between two given angles.
        static DeltaAngle(current: number, target: number)
        {
            let delta = Mathf.Repeat((target - current), 360.0);
            if (delta > 180.0)
            { delta -= 360.0; }

            return delta;
        }

        // Infinite Line Intersection (line1 is p1-p2 and line2 is p3-p4)
        static LineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2, result: Vector2)
        {
            const bx = p2.x - p1.x;
            const by = p2.y - p1.y;
            const dx = p4.x - p3.x;
            const dy = p4.y - p3.y;
            const bDotDPerp = bx * dy - by * dx;
            if (bDotDPerp === 0)
            {
                return false;
            }
            const cx = p3.x - p1.x;
            const cy = p3.y - p1.y;
            const t = (cx * dy - cy * dx) / bDotDPerp;

            result.x = p1.x + t * bx;
            result.y = p1.y + t * by;

            return true;
        }

        // Line Segment Intersection (line1 is p1-p2 and line2 is p3-p4)
        static LineSegmentIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2, result: Vector2)
        {
            const bx = p2.x - p1.x;
            const by = p2.y - p1.y;
            const dx = p4.x - p3.x;
            const dy = p4.y - p3.y;
            const bDotDPerp = bx * dy - by * dx;
            if (bDotDPerp === 0)
            {
                return false;
            }
            const cx = p3.x - p1.x;
            const cy = p3.y - p1.y;
            const t = (cx * dy - cy * dx) / bDotDPerp;
            if (t < 0 || t > 1)
            {
                return false;
            }
            const u = (cx * by - cy * bx) / bDotDPerp;
            if (u < 0 || u > 1)
            {
                return false;
            }

            result.x = p1.x + t * bx;
            result.y = p1.y + t * by;

            return true;
        }

        // static RandomToLong(System.Random r)
        // {
        //     var buffer = new byte[8];
        //     r.NextBytes(buffer);
        //     return (long)(System.BitConverter.ToUInt64(buffer, 0) & System.Int64.MaxValue);
        // }

        // static ClampToFloat(value: number)
        // {
        //     if (Mathf.Infinity === value)
        //         return Mathf.Infinity;

        //     if (Mathf.NegativeInfinity === value)
        //         return Mathf.NegativeInfinity;

        //     if (value < float.MinValue)
        //         return float.MinValue;

        //     if (value > float.MaxValue)
        //         return float.MaxValue;

        //     return (float)value;
        // }

        // //         internal static int ClampToInt(long value)
        // // {
        // //     if (value < int.MinValue)
        // //         return int.MinValue;

        // //     if (value > int.MaxValue)
        // //         return int.MaxValue;

        // //     return (int)value;
        // // }

        static RoundToMultipleOf(value: number, roundingValue: number)
        {
            if (roundingValue === 0)
            {
                return value;
            }

            return Mathf.Round(value / roundingValue) * roundingValue;
        }

        static GetClosestPowerOfTen(positiveNumber: number)
        {
            if (positiveNumber <= 0)
            {
                return 1;
            }

            return Mathf.Pow(10, Mathf.RoundToInt(Mathf.Log10(positiveNumber)));
        }

        static GetNumberOfDecimalsForMinimumDifference(minDifference: number)
        {
            return Mathf.Clamp(-Mathf.FloorToInt(Mathf.Log10(Mathf.Abs(minDifference))), 0, Mathf.kMaxDecimals);
        }

        static GetNumberOfDecimalsForMinimumDifference1(minDifference: number)
        {
            return Math.max(0.0, -Math.floor(Math.log10(Math.abs(minDifference))));
        }

        // static RoundBasedOnMinimumDifference(valueToRound: number, minDifference: number)
        // {
        //     if (minDifference === 0)
        //     {
        //         return Mathf.DiscardLeastSignificantDecimal(valueToRound);
        //     }

        //     return Math.round(valueToRound, Mathf.GetNumberOfDecimalsForMinimumDifference(minDifference),
        //         System.MidpointRounding.AwayFromZero);
        // }

        // static RoundBasedOnMinimumDifference1(valueToRound: number, minDifference: number)
        // {
        //     if (minDifference === 0)
        //     {
        //         return Mathf.DiscardLeastSignificantDecimal(valueToRound);
        //     }

        //     return Math.Round(valueToRound, Mathf.GetNumberOfDecimalsForMinimumDifference(minDifference),
        //         System.MidpointRounding.AwayFromZero);
        // }

        // static DiscardLeastSignificantDecimal(v: number)
        // {
        //     const decimals = Mathf.Clamp((5 - Mathf.Log10(Mathf.Abs(v))), 0, Mathf.kMaxDecimals);

        //     return Math.round(v, decimals, System.MidpointRounding.AwayFromZero);
        // }

        // static DiscardLeastSignificantDecimal1(v: number)
        // {
        //     const decimals = Math.max(0, (5 - Math.log10(Math.abs(v))));
        //     try
        //     {
        //         return Math.Round(v, decimals);
        //     }
        //     catch (System.ArgumentOutOfRangeException)
        //     {
        //         // This can happen for very small numbers.
        //         return 0;
        //     }
        // }
    }
}