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
     * 心跳计时器单例
     */
    export var ticker = new SystemTicker();

    /**
     * 默认几何体
     */
    export var defaultGeometry = new CubeGeometry();

    /**
     * 默认材质
     */
    export var defaultMaterial = new StandardMaterial();

	/**
     * 快捷键
     */
    export var shortcut = new ShortCut();

    console.log(`Feng3D version ${revision}`)
}