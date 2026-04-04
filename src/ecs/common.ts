import { Component, RegisterComponent } from "./Component"

declare module './Component'
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
