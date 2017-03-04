module feng3d
{
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    var $REVISION: string = "0.0.0";
    console.log(`Feng3D version ${$REVISION}`)

    /*************************** 初始化模块 ***************************/
    //键盘鼠标输入模块
    export var input = new Input();
    export var inputType = new InputEventType();

    //快捷键模块
    export var shortcut = new ShortCut();
}