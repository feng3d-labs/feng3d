namespace feng3d
{
    /**
     * 对象池
     */
    export class Pool<T>
    {
        private _objects: T[];
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
    }
}