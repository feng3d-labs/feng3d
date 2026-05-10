// @ts-ignore

export const HalfFloat: { encodeFloat16AsInt16: (value: number) => number, Float16Array: (numArray: number[]) => Int16Array } = {};

(function ()
{
    let exponent = 0;
    let mantissa = 0;

    let bits = 0;

    const data64 = new DataView(new ArrayBuffer(8));
    const data16 = new DataView(new ArrayBuffer(2));

    const UNIT_VALUE = 1 / 1024;

    // http://stackoverflow.com/questions/28688838/convert-a-number-into-a-16-bit-float-stored-as-bytes-and-back
    // http://croquetweak.blogspot.de/2014/08/deconstructing-floats-frexp-and-ldexp.html
    function frexp(value)
    {
        if (value === 0)
        {
            mantissa = 0;
            exponent = 0;

            return;
        }
        data64.setFloat64(0, value);
        bits = (data64.getUint32(0) >>> 20) & 0x7FF;
        if (bits === 0)
        {
            data64.setFloat64(0, value * Math.pow(2, 64));
            bits = ((data64.getUint32(0) >>> 20) & 0x7FF) - 64;
        }
        exponent = bits - 1022;
        mantissa = ldexp(value, -exponent);
    }

    function ldexp(f, e)
    {
        // avoid multiplying by infinity and zero
        return e > 1023 ? f * Math.pow(2, 1023) * Math.pow(2, e - 1023)
            : e < -1074 ? f * Math.pow(2, -1074) * Math.pow(2, e + 1074) : f * Math.pow(2, e);
    }

    let signBit;
    let sign;
    let exp;
    let frac;
    HalfFloat.encodeFloat16AsInt16 = function (value: number): number
    {
        // Inf unhandled here

        // https://en.wikipedia.org/wiki/Half-precision_floating-point_format
        frexp(value);

        if (mantissa === 0)
        {
            // zero
            data16.setInt16(0, 0);

            return data16.getInt16(0);
        }

        signBit = mantissa < 0 ? 1 : 0;
        sign = signBit << 15;
        exp = 0;
        frac = 0;

        if (exponent <= -14)
        {
            // subnormal value
            frac = Math.abs(mantissa * Math.pow(2, exponent + 14)) / UNIT_VALUE;
            data16.setInt16(0, sign + exp + frac);

            return data16.getInt16(0);
        }

        // normalized value
        if (mantissa < 1.0)
        {
            mantissa = mantissa * 2 - 1;
            exponent = exponent - 1;
        }

        exp = (exponent + 15) << 10;
        frac = Math.abs(mantissa) / UNIT_VALUE;

        data16.setInt16(0, sign + exp + frac);

        return data16.getInt16(0);
    };

    /**
     * Returns a float 16 array buffer which is actually encoded as Int16Array
     * @param numArray: javaScript number Array
     */
    let i;
    HalfFloat.Float16Array = function (numArray: number[]): Int16Array
    {
        const float16Array = new Int16Array(new ArrayBuffer(2 * numArray.length));
        const tmpArray = new Array(numArray.length);
        for (i = 0; i < numArray.length; ++i)
        {
            tmpArray[i] = HalfFloat.encodeFloat16AsInt16(numArray[i]);
        }
        float16Array.set(tmpArray, 0);

        return float16Array;
    };
})();

