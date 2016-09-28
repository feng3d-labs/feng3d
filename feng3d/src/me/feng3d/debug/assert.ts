module feng3d {

    /**
	 * 断言
	 * @b			判定为真的表达式
	 * @msg			在表达式为假时将输出的错误信息
	 * @author feng 2014-10-29
	 */
    export function assert(b: boolean, msg: string = "assert"): void {
        if (!b)
            throw msg;
    }
}