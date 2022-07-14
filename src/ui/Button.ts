namespace feng3d { export interface ComponentMap { Button: feng2d.Button; } }

namespace feng2d
{
    /**
     * 按钮状态
     */
    export enum ButtonState
    {
        /**
         * 弹起状态，默认状态。
         */
        up = "up",
        /**
         * 鼠标在按钮上状态。
         */
        over = "over",
        /**
         * 鼠标按下状态。
         */
        down = "down",
        /**
         * 选中时弹起状态。
         */
        selected_up = "selected_up",
        /**
         * 选中时鼠标在按钮上状态。
         */
        selected_over = "selected_over",
        /**
         * 选中时鼠标按下状态。
         */
        selected_down = "selected_down",
        /**
         * 禁用状态。
         */
        disabled = "disabled",
    }

    /**
     * 按钮
     */
    @feng3d.AddComponentMenu("UI/Button")
    @feng3d.RegisterComponent()
    export class Button extends feng3d.Behaviour
    {
        /**
         * 按钮所处状态。
         */
        @feng3d.oav({ block: "Layout", tooltip: "按钮所处状态。", component: "OAVEnum", componentParam: { enumClass: ButtonState } })
        @feng3d.watch("_onStateChanged")
        state = ButtonState.up;

        /**
         * 所有状态数据，每一个状态数据中记录了子对象的当前数据。
         */
        @feng3d.serialize
        allStateData = {};

        private _stateInvalid = true;

        /**
         * 保存当前状态，例如在编辑器中编辑完按钮某一状态后调用该方法进行保存当前状态数据。
         */
        @feng3d.oav()
        saveState()
        {
            var stateData = {};
            // 出现相同名称时，只保存第一个数据
            var childMap: { [name: string]: feng3d.GameObject } = {};
            this.gameObject.children.forEach(child =>
            {
                if (childMap[child.name]) return;
                childMap[child.name] = child;
            });
            for (const childname in childMap)
            {
                var jsonObj = feng3d.serialization.serialize(childMap[childname]);
                feng3d.serialization.deleteCLASS_KEY(jsonObj);
                stateData[childname] = jsonObj;
            }
            this.allStateData[this.state] = stateData;
        }

        private _onStateChanged()
        {
            this._stateInvalid = true;
        }

        /**
         * 每帧执行
         */
        update(interval?: number)
        {
            if (this._stateInvalid)
            {
                this._updateState();
                this._stateInvalid = false;
            }
        }

        /**
         * 更新状态
         */
        private _updateState()
        {
            var statedata = this.allStateData[this.state];
            if (!statedata) return;
            var childMap: { [name: string]: feng3d.GameObject } = {};
            this.gameObject.children.forEach(child =>
            {
                if (childMap[child.name]) return;
                childMap[child.name] = child;
            });
            for (const childname in childMap)
            {
                childMap[childname] = feng3d.serialization.setValue(childMap[childname], statedata[childname]);
            }
        }

    }
}

namespace feng3d
{
    GameObject.registerPrimitive("Button", (g) =>
    {
        var transform2D = g.addComponent("Transform2D");

        transform2D.size.x = 160;
        transform2D.size.y = 30;
        g.addComponent("Button")
    });

    export interface PrimitiveGameObject
    {
        Button: GameObject;
    }
    // 在 Hierarchy 界面新增右键菜单项
    createNodeMenu.push(
        {
            path: "UI/按钮",
            priority: -2,
            click: () =>
            {
                return GameObject.createPrimitive("Button");
            }
        }
    );

}