module feng3d
{
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    export var revision: string = "0.0.0";
    //webgl 1
    export type GL = WebGLRenderingContext;
    export var GL = WebGLRenderingContext;
    /**
     * 是否开启调试(主要用于断言)
     */
    export var debuger = true;
    /**
     * 数据持久化
     */
    export var serialization: Serialization;
    /**
     * 键盘鼠标输入
     */
    export var input: Input;
    export var inputType: InputEventType;
    /**
     * 快捷键
     */
    export var shortcut: ShortCut;
    /**
     * 默认材质
     */
    export var defaultMaterial: StandardMaterial;
    /**
     * 默认几何体
     */
    export var defaultGeometry: Geometry;
    /**
     * 心跳计时器单例
     */
    export var ticker: SystemTicker;
    /**
     * 着色器库，由shader.ts初始化
     */
    export var shaderFileMap: { [filePath: string]: string };
    /**
     * 3D环境对象池
     */
    export var context3DPool: RenderBufferPool;

    /**
     * 初始化引擎
     */
    export function initEngine()
    {
        if (!isInit)
        {
            isInit = true;
            console.log(`Feng3D version ${this.revision}`)
            serialization = new Serialization();
            input = new Input();
            inputType = new InputEventType();
            shortcut = new ShortCut();
            defaultMaterial = new StandardMaterial();
            defaultGeometry = new CubeGeometry();
            ticker = new SystemTicker();
            context3DPool = new RenderBufferPool();
        }
        if (initFunctions)
        {
            for (var i = 0; i < initFunctions.length; i++)
            {
                var element = initFunctions[i];
                element();
            }
            delete feng3d.initFunctions;
        }
    }
    var isInit = false;

    /**
     * 初始化函数列表
     */
    export var initFunctions: Function[];
}