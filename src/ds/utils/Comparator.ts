namespace feng3d
{
    export type CompareFunction<T> = (a: T, b: T) => number;

    /**
     * 比较器
     */
    export class Comparator<T>
    {
        /**
         * 默认比较函数。只能处理 a和b 同为string或number的比较。
         * 
         * @param a 比较值a
         * @param b 比较值b
         */
        static defaultCompareFunction(a: string | number, b: string | number)
        {
            if (a === b) return 0;
            return a < b ? -1 : 1;
        }

        private compare: CompareFunction<T>;

        /**
         * 构建比较器
         * @param compareFunction 比较函数 
         */
        constructor(compareFunction?: CompareFunction<T>)
        {
            this.compare = compareFunction || <any>Comparator.defaultCompareFunction;
        }

        /**
         * 检查 a 是否等于 b 。
         * 
         * @param a 值a
         * @param b 值b
         */
        equal(a: T, b: T)
        {
            return this.compare(a, b) === 0;
        }

        /**
         * 检查 a 是否小于 b 。
         * 
         * @param a 值a
         * @param b 值b
         */
        lessThan(a: T, b: T)
        {
            return this.compare(a, b) < 0;
        }

        /**
         * 检查 a 是否大于 b 。
         * 
         * @param a 值a
         * @param b 值b
         */
        greaterThan(a: T, b: T)
        {
            return this.compare(a, b) > 0;
        }

        /**
         * 检查 a 是否小于等于 b 。
         * 
         * @param a 值a
         * @param b 值b
         */
        lessThanOrEqual(a: T, b: T)
        {
            return this.lessThan(a, b) || this.equal(a, b);
        }

        /**
         * 检查 a 是否大于等于 b 。
         * 
         * @param a 值a
         * @param b 值b
         */
        greaterThanOrEqual(a: T, b: T)
        {
            return this.greaterThan(a, b) || this.equal(a, b);
        }

        /**
         * 反转比较函数。
         */
        reverse()
        {
            const compareOriginal = this.compare;
            this.compare = (a, b) => compareOriginal(b, a);
        }
    }
}