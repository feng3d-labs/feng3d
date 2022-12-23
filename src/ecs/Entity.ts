// import { EventEmitter } from '../event/EventEmitter';
// import { IEvent } from '../event/IEvent';
// import { oav } from '../objectview/ObjectView';
// import { Constructor } from '../polyfill/Types';
// import { serialize } from '../serialization/Serialization';
// import { Component, ComponentMap, ComponentNames } from './Component';

// type Components = ComponentMap[ComponentNames];

// export interface EntityEventMap extends MixinsEntityEventMap
// {
//     /**
//      * 添加子组件事件
//      */
//     addComponent: { entity: Entity, component: Component };

//     /**
//      * 移除子组件事件
//      */
//     removeComponent: { entity: Entity, component: Component };
// }

// /**
//  * 实体，场景唯一存在的对象类型
//  */
// export class Entity<T extends EntityEventMap = EntityEventMap> extends EventEmitter<T>
// {
//     __class__: 'feng3d.Entity';

//     /**
//      * 名称
//      */
//     @serialize
//     @oav({ component: 'OAVEntityName' })
//     get name()
//     {
//         return this._name;
//     }
//     set name(v)
//     {
//         this._name = v;
//     }
//     protected _name: string = null;

//     /**
//      * 标签
//      */
//     @serialize
//     tag: string;

//     /**
//      * 子组件个数
//      */
//     get numComponents()
//     {
//         return this._components.length;
//     }

//     @serialize
//     @oav({ component: 'OAVComponentList' })
//     get components()
//     {
//         return this._components.concat();
//     }
//     set components(value)
//     {
//         if (!value) return;
//         for (let i = 0, n = value.length; i < n; i++)
//         {
//             const component = value[i];
//             if (!component) continue;
//             this.addComponentAt(value[i], this.numComponents);
//         }
//     }

//     // ------------------------------------------
//     // Functions
//     // ------------------------------------------
//     /**
//      * 构建3D对象
//      */
//     constructor()
//     {
//         super();
//         this.name = 'Entity';

//         this.onAny(this._onAnyListener, this);
//     }

//     /**
//      * 获取指定位置索引的子组件
//      *
//      * @param index 位置索引
//      * @returns             子组件
//      */
//     getComponentAt(index: number): Component
//     {
//         console.assert(index < this.numComponents, '给出索引超出范围');

//         return this._components[index];
//     }

//     /**
//      * 添加指定组件类型到实体
//      *
//      * @type type 被添加组件类定义
//      */
//     addComponent<T extends Component>(Type: Constructor<T>, callback?: (component: T) => void): T
//     {
//         let component = this.getComponent(Type);
//         if (component && Component.isSingleComponent(Type))
//         {
//             // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
//             return component;
//         }
//         const dependencies = Component.getDependencies(Type);
//         // 先添加依赖
//         dependencies.forEach((dependency) =>
//         {
//             this.addComponent(dependency);
//         });
//         //
//         component = new Type();
//         this.addComponentAt(component, this._components.length);
//         callback && callback(component);

//         return component;
//     }

//     /**
//      * 获取实体上第一个指定类型的组件，不存在时返回null
//      *
//      * @param type 类定义
//      * @returns                  返回指定类型组件
//      */
//     getComponent<T extends Component>(type: Constructor<T>): T
//     {
//         const component = this.getComponents(type)[0];

//         return component;
//     }

//     /**
//      * 获取实体上所有指定类型的组件数组
//      *
//      * @param type 类定义
//      * @returns         返回与给出类定义一致的组件
//      */
//     getComponents<T extends Component>(type: Constructor<T>): T[]
//     {
//         console.assert(!!type, `类型不能为空！`);

//         const cls = type;
//         if (!cls)
//         {
//             console.warn(`无法找到 ${type.name} 组件类定义，请使用 @RegisterComponent() 在组件类上标记。`);

//             return [];
//         }
//         const filterResult: any = this._components.filter((v) => v instanceof cls);

//         return filterResult;
//     }

//     /**
//      * 设置子组件的位置
//      *
//      * @param component 子组件
//      * @param index 位置索引
//      */
//     setComponentIndex<T extends Component>(component: T, index: number): void
//     {
//         console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

//         const oldIndex = this._components.indexOf(component);
//         console.assert(oldIndex >= 0 && oldIndex < this.numComponents, '子组件不在容器内');

//         this._components.splice(oldIndex, 1);
//         this._components.splice(index, 0, component);
//     }

//     /**
//      * 设置组件到指定位置
//      *
//      * @param component 被设置的组件
//      * @param index 索引
//      */
//     setComponentAt<T extends Component>(component: T, index: number)
//     {
//         if (this._components[index])
//         {
//             this.removeComponentAt(index);
//         }
//         this.addComponentAt(component, index);
//     }

