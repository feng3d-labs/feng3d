var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    /**
     * Base class for all entities in feng3d scenes.
     */
    var GameObject = (function (_super) {
        __extends(GameObject, _super);
        //------------------------------------------
        // Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        function GameObject(name) {
            if (name === void 0) { name = "GameObject"; }
            var _this = _super.call(this) || this;
            _this._children = [];
            /**
             * 是否可序列化
             */
            _this.serializable = true;
            /**
             * 是否显示
             */
            _this.visible = true;
            /**
             * 自身以及子对象是否支持鼠标拾取
             */
            _this.mouseEnabled = true;
            /**
             * @private
             */
            _this._renderData = new feng3d.Object3DRenderAtomic();
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 组件列表
             */
            _this._components = [];
            _this.name = name;
            _this._transform = _this.addComponent(feng3d.Transform);
            //
            GameObject._gameObjects.push(_this);
            return _this;
        }
        Object.defineProperty(GameObject.prototype, "transform", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            /**
             * The Transform attached to this GameObject. (null if there is none attached).
             */
            get: function () {
                return this._transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "children", {
            /**
             * 子对象
             */
            get: function () {
                return this._children.concat();
            },
            set: function (value) {
                for (var i = 0, n = this._children.length; i < n; i++) {
                    this.removeChildAt(i);
                }
                for (var i = 0; i < value.length; i++) {
                    this.addChild(value[i]);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "numChildren", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "numComponents", {
            /**
             * 子组件个数
             */
            get: function () {
                return this._components.length;
            },
            enumerable: true,
            configurable: true
        });
        GameObject.prototype.updateRender = function (renderContext) {
            if (this._renderData.renderHolderInvalid) {
                this._renderData.clear();
                this.collectRenderDataHolder(this._renderData);
                this._renderData.renderHolderInvalid = false;
            }
            this._renderData.update(renderContext);
        };
        GameObject.prototype.contains = function (child) {
            return this._children.indexOf(child) >= 0;
        };
        GameObject.prototype.addChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child._setParent(this);
            child.transform.invalidateSceneTransform();
            this._children.push(child);
            return child;
        };
        GameObject.prototype.addChildren = function () {
            var childarray = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                childarray[_i] = arguments[_i];
            }
            for (var child_key_a in childarray) {
                var child = childarray[child_key_a];
                this.addChild(child);
            }
        };
        GameObject.prototype.setChildAt = function (child, index) {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent) {
                if (child._parent != this) {
                    child._parent.removeChild(child);
                }
                else {
                    var oldIndex = this._children.indexOf(child);
                    this._children.splice(oldIndex, 1);
                    this._children.splice(index, 0, child);
                }
            }
            else {
                child._setParent(this);
                child.transform.invalidateSceneTransform();
                this._children[index] = child;
            }
        };
        GameObject.prototype.removeChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        };
        GameObject.prototype.removeChildAt = function (index) {
            var child = this._children[index];
            this.removeChildInternal(index, child);
        };
        GameObject.prototype._setParent = function (value) {
            this._parent = value;
            this.updateScene();
            this.transform.invalidateSceneTransform();
        };
        GameObject.prototype.getChildAt = function (index) {
            index = index;
            return this._children[index];
        };
        Object.defineProperty(GameObject.prototype, "scene", {
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        GameObject.prototype.updateScene = function () {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
                this.dispatch("removedFromScene", this);
            this._scene = newScene;
            if (this._scene)
                this.dispatch("addedToScene", this);
            for (var i = 0, n = this._children.length; i < n; i++) {
                this._children[i].updateScene();
            }
            this.dispatch("sceneChanged", this);
        };
        /**
         * 获取子对象列表（备份）
         */
        GameObject.prototype.getChildren = function () {
            return this._children.concat();
        };
        GameObject.prototype.removeChildInternal = function (childIndex, child) {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);
        };
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        GameObject.prototype.getComponentAt = function (index) {
            feng3d.debuger && console.assert(index < this.numComponents, "给出索引超出范围");
            return this._components[index];
        };
        /**
         * 添加组件
         * Adds a component class named className to the game object.
         * @param param 被添加组件
         */
        GameObject.prototype.addComponent = function (param) {
            var component;
            if (this.getComponent(param)) {
                // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
                return this.getComponent(param);
            }
            component = new param(this);
            this.addComponentAt(component, this._components.length);
            return component;
        };
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        GameObject.prototype.hasComponent = function (com) {
            return this._components.indexOf(com) != -1;
        };
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        GameObject.prototype.getComponent = function (type) {
            var component = this.getComponents(type)[0];
            return component;
        };
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        GameObject.prototype.getComponents = function (type) {
            if (type === void 0) { type = null; }
            var filterResult;
            if (!type) {
                filterResult = this._components.concat();
            }
            else {
                filterResult = this._components.filter(function (value, index, array) {
                    return value instanceof type;
                });
            }
            return filterResult;
        };
        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        GameObject.prototype.getComponentsInChildren = function (type, result) {
            if (type === void 0) { type = null; }
            if (result === void 0) { result = null; }
            result = result || [];
            for (var i = 0, n = this._components.length; i < n; i++) {
                if (!type) {
                    result.push(this._components[i]);
                }
                else if (this._components[i] instanceof type) {
                    result.push(this._components[i]);
                }
            }
            for (var i = 0, n = this.numChildren; i < n; i++) {
                this.getChildAt(i).getComponentsInChildren(type, result);
            }
            return result;
        };
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        GameObject.prototype.setComponentIndex = function (component, index) {
            feng3d.debuger && console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var oldIndex = this._components.indexOf(component);
            feng3d.debuger && console.assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");
            this._components.splice(oldIndex, 1);
            this._components.splice(index, 0, component);
        };
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        GameObject.prototype.setComponentAt = function (component, index) {
            if (this._components[index]) {
                this.removeComponentAt(index);
            }
            this.addComponentAt(component, index);
        };
        /**
         * 移除组件
         * @param component 被移除组件
         */
        GameObject.prototype.removeComponent = function (component) {
            feng3d.debuger && console.assert(this.hasComponent(component), "只能移除在容器中的组件");
            var index = this.getComponentIndex(component);
            this.removeComponentAt(index);
        };
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        GameObject.prototype.getComponentIndex = function (component) {
            feng3d.debuger && console.assert(this._components.indexOf(component) != -1, "组件不在容器中");
            var index = this._components.indexOf(component);
            return index;
        };
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        GameObject.prototype.removeComponentAt = function (index) {
            feng3d.debuger && console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var component = this._components.splice(index, 1)[0];
            //派发移除组件事件
            this.dispatch("removedComponent", component);
            this.removeRenderDataHolder(component);
            component.dispose();
            return component;
        };
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        GameObject.prototype.swapComponentsAt = function (index1, index2) {
            feng3d.debuger && console.assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            feng3d.debuger && console.assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");
            var temp = this._components[index1];
            this._components[index1] = this._components[index2];
            this._components[index2] = temp;
        };
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        GameObject.prototype.swapComponents = function (a, b) {
            feng3d.debuger && console.assert(this.hasComponent(a), "第一个子组件不在容器中");
            feng3d.debuger && console.assert(this.hasComponent(b), "第二个子组件不在容器中");
            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        };
        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        GameObject.prototype.removeComponentsByType = function (type) {
            var removeComponents = [];
            for (var i = this._components.length - 1; i >= 0; i--) {
                if (this._components[i].constructor == type)
                    removeComponents.push(this.removeComponentAt(i));
            }
            return removeComponents;
        };
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        GameObject.find = function (name) {
            for (var i = 0; i < this._gameObjects.length; i++) {
                var element = this._gameObjects[i];
                if (element.name == name)
                    return element;
            }
        };
        GameObject.create = function (name) {
            if (name === void 0) { name = "GameObject"; }
            return new GameObject(name);
        };
        Object.defineProperty(GameObject.prototype, "components", {
            get: function () {
                return this._components.concat();
            },
            set: function (value) {
                for (var i = this._components.length - 1; i >= 0; i--) {
                    this.removeComponentAt(i);
                }
                for (var i = 0, n = value.length; i < n; i++) {
                    this.addComponentAt(value[i], this.numComponents);
                }
            },
            enumerable: true,
            configurable: true
        });
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        //------------------------------------------
        // Private Properties
        //------------------------------------------
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        GameObject.prototype.addComponentAt = function (component, index) {
            feng3d.debuger && console.assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");
            if (this.hasComponent(component)) {
                index = Math.min(index, this._components.length - 1);
                this.setComponentIndex(component, index);
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(component.constructor);
            this._components.splice(index, 0, component);
            //派发添加组件事件
            this.dispatch("addedComponent", component);
            this.addRenderDataHolder(component);
        };
        /**
         * 销毁
         */
        GameObject.prototype.dispose = function () {
            if (this.parent)
                this.parent.removeChild(this);
            for (var i = this._children.length - 1; i >= 0; i--) {
                this.removeChildAt(i);
            }
            for (var i = this._components.length - 1; i >= 0; i--) {
                this.removeComponentAt(i);
            }
        };
        GameObject.prototype.disposeWithChildren = function () {
            this.dispose();
            while (this.numChildren > 0)
                this.getChildAt(0).dispose();
        };
        GameObject.prototype.deserialize = function (object) {
            for (var key in object) {
                var item = object[key];
                switch (key) {
                    case "components":
                        var components = item;
                        for (var i = 0; i < components.length; i++) {
                            var element = components[i];
                            var cls = feng3d.ClassUtils.getDefinitionByName(element["__class__"]);
                            var component;
                            if (cls == feng3d.Transform) {
                                component = this.transform;
                            }
                            else {
                                component = this.addComponent(cls);
                            }
                            feng3d.serialization.deserialize(element, component);
                        }
                        break;
                    case "children":
                        var children = item;
                        for (var i = 0; i < children.length; i++) {
                            var gameObject = feng3d.serialization.deserialize(children[i]);
                            this.addChild(gameObject);
                        }
                        break;
                    default:
                        this[key] = feng3d.serialization.deserialize(item);
                        break;
                }
            }
        };
        return GameObject;
    }(feng3d.Feng3dObject));
    //------------------------------------------
    // Static Functions
    //------------------------------------------
    GameObject._gameObjects = [];
    __decorate([
        feng3d.serialize
    ], GameObject.prototype, "name", void 0);
    __decorate([
        feng3d.serialize
    ], GameObject.prototype, "visible", void 0);
    __decorate([
        feng3d.serialize
    ], GameObject.prototype, "mouseEnabled", void 0);
    __decorate([
        feng3d.serialize
    ], GameObject.prototype, "children", null);
    __decorate([
        feng3d.serialize
    ], GameObject.prototype, "_components", void 0);
    feng3d.GameObject = GameObject;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=GameObject.js.map