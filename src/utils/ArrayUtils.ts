module feng3d
{

    /**
     * 数组工具
     * @author feng 2017-01-03
     */
    export class ArrayUtils
    {

        /**
         * 删除数据元素
         * @param source    数组源数据
         * @param item      被删除数据
         * @param all       是否删除所有相同数据
         */
        static removeItem<T>(source: T[], item: T, all = false)
        {

            var deleteIndexs: number[] = [];
            var index = source.indexOf(item);
            while (index != -1)
            {
                source.splice(index, 1);
                deleteIndexs.push(index);
                all || (index = -1);
            }
            return { deleteIndexs: deleteIndexs, length: source.length };
        }
    }
}