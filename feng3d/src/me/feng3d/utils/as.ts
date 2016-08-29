module me.feng3d {

    /**
     * 如果a为b类型则返回，否则返回null
     */
    export function as(a, b: Function) {
        if (!is(a, b))
            return null;
        return <any>a;
    }
}