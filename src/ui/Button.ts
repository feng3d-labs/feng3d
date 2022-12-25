import { Node3D } from '../core/core/Node3D';
import { AddComponentMenu } from '../core/Menu';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { RegisterComponent } from '../ecs/Component';
import { oav } from '../objectview/ObjectView';
import { Serializable } from '../serialization/Serializable';
import { $set, serialization } from '../serialization/Serialization';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { watcher } from '../watcher/watcher';
import { Component2D } from './core/Component2D';
import { Node2D } from './core/Node2D';

declare global
{
    export interface MixinsComponentMap
    {
        Button: Button;
    }

    export interface MixinsPrimitiveNode2D
    {
        Button: Node2D;
    }
}

/**
 * 按钮状态
 */
export enum ButtonState
{
    /**
     * 弹起状态，默认状态。
     */
    up = 'up',
    /**
     * 鼠标在按钮上状态。
     */
    over = 'over',
    /**
     * 鼠标按下状态。
     */
    down = 'down',
    /**
     * 选中时弹起状态。
     */
    selected_up = 'selected_up',
    /**
     * 选中时鼠标在按钮上状态。
     */
    selected_over = 'selected_over',
    /**
     * 选中时鼠标按下状态。
     */
    selected_down = 'selected_down',
    /**
     * 禁用状态。
     */
    disabled = 'disabled',
}

/**
 * 按钮
 */
@AddComponentMenu('UI/Button')
@RegisterComponent({ name: 'Button' })
@Serializable('Button')
export class Button extends Component2D
{
    /**
     * 按钮所处状态。
     */
    @oav({ block: 'Layout', tooltip: '按钮所处状态。', component: 'OAVEnum', componentParam: { enumClass: ButtonState } })
    state = ButtonState.up;

    /**
     * 所有状态数据，每一个状态数据中记录了子对象的当前数据。
     */
    @SerializeProperty()
    allStateData = {};

    private _stateInvalid = true;

    constructor()
    {
        super();
        watcher.watch(this as Button, 'state', this._onStateChanged, this);
    }

    /**
     * 保存当前状态，例如在编辑器中编辑完按钮某一状态后调用该方法进行保存当前状态数据。
     */
    @oav()
    saveState()
    {
        const stateData = {};
        // 出现相同名称时，只保存第一个数据
        const childMap: { [name: string]: Node2D } = {};
        this.node2d.children.forEach((child) =>
        {
            if (childMap[child.name]) return;
            childMap[child.name] = child;
        });
        for (const childname in childMap)
        {
            const jsonObj = serialization.serialize(childMap[childname]);
            serialization.deleteClassKey(jsonObj);
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
    update(_interval?: number)
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
        const statedata = this.allStateData[this.state];
        if (!statedata) return;
        const childMap: { [name: string]: Node2D } = {};
        this.node2d.children.forEach((child) =>
        {
            if (childMap[child.name]) return;
            childMap[child.name] = child;
        });
        for (const childname in childMap)
        {
            childMap[childname] = $set(childMap[childname], statedata[childname]);
        }
    }
}

Node2D.registerPrimitive('Button', (g) =>
{
    g.size.x = 160;
    g.size.y = 30;
    g.addComponent(Button);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Button',
        priority: -2,
        click: () =>
            Node2D.createPrimitive('Button')
    }
);