//     /**
//      * 移除组件
//      *
//      * @param component 被移除组件
//      */
//     removeComponent<T extends Component>(component: T): void
//     {
//         console.assert(this.hasComponent(component), '只能移除在容器中的组件');

//         const index = this.getComponentIndex(component);
//         this.removeComponentAt(index);
//     }

//     /**
//      * 获取组件在容器的索引位置
//      *
//      * @param component 查询的组件
//      * @returns                 组件在容器的索引位置
//      */
//     getComponentIndex<T extends Component>(component: T): number
//     {
//         console.assert(this._components.indexOf(component) !== -1, '组件不在容器中');

//         const index = this._components.indexOf(component);

//         return index;
//     }

//     /**
//      * 移除组件
//      *
//      * @param index 要删除的 Component 的子索引。
//      */
//     removeComponentAt(index: number): Component
//     {
//         console.assert(index >= 0 && index < this.numComponents, '给出索引超出范围');

//         const component: Component = this._components.splice(index, 1)[0];
//         // 派发移除组件事件
//         this.emit('removeComponent', { component, entity: this }, true);
//         component.dispose();

//         return component;
//     }

//     /**
//      * 交换子组件位置
//      *
//      * @param index1 第一个子组件的索引位置
//      * @param index2 第二个子组件的索引位置
//      */
//     swapComponentsAt(index1: number, index2: number): void
//     {
//         console.assert(index1 >= 0 && index1 < this.numComponents, '第一个子组件的索引位置超出范围');
//         console.assert(index2 >= 0 && index2 < this.numComponents, '第二个子组件的索引位置超出范围');

//         const temp = this._components[index1];
//         this._components[index1] = this._components[index2];
//         this._components[index2] = temp;
//     }

//     /**
//      * 交换子组件位置
//      *
//      * @param a 第一个子组件
//      * @param b 第二个子组件
//      */
//     swapComponents<T1 extends Component, T2 extends Component>(a: T1, b: T2): void
//     {
//         console.assert(this.hasComponent(a), '第一个子组件不在容器中');
//         console.assert(this.hasComponent(b), '第二个子组件不在容器中');

//         this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
//     }

//     /**
//      * 获取指定类型组件
//      *
//      * @param type 组件类型
//      */
//     getComponentsByType<T extends Component>(type: Constructor<T>)
//     {
//         const removeComponents: T[] = [];
//         for (let i = 0; i < this._components.length; i++)
//         {
//             if (this._components[i] instanceof type)
//             { removeComponents.push(this._components[i] as any); }
//         }

//         return removeComponents;
//     }

//     /**
//      * 移除指定类型组件
//      *
//      * @param type 组件类型
//      */
//     removeComponentsByType<T extends Component>(type: Constructor<T>)
//     {
//         const removeComponents: T[] = [];
//         for (let i = this._components.length - 1; i >= 0; i--)
//         {
//             if (this._components[i].constructor === type)
//             { removeComponents.push(this.removeComponentAt(i) as T); }
//         }

//         return removeComponents;
//     }

//     /**
//      * 监听对象的所有事件并且传播到所有组件中
//      */
//     private _onAnyListener(e: IEvent<any>)
//     {
//         this.components.forEach((element: Component) =>
//         {
//             element.emitEvent(e);
//         });
//     }

//     /**
//      * 销毁
//      */
//     dispose()
//     {
//         for (let i = this._components.length - 1; i >= 0; i--)
//         {
//             this.removeComponentAt(i);
//         }
//     }

//     /**
//      * 组件列表
//      */
//     protected _components: Components[] = [];

//     /**
//      * 判断是否拥有组件
//      *
//      * @param com 被检测的组件
//      * @returns     true：拥有该组件；false：不拥有该组件。
//      */
//     private hasComponent<T extends Component>(com: T): boolean
//     {
//         return this._components.indexOf(com) !== -1;
//     }

//     /**
//      * 添加组件到指定位置
//      *
//      * @param component 被添加的组件
//      * @param index 插入的位置
//      */
//     private addComponentAt<T extends Component>(component: T, index: number): void
//     {
//         if (!component)
//         {
//             return;
//         }
//         console.assert(index >= 0 && index <= this.numComponents, '给出索引超出范围');

//         if (this.hasComponent(component))
//         {
//             index = Math.min(index, this._components.length - 1);
//             this.setComponentIndex(component, index);

//             return;
//         }
//         // 组件唯一时移除同类型的组件
//         const type = component.constructor as Constructor<Component>;
//         if (Component.isSingleComponent(type))
//         {
//             const oldComponents = this.getComponentsByType(type);
//             if (oldComponents.length > 0)
//             {
//                 console.assert(oldComponents.length === 1);
//                 this.removeComponent(oldComponents[0]);
//             }
//         }

//         this._components.splice(index, 0, component);
//         component._setEntity(this);
//         component.init();
//         // 派发添加组件事件
//         this.emit('addComponent', { component, entity: this }, true);
//     }
// }
