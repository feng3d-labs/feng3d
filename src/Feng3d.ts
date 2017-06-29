namespace feng3d
{
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    export var revision: string = "0.0.0";
    /**
     * 是否开启调试(主要用于断言)
     */
    export var debuger = true;
    /**
     * 数据持久化
     */
    export var serialization: Serialization;
    /**
     * 默认材质
     */
    export var defaultMaterial: StandardMaterial;
    /**
     * 默认几何体
     */
    export var defaultGeometry: Geometry;
    /**
     * 着色器库，由shader.ts初始化
     */
    export var shaderFileMap: { [filePath: string]: string };

    /**
     * 初始化引擎
     */
    export function initEngine()
    {
        if (initFunctions)
        {
            for (var i = 0; i < initFunctions.length; i++)
            {
                var element = initFunctions[i];
                element();
            }
            delete feng3d.initFunctions;
        }
        if (!isInit)
        {
            isInit = true;
            console.log(`Feng3D version ${this.revision}`)
            serialization = new Serialization();
            ShortCut.init();
            SystemTicker.init();
            defaultMaterial = new StandardMaterial();
            defaultGeometry = new CubeGeometry();
        }
    }
    var isInit = false;

    /**
     * 初始化函数列表
     */
    export var initFunctions: Function[];
}