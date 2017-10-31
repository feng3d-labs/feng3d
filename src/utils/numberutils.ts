module feng3d
{
    export var numberutils = {
        fixed: fixed,
        toArray: toArray,
    };

    function fixed(a: number, fractionDigits?): number;
    function fixed<T extends ArrayLike<number>>(source: T, fractionDigits?): T;
    function fixed<T extends ArrayLike<number>>(source: ArrayLike<number>, fractionDigits?, target?: T): T;
    function fixed(source: any, fractionDigits = 6, target?: any, )
    {
        if (typeof source == "number")
            return Number(source.toFixed(fractionDigits));
        target = target || source;
        for (var i = 0; i < source.length; i++)
        {
            (<any>target)[i] = Number(source[i].toFixed(fractionDigits));
        }
        return target;
    }

    function toArray<T extends ArrayLike<number>>(source: T, target?: number[])
    {
        target = target || [];
        target.length = source.length;
        for (var i = 0; i < source.length; i++)
        {
            target[i] = source[i];
        }
        return target;
    }
}