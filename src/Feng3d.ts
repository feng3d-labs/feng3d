module feng3d
{
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    var $REVISION: string = "0.0.0";
    console.log(`Feng3D version ${$REVISION}`)

    /*************************** 初始化模块 ***************************/
    /**
     * 是否开启调试(主要用于断言)
     */
    export var debuger = true;

    //数据持久化
    export var serialization = new Serialization();

    //键盘鼠标输入
    export var input = new Input();
    export var inputType = new InputEventType();

    //快捷键
    export var shortcut = new ShortCut();
}