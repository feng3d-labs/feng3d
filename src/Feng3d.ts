module feng3d
{
    export class Engine
    {
        /**
         * feng3d的版本号
         * @author feng 2015-03-20
         */
        private revision: string = "0.0.0";

        private _serialization: Serialization;
        private _input: Input;
        private _inputType: InputEventType;
        private _shortcut: ShortCut;
        private _defaultMaterial: StandardMaterial;
        private _defaultGeometry: Geometry;
        private _systemTicker: SystemTicker;

        constructor()
        {
            console.log(`Feng3D version ${this.revision}`)
        }

        /**
         * 是否开启调试(主要用于断言)
         */
        debuger = true;

        /**
         * 数据持久化
         */
        get serialization()
        {
            return this._serialization = this._serialization || new Serialization();
        }

        /**
         * 键盘鼠标输入
         */
        get input()
        {
            return this._input = this._input || new Input();
        }

        get inputType()
        {
            return this._inputType = this._inputType || new InputEventType();
        }

        /**
         * 快捷键
         */
        get shortcut()
        {
            return this._shortcut = this._shortcut || new ShortCut();
        }

        /**
         * 默认材质
         */
        get defaultMaterial()
        {
            return this._defaultMaterial = this._defaultMaterial || new StandardMaterial();
        }

        /**
         * 默认几何体
         */
        get defaultGeometry()
        {
            return this._defaultGeometry = this._defaultGeometry || new CubeGeometry();
        }

        /**
         * 心跳计时器单例
         */
        get ticker()
        {
            return this._systemTicker = this._systemTicker || new SystemTicker();
        }
    }

    export var engine = new Engine();
}