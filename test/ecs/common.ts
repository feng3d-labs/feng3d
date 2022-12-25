import { Component, RegisterComponent } from '../../src/ecs/Component'

declare global
{
    /**
     * 组件映射
     */
    interface MixinsComponentMap
    {
        CustomComponent: CustomComponent
    }
}

@RegisterComponent()
export class CustomComponent extends Component
{

}

@RegisterComponent()
export class ComponentA extends Component
{

}

export class ComponentB extends Component
{

}
