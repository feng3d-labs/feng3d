interface ArrayConstructor
{
    /**
     * Creates an array from an array-like object.
     * @param arrayLike An array-like object to convert to an array.
     * @param mapfn A mapping function to call on every element of the array.
     * @param thisArg Value of 'this' used to invoke the mapfn.
     */
    from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): U[];
}

interface Array<T>
{
    /**
     * 使数组元素变得唯一,除去相同值
     * @param compareFn 比较函数
     */
    unique(compareFn?: (a: T, b: T) => boolean): this;

    /**
     * 数组元素是否唯一
     * @param compareFn 比较函数
     */
    isUnique(compareFn?: (a: T, b: T) => boolean): boolean;
}

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Polyfill
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from)
{
    (function ()
    {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn)
        {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value)
        {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value)
        {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };

        // The length property of the from method is 1.
        Array.from = function from(arrayLike/*, mapFn, thisArg */)
        {
            // 1. Let C be the this value.
            var C = this;

            // 2. Let items be ToObject(arrayLike).
            var items = Object(arrayLike);

            // 3. ReturnIfAbrupt(items).
            if (arrayLike == null)
            {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            // 4. If mapfn is undefined, then let mapping be false.
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined')
            {
                // 5. else
                // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                if (!isCallable(mapFn))
                {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }

                // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (arguments.length > 2)
                {
                    T = arguments[2];
                }
            }

            // 10. Let lenValue be Get(items, "length").
            // 11. Let len be ToLength(lenValue).
            var len = toLength(items.length);

            // 13. If IsConstructor(C) is true, then
            // 13. a. Let A be the result of calling the [[Construct]] internal method 
            // of C with an argument list containing the single item len.
            // 14. a. Else, Let A be ArrayCreate(len).
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            // 16. Let k be 0.
            var k = 0;
            // 17. Repeat, while k < len… (also steps a - h)
            var kValue;
            while (k < len)
            {
                kValue = items[k];
                if (mapFn)
                {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else
                {
                    A[k] = kValue;
                }
                k += 1;
            }
            // 18. Let putStatus be Put(A, "length", len, true).
            A.length = len;
            // 20. Return A.
            return A;
        };
    }());
}

Array.prototype.unique = function (compareFn = (a, b) => (a == b))
{
    var arr: Array<any> = this;
    for (let i = arr.length - 1; i >= 0; i--)
    {
        for (let j = 0; j < i; j++)
        {
            if (compareFn(arr[i], arr[j]))
            {
                arr.splice(i, 1);
                break;
            }
        }
    }
    return this;
}

Array.prototype.isUnique = function (compareFn = (a, b) => (a == b))
{
    var arr: Array<any> = this;
    for (let i = arr.length - 1; i >= 0; i--)
    {
        for (let j = 0; j < i; j++)
        {
            if (compareFn(arr[i], arr[j]))
            {
                return false;
            }
        }
    }
    return true;
}