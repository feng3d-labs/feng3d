module feng3d{
    
    /**
     * ArgumentError 类表示一种错误，如果函数提供的参数与为该函数定义的参数不一致，则会出现该错误。例如，如果在调用函数时使用了错误的参数数目、不正确的参数类型或无效参数，则会发生此错误。
     * @author feng 2016-3-25
     */
    export class ArgumentError extends Error
    {
        constructor(message?: string){
            super(message);
            console.error("ArgumentError: One of the parameters is invalid.")
        }
    }
}