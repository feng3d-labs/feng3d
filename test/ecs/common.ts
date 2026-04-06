import { Component, RegisterComponent } from '../../src/ecs/Component';

declare module '../../src/ecs/Component'
{
    /**
     * 组件映射
     */
    interface ComponentMap
    {
        CustomComponent: CustomComponent
        ComponentA: ComponentA
    }
}

@RegisterComponent({ name: 'CustomComponent' })
export class CustomComponent extends Component
{

}

@RegisterComponent({ name: 'ComponentA' })
export class ComponentA extends Component
{

}

export class ComponentB extends Component
{

}
