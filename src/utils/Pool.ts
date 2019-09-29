namespace feng3d
{
    /**
     * 对象池
     * 
     * 对象池并不能带来性能的提升，反而会严重影响性能。但是在管理内存时可以考虑使用。
     * 
     * js虚拟机会在对象没有被引用时自动释放内存，谨慎使用对象池。
     * 
     */
    export class Pool<T>
    {
        private _objects: T[] = [];
        private _type: new (...args: any[]) => T;

        constructor(type: Constructor<T>)
        {
            this._type = type;
        }

        /**
         * 获取对象
         */
        get()
        {
            var obj = this._objects.pop();
            if (obj) return obj;
            return new this._type();
        }

        /**
         * 释放对象
         * 
         * @param args 被释放对象列表
         */
        release(...args: T[])
        {
            args.forEach(element =>
            {
                this._objects.push(element);
            });
        }

        /**
         * 获取指定数量的对象
         * 
         * @param num 数量
         */
        getArray(num: number)
        {
            var arr: T[];
            if (this._objects.length <= num)
            {
                arr = this._objects.concat();
                this._objects.length = 0;
            } else
            {
                arr = this._objects.splice(0, num);
            }
            while (arr.length < num)
            {
                arr.push(new this._type());
            }
            return arr;
        }

        /**
         * 释放对象
         * 
         * @param objects 被释放对象列表
         */
        releaseArray(objects: T[])
        {
            objects.forEach(element =>
            {
                this._objects.push(element);
            });
        }
    }
}