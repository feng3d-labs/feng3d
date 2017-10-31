module feng3d
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
     * 快捷键
     */
    export var shortcut = new ShortCut();

    /**
     * 资源路径
     */
    export var assetsRoot = "";

    export var componentMap = {
        Transform: Transform,
    };

    console.log(`Feng3D version ${revision}`)
}