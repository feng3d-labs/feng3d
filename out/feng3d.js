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
    var RenderData = (function () {
        function RenderData() {
            this._elementMap = {};
            this._elements = [];
        }
        Object.defineProperty(RenderData.prototype, "elements", {
            get: function () {
                return this._elements.concat();
            },
            enumerable: true,
            configurable: true
        });
        RenderData.prototype.createIndexBuffer = function (indices) {
            var renderData = this._elementMap["index"];
            if (!renderData) {
                this._elementMap["index"] = renderData = new feng3d.IndexRenderData();
                this.addRenderElement(renderData);
            }
            renderData.indices = indices;
            return renderData;
        };
        RenderData.prototype.createUniformData = function (name, data) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.UniformData(name, data);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            return renderData;
        };
        RenderData.prototype.createAttributeRenderData = function (name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AttributeRenderData(name, data, size, divisor);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            renderData.size = size;
            renderData.divisor = divisor;
            return renderData;
        };
        RenderData.prototype.createShaderCode = function (code) {
            var renderData = this._elementMap["shader"];
            if (!renderData) {
                this._elementMap["shader"] = renderData = new feng3d.ShaderCode(code);
                this.addRenderElement(renderData);
            }
            renderData.code = code;
            return renderData;
        };
        RenderData.prototype.createValueMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.ValueMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createBoolMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.BoolMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createAddMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AddMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createInstanceCount = function (value) {
            var renderData = this._elementMap["instanceCount"];
            if (!renderData) {
                this._elementMap["instanceCount"] = renderData = new feng3d.RenderInstanceCount();
                this.addRenderElement(renderData);
            }
            renderData.data = value;
            return renderData;
        };
        RenderData.prototype.createShaderParam = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap["instanceCount"] = renderData = new feng3d.ShaderParam(name);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                this._elements.push(element);
                feng3d.Event.dispatch(this, feng3d.Object3DRenderAtomic.ADD_RENDERELEMENT, element);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderData.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                var index = this._elements.indexOf(element);
                if (index != -1) {
                    this._elements.splice(i, 1);
                    feng3d.Event.dispatch(this, feng3d.Object3DRenderAtomic.REMOVE_RENDERELEMENT, element);
                }
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        return RenderData;
    }());
    feng3d.RenderData = RenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    var RenderDataHolder = (function (_super) {
        __extends(RenderDataHolder, _super);
        /**
         * 创建GL数据缓冲
         */
        function RenderDataHolder() {
            var _this = _super.call(this) || this;
            _this._updateEverytime = false;
            _this.childrenRenderDataHolder = [];
            return _this;
        }
        Object.defineProperty(RenderDataHolder.prototype, "updateEverytime", {
            /**
             * 是否每次必须更新
             */
            get: function () { return this._updateEverytime; },
            enumerable: true,
            configurable: true
        });
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        RenderDataHolder.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            renderAtomic.addRenderDataHolder(this);
            for (var i = 0; i < this.childrenRenderDataHolder.length; i++) {
                this.childrenRenderDataHolder[i].collectRenderDataHolder(renderAtomic);
            }
        };
        RenderDataHolder.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (this.childrenRenderDataHolder.indexOf(renderDataHolder) == -1)
                this.childrenRenderDataHolder.push(renderDataHolder);
            feng3d.Event.dispatch(this, feng3d.Object3DRenderAtomic.ADD_RENDERHOLDER, renderDataHolder);
        };
        RenderDataHolder.prototype.removeRenderDataHolder = function (renderDataHolder) {
            var index = this.childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index != -1)
                this.childrenRenderDataHolder.splice(index, 1);
            feng3d.Event.dispatch(this, feng3d.Object3DRenderAtomic.REMOVE_RENDERHOLDER, renderDataHolder);
        };
        /**
         * 更新渲染数据
         */
        RenderDataHolder.prototype.updateRenderData = function (renderContext, renderData) {
        };
        return RenderDataHolder;
    }(feng3d.RenderData));
    feng3d.RenderDataHolder = RenderDataHolder;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var Object3DRenderAtomic = (function (_super) {
        __extends(Object3DRenderAtomic, _super);
        function Object3DRenderAtomic() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._invalidateRenderDataHolderList = [];
            _this.renderHolderInvalid = true;
            _this.renderDataHolders = [];
            _this.updateEverytimeList = [];
            return _this;
        }
        Object3DRenderAtomic.prototype.onInvalidate = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateHolders(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddElement = function (event) {
            this.addRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveElement = function (event) {
            this.removeRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onInvalidateShader = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateShader(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.addRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.removeRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.addInvalidateHolders = function (renderDataHolder) {
            if (this._invalidateRenderDataHolderList.indexOf(renderDataHolder) == -1) {
                this._invalidateRenderDataHolderList.push(renderDataHolder);
            }
        };
        Object3DRenderAtomic.prototype.addInvalidateShader = function (renderDataHolder) {
            this.invalidateShader();
        };
        Object3DRenderAtomic.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof feng3d.RenderDataHolder) {
                this.addRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                this.renderDataHolders.push(renderDataHolder);
                if (renderDataHolder.updateEverytime) {
                    this.updateEverytimeList.push(renderDataHolder);
                }
                this.addRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                feng3d.Event.on(renderDataHolder, Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                feng3d.Event.on(renderDataHolder, Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                feng3d.Event.on(renderDataHolder, Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                feng3d.Event.on(renderDataHolder, Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }
            else {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.addRenderDataHolder(renderDataHolder[i]);
                }
            }
        };
        Object3DRenderAtomic.prototype.removeRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof Array) {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.removeRenderDataHolder(renderDataHolder[i]);
                }
            }
            else {
                this.removeRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    this.renderDataHolders.splice(index, 1);
                if (renderDataHolder.updateEverytime) {
                    var index_1 = this.updateEverytimeList.indexOf(renderDataHolder);
                    if (index_1 != -1)
                        this.updateEverytimeList.splice(index_1, 1);
                }
                this.removeRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                feng3d.Event.off(renderDataHolder, Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                feng3d.Event.off(renderDataHolder, Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                feng3d.Event.off(renderDataHolder, Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                feng3d.Event.off(renderDataHolder, Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }
        };
        Object3DRenderAtomic.prototype.update = function (renderContext) {
            var _this = this;
            renderContext.updateRenderData1();
            this.addRenderDataHolder(renderContext);
            if (this.updateEverytimeList.length > 0) {
                this.updateEverytimeList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
            }
            if (this._invalidateRenderDataHolderList.length > 0) {
                this._invalidateRenderDataHolderList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
                this._invalidateRenderDataHolderList.length = 0;
            }
        };
        Object3DRenderAtomic.prototype.clear = function () {
            var _this = this;
            this.renderDataHolders.forEach(function (element) {
                _this.removeRenderDataHolder(element);
            });
        };
        return Object3DRenderAtomic;
    }(feng3d.RenderAtomic));
    /**
     * 添加渲染元素
     */
    Object3DRenderAtomic.ADD_RENDERELEMENT = "addRenderElement";
    /**
     * 移除渲染元素
     */
    Object3DRenderAtomic.REMOVE_RENDERELEMENT = "removeRenderElement";
    /**
     * 添加渲染数据拥有者
     */
    Object3DRenderAtomic.ADD_RENDERHOLDER = "addRenderHolder";
    /**
     * 移除渲染数据拥有者
     */
    Object3DRenderAtomic.REMOVE_RENDERHOLDER = "removeRenderHolder";
    feng3d.Object3DRenderAtomic = Object3DRenderAtomic;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    var RenderContext = (function (_super) {
        __extends(RenderContext, _super);
        function RenderContext() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(RenderContext.prototype, "camera", {
            /**
             * 摄像机
             */
            get: function () {
                return this._camera;
            },
            set: function (value) {
                if (this._camera == value)
                    return;
                if (this._camera)
                    this.removeRenderDataHolder(this._camera);
                this._camera = value;
                if (this._camera)
                    this.addRenderDataHolder(this._camera);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新渲染数据
         */
        RenderContext.prototype.updateRenderData1 = function () {
            var pointLights = feng3d.PointLight.pointLights;
            var directionalLights = feng3d.DirectionalLight.directionalLights;
            this.createValueMacro("NUM_LIGHT", feng3d.Light.lights.length);
            //收集点光源数据
            var pointLightPositions = [];
            var pointLightColors = [];
            var pointLightIntensitys = [];
            var pointLightRanges = [];
            for (var i = 0; i < pointLights.length; i++) {
                var pointLight = pointLights[i];
                pointLightPositions.push(pointLight.position);
                pointLightColors.push(pointLight.color);
                pointLightIntensitys.push(pointLight.intensity);
                pointLightRanges.push(pointLight.range);
            }
            //设置点光源数据
            this.createValueMacro("NUM_POINTLIGHT", pointLights.length);
            if (pointLights.length > 0) {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_pointLightPositions", pointLightPositions);
                this.createUniformData("u_pointLightColors", pointLightColors);
                this.createUniformData("u_pointLightIntensitys", pointLightIntensitys);
                this.createUniformData("u_pointLightRanges", pointLightRanges);
            }
            var directionalLightDirections = [];
            var directionalLightColors = [];
            var directionalLightIntensitys = [];
            for (var i = 0; i < directionalLights.length; i++) {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.sceneDirection);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            this.createValueMacro("NUM_DIRECTIONALLIGHT", directionalLights.length);
            if (directionalLights.length > 0) {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_directionalLightDirections", directionalLightDirections);
                this.createUniformData("u_directionalLightColors", directionalLightColors);
                this.createUniformData("u_directionalLightIntensitys", directionalLightIntensitys);
            }
            this.createUniformData("u_sceneAmbientColor", this.scene3d.ambientColor);
            this.createUniformData("u_scaleByDepth", this.view3D.getScaleByDepth(1));
        };
        return RenderContext;
    }(feng3d.RenderDataHolder));
    feng3d.RenderContext = RenderContext;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    var ShaderLib = (function () {
        function ShaderLib() {
        }
        ShaderLib.getShaderContentByName = function (shaderName) {
            var shaderPath = "shaders/" + shaderName + ".glsl";
            return feng3d.shaderFileMap[shaderPath];
        };
        /**
         * 获取shaderCode
         */
        ShaderLib.getShaderCode = function (shaderName) {
            if (!_shaderMap[shaderName])
                _shaderMap[shaderName] = ShaderLoader.loadText(shaderName);
            return _shaderMap[shaderName];
        };
        return ShaderLib;
    }());
    feng3d.ShaderLib = ShaderLib;
    /**
     * 渲染代码字典
     */
    var _shaderMap = {};
    /**
     * 渲染代码加载器字典
     */
    var _shaderLoaderMap = {};
    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    var ShaderLoader = (function () {
        function ShaderLoader() {
        }
        /**
         * 加载shader
         * @param url   路径
         */
        ShaderLoader.loadText = function (shaderName) {
            var shaderCode = ShaderLib.getShaderContentByName(shaderName);
            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            var match = includeRegExp.exec(shaderCode);
            while (match != null) {
                var subShaderName = match[1];
                var subShaderCode = ShaderLib.getShaderCode(subShaderName);
                if (subShaderCode) {
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                }
                else {
                    var subShaderCode = ShaderLoader.loadText(subShaderName);
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                }
                match = includeRegExp.exec(shaderCode);
            }
            return shaderCode;
        };
        return ShaderLoader;
    }());
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Bit mask that controls object destruction, saving and visibility in inspectors.
     */
    var HideFlags;
    (function (HideFlags) {
        /**
         * A normal, visible object. This is the default.
         */
        HideFlags[HideFlags["None"] = 0] = "None";
        /**
         * The object will not appear in the hierarchy.
         */
        HideFlags[HideFlags["HideInHierarchy"] = 1] = "HideInHierarchy";
        /**
         * It is not possible to view it in the inspector.
         */
        HideFlags[HideFlags["HideInInspector"] = 2] = "HideInInspector";
        /**
         * The object will not be saved to the scene in the editor.
         */
        HideFlags[HideFlags["DontSaveInEditor"] = 4] = "DontSaveInEditor";
        /**
         * The object is not be editable in the inspector.
         */
        HideFlags[HideFlags["NotEditable"] = 8] = "NotEditable";
        /**
         * The object will not be saved when building a player.
         */
        HideFlags[HideFlags["DontSaveInBuild"] = 16] = "DontSaveInBuild";
        /**
         * The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideFlags[HideFlags["DontUnloadUnusedAsset"] = 32] = "DontUnloadUnusedAsset";
        /**
         * The object will not be saved to the scene. It will not be destroyed when a new scene is loaded. It is a shortcut for HideFlags.DontSaveInBuild | HideFlags.DontSaveInEditor | HideFlags.DontUnloadUnusedAsset.
         */
        HideFlags[HideFlags["DontSave"] = 52] = "DontSave";
        /**
         * A combination of not shown in the hierarchy, not saved to to scenes and not unloaded by The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideFlags[HideFlags["HideAndDontSave"] = 61] = "HideAndDontSave";
    })(HideFlags = feng3d.HideFlags || (feng3d.HideFlags = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for all objects feng3d can reference.
     *
     * Any public variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    var Feng3dObject = (function (_super) {
        __extends(Feng3dObject, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function Feng3dObject() {
            var _this = _super.call(this) || this;
            _this._uuid = Math.generateUUID();
            return _this;
        }
        Object.defineProperty(Feng3dObject.prototype, "uuid", {
            /**
             * Returns the instance id of the Feng3dObject.
             */
            get: function () {
                return this._uuid;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the name of the game Feng3dObject.
         */
        Feng3dObject.prototype.toString = function () {
            return this.name;
        };
        //------------------------------------------
        // Static Functions
        //------------------------------------------
        /**
         * Removes a gameobject, component or asset.
         * @param obj	The Feng3dObject to destroy.
         * @param t	    The optional amount of time to delay before destroying the Feng3dObject.
         */
        Feng3dObject.destroy = function (obj, t) {
            if (t === void 0) { t = 0; }
        };
        /**
         * Destroys the Feng3dObject obj immediately.
         * @param obj	                    Feng3dObject to be destroyed.
         * @param allowDestroyingAssets	    Set to true to allow assets to be destoyed.
         */
        Feng3dObject.destroyImmediate = function (obj, allowDestroyingAssets) {
            if (allowDestroyingAssets === void 0) { allowDestroyingAssets = false; }
        };
        /**
         * Makes the Feng3dObject target not be destroyed automatically when loading a new scene.
         */
        Feng3dObject.dontDestroyOnLoad = function (target) {
        };
        /**
         * Returns the first active loaded Feng3dObject of Type type.
         */
        Feng3dObject.findObjectOfType = function (type) {
            return null;
        };
        /**
         * Returns a list of all active loaded objects of Type type.
         */
        Feng3dObject.findObjectsOfType = function (type) {
            return null;
        };
        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        Feng3dObject.instantiate = function (original, position, rotation, parent, worldPositionStays) {
            if (position === void 0) { position = null; }
            if (rotation === void 0) { rotation = null; }
            if (parent === void 0) { parent = null; }
            if (worldPositionStays === void 0) { worldPositionStays = false; }
            return null;
        };
        return Feng3dObject;
    }(feng3d.RenderDataHolder));
    feng3d.Feng3dObject = Feng3dObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    var ComponentEvent = (function () {
        function ComponentEvent() {
        }
        return ComponentEvent;
    }());
    /**
     * 添加子组件事件
     */
    ComponentEvent.ADDED_COMPONENT = "addedComponent";
    /**
     * 移除子组件事件
     */
    ComponentEvent.REMOVED_COMPONENT = "removedComponent";
    feng3d.ComponentEvent = ComponentEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for everything attached to GameObjects.
     *
     * Note that your code will never directly create a Component. Instead, you write script code, and attach the script to a GameObject. See Also: ScriptableObject as a way to create scripts that do not attach to any GameObject.
     */
    var Component = (function (_super) {
        __extends(Component, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 创建一个组件容器
         */
        function Component(gameObject) {
            var _this = _super.call(this) || this;
            //------------------------------------------
            // Static Functions
            //------------------------------------------
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 组件列表
             */
            _this._single = false;
            _this._gameObject = gameObject;
            _this.initComponent();
            return _this;
        }
        Object.defineProperty(Component.prototype, "gameObject", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            /**
             * The game object this component is attached to. A component is always attached to a game object.
             */
            get: function () {
                return this.internalGetGameObject();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "tag", {
            /**
             * The tag of this game object.
             */
            get: function () {
                return this._tag;
            },
            set: function (value) {
                this._tag = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "transform", {
            /**
             * The Transform attached to this GameObject (null if there is none attached).
             */
            get: function () {
                if (this._transform == null) {
                    this._transform = this.internalGetTransform();
                }
                return this._transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "single", {
            /**
             * 是否唯一，同类型3D对象组件只允许一个
             */
            get: function () {
                return this._single;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        Component.prototype.getComponent = function (type) {
            return this.gameObject.getComponent(type);
        };
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        Component.prototype.getComponents = function (type) {
            if (type === void 0) { type = null; }
            return this.gameObject.getComponents(type);
        };
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        Component.prototype.getComponentsInChildren = function (type) {
            if (type === void 0) { type = null; }
            return this.gameObject.getComponentsInChildren(type);
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        /**
         * 初始化组件
         */
        Component.prototype.initComponent = function () {
            //以最高优先级监听组件被添加，设置父组件
            feng3d.Event.on(this, feng3d.ComponentEvent.ADDED_COMPONENT, this._onAddedComponent, this, Number.MAX_VALUE);
            //以最低优先级监听组件被删除，清空父组件
            feng3d.Event.on(this, feng3d.ComponentEvent.REMOVED_COMPONENT, this._onRemovedComponent, this, Number.MIN_VALUE);
        };
        /**
         * 处理被添加组件事件
         */
        Component.prototype.onBeAddedComponent = function (event) {
        };
        /**
         * 处理被移除组件事件
         */
        Component.prototype.onBeRemovedComponent = function (event) {
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        Component.prototype._onAddedComponent = function (event) {
            var data = event.data;
            if (data.child == this) {
                this._gameObject = data.container;
                this.onBeAddedComponent(event);
            }
        };
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        Component.prototype._onRemovedComponent = function (event) {
            var data = event.data;
            if (event.data.child == this) {
                this.onBeRemovedComponent(event);
                this._gameObject = null;
            }
        };
        Component.prototype.internalGetTransform = function () {
            if (this._gameObject)
                return this._gameObject.transform;
            return null;
        };
        Component.prototype.internalGetGameObject = function () {
            return this._gameObject;
        };
        return Component;
    }(feng3d.Feng3dObject));
    feng3d.Component = Component;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    var FrameBufferObject = (function () {
        function FrameBufferObject() {
            this.OFFSCREEN_WIDTH = 1024;
            this.OFFSCREEN_HEIGHT = 1024;
        }
        FrameBufferObject.prototype.init = function (gl) {
            // Create a framebuffer object (FBO)
            this.framebuffer = gl.createFramebuffer();
            if (!this.framebuffer) {
                feng3d.debuger && alert('Failed to create frame buffer object');
                return this.clear(gl);
            }
            // Create a texture object and set its size and parameters
            this.texture = gl.createTexture(); // Create a texture object
            if (!this.texture) {
                feng3d.debuger && alert('Failed to create texture object');
                return this.clear(gl);
            }
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            // Create a renderbuffer object and Set its size and parameters
            this.depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
            if (!this.depthBuffer) {
                feng3d.debuger && alert('Failed to create renderbuffer object');
                return this.clear(gl);
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            // Attach the texture and the renderbuffer object to the FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
            // Check if FBO is configured correctly
            var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (gl.FRAMEBUFFER_COMPLETE !== e) {
                feng3d.debuger && alert('Frame buffer object is incomplete: ' + e.toString());
                return this.clear(gl);
            }
            // Unbind the buffer object
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        };
        FrameBufferObject.prototype.active = function (gl) {
            gl.bindFramebuffer(feng3d.GL.FRAMEBUFFER, this.framebuffer);
        };
        FrameBufferObject.prototype.deactive = function (gl) {
            gl.bindFramebuffer(feng3d.GL.FRAMEBUFFER, null);
        };
        FrameBufferObject.prototype.clear = function (gl) {
            if (this.framebuffer)
                gl.deleteFramebuffer(this.framebuffer);
            if (this.texture)
                gl.deleteTexture(this.texture);
            if (this.depthBuffer)
                gl.deleteRenderbuffer(this.depthBuffer);
            return null;
        };
        return FrameBufferObject;
    }());
    feng3d.FrameBufferObject = FrameBufferObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    var Renderer = (function (_super) {
        __extends(Renderer, _super);
        function Renderer(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.addRenderDataHolder(_this.material);
            Renderer.renderers.push(_this);
            return _this;
        }
        Object.defineProperty(Renderer.prototype, "material", {
            /**
             * 材质
             * Returns the first instantiated Material assigned to the renderer.
             */
            get: function () { return this._material || feng3d.defaultMaterial; },
            set: function (value) {
                if (this._material == value)
                    return;
                this.removeRenderDataHolder(this.material);
                this._material = value;
                this.addRenderDataHolder(this.material);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enabled", {
            /**
             * Makes the rendered 3D object visible if enabled.
             */
            get: function () {
                return this._enabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enable", {
            set: function (value) {
                this._enabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "isVisible", {
            /**
             * Is this renderer visible in any camera? (Read Only)
             */
            get: function () {
                return this.gameObject.transform.visible;
            },
            enumerable: true,
            configurable: true
        });
        Renderer.prototype.drawRenderables = function (renderContext) {
            var object3D = this.gameObject;
            //更新数据
            object3D.updateRender(renderContext);
            var gl = renderContext.gl;
            try {
                //绘制
                var material = this.material;
                if (material.enableBlend) {
                    //
                    gl.enable(feng3d.GL.BLEND);
                    gl.blendEquation(material.blendEquation);
                    gl.depthMask(false);
                    gl.blendFunc(material.sfactor, material.dfactor);
                }
                else {
                    gl.disable(feng3d.GL.BLEND);
                    gl.depthMask(true);
                }
                this.drawObject3D(gl, object3D.renderData); //
            }
            catch (error) {
                console.log(error);
            }
        };
        /**
         * 绘制3D对象
         */
        Renderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            shader = shader || renderAtomic.shader;
            var shaderProgram = shader.activeShaderProgram(gl);
            if (!shaderProgram)
                return;
            //
            renderAtomic.activeAttributes(gl, shaderProgram.attributes);
            renderAtomic.activeUniforms(gl, shaderProgram.uniforms);
            renderAtomic.dodraw(gl);
        };
        return Renderer;
    }(feng3d.Component));
    Renderer.renderers = [];
    feng3d.Renderer = Renderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    var ForwardRenderer = (function () {
        function ForwardRenderer() {
            this.viewRect = new feng3d.Rectangle(0, 0, 100, 100);
        }
        /**
         * 渲染
         */
        ForwardRenderer.prototype.draw = function (renderContext) {
            var gl = renderContext.gl;
            var scene3D = renderContext.scene3d;
            // 默认渲染
            gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, this.viewRect.width, this.viewRect.height);
            gl.enable(feng3d.GL.DEPTH_TEST);
            // gl.cullFace()
            var meshRenderers = scene3D.getComponentsInChildren(feng3d.MeshRenderer);
            for (var i = 0; i < meshRenderers.length; i++) {
                meshRenderers[i].drawRenderables(renderContext);
            }
        };
        return ForwardRenderer;
    }());
    feng3d.ForwardRenderer = ForwardRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 深度渲染器
     * @author  feng    2017-03-25
     */
    var DepthRenderer = (function () {
        function DepthRenderer() {
        }
        return DepthRenderer;
    }());
    feng3d.DepthRenderer = DepthRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    var MouseRenderer = (function (_super) {
        __extends(MouseRenderer, _super);
        function MouseRenderer() {
            var _this = _super.call(this) || this;
            _this._shaderName = "mouse";
            _this.objects = [null];
            return _this;
        }
        /**
         * 渲染
         */
        MouseRenderer.prototype.draw = function (renderContext) {
            this.objects.length = 1;
            var gl = renderContext.gl;
            //启动裁剪，只绘制一个像素
            gl.enable(feng3d.GL.SCISSOR_TEST);
            gl.scissor(0, 0, 1, 1);
            // super.draw(renderContext);
            gl.disable(feng3d.GL.SCISSOR_TEST);
            //读取鼠标拾取索引
            // this.frameBufferObject.readBuffer(gl, "objectID");
            var data = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, feng3d.GL.RGBA, feng3d.GL.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3]; //最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            // console.log(`选中索引3D对象${id}`, data.toString());
            this.selectedObject3D = this.objects[id];
        };
        MouseRenderer.prototype.drawRenderables = function (renderContext, meshRenderer) {
            if (meshRenderer.gameObject.transform.mouseEnabled) {
                var object = meshRenderer.gameObject;
                this.objects.push(object);
                object.renderData.addUniform(this.createUniformData("u_objectID", this.objects.length - 1));
                // super.drawRenderables(renderContext, meshRenderer);
            }
        };
        /**
         * 绘制3D对象
         */
        MouseRenderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            var vertexCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".vertex");
            var fragmentCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".fragment");
            var shader = new feng3d.ShaderRenderData();
            shader.setShaderCode(this.createShaderCode({ vertexCode: vertexCode, fragmentCode: fragmentCode }));
            // super.drawObject3D(gl, renderAtomic, shader);
        };
        return MouseRenderer;
    }(feng3d.RenderDataHolder));
    feng3d.MouseRenderer = MouseRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 后处理渲染器
     * @author feng 2017-02-20
     */
    var PostProcessRenderer = (function () {
        function PostProcessRenderer() {
        }
        return PostProcessRenderer;
    }());
    feng3d.PostProcessRenderer = PostProcessRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    var ShadowRenderer = (function () {
        function ShadowRenderer() {
        }
        /**
         * 渲染
         */
        ShadowRenderer.prototype.draw = function (renderContext) {
            var gl = renderContext.gl;
            var lights = feng3d.Light.lights;
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                var frameBufferObject = new feng3d.FrameBufferObject();
                frameBufferObject.init(gl);
                frameBufferObject.active(gl);
                // MeshRenderer.meshRenderers.forEach(element =>
                // {
                // this.drawRenderables(renderContext, element);
                // });
                frameBufferObject.deactive(gl);
            }
        };
        return ShadowRenderer;
    }());
    feng3d.ShadowRenderer = ShadowRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 后处理效果
     * @author feng 2017-02-20
     */
    var PostEffect = (function () {
        function PostEffect() {
        }
        return PostEffect;
    }());
    feng3d.PostEffect = PostEffect;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 快速近似抗锯齿（Fast Approximate Anti-Aliasing）后处理效果
     * @author feng 2017-02-20
     *
     * @see
     * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.fragment.fx
     * https://github.com/playcanvas/engine/blob/master/extras/posteffects/posteffect-fxaa.js
     */
    var FXAAEffect = (function () {
        function FXAAEffect() {
        }
        return FXAAEffect;
    }());
    feng3d.FXAAEffect = FXAAEffect;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    var MeshFilter = (function (_super) {
        __extends(MeshFilter, _super);
        function MeshFilter(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.addRenderDataHolder(_this.mesh);
            return _this;
        }
        Object.defineProperty(MeshFilter.prototype, "mesh", {
            /**
             * Returns the instantiated Mesh assigned to the mesh filter.
             */
            get: function () {
                return this._mesh || feng3d.defaultGeometry;
            },
            set: function (value) {
                if (this._mesh == value)
                    return;
                if (this._mesh) {
                    this.removeRenderDataHolder(this.mesh);
                }
                this._mesh = value;
                this.addRenderDataHolder(this.mesh);
            },
            enumerable: true,
            configurable: true
        });
        return MeshFilter;
    }(feng3d.Component));
    feng3d.MeshFilter = MeshFilter;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var Object3DEventType1 = (function () {
        function Object3DEventType1() {
            this.visiblityUpdated = "visiblityUpdated";
        }
        return Object3DEventType1;
    }());
    feng3d.Object3DEventType1 = Object3DEventType1;
    //-------------- test ------------------
    // function a()
    // {
    //     Event.on({}, Object3DEvent.VISIBLITY_UPDATED, (e) => { e.data }, this);
    //     Event.on({}, Object3D.eventtype.visiblityUpdated, (e) => { e.data }, this);
    //     var o = new Object3D(null);
    //     Event.on(o, o.eventtype.visiblityUpdated, (e) => { e.data }, this);
    // }
    //-------------- test ------------------
    /**
     * Position, rotation and scale of an object.
     */
    var Object3D = (function (_super) {
        __extends(Object3D, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function Object3D(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            //------------------------------------------
            // Private Properties
            //------------------------------------------
            _this._smallestNumber = 0.0000000000000000000001;
            _this._x = 0;
            _this._y = 0;
            _this._z = 0;
            _this._rx = 0;
            _this._ry = 0;
            _this._rz = 0;
            _this._sx = 1;
            _this._sy = 1;
            _this._sz = 1;
            return _this;
        }
        Object.defineProperty(Object3D.prototype, "eventtype", {
            get: function () {
                return Object3D.eventtype;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "x", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            get: function () {
                return this._x;
            },
            set: function (val) {
                if (this._x == val)
                    return;
                this._x = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (val) {
                if (this._y == val)
                    return;
                this._y = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "z", {
            get: function () {
                return this._z;
            },
            set: function (val) {
                if (this._z == val)
                    return;
                this._z = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rx", {
            get: function () {
                return this._rx;
            },
            set: function (val) {
                if (this.rx == val)
                    return;
                this._rx = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "ry", {
            get: function () {
                return this._ry;
            },
            set: function (val) {
                if (this.ry == val)
                    return;
                this._ry = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rz", {
            get: function () {
                return this._rz;
            },
            set: function (val) {
                if (this.rz == val)
                    return;
                this._rz = val;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sx", {
            get: function () {
                return this._sx;
            },
            set: function (val) {
                if (this._sx == val)
                    return;
                this._sx = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sy", {
            get: function () {
                return this._sy;
            },
            set: function (val) {
                if (this._sy == val)
                    return;
                this._sy = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "sz", {
            get: function () {
                return this._sz;
            },
            set: function (val) {
                if (this._sz == val)
                    return;
                this._sz = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "matrix3d", {
            /**
             * @private
             */
            get: function () {
                if (!this._matrix3d)
                    this.updateMatrix3D();
                return this._matrix3d;
            },
            set: function (val) {
                var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
                val.copyRawDataTo(raw);
                if (!raw[0]) {
                    raw[0] = this._smallestNumber;
                    val.copyRawDataFrom(raw);
                }
                var elements = val.decompose();
                var vec;
                this.position = elements[0];
                this.rotation = elements[1].scaleBy(180 / Math.PI);
                this.scale = elements[2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "position", {
            /**
             * 返回保存位置数据的Vector3D对象
             */
            get: function () {
                return new feng3d.Vector3D(this._x, this._y, this._z);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._x != x || this._y != y || this._z != z) {
                    this._x = x;
                    this._y = y;
                    this._z = z;
                    this.invalidatePosition();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotation", {
            get: function () {
                return new feng3d.Vector3D(this._rx, this._ry, this._rz);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._rx != x || this._ry != y || this._rz != z) {
                    this._rx = x;
                    this._ry = y;
                    this._rz = z;
                    this.invalidateRotation();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "scale", {
            get: function () {
                return new feng3d.Vector3D(this._sx, this._sy, this._sz);
            },
            set: function (_a) {
                var _b = _a.x, x = _b === void 0 ? 1 : _b, _c = _a.y, y = _c === void 0 ? 1 : _c, _d = _a.z, z = _d === void 0 ? 1 : _d;
                if (this._sx != x || this._sy != y || this._sz != z) {
                    this._sx = x;
                    this._sy = y;
                    this._sz = z;
                    this.invalidateScale();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "forwardVector", {
            get: function () {
                return this.matrix3d.forward;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rightVector", {
            get: function () {
                return this.matrix3d.right;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "upVector", {
            get: function () {
                return this.matrix3d.up;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "backVector", {
            get: function () {
                var director = this.matrix3d.forward;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "leftVector", {
            get: function () {
                var director = this.matrix3d.left;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "downVector", {
            get: function () {
                var director = this.matrix3d.up;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object3D.prototype.moveForward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, distance);
        };
        Object3D.prototype.moveBackward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, -distance);
        };
        Object3D.prototype.moveLeft = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, -distance);
        };
        Object3D.prototype.moveRight = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, distance);
        };
        Object3D.prototype.moveUp = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, distance);
        };
        Object3D.prototype.moveDown = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, -distance);
        };
        Object3D.prototype.translate = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        };
        Object3D.prototype.translateLocal = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            var matrix3d = this.matrix3d.clone();
            matrix3d.prependTranslation(x * len, y * len, z * len);
            this._x = matrix3d.position.x;
            this._y = matrix3d.position.y;
            this._z = matrix3d.position.z;
            this.invalidatePosition();
        };
        Object3D.prototype.pitch = function (angle) {
            this.rotate(feng3d.Vector3D.X_AXIS, angle);
        };
        Object3D.prototype.yaw = function (angle) {
            this.rotate(feng3d.Vector3D.Y_AXIS, angle);
        };
        Object3D.prototype.roll = function (angle) {
            this.rotate(feng3d.Vector3D.Z_AXIS, angle);
        };
        Object3D.prototype.rotateTo = function (ax, ay, az) {
            this._rx = ax;
            this._ry = ay;
            this._rz = az;
            this.invalidateRotation();
        };
        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         *
         */
        Object3D.prototype.rotate = function (axis, angle, pivotPoint) {
            //转换位移
            var positionMatrix3d = feng3d.Matrix3D.fromPosition(this.position);
            positionMatrix3d.appendRotation(angle, axis, pivotPoint);
            this.position = positionMatrix3d.position;
            //转换旋转
            var rotationMatrix3d = feng3d.Matrix3D.fromRotation(this.rx, this.ry, this.rz);
            rotationMatrix3d.appendRotation(angle, axis, pivotPoint);
            var newrotation = rotationMatrix3d.decompose()[1];
            newrotation.scaleBy(180 / Math.PI);
            var v = Math.round((newrotation.x - this.rx) / 180);
            if (v % 2 != 0) {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = function (a, b, c) {
                if (c === void 0) { c = 360; }
                return Math.round((b - a) / c) * c + a;
            };
            newrotation.x = toRound(newrotation.x, this.rx);
            newrotation.y = toRound(newrotation.y, this.ry);
            newrotation.z = toRound(newrotation.z, this.rz);
            this.rotation = newrotation;
        };
        Object3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            var xAxis = new feng3d.Vector3D();
            var yAxis = new feng3d.Vector3D();
            var zAxis = new feng3d.Vector3D();
            var raw;
            upAxis = upAxis || feng3d.Vector3D.Y_AXIS;
            if (!this._matrix3d) {
                this.updateMatrix3D();
            }
            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.length < .05) {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            raw[0] = this._sx * xAxis.x;
            raw[1] = this._sx * xAxis.y;
            raw[2] = this._sx * xAxis.z;
            raw[3] = 0;
            raw[4] = this._sy * yAxis.x;
            raw[5] = this._sy * yAxis.y;
            raw[6] = this._sy * yAxis.z;
            raw[7] = 0;
            raw[8] = this._sz * zAxis.x;
            raw[9] = this._sz * zAxis.y;
            raw[10] = this._sz * zAxis.z;
            raw[11] = 0;
            raw[12] = this._x;
            raw[13] = this._y;
            raw[14] = this._z;
            raw[15] = 1;
            this._matrix3d.copyRawDataFrom(raw);
            this.matrix3d = this.matrix3d;
            if (zAxis.z < 0) {
                this.ry = (180 - this.ry);
                this.rx -= 180;
                this.rz -= 180;
            }
        };
        Object3D.prototype.dispose = function () {
        };
        Object3D.prototype.disposeAsset = function () {
            this.dispose();
        };
        Object3D.prototype.invalidateTransform = function () {
            this._matrix3d = null;
        };
        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        Object3D.prototype.updateMatrix3D = function () {
            if (!this._position)
                this._position = new feng3d.Vector3D(this._x, this._y, this._z);
            if (!this._rotation)
                this._rotation = new feng3d.Vector3D(this._rx, this._ry, this._rz);
            if (!this._scale)
                this._scale = new feng3d.Vector3D(this._sx, this._sy, this._sz);
            this._matrix3d = new feng3d.Matrix3D().recompose([this._position, this._rotation.clone().scaleBy(Math.PI / 180), this._scale]);
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        Object3D.prototype.invalidateRotation = function () {
            if (!this._rotation)
                return;
            this._rotation = null;
            this.invalidateTransform();
            this.notifyRotationChanged();
        };
        Object3D.prototype.notifyRotationChanged = function () {
            feng3d.Event.dispatch(this, feng3d.Object3DEvent.ROTATION_CHANGED, this);
        };
        Object3D.prototype.invalidateScale = function () {
            if (!this._scale)
                return;
            this._scale = null;
            this.invalidateTransform();
            this.notifyScaleChanged();
        };
        Object3D.prototype.notifyScaleChanged = function () {
            feng3d.Event.dispatch(this, feng3d.Object3DEvent.SCALE_CHANGED, this);
        };
        Object3D.prototype.invalidatePosition = function () {
            if (!this._position)
                return;
            this._position = null;
            this.invalidateTransform();
            this.notifyPositionChanged();
        };
        Object3D.prototype.notifyPositionChanged = function () {
            feng3d.Event.dispatch(this, feng3d.Object3DEvent.POSITION_CHANGED, this);
        };
        return Object3D;
    }(feng3d.Component));
    Object3D.eventtype = new Object3DEventType1();
    __decorate([
        feng3d.serialize
    ], Object3D.prototype, "x", null);
    feng3d.Object3D = Object3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ObjectContainer3D = (function (_super) {
        __extends(ObjectContainer3D, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function ObjectContainer3D(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            //------------------------------------------
            // Variables
            //------------------------------------------
            _this._ancestorsAllowMouseEnabled = false;
            _this._isRoot = false;
            _this._sceneTransform = new feng3d.Matrix3D();
            _this._sceneTransformDirty = true;
            _this._mouseEnabled = true;
            _this._ignoreTransform = false;
            //------------------------------------------
            // Private Properties
            //------------------------------------------
            _this._children = [];
            _this._mouseChildren = true;
            _this._worldToLocalMatrix = new feng3d.Matrix3D();
            _this._worldToLocalMatrixDirty = true;
            _this._scenePosition = new feng3d.Vector3D();
            _this._scenePositionDirty = true;
            _this._explicitVisibility = true;
            _this._implicitVisibility = true;
            return _this;
        }
        Object.defineProperty(ObjectContainer3D.prototype, "childCount", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "ignoreTransform", {
            get: function () {
                return this._ignoreTransform;
            },
            set: function (value) {
                this._ignoreTransform = value;
                this._sceneTransformDirty = !value;
                this._worldToLocalMatrixDirty = !value;
                this._scenePositionDirty = !value;
                if (!value) {
                    this._sceneTransform.identity();
                    this._scenePosition.setTo(0, 0, 0);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "isVisible", {
            get: function () {
                return this._implicitVisibility && this._explicitVisibility;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "mouseEnabled", {
            get: function () {
                return this._mouseEnabled;
            },
            set: function (value) {
                this._mouseEnabled = value;
                this.updateMouseChildren();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "mouseChildren", {
            get: function () {
                return this._mouseChildren;
            },
            set: function (value) {
                this._mouseChildren = value;
                this.updateMouseChildren();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "visible", {
            get: function () {
                return this._explicitVisibility;
            },
            set: function (value) {
                var len = this._children.length;
                this._explicitVisibility = value;
                for (var i = 0; i < len; ++i)
                    this._children[i].updateImplicitVisibility();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "scenePosition", {
            get: function () {
                if (this._scenePositionDirty) {
                    this.localToWorldMatrix.copyColumnTo(3, this._scenePosition);
                    this._scenePositionDirty = false;
                }
                return this._scenePosition;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minX", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minX + child.x;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minY", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minY + child.y;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minZ", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minZ + child.z;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxX", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxX + child.x;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxY", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxY + child.y;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxZ", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxZ + child.z;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "localToWorldMatrix", {
            /**
             * Matrix that transforms a point from local space into world space.
             */
            get: function () {
                if (this._sceneTransformDirty)
                    this.updateLocalToWorldMatrix();
                return this._sceneTransform;
            },
            set: function (value) {
                value = value.clone();
                this._parent && value.append(this._parent.worldToLocalMatrix);
                this.matrix3d = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "scene", {
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        ObjectContainer3D.prototype.updateScene = function () {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
                feng3d.Event.dispatch(this, feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this);
            this._scene = newScene;
            if (this._scene)
                feng3d.Event.dispatch(this, feng3d.Scene3DEvent.ADDED_TO_SCENE, this);
            for (var i = 0, n = this._children.length; i < n; i++) {
                this._children[i].updateScene();
            }
        };
        Object.defineProperty(ObjectContainer3D.prototype, "worldToLocalMatrix", {
            /**
             * Matrix that transforms a point from world space into local space (Read Only).
             */
            get: function () {
                if (this._worldToLocalMatrixDirty) {
                    this._worldToLocalMatrix.copyFrom(this.localToWorldMatrix);
                    this._worldToLocalMatrix.invert();
                    this._worldToLocalMatrixDirty = false;
                }
                return this._worldToLocalMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        ObjectContainer3D.prototype.contains = function (child) {
            return this._children.indexOf(child) >= 0;
        };
        ObjectContainer3D.prototype.addChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child._setParent(this);
            child.notifySceneTransformChange();
            child.updateMouseChildren();
            child.updateImplicitVisibility();
            this._children.push(child);
            return child;
        };
        ObjectContainer3D.prototype.addChildren = function () {
            var childarray = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                childarray[_i] = arguments[_i];
            }
            for (var child_key_a in childarray) {
                var child = childarray[child_key_a];
                this.addChild(child);
            }
        };
        ObjectContainer3D.prototype.setChildAt = function (child, index) {
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
                child.notifySceneTransformChange();
                child.updateMouseChildren();
                child.updateImplicitVisibility();
                this._children[index] = child;
            }
        };
        ObjectContainer3D.prototype.removeChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        };
        ObjectContainer3D.prototype.removeChildAt = function (index) {
            index = index;
            var child = this._children[index];
            this.removeChildInternal(index, child);
        };
        ObjectContainer3D.prototype._setParent = function (value) {
            this._parent = value;
            this.updateMouseChildren();
            this.updateScene();
            this.notifySceneTransformChange();
            this.notifySceneChange();
        };
        ObjectContainer3D.prototype.getChildAt = function (index) {
            index = index;
            return this._children[index];
        };
        ObjectContainer3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            _super.prototype.lookAt.call(this, target, upAxis);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.translateLocal = function (axis, distance) {
            _super.prototype.translateLocal.call(this, axis, distance);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.dispose = function () {
            if (this.parent)
                this.parent.removeChild(this);
        };
        ObjectContainer3D.prototype.disposeWithChildren = function () {
            this.dispose();
            while (this.childCount > 0)
                this.getChildAt(0).dispose();
        };
        ObjectContainer3D.prototype.rotate = function (axis, angle, pivotPoint) {
            _super.prototype.rotate.call(this, axis, angle, pivotPoint);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.updateImplicitVisibility = function () {
            var len = this._children.length;
            this._implicitVisibility = this._parent._explicitVisibility && this._parent._implicitVisibility;
            for (var i = 0; i < len; ++i)
                this._children[i].updateImplicitVisibility();
        };
        /**
         * 获取子对象列表（备份）
         */
        ObjectContainer3D.prototype.getChildren = function () {
            return this._children.concat();
        };
        ObjectContainer3D.prototype.invalidateTransform = function () {
            _super.prototype.invalidateTransform.call(this);
            this.notifySceneTransformChange();
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        ObjectContainer3D.prototype.updateMouseChildren = function () {
            if (this._parent && !this._parent._isRoot) {
                this._ancestorsAllowMouseEnabled = this.parent._ancestorsAllowMouseEnabled && this._parent.mouseChildren;
            }
            else
                this._ancestorsAllowMouseEnabled = this.mouseChildren;
            var len = this._children.length;
            for (var i = 0; i < len; ++i)
                this._children[i].updateMouseChildren();
        };
        ObjectContainer3D.prototype.invalidateSceneTransform = function () {
            this._sceneTransformDirty = !this._ignoreTransform;
            this._worldToLocalMatrixDirty = !this._ignoreTransform;
            this._scenePositionDirty = !this._ignoreTransform;
        };
        ObjectContainer3D.prototype.updateLocalToWorldMatrix = function () {
            if (this._parent && !this._parent._isRoot) {
                this._sceneTransform.copyFrom(this._parent.localToWorldMatrix);
                this._sceneTransform.prepend(this.matrix3d);
            }
            else
                this._sceneTransform.copyFrom(this.matrix3d);
            this._sceneTransformDirty = false;
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        ObjectContainer3D.prototype.notifySceneTransformChange = function () {
            if (this._sceneTransformDirty || this._ignoreTransform)
                return;
            this.invalidateSceneTransform();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneTransformChange();
            feng3d.Event.dispatch(this, feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this);
        };
        ObjectContainer3D.prototype.notifySceneChange = function () {
            this.notifySceneTransformChange();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneChange();
            feng3d.Event.dispatch(this, feng3d.Object3DEvent.SCENE_CHANGED, this);
        };
        ObjectContainer3D.prototype.removeChildInternal = function (childIndex, child) {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);
        };
        return ObjectContainer3D;
    }(feng3d.Object3D));
    feng3d.ObjectContainer3D = ObjectContainer3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    var Transform = (function (_super) {
        __extends(Transform, _super);
        /**
         * 创建一个实体，该类为虚类
         */
        function Transform(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this._boundsInvalid = true;
            _this._worldBoundsInvalid = true;
            /**
             * 是否为公告牌（默认永远朝向摄像机），默认false。
             */
            _this.isBillboard = false;
            /**
             * 保持缩放尺寸
             */
            _this.holdSize = NaN;
            _this._updateEverytime = true;
            _this._bounds = _this.getDefaultBoundingVolume();
            _this._worldBounds = _this.getDefaultBoundingVolume();
            feng3d.Event.on(_this._bounds, "change", _this.onBoundsChange, _this);
            //
            _this.createUniformData("u_modelMatrix", function () { return _this.localToWorldMatrix; });
            return _this;
        }
        /**
         * 更新渲染数据
         */
        Transform.prototype.updateRenderData = function (renderContext, renderData) {
            if (this.isBillboard) {
                var parentInverseSceneTransform = (this.parent && this.parent.worldToLocalMatrix) || new feng3d.Matrix3D();
                var cameraPos = parentInverseSceneTransform.transformVector(renderContext.camera.sceneTransform.position);
                var yAxis = parentInverseSceneTransform.deltaTransformVector(feng3d.Vector3D.Y_AXIS);
                this.lookAt(cameraPos, yAxis);
            }
            if (this.holdSize) {
                var depthScale = this.getDepthScale(renderContext);
                var vec = this.localToWorldMatrix.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                this.localToWorldMatrix.recompose(vec);
            }
            _super.prototype.updateRenderData.call(this, renderContext, renderData);
        };
        Transform.prototype.getDepthScale = function (renderContext) {
            var cameraTranform = renderContext.camera.sceneTransform;
            var distance = this.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = renderContext.view3D.getScaleByDepth(depth);
            return scale;
        };
        Object.defineProperty(Transform.prototype, "minX", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "minY", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "minZ", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxX", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxY", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxZ", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "bounds", {
            /**
             * 边界
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        Transform.prototype.invalidateSceneTransform = function () {
            _super.prototype.invalidateSceneTransform.call(this);
            this._worldBoundsInvalid = true;
        };
        /**
         * 边界失效
         */
        Transform.prototype.invalidateBounds = function () {
            this._boundsInvalid = true;
        };
        /**
         * 获取默认边界（默认盒子边界）
         * @return
         */
        Transform.prototype.getDefaultBoundingVolume = function () {
            return new feng3d.AxisAlignedBoundingBox();
        };
        Object.defineProperty(Transform.prototype, "pickingCollisionVO", {
            /**
             * 获取碰撞数据
             */
            get: function () {
                if (!this._pickingCollisionVO)
                    this._pickingCollisionVO = new feng3d.PickingCollisionVO(this.gameObject);
                return this._pickingCollisionVO;
            },
            enumerable: true,
            configurable: true
        });
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        Transform.prototype.isIntersectingRay = function (ray3D) {
            var meshFilter = this.gameObject.getComponent(feng3d.MeshFilter);
            if (!meshFilter || !meshFilter.mesh)
                return false;
            if (!this.pickingCollisionVO.localNormal)
                this.pickingCollisionVO.localNormal = new feng3d.Vector3D();
            //转换到当前实体坐标系空间
            var localRay = this.pickingCollisionVO.localRay;
            this.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);
            //检测射线与边界的碰撞
            var rayEntryDistance = this.bounds.rayIntersection(localRay, this.pickingCollisionVO.localNormal);
            if (rayEntryDistance < 0)
                return false;
            //保存碰撞数据
            this.pickingCollisionVO.rayEntryDistance = rayEntryDistance;
            this.pickingCollisionVO.ray3D = ray3D;
            this.pickingCollisionVO.rayOriginIsInsideBounds = rayEntryDistance == 0;
            return true;
        };
        Object.defineProperty(Transform.prototype, "worldBounds", {
            /**
             * 世界边界
             */
            get: function () {
                if (this._worldBoundsInvalid)
                    this.updateWorldBounds();
                return this._worldBounds;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新世界边界
         */
        Transform.prototype.updateWorldBounds = function () {
            this._worldBounds.transformFrom(this.bounds, this.localToWorldMatrix);
            this._worldBoundsInvalid = false;
        };
        /**
         * 处理包围盒变换事件
         */
        Transform.prototype.onBoundsChange = function () {
            this._worldBoundsInvalid = true;
        };
        /**
         * @inheritDoc
         */
        Transform.prototype.updateBounds = function () {
            var meshFilter = this.gameObject.getComponent(feng3d.MeshFilter);
            this._bounds.geometry = meshFilter.mesh;
            this._bounds.fromGeometry(meshFilter.mesh);
            this._boundsInvalid = false;
        };
        /**
         * 碰撞前设置碰撞状态
         * @param shortestCollisionDistance 最短碰撞距离
         * @param findClosest 是否寻找最优碰撞
         * @return
         */
        Transform.prototype.collidesBefore = function (pickingCollider, shortestCollisionDistance, findClosest) {
            pickingCollider.setLocalRay(this._pickingCollisionVO.localRay);
            this._pickingCollisionVO.renderable = null;
            var meshFilter = this.gameObject.getComponent(feng3d.MeshFilter);
            var model = meshFilter.mesh;
            if (pickingCollider.testSubMeshCollision(model, this._pickingCollisionVO, shortestCollisionDistance)) {
                shortestCollisionDistance = this._pickingCollisionVO.rayEntryDistance;
                this._pickingCollisionVO.renderable = model;
                if (!findClosest)
                    return true;
            }
            return this._pickingCollisionVO.renderable != null;
        };
        return Transform;
    }(feng3d.ObjectContainer3D));
    feng3d.Transform = Transform;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for all entities in feng3d scenes.
     */
    var GameObject = (function (_super) {
        __extends(GameObject, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        function GameObject(name) {
            if (name === void 0) { name = "GameObject"; }
            var _this = _super.call(this) || this;
            /**
             * @private
             */
            _this.renderData = new feng3d.Object3DRenderAtomic();
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 组件列表
             */
            _this.components = [];
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
        Object.defineProperty(GameObject.prototype, "numComponents", {
            /**
             * 子组件个数
             */
            get: function () {
                return this.components.length;
            },
            enumerable: true,
            configurable: true
        });
        GameObject.prototype.updateRender = function (renderContext) {
            if (this.renderData.renderHolderInvalid) {
                this.renderData.clear();
                this.collectRenderDataHolder(this.renderData);
                this.renderData.renderHolderInvalid = false;
            }
            this.renderData.update(renderContext);
        };
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        GameObject.prototype.getComponentAt = function (index) {
            feng3d.debuger && console.assert(index < this.numComponents, "给出索引超出范围");
            return this.components[index];
        };
        /**
         * 添加组件
         * Adds a component class named className to the game object.
         * @param param 被添加组件
         */
        GameObject.prototype.addComponent = function (param) {
            var component;
            if (this.getComponent(param)) {
                alert("The compnent " + component.constructor["name"] + " can't be added because " + this.name + " already contains the same component.");
                return;
            }
            component = new param(this);
            this.addComponentAt(component, this.components.length);
            return component;
        };
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        GameObject.prototype.hasComponent = function (com) {
            return this.components.indexOf(com) != -1;
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
                filterResult = this.components.concat();
            }
            else {
                filterResult = this.components.filter(function (value, index, array) {
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
            for (var i = 0, n = this.components.length; i < n; i++) {
                if (!type) {
                    result.push(this.components[i]);
                }
                else if (this.components[i] instanceof type) {
                    result.push(this.components[i]);
                }
            }
            for (var i = 0, n = this.transform.childCount; i < n; i++) {
                this.transform.getChildAt(i).gameObject.getComponentsInChildren(type, result);
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
            var oldIndex = this.components.indexOf(component);
            feng3d.debuger && console.assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");
            this.components.splice(oldIndex, 1);
            this.components.splice(index, 0, component);
        };
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        GameObject.prototype.setComponentAt = function (component, index) {
            if (this.components[index]) {
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
            feng3d.debuger && console.assert(this.components.indexOf(component) != -1, "组件不在容器中");
            var index = this.components.indexOf(component);
            return index;
        };
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        GameObject.prototype.removeComponentAt = function (index) {
            feng3d.debuger && console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var component = this.components.splice(index, 1)[0];
            //派发移除组件事件
            feng3d.Event.dispatch(component, feng3d.ComponentEvent.REMOVED_COMPONENT, { container: this, child: component });
            feng3d.Event.dispatch(this, feng3d.ComponentEvent.REMOVED_COMPONENT, { container: this, child: component });
            this.removeRenderDataHolder(component);
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
            var temp = this.components[index1];
            this.components[index1] = this.components[index2];
            this.components[index2] = temp;
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
            for (var i = this.components.length - 1; i >= 0; i--) {
                if (this.components[i].constructor == type)
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
                index = Math.min(index, this.components.length - 1);
                this.setComponentIndex(component, index);
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(component.constructor);
            this.components.splice(index, 0, component);
            //派发添加组件事件
            feng3d.Event.dispatch(component, feng3d.ComponentEvent.ADDED_COMPONENT, { container: this, child: component });
            feng3d.Event.dispatch(this, feng3d.ComponentEvent.ADDED_COMPONENT, { container: this, child: component });
            this.addRenderDataHolder(component);
        };
        return GameObject;
    }(feng3d.Feng3dObject));
    //------------------------------------------
    // Static Functions
    //------------------------------------------
    GameObject._gameObjects = [];
    feng3d.GameObject = GameObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    var View3D = (function () {
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        function View3D(canvas, scene, camera, autoRender) {
            if (canvas === void 0) { canvas = null; }
            if (scene === void 0) { scene = null; }
            if (camera === void 0) { camera = null; }
            if (autoRender === void 0) { autoRender = true; }
            /**
             * 鼠标在3D视图中的位置
             */
            this.mousePos = new feng3d.Point();
            //初始化引擎
            feng3d.initEngine();
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvas.id = "glcanvas";
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                document.body.appendChild(canvas);
            }
            feng3d.debuger && console.assert(canvas instanceof HTMLCanvasElement, "canvas\u53C2\u6570\u5FC5\u987B\u4E3A HTMLCanvasElement \u7C7B\u578B\uFF01");
            this._canvas = canvas;
            var glProxy = new feng3d.GLProxy(canvas);
            this._gl = glProxy.gl;
            this.initGL();
            this._viewRect = new feng3d.Rectangle(this._canvas.clientLeft, this._canvas.clientTop, this._canvas.clientWidth, this._canvas.clientHeight);
            this.scene = scene || feng3d.GameObject.create("scene").addComponent(feng3d.Scene3D);
            this.camera = camera || feng3d.GameObject.create("camera").addComponent(feng3d.Camera);
            this.autoRender = autoRender;
            this.defaultRenderer = new feng3d.ForwardRenderer();
            this.mouse3DManager = new feng3d.Mouse3DManager();
            this.shadowRenderer = new feng3d.ShadowRenderer();
            this._renderContext = new feng3d.RenderContext();
            feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
        }
        Object.defineProperty(View3D.prototype, "autoRender", {
            /**
             * 是否自动渲染
             */
            get: function () {
                return this._autoRender;
            },
            set: function (value) {
                if (this._autoRender)
                    feng3d.Event.off(feng3d.ticker, "enterFrame", this.render, this);
                this._autoRender = value;
                if (this._autoRender)
                    feng3d.Event.on(feng3d.ticker, "enterFrame", this.render, this);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View3D.prototype, "viewRect", {
            get: function () {
                return this._viewRect;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 初始化GL
         */
        View3D.prototype.initGL = function () {
            this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            this._gl.clearDepth(1.0); // Clear everything
            this._gl.enable(feng3d.GL.DEPTH_TEST); // Enable depth testing
            this._gl.depthFunc(feng3d.GL.LEQUAL); // Near things obscure far things
        };
        Object.defineProperty(View3D.prototype, "scene", {
            /** 3d场景 */
            get: function () {
                return this._scene;
            },
            set: function (value) {
                this._scene = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View3D.prototype, "width", {
            /**
             * 视窗宽度
             */
            get: function () {
                return this._canvas.width;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 绘制场景
         */
        View3D.prototype.render = function () {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;
            this._renderContext.camera = this._camera;
            this._renderContext.scene3d = this._scene;
            this._renderContext.view3D = this;
            this._renderContext.gl = this._gl;
            var viewClientRect = this._canvas.getBoundingClientRect();
            var viewRect = this._viewRect = this._viewRect || new feng3d.Rectangle();
            viewRect.setTo(viewClientRect.left, viewClientRect.top, viewClientRect.width, viewClientRect.height);
            this.camera.lens.aspectRatio = viewRect.width / viewRect.height;
            //鼠标拾取渲染
            this.mouse3DManager.viewRect.copyFrom(viewRect);
            this.mouse3DManager.draw(this._renderContext);
            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);
            // 默认渲染
            this.defaultRenderer.viewRect.copyFrom(viewRect);
            this.defaultRenderer.draw(this._renderContext);
        };
        Object.defineProperty(View3D.prototype, "camera", {
            /**
             * 摄像机
             */
            get: function () {
                return this._camera;
            },
            set: function (value) {
                this._camera = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听鼠标事件收集事件类型
         */
        View3D.prototype.onMouseEvent = function (event) {
            var inputEvent = event.data;
            this.mousePos.setTo(inputEvent.clientX - this._viewRect.x, inputEvent.clientY - this._viewRect.y);
        };
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        View3D.prototype.getMouseRay3D = function () {
            var pos = this.mousePos;
            return this.getRay3D(pos.x, pos.y);
        };
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        View3D.prototype.getRay3D = function (x, y, ray3D) {
            if (ray3D === void 0) { ray3D = null; }
            //摄像机坐标
            var rayPosition = this.unproject(x, y, 0, View3D.tempRayPosition);
            //摄像机前方1处坐标
            var rayDirection = this.unproject(x, y, 1, View3D.tempRayDirection);
            //射线方向
            rayDirection.x = rayDirection.x - rayPosition.x;
            rayDirection.y = rayDirection.y - rayPosition.y;
            rayDirection.z = rayDirection.z - rayPosition.z;
            rayDirection.normalize();
            //定义射线
            ray3D = ray3D || new feng3d.Ray3D(rayPosition, rayDirection);
            return ray3D;
        };
        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        View3D.prototype.project = function (point3d) {
            var v = this._camera.project(point3d);
            v.x = (v.x + 1.0) * this._canvas.width / 2.0;
            v.y = (v.y + 1.0) * this._canvas.height / 2.0;
            return v;
        };
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        View3D.prototype.unproject = function (sX, sY, sZ, v) {
            if (v === void 0) { v = null; }
            var gpuPos = this.screenToGpuPosition(new feng3d.Point(sX, sY));
            return this._camera.unproject(gpuPos.x, gpuPos.y, sZ, v);
        };
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        View3D.prototype.screenToGpuPosition = function (screenPos) {
            var gpuPos = new feng3d.Point();
            gpuPos.x = (screenPos.x * 2 - this._canvas.width) / this._canvas.width;
            gpuPos.y = (screenPos.y * 2 - this._canvas.height) / this._canvas.height;
            return gpuPos;
        };
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        View3D.prototype.getScaleByDepth = function (depth) {
            var centerX = this._viewRect.width / 2;
            var centerY = this._viewRect.height / 2;
            var lt = this.unproject(centerX - 0.5, centerY - 0.5, depth);
            var rb = this.unproject(centerX + 0.5, centerY + 0.5, depth);
            var scale = lt.subtract(rb).length;
            return scale;
        };
        return View3D;
    }());
    /**
     * 射线坐标临时变量
     */
    View3D.tempRayPosition = new feng3d.Vector3D();
    /**
     * 射线方向临时变量
     */
    View3D.tempRayDirection = new feng3d.Vector3D();
    feng3d.View3D = View3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象事件
     */
    var Object3DEvent = (function () {
        function Object3DEvent() {
        }
        return Object3DEvent;
    }());
    Object3DEvent.VISIBLITY_UPDATED = "visiblityUpdated";
    Object3DEvent.SCENETRANSFORM_CHANGED = "scenetransformChanged";
    Object3DEvent.SCENE_CHANGED = "sceneChanged";
    Object3DEvent.POSITION_CHANGED = "positionChanged";
    Object3DEvent.ROTATION_CHANGED = "rotationChanged";
    Object3DEvent.SCALE_CHANGED = "scaleChanged";
    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    Object3DEvent.ADDED = "added";
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    Object3DEvent.REMOVED = "removed";
    feng3d.Object3DEvent = Object3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    var MeshRenderer = (function (_super) {
        __extends(MeshRenderer, _super);
        /**
         * 构建
         */
        function MeshRenderer(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this._single = true;
            return _this;
        }
        MeshRenderer.prototype.drawRenderables = function (renderContext) {
            if (this.gameObject.transform.isVisible) {
                var frustumPlanes = renderContext.camera.frustumPlanes;
                var gameObject = this.gameObject;
                var isIn = gameObject.transform.worldBounds.isInFrustum(frustumPlanes, 6);
                var model = gameObject.getComponent(MeshRenderer);
                if (gameObject.getComponent(feng3d.MeshFilter).mesh instanceof feng3d.SkyBoxGeometry) {
                    isIn = true;
                }
                if (isIn) {
                    _super.prototype.drawRenderables.call(this, renderContext);
                }
            }
        };
        return MeshRenderer;
    }(feng3d.Renderer));
    feng3d.MeshRenderer = MeshRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    var Object3dScript = (function (_super) {
        __extends(Object3dScript, _super);
        function Object3dScript() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 脚本路径
             */
            _this.script = "";
            return _this;
        }
        return Object3dScript;
    }(feng3d.Component));
    feng3d.Object3dScript = Object3dScript;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    var Scene3D = (function (_super) {
        __extends(Scene3D, _super);
        /**
         * 构造3D场景
         */
        function Scene3D(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 背景颜色
             */
            _this.background = new feng3d.Color(0, 0, 0, 1);
            /**
             * 环境光强度
             */
            _this.ambientColor = new feng3d.Color();
            gameObject.transform["_scene"] = _this;
            gameObject.transform._isRoot = true;
            return _this;
        }
        return Scene3D;
    }(feng3d.Component));
    feng3d.Scene3D = Scene3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    var Scene3DEvent = (function () {
        function Scene3DEvent() {
        }
        return Scene3DEvent;
    }());
    /**
     * 当Object3D的scene属性被设置是由Scene3D派发
     */
    Scene3DEvent.ADDED_TO_SCENE = "addedToScene";
    /**
     * 当Object3D的scene属性被清空时由Scene3D派发
     */
    Scene3DEvent.REMOVED_FROM_SCENE = "removedFromScene";
    feng3d.Scene3DEvent = Scene3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    var Geometry = (function (_super) {
        __extends(Geometry, _super);
        /**
         * 创建一个几何体
         */
        function Geometry() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._geometryInvalid = true;
            _this._useFaceWeights = false;
            _this._scaleU = 1;
            _this._scaleV = 1;
            return _this;
        }
        Object.defineProperty(Geometry.prototype, "positions", {
            /**
             * 坐标数据
             */
            get: function () {
                return this.getVAData1("a_position");
            },
            set: function (value) {
                this.setVAData("a_position", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "uvs", {
            /**
             * uv数据
             */
            get: function () {
                return this.getVAData1("a_uv");
            },
            set: function (value) {
                this.setVAData("a_uv", value, 2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "normals", {
            /**
             * 法线数据
             */
            get: function () {
                return this.getVAData1("a_normal");
            },
            set: function (value) {
                this.setVAData("a_normal", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "tangents", {
            /**
             * 切线数据
             */
            get: function () {
                return this.getVAData1("a_tangent");
            },
            set: function (value) {
                this.setVAData("a_tangent", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新渲染数据
         */
        Geometry.prototype.updateRenderData = function (renderContext, renderData) {
            this.updateGrometry();
            _super.prototype.updateRenderData.call(this, renderContext, renderData);
        };
        /**
         * 几何体变脏
         */
        Geometry.prototype.invalidateGeometry = function () {
            this._geometryInvalid = true;
        };
        /**
         * 更新几何体
         */
        Geometry.prototype.updateGrometry = function () {
            if (this._geometryInvalid) {
                this.buildGeometry();
                this._geometryInvalid = false;
                this.invalidateBounds();
            }
        };
        /**
         * 构建几何体
         */
        Geometry.prototype.buildGeometry = function () {
        };
        Object.defineProperty(Geometry.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indexBuffer && this._indexBuffer.indices;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新顶点索引数据
         */
        Geometry.prototype.setIndices = function (indices) {
            this._indexBuffer = this.createIndexBuffer(indices);
            feng3d.Event.dispatch(this, feng3d.GeometryEvent.CHANGED_INDEX_DATA);
        };
        /**
         * 获取顶点数据
         */
        Geometry.prototype.getIndexData = function () {
            return this._indexBuffer;
        };
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        Geometry.prototype.setVAData = function (vaId, data, size) {
            if (data) {
                if (!this._attributes[vaId])
                    this._attributes[vaId] = this.createAttributeRenderData(vaId, data, size);
                this._attributes[vaId].data = data;
            }
            else {
                delete this._attributes[vaId];
            }
            feng3d.Event.dispatch(this, feng3d.GeometryEvent.CHANGED_VA_DATA, vaId);
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData = function (vaId) {
            this.updateGrometry();
            feng3d.Event.dispatch(this, feng3d.GeometryEvent.GET_VA_DATA, vaId);
            return this._attributes[vaId];
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData1 = function (vaId) {
            var attributeRenderData = this.getVAData(vaId);
            return attributeRenderData && attributeRenderData.data;
        };
        Object.defineProperty(Geometry.prototype, "numVertex", {
            /**
             * 顶点数量
             */
            get: function () {
                var numVertex = 0;
                for (var attributeName in this._attributes) {
                    var attributeRenderData = this._attributes[attributeName];
                    numVertex = attributeRenderData.data.length / attributeRenderData.size;
                    break;
                }
                return numVertex;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        Geometry.prototype.addGeometry = function (geometry, transform) {
            if (transform === void 0) { transform = null; }
            //更新几何体
            this.updateGrometry();
            geometry.updateGrometry();
            //变换被添加的几何体
            if (transform != null) {
                geometry = geometry.clone();
                geometry.applyTransformation(transform);
            }
            //如果自身为空几何体
            if (!this._indexBuffer) {
                this.cloneFrom(geometry);
                return;
            }
            //
            var attributes = this._attributes;
            var addAttributes = geometry._attributes;
            //当前顶点数量
            var oldNumVertex = this.numVertex;
            //合并索引
            var indices = this._indexBuffer.indices;
            var targetIndices = geometry._indexBuffer.indices;
            var totalIndices = new Uint16Array(indices.length + targetIndices.length);
            totalIndices.set(indices, 0);
            for (var i = 0; i < targetIndices.length; i++) {
                totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
            }
            this.setIndices(totalIndices);
            //合并后顶点数量
            var totalVertex = oldNumVertex + geometry.numVertex;
            //合并属性数据
            for (var attributeName in attributes) {
                var stride = attributes[attributeName].size;
                var data = new Float32Array(totalVertex * stride);
                data.set(attributes[attributeName].data, 0);
                data.set(addAttributes[attributeName].data, oldNumVertex * stride);
                this.setVAData(attributeName, data, stride);
            }
        };
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        Geometry.prototype.applyTransformation = function (transform) {
            this.updateGrometry();
            var positionRenderData = this.getVAData("a_position");
            var normalRenderData = this.getVAData("a_normal");
            var tangentRenderData = this.getVAData("a_tangent");
            var vertices = positionRenderData.data;
            var normals = normalRenderData.data;
            var tangents = tangentRenderData.data;
            var posStride = positionRenderData.size;
            var normalStride = normalRenderData.size;
            var tangentStride = tangentRenderData.size;
            var len = vertices.length / posStride;
            var i, i1, i2;
            var vector = new feng3d.Vector3D();
            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose;
            if (bakeNormals || bakeTangents) {
                invTranspose = transform.clone();
                invTranspose.invert();
                invTranspose.transpose();
            }
            var vi0 = 0;
            var ni0 = 0;
            var ti0 = 0;
            for (i = 0; i < len; ++i) {
                i1 = vi0 + 1;
                i2 = vi0 + 2;
                // bake position
                vector.x = vertices[vi0];
                vector.y = vertices[i1];
                vector.z = vertices[i2];
                vector = transform.transformVector(vector);
                vertices[vi0] = vector.x;
                vertices[i1] = vector.y;
                vertices[i2] = vector.z;
                vi0 += posStride;
                // bake normal
                if (bakeNormals) {
                    i1 = ni0 + 1;
                    i2 = ni0 + 2;
                    vector.x = normals[ni0];
                    vector.y = normals[i1];
                    vector.z = normals[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    normals[ni0] = vector.x;
                    normals[i1] = vector.y;
                    normals[i2] = vector.z;
                    ni0 += normalStride;
                }
                // bake tangent
                if (bakeTangents) {
                    i1 = ti0 + 1;
                    i2 = ti0 + 2;
                    vector.x = tangents[ti0];
                    vector.y = tangents[i1];
                    vector.z = tangents[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    tangents[ti0] = vector.x;
                    tangents[i1] = vector.y;
                    tangents[i2] = vector.z;
                    ti0 += tangentStride;
                }
            }
            positionRenderData.invalidate();
            normalRenderData.invalidate();
            normalRenderData.invalidate();
        };
        Object.defineProperty(Geometry.prototype, "scaleU", {
            /**
             * 纹理U缩放，默认为1。
             */
            get: function () {
                return this._scaleU;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "scaleV", {
            /**
             * 纹理V缩放，默认为1。
             */
            get: function () {
                return this._scaleV;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        Geometry.prototype.scaleUV = function (scaleU, scaleV) {
            if (scaleU === void 0) { scaleU = 1; }
            if (scaleV === void 0) { scaleV = 1; }
            this.updateGrometry();
            var uvVaData = this.getVAData("a_uv");
            var uvs = uvVaData.data;
            var len = uvs.length;
            var ratioU = scaleU / this._scaleU;
            var ratioV = scaleV / this._scaleV;
            for (var i = 0; i < len; i += 2) {
                uvs[i] *= ratioU;
                uvs[i + 1] *= ratioV;
            }
            this._scaleU = scaleU;
            this._scaleV = scaleV;
            uvVaData.invalidate();
        };
        /**
         * 包围盒失效
         */
        Geometry.prototype.invalidateBounds = function () {
            feng3d.Event.dispatch(this, feng3d.GeometryEvent.BOUNDS_INVALID);
        };
        /**
         * 创建顶点法线
         */
        Geometry.prototype.createVertexNormals = function () {
            //生成法线
            var normals = feng3d.GeometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
            this.normals = new Float32Array(normals);
        };
        /**
         * 创建顶点切线
         */
        Geometry.prototype.createVertexTangents = function () {
            //生成切线
            var tangents = feng3d.GeometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
            this.tangents = new Float32Array(tangents);
        };
        /**
         * 克隆一个几何体
         */
        Geometry.prototype.clone = function () {
            var geometry = new Geometry();
            geometry.cloneFrom(this);
            return geometry;
        };
        /**
         * 从一个几何体中克隆数据
         */
        Geometry.prototype.cloneFrom = function (geometry) {
            geometry.updateGrometry();
            this._indexBuffer = geometry._indexBuffer.clone();
            this._attributes = {};
            for (var key in geometry._attributes) {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(key, attributeRenderData.data, attributeRenderData.size);
            }
        };
        return Geometry;
    }(feng3d.Feng3dObject));
    feng3d.Geometry = Geometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    var GeometryEvent = (function () {
        function GeometryEvent() {
        }
        return GeometryEvent;
    }());
    /**
     * 获取几何体顶点数据
     */
    GeometryEvent.GET_VA_DATA = "getVAData";
    /**
     * 改变几何体顶点数据事件
     */
    GeometryEvent.CHANGED_VA_DATA = "changedVAData";
    /**
     * 改变顶点索引数据事件
     */
    GeometryEvent.CHANGED_INDEX_DATA = "changedIndexData";
    /**
     * 包围盒失效
     */
    GeometryEvent.BOUNDS_INVALID = "boundsInvalid";
    feng3d.GeometryEvent = GeometryEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GeometryUtils = (function () {
        function GeometryUtils() {
        }
        GeometryUtils.createFaceNormals = function (indices, positions, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var i = 0, j = 0, k = 0;
            var index = 0;
            var len = indices.length;
            var x1 = 0, x2 = 0, x3 = 0;
            var y1 = 0, y2 = 0, y3 = 0;
            var z1 = 0, z2 = 0, z3 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var d = 0;
            var posStride = 3;
            var faceNormals = new Array(len);
            if (useFaceWeights)
                var faceWeights = new Array(len / 3);
            while (i < len) {
                index = indices[i++] * posStride;
                x1 = positions[index];
                y1 = positions[index + 1];
                z1 = positions[index + 2];
                index = indices[i++] * posStride;
                x2 = positions[index];
                y2 = positions[index + 1];
                z2 = positions[index + 2];
                index = indices[i++] * posStride;
                x3 = positions[index];
                y3 = positions[index + 1];
                z3 = positions[index + 2];
                dx1 = x3 - x1;
                dy1 = y3 - y1;
                dz1 = z3 - z1;
                dx2 = x2 - x1;
                dy2 = y2 - y1;
                dz2 = z2 - z1;
                cx = dz1 * dy2 - dy1 * dz2;
                cy = dx1 * dz2 - dz1 * dx2;
                cz = dy1 * dx2 - dx1 * dy2;
                d = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights) {
                    var w = d * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                d = 1 / d;
                faceNormals[j++] = cx * d;
                faceNormals[j++] = cy * d;
                faceNormals[j++] = cz * d;
            }
            return { faceNormals: faceNormals, faceWeights: faceWeights };
        };
        GeometryUtils.createVertexNormals = function (_indices, positions, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var faceNormalsResult = GeometryUtils.createFaceNormals(_indices, positions, useFaceWeights);
            var faceWeights = faceNormalsResult.faceWeights;
            var faceNormals = faceNormalsResult.faceNormals;
            var v1 = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            var lenV = positions.length;
            var normalStride = 3;
            var normalOffset = 0;
            var normals = new Array(lenV);
            v1 = 0;
            while (v1 < lenV) {
                normals[v1] = 0.0;
                normals[v1 + 1] = 0.0;
                normals[v1 + 2] = 0.0;
                v1 += normalStride;
            }
            var i = 0, k = 0;
            var lenI = _indices.length;
            var index = 0;
            var weight = 0;
            while (i < lenI) {
                weight = useFaceWeights ? faceWeights[k++] : 1;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            v1 = normalOffset;
            while (v1 < lenV) {
                var vx = normals[v1];
                var vy = normals[v1 + 1];
                var vz = normals[v1 + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                normals[v1] = vx * d;
                normals[v1 + 1] = vy * d;
                normals[v1 + 2] = vz * d;
                v1 += normalStride;
            }
            return normals;
        };
        GeometryUtils.createVertexTangents = function (indices, positions, uvs, _useFaceWeights) {
            if (_useFaceWeights === void 0) { _useFaceWeights = false; }
            var faceTangentsResult = GeometryUtils.createFaceTangents(indices, positions, uvs);
            var faceWeights = faceTangentsResult.faceWeights;
            var faceTangents = faceTangentsResult.faceTangents;
            var i = 0;
            var lenV = positions.length;
            var tangentStride = 3;
            var tangentOffset = 0;
            var target = new Array(lenV);
            i = tangentOffset;
            while (i < lenV) {
                target[i] = 0.0;
                target[i + 1] = 0.0;
                target[i + 2] = 0.0;
                i += tangentStride;
            }
            var k = 0;
            var lenI = indices.length;
            var index = 0;
            var weight = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            i = 0;
            while (i < lenI) {
                weight = _useFaceWeights ? faceWeights[k++] : 1;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            i = tangentOffset;
            while (i < lenV) {
                var vx = target[i];
                var vy = target[i + 1];
                var vz = target[i + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                target[i] = vx * d;
                target[i + 1] = vy * d;
                target[i + 2] = vz * d;
                i += tangentStride;
            }
            return target;
        };
        GeometryUtils.createFaceTangents = function (indices, positions, uvs, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var i = 0, k = 0;
            var index1 = 0, index2 = 0, index3 = 0;
            var len = indices.length;
            var ui = 0, vi = 0;
            var v0 = 0;
            var dv1 = 0, dv2 = 0;
            var denom = 0;
            var x0 = 0, y0 = 0, z0 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var posStride = 3;
            var posOffset = 0;
            var texStride = 2;
            var texOffset = 0;
            var faceTangents = new Array(indices.length);
            if (useFaceWeights)
                var faceWeights = new Array(len / 3);
            while (i < len) {
                index1 = indices[i];
                index2 = indices[i + 1];
                index3 = indices[i + 2];
                ui = texOffset + index1 * texStride + 1;
                v0 = uvs[ui];
                ui = texOffset + index2 * texStride + 1;
                dv1 = uvs[ui] - v0;
                ui = texOffset + index3 * texStride + 1;
                dv2 = uvs[ui] - v0;
                vi = posOffset + index1 * posStride;
                x0 = positions[vi];
                y0 = positions[vi + 1];
                z0 = positions[vi + 2];
                vi = posOffset + index2 * posStride;
                dx1 = positions[vi] - x0;
                dy1 = positions[vi + 1] - y0;
                dz1 = positions[vi + 2] - z0;
                vi = posOffset + index3 * posStride;
                dx2 = positions[vi] - x0;
                dy2 = positions[vi + 1] - y0;
                dz2 = positions[vi + 2] - z0;
                cx = dv2 * dx1 - dv1 * dx2;
                cy = dv2 * dy1 - dv1 * dy2;
                cz = dv2 * dz1 - dv1 * dz2;
                denom = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights) {
                    var w = denom * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                denom = 1 / denom;
                faceTangents[i++] = denom * cx;
                faceTangents[i++] = denom * cy;
                faceTangents[i++] = denom * cz;
            }
            return { faceTangents: faceTangents, faceWeights: faceWeights };
        };
        return GeometryUtils;
    }());
    feng3d.GeometryUtils = GeometryUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    var PointGeometry = (function (_super) {
        __extends(PointGeometry, _super);
        function PointGeometry() {
            var _this = _super.call(this) || this;
            /**
             * 几何体是否变脏
             */
            _this.geometryDirty = false;
            _this._points = [];
            _this.addPoint(new PointInfo(new feng3d.Vector3D(0, 0, 0)));
            return _this;
        }
        /**
         * 添加点
         * @param point		点数据
         */
        PointGeometry.prototype.addPoint = function (point, needUpdateGeometry) {
            if (needUpdateGeometry === void 0) { needUpdateGeometry = true; }
            this._points.push(point);
            this.geometryDirty = true;
            this.updateGeometry();
        };
        /**
         * 更新几何体
         */
        PointGeometry.prototype.updateGeometry = function () {
            this.geometryDirty = false;
            var positionStep = 3;
            var normalStep = 3;
            var uvStep = 2;
            var numPoints = this._points.length;
            var indices = new Uint16Array(numPoints);
            var positionData = new Float32Array(numPoints * positionStep);
            var normalData = new Float32Array(numPoints * normalStep);
            var uvData = new Float32Array(numPoints * uvStep);
            for (var i = 0; i < numPoints; i++) {
                var element = this._points[i];
                indices[i] = i;
                positionData.set(element.position.toArray(3), i * positionStep);
                normalData.set(element.normal.toArray(3), i * normalStep);
                uvData.set(element.uv.toArray(), i * uvStep);
            }
            this.positions = positionData;
            this.uvs = uvData;
            this.normals = normalData;
            this.setIndices(indices);
        };
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        PointGeometry.prototype.getPoint = function (index) {
            if (index < this._points.length)
                return this._points[index];
            return null;
        };
        /**
         * 移除所有线段
         */
        PointGeometry.prototype.removeAllPoints = function () {
            this.points.length = 0;
            this.geometryDirty = true;
        };
        Object.defineProperty(PointGeometry.prototype, "points", {
            /**
             * 线段列表
             */
            get: function () {
                return this._points;
            },
            enumerable: true,
            configurable: true
        });
        return PointGeometry;
    }(feng3d.Geometry));
    feng3d.PointGeometry = PointGeometry;
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    var PointInfo = (function () {
        /**
         * 创建点
         * @param position 坐标
         */
        function PointInfo(position, uv, normal) {
            if (position === void 0) { position = new feng3d.Vector3D(); }
            if (uv === void 0) { uv = new feng3d.Point(); }
            if (normal === void 0) { normal = new feng3d.Vector3D(0, 1, 0); }
            this.position = position;
            this.normal = normal;
            this.uv = uv;
        }
        return PointInfo;
    }());
    feng3d.PointInfo = PointInfo;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    var SegmentGeometry = (function (_super) {
        __extends(SegmentGeometry, _super);
        function SegmentGeometry() {
            var _this = _super.call(this) || this;
            _this.segments_ = [];
            return _this;
        }
        /**
         * 添加线段
         * @param segment		            线段数据
         */
        SegmentGeometry.prototype.addSegment = function (segment) {
            this.segments_.push(segment);
            this.invalidateGeometry();
        };
        /**
         * 设置线段
         * @param segment		            线段数据
         * @param index		                线段索引
         */
        SegmentGeometry.prototype.setSegmentAt = function (segment, index) {
            this.segments_[index] = segment;
            this.invalidateGeometry();
        };
        /**
         * 更新几何体
         */
        SegmentGeometry.prototype.buildGeometry = function () {
            var segmentPositionStep = 6;
            var segmentColorStep = 8;
            var numSegments = this.segments_.length;
            var indices = new Uint16Array(numSegments * 2);
            var positionData = new Float32Array(numSegments * segmentPositionStep);
            var colorData = new Float32Array(numSegments * segmentColorStep);
            for (var i = 0; i < numSegments; i++) {
                var element = this.segments_[i];
                indices.set([i * 2, i * 2 + 1], i * 2);
                positionData.set(element.positionData, i * segmentPositionStep);
                colorData.set(element.colorData, i * segmentColorStep);
            }
            this.setVAData("a_position", positionData, 3);
            this.setVAData("a_color", colorData, 4);
            this.setIndices(indices);
        };
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        SegmentGeometry.prototype.getSegment = function (index) {
            if (index < this.segments_.length)
                return this.segments_[index];
            return null;
        };
        /**
         * 移除所有线段
         */
        SegmentGeometry.prototype.removeAllSegments = function () {
            this.segments.length = 0;
            this.invalidateGeometry();
        };
        Object.defineProperty(SegmentGeometry.prototype, "segments", {
            /**
             * 线段列表
             */
            get: function () {
                return this.segments_;
            },
            enumerable: true,
            configurable: true
        });
        return SegmentGeometry;
    }(feng3d.Geometry));
    feng3d.SegmentGeometry = SegmentGeometry;
    /**
     * 线段
     * @author feng 2016-10-16
     */
    var Segment = (function () {
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        function Segment(start, end, colorStart, colorEnd, thickness) {
            if (colorStart === void 0) { colorStart = 0xffffff; }
            if (colorEnd === void 0) { colorEnd = 0xffffff; }
            if (thickness === void 0) { thickness = 1; }
            this.thickness = thickness * .5;
            this.start = start;
            this.end = end;
            this.startColor = new feng3d.Color();
            this.startColor.fromUnit(colorStart, colorStart > 1 << 24);
            this.endColor = new feng3d.Color();
            this.endColor.fromUnit(colorEnd, colorEnd > 1 << 24);
        }
        Object.defineProperty(Segment.prototype, "positionData", {
            /**
             * 坐标数据
             */
            get: function () {
                return [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Segment.prototype, "colorData", {
            /**
             * 颜色数据
             */
            get: function () {
                return [
                    this.startColor.r, this.startColor.g, this.startColor.b, this.startColor.a,
                    this.endColor.r, this.endColor.g, this.endColor.b, this.endColor.a,
                ];
            },
            enumerable: true,
            configurable: true
        });
        return Segment;
    }());
    feng3d.Segment = Segment;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    var CoordinateSystem = (function () {
        function CoordinateSystem() {
        }
        return CoordinateSystem;
    }());
    /**
     * 默认坐标系统，左手坐标系统
     */
    CoordinateSystem.LEFT_HANDED = 0;
    /**
     * 右手坐标系统
     */
    CoordinateSystem.RIGHT_HANDED = 1;
    feng3d.CoordinateSystem = CoordinateSystem;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    var LensBase = (function () {
        /**
         * 创建一个摄像机镜头
         */
        function LensBase() {
            /**
             * 最近距离
             */
            this.near = 0.1;
            /**
             * 最远距离
             */
            this.far = 10000;
            /**
             * 视窗缩放比例(width/height)，在渲染器中设置
             */
            this.aspectRatio = 1;
            this._scissorRect = new feng3d.Rectangle();
            this._viewPort = new feng3d.Rectangle();
            this._frustumCorners = [];
        }
        Object.defineProperty(LensBase.prototype, "frustumCorners", {
            /**
             * Retrieves the corner points of the lens frustum.
             */
            get: function () {
                return this._frustumCorners;
            },
            set: function (frustumCorners) {
                this._frustumCorners = frustumCorners;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LensBase.prototype, "matrix", {
            /**
             * 投影矩阵
             */
            get: function () {
                if (!this._matrix) {
                    this.updateMatrix();
                }
                return this._matrix;
            },
            set: function (value) {
                this._matrix = value;
                feng3d.Event.dispatch(this, feng3d.LensEvent.MATRIX_CHANGED, this);
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        LensBase.prototype.project = function (point3d, v) {
            if (v === void 0) { v = null; }
            if (!v)
                v = new feng3d.Vector3D();
            this.matrix.transformVector(point3d, v);
            v.x = v.x / v.w;
            v.y = -v.y / v.w;
            //z is unaffected by transform
            v.z = point3d.z;
            return v;
        };
        Object.defineProperty(LensBase.prototype, "unprojectionMatrix", {
            /**
             * 投影逆矩阵
             */
            get: function () {
                if (!this._unprojection) {
                    this._unprojection = new feng3d.Matrix3D();
                    this._unprojection.copyFrom(this.matrix);
                    this._unprojection.invert();
                }
                return this._unprojection;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 投影矩阵失效
         */
        LensBase.prototype.invalidateMatrix = function () {
            this._matrix = null;
            feng3d.Event.dispatch(this, feng3d.LensEvent.MATRIX_CHANGED, this);
            this._unprojection = null;
        };
        return LensBase;
    }());
    __decorate([
        feng3d.watch("invalidateMatrix"),
        feng3d.serialize
    ], LensBase.prototype, "near", void 0);
    __decorate([
        feng3d.watch("invalidateMatrix"),
        feng3d.serialize
    ], LensBase.prototype, "far", void 0);
    __decorate([
        feng3d.watch("invalidateMatrix"),
        feng3d.serialize
    ], LensBase.prototype, "aspectRatio", void 0);
    feng3d.LensBase = LensBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     *
     * @author feng 2015-5-28
     */
    var FreeMatrixLens = (function (_super) {
        __extends(FreeMatrixLens, _super);
        function FreeMatrixLens() {
            return _super.call(this) || this;
        }
        FreeMatrixLens.prototype.updateMatrix = function () {
        };
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        FreeMatrixLens.prototype.unproject = function (nX, nY, sZ, v) {
            return null;
        };
        return FreeMatrixLens;
    }(feng3d.LensBase));
    feng3d.FreeMatrixLens = FreeMatrixLens;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    var PerspectiveLens = (function (_super) {
        __extends(PerspectiveLens, _super);
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        function PerspectiveLens(fieldOfView, coordinateSystem) {
            if (fieldOfView === void 0) { fieldOfView = 60; }
            if (coordinateSystem === void 0) { coordinateSystem = feng3d.CoordinateSystem.LEFT_HANDED; }
            var _this = _super.call(this) || this;
            _this.fieldOfView = fieldOfView;
            _this.coordinateSystem = coordinateSystem;
            return _this;
        }
        PerspectiveLens.prototype.fieldOfViewChange = function () {
            delete this._focalLength;
            this.invalidateMatrix();
        };
        PerspectiveLens.prototype.coordinateSystemChange = function () {
            this.invalidateMatrix();
        };
        Object.defineProperty(PerspectiveLens.prototype, "focalLength", {
            /**
             * 焦距
             */
            get: function () {
                if (!this._focalLength)
                    this._focalLength = 1 / Math.tan(this.fieldOfView * Math.PI / 360);
                return this._focalLength;
            },
            set: function (value) {
                if (value == this._focalLength)
                    return;
                this._focalLength = value;
                this.fieldOfView = Math.atan(1 / this._focalLength) * 360 / Math.PI;
            },
            enumerable: true,
            configurable: true
        });
        PerspectiveLens.prototype.unproject = function (nX, nY, sZ, v) {
            if (v === void 0) { v = null; }
            if (!v)
                v = new feng3d.Vector3D();
            v.x = nX;
            v.y = -nY;
            v.z = sZ;
            v.w = 1;
            v.x *= sZ;
            v.y *= sZ;
            this.unprojectionMatrix.transformVector(v, v);
            //z is unaffected by transform
            v.z = sZ;
            return v;
        };
        PerspectiveLens.prototype.updateMatrix = function () {
            this._matrix = new feng3d.Matrix3D();
            var raw = this._matrix.rawData;
            this._focalLength = 1 / Math.tan(this.fieldOfView * Math.PI / 360);
            var _focalLengthInv = 1 / this._focalLength;
            this._yMax = this.near * _focalLengthInv;
            this._xMax = this._yMax * this.aspectRatio;
            var left, right, top, bottom;
            if (this._scissorRect.x == 0 && this._scissorRect.y == 0 && this._scissorRect.width == this._viewPort.width && this._scissorRect.height == this._viewPort.height) {
                // assume unscissored frustum
                left = -this._xMax;
                right = this._xMax;
                top = -this._yMax;
                bottom = this._yMax;
                // assume unscissored frustum
                raw[0] = this.near / this._xMax;
                raw[5] = this.near / this._yMax;
                raw[10] = this.far / (this.far - this.near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[8] = raw[9] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -this.near * raw[10];
            }
            else {
                // assume scissored frustum
                var xWidth = this._xMax * (this._viewPort.width / this._scissorRect.width);
                var yHgt = this._yMax * (this._viewPort.height / this._scissorRect.height);
                var center = this._xMax * (this._scissorRect.x * 2 - this._viewPort.width) / this._scissorRect.width + this._xMax;
                var middle = -this._yMax * (this._scissorRect.y * 2 - this._viewPort.height) / this._scissorRect.height - this._yMax;
                left = center - xWidth;
                right = center + xWidth;
                top = middle - yHgt;
                bottom = middle + yHgt;
                raw[0] = 2 * this.near / (right - left);
                raw[5] = 2 * this.near / (bottom - top);
                raw[8] = (right + left) / (right - left);
                raw[9] = (bottom + top) / (bottom - top);
                raw[10] = (this.far + this.near) / (this.far - this.near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -2 * this.far * this.near / (this.far - this.near);
            }
            // Switch projection transform from left to right handed.
            if (this.coordinateSystem == feng3d.CoordinateSystem.RIGHT_HANDED)
                raw[5] = -raw[5];
            var yMaxFar = this.far * _focalLengthInv;
            var xMaxFar = yMaxFar * this.aspectRatio;
            this._frustumCorners[0] = this._frustumCorners[9] = left;
            this._frustumCorners[3] = this._frustumCorners[6] = right;
            this._frustumCorners[1] = this._frustumCorners[4] = top;
            this._frustumCorners[7] = this._frustumCorners[10] = bottom;
            this._frustumCorners[12] = this._frustumCorners[21] = -xMaxFar;
            this._frustumCorners[15] = this._frustumCorners[18] = xMaxFar;
            this._frustumCorners[13] = this._frustumCorners[16] = -yMaxFar;
            this._frustumCorners[19] = this._frustumCorners[22] = yMaxFar;
            this._frustumCorners[2] = this._frustumCorners[5] = this._frustumCorners[8] = this._frustumCorners[11] = this.near;
            this._frustumCorners[14] = this._frustumCorners[17] = this._frustumCorners[20] = this._frustumCorners[23] = this.far;
        };
        return PerspectiveLens;
    }(feng3d.LensBase));
    __decorate([
        feng3d.watch("fieldOfViewChange"),
        feng3d.serialize
    ], PerspectiveLens.prototype, "fieldOfView", void 0);
    __decorate([
        feng3d.watch("coordinateSystemChange"),
        feng3d.serialize
    ], PerspectiveLens.prototype, "coordinateSystem", void 0);
    feng3d.PerspectiveLens = PerspectiveLens;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    var LensEvent = (function () {
        function LensEvent() {
        }
        return LensEvent;
    }());
    LensEvent.MATRIX_CHANGED = "matrixChanged";
    feng3d.LensEvent = LensEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    var Camera = (function (_super) {
        __extends(Camera, _super);
        /**
         * 创建一个摄像机
         */
        function Camera(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this._viewProjection = new feng3d.Matrix3D();
            _this._viewProjectionDirty = true;
            _this._frustumPlanesDirty = true;
            _this._single = true;
            _this._lens = new feng3d.PerspectiveLens();
            feng3d.Event.on(_this._lens, feng3d.LensEvent.MATRIX_CHANGED, _this.onLensMatrixChanged, _this);
            _this._frustumPlanes = [];
            for (var i = 0; i < 6; ++i)
                _this._frustumPlanes[i] = new feng3d.Plane3D();
            //
            _this.createUniformData("u_viewProjection", function () { return _this.viewProjection; });
            _this.createUniformData("u_cameraMatrix", function () {
                return _this.gameObject ? _this.gameObject.transform.localToWorldMatrix : new feng3d.Matrix3D();
            });
            _this.createUniformData("u_skyBoxSize", function () { return _this._lens.far / Math.sqrt(3); });
            return _this;
        }
        /**
         * 处理镜头变化事件
         */
        Camera.prototype.onLensMatrixChanged = function (event) {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
            feng3d.Event.dispatch(this, event.type, event.data);
        };
        Object.defineProperty(Camera.prototype, "lens", {
            /**
             * 镜头
             */
            get: function () {
                return this._lens;
            },
            set: function (value) {
                if (this._lens == value)
                    return;
                if (!value)
                    throw new Error("Lens cannot be null!");
                feng3d.Event.off(this._lens, feng3d.LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
                this._lens = value;
                feng3d.Event.on(this._lens, feng3d.LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
                feng3d.Event.dispatch(this, feng3d.CameraEvent.LENS_CHANGED, this);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "viewProjection", {
            /**
             * 场景投影矩阵，世界空间转投影空间
             */
            get: function () {
                if (this._viewProjectionDirty) {
                    //场景空间转摄像机空间
                    this._viewProjection.copyFrom(this.inverseSceneTransform);
                    //+摄像机空间转投影空间 = 场景空间转投影空间
                    this._viewProjection.append(this._lens.matrix);
                    this._viewProjectionDirty = false;
                }
                return this._viewProjection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "inverseSceneTransform", {
            get: function () {
                return this.gameObject ? this.gameObject.transform.worldToLocalMatrix : new feng3d.Matrix3D();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "sceneTransform", {
            get: function () {
                return this.gameObject ? this.gameObject.transform.localToWorldMatrix : new feng3d.Matrix3D();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        Camera.prototype.unproject = function (nX, nY, sZ, v) {
            if (v === void 0) { v = null; }
            return this.sceneTransform.transformVector(this.lens.unproject(nX, nY, sZ, v), v);
        };
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        Camera.prototype.project = function (point3d, v) {
            if (v === void 0) { v = null; }
            return this.lens.project(this.inverseSceneTransform.transformVector(point3d, v), v);
        };
        /**
         * 处理被添加组件事件
         */
        Camera.prototype.onBeAddedComponent = function (event) {
            feng3d.Event.on(this.gameObject.transform, feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        };
        /**
         * 处理被移除组件事件
         */
        Camera.prototype.onBeRemovedComponent = function (event) {
            feng3d.Event.off(this.gameObject.transform, feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        };
        /**
         * 处理场景变换改变事件
         */
        Camera.prototype.onScenetransformChanged = function () {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        };
        Object.defineProperty(Camera.prototype, "frustumPlanes", {
            /**
             * 视锥体面
             */
            get: function () {
                if (this._frustumPlanesDirty)
                    this.updateFrustum();
                return this._frustumPlanes;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        Camera.prototype.updateFrustum = function () {
            var a, b, c;
            //var d :number;
            var c11, c12, c13, c14;
            var c21, c22, c23, c24;
            var c31, c32, c33, c34;
            var c41, c42, c43, c44;
            var p;
            var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            //长度倒数
            var invLen;
            this.viewProjection.copyRawDataTo(raw);
            c11 = raw[0];
            c12 = raw[4];
            c13 = raw[8];
            c14 = raw[12];
            c21 = raw[1];
            c22 = raw[5];
            c23 = raw[9];
            c24 = raw[13];
            c31 = raw[2];
            c32 = raw[6];
            c33 = raw[10];
            c34 = raw[14];
            c41 = raw[3];
            c42 = raw[7];
            c43 = raw[11];
            c44 = raw[15];
            // left plane
            p = this._frustumPlanes[0];
            a = c41 + c11;
            b = c42 + c12;
            c = c43 + c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c14) * invLen;
            // right plane
            p = this._frustumPlanes[1];
            a = c41 - c11;
            b = c42 - c12;
            c = c43 - c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c14 - c44) * invLen;
            // bottom
            p = this._frustumPlanes[2];
            a = c41 + c21;
            b = c42 + c22;
            c = c43 + c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c24) * invLen;
            // top
            p = this._frustumPlanes[3];
            a = c41 - c21;
            b = c42 - c22;
            c = c43 - c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c24 - c44) * invLen;
            // near
            p = this._frustumPlanes[4];
            a = c31;
            b = c32;
            c = c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -c34 * invLen;
            // far
            p = this._frustumPlanes[5];
            a = c41 - c31;
            b = c42 - c32;
            c = c43 - c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c34 - c44) * invLen;
            this._frustumPlanesDirty = false;
        };
        return Camera;
    }(feng3d.Component));
    __decorate([
        feng3d.serialize
    ], Camera.prototype, "_lens", void 0);
    feng3d.Camera = Camera;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机事件
     * @author feng 2014-10-14
     */
    var CameraEvent = (function () {
        function CameraEvent() {
        }
        return CameraEvent;
    }());
    CameraEvent.LENS_CHANGED = "lensChanged";
    feng3d.CameraEvent = CameraEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 包围盒基类
     * @author feng 2014-4-27
     */
    var BoundingVolumeBase = (function () {
        /**
         * 创建包围盒
         */
        function BoundingVolumeBase() {
            this._aabbPointsDirty = true;
            this._min = new feng3d.Vector3D();
            this._max = new feng3d.Vector3D();
        }
        Object.defineProperty(BoundingVolumeBase.prototype, "geometry", {
            /**
             * 用于生产包围盒的几何体
             */
            get: function () {
                return this._geometry;
            },
            set: function (value) {
                if (this._geometry) {
                    feng3d.Event.off(this._geometry, feng3d.GeometryEvent.BOUNDS_INVALID, this.onGeometryBoundsInvalid, this);
                }
                this._geometry = value;
                this.fromGeometry(this._geometry);
                if (this._geometry) {
                    feng3d.Event.on(this._geometry, feng3d.GeometryEvent.BOUNDS_INVALID, this.onGeometryBoundsInvalid, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "max", {
            /**
             * The maximum extreme of the bounds
             */
            get: function () {
                return this._max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "min", {
            /**
             * The minimum extreme of the bounds
             */
            get: function () {
                return this._min;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理几何体包围盒失效
         */
        BoundingVolumeBase.prototype.onGeometryBoundsInvalid = function () {
            this.fromGeometry(this.geometry);
            feng3d.Event.dispatch(this, "change");
        };
        /**
         * 根据几何结构更新边界
         */
        BoundingVolumeBase.prototype.fromGeometry = function (geometry) {
            var minX, minY, minZ;
            var maxX, maxY, maxZ;
            var vertices = geometry.positions;
            if (!vertices) {
                this.fromExtremes(0, 0, 0, 0, 0, 0);
                return;
            }
            var i = 0;
            minX = maxX = vertices[i];
            minY = maxY = vertices[i + 1];
            minZ = maxZ = vertices[i + 2];
            var vertexDataLen = vertices.length;
            i = 0;
            var stride = 3;
            while (i < vertexDataLen) {
                var v = vertices[i];
                if (v < minX)
                    minX = v;
                else if (v > maxX)
                    maxX = v;
                v = vertices[i + 1];
                if (v < minY)
                    minY = v;
                else if (v > maxY)
                    maxY = v;
                v = vertices[i + 2];
                if (v < minZ)
                    minZ = v;
                else if (v > maxZ)
                    maxZ = v;
                i += stride;
            }
            this.fromExtremes(minX, minY, minZ, maxX, maxY, maxZ);
        };
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        BoundingVolumeBase.prototype.fromExtremes = function (minX, minY, minZ, maxX, maxY, maxZ) {
            this._min.x = minX;
            this._min.y = minY;
            this._min.z = minZ;
            this._max.x = maxX;
            this._max.y = maxY;
            this._max.z = maxZ;
        };
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        BoundingVolumeBase.prototype.rayIntersection = function (ray3D, targetNormal) {
            return -1;
        };
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        BoundingVolumeBase.prototype.containsPoint = function (position) {
            return false;
        };
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        BoundingVolumeBase.prototype.fromSphere = function (center, radius) {
            this.fromExtremes(center.x - radius, center.y - radius, center.z - radius, center.x + radius, center.y + radius, center.z + radius);
        };
        return BoundingVolumeBase;
    }());
    feng3d.BoundingVolumeBase = BoundingVolumeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 轴对其包围盒
     * @author feng 2014-4-27
     */
    var AxisAlignedBoundingBox = (function (_super) {
        __extends(AxisAlignedBoundingBox, _super);
        /**
         * 创建轴对其包围盒
         */
        function AxisAlignedBoundingBox() {
            var _this = _super.call(this) || this;
            _this._centerX = 0;
            _this._centerY = 0;
            _this._centerZ = 0;
            _this._halfExtentsX = 0;
            _this._halfExtentsY = 0;
            _this._halfExtentsZ = 0;
            return _this;
        }
        /**
         * 测试轴对其包围盒是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @return 				true：出现在视锥体内
         * @see me.feng3d.cameras.Camera3D.updateFrustum()
         */
        AxisAlignedBoundingBox.prototype.isInFrustum = function (planes, numPlanes) {
            for (var i = 0; i < numPlanes; ++i) {
                var plane = planes[i];
                var a = plane.a;
                var b = plane.b;
                var c = plane.c;
                //最可能出现在平面内的点，即距离最可能大于0的点 (如果这个点都不在平面内的话，其他的点肯定会不在平面内)
                var flippedExtentX = a < 0 ? -this._halfExtentsX : this._halfExtentsX;
                var flippedExtentY = b < 0 ? -this._halfExtentsY : this._halfExtentsY;
                var flippedExtentZ = c < 0 ? -this._halfExtentsZ : this._halfExtentsZ;
                var projDist = a * (this._centerX + flippedExtentX) + b * (this._centerY + flippedExtentY) + c * (this._centerZ + flippedExtentZ) - plane.d;
                //小于0表示包围盒8个点都在平面内，同时就表面不存在点在视锥体内。注：视锥体6个平面朝内
                if (projDist < 0)
                    return false;
            }
            return true;
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.fromExtremes = function (minX, minY, minZ, maxX, maxY, maxZ) {
            this._centerX = (maxX + minX) * .5;
            this._centerY = (maxY + minY) * .5;
            this._centerZ = (maxZ + minZ) * .5;
            this._halfExtentsX = (maxX - minX) * .5;
            this._halfExtentsY = (maxY - minY) * .5;
            this._halfExtentsZ = (maxZ - minZ) * .5;
            _super.prototype.fromExtremes.call(this, minX, minY, minZ, maxX, maxY, maxZ);
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.rayIntersection = function (ray3D, targetNormal) {
            var position = ray3D.position;
            var direction = ray3D.direction;
            if (this.containsPoint(position))
                return 0;
            var px = position.x - this._centerX, py = position.y - this._centerY, pz = position.z - this._centerZ;
            var vx = direction.x, vy = direction.y, vz = direction.z;
            var ix, iy, iz;
            var rayEntryDistance;
            // ray-plane tests
            var intersects;
            if (vx < 0) {
                rayEntryDistance = (this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vx > 0) {
                rayEntryDistance = (-this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = -1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy < 0) {
                rayEntryDistance = (this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 0;
                        targetNormal.y = 1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy > 0) {
                rayEntryDistance = (-this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 0;
                        targetNormal.y = -1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz < 0) {
                rayEntryDistance = (this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX) {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = 1;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz > 0) {
                rayEntryDistance = (-this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX) {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = -1;
                        intersects = true;
                    }
                }
            }
            return intersects ? rayEntryDistance : -1;
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.containsPoint = function (position) {
            var px = position.x - this._centerX, py = position.y - this._centerY, pz = position.z - this._centerZ;
            return px <= this._halfExtentsX && px >= -this._halfExtentsX && py <= this._halfExtentsY && py >= -this._halfExtentsY && pz <= this._halfExtentsZ && pz >= -this._halfExtentsZ;
        };
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
         */
        AxisAlignedBoundingBox.prototype.transformFrom = function (bounds, matrix) {
            var aabb = bounds;
            var cx = aabb._centerX;
            var cy = aabb._centerY;
            var cz = aabb._centerZ;
            var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            matrix.copyRawDataTo(raw);
            var m11 = raw[0], m12 = raw[4], m13 = raw[8], m14 = raw[12];
            var m21 = raw[1], m22 = raw[5], m23 = raw[9], m24 = raw[13];
            var m31 = raw[2], m32 = raw[6], m33 = raw[10], m34 = raw[14];
            this._centerX = cx * m11 + cy * m12 + cz * m13 + m14;
            this._centerY = cx * m21 + cy * m22 + cz * m23 + m24;
            this._centerZ = cx * m31 + cy * m32 + cz * m33 + m34;
            if (m11 < 0)
                m11 = -m11;
            if (m12 < 0)
                m12 = -m12;
            if (m13 < 0)
                m13 = -m13;
            if (m21 < 0)
                m21 = -m21;
            if (m22 < 0)
                m22 = -m22;
            if (m23 < 0)
                m23 = -m23;
            if (m31 < 0)
                m31 = -m31;
            if (m32 < 0)
                m32 = -m32;
            if (m33 < 0)
                m33 = -m33;
            var hx = aabb._halfExtentsX;
            var hy = aabb._halfExtentsY;
            var hz = aabb._halfExtentsZ;
            this._halfExtentsX = hx * m11 + hy * m12 + hz * m13;
            this._halfExtentsY = hx * m21 + hy * m22 + hz * m23;
            this._halfExtentsZ = hx * m31 + hy * m32 + hz * m33;
            this._min.x = this._centerX - this._halfExtentsX;
            this._min.y = this._centerY - this._halfExtentsY;
            this._min.z = this._centerZ - this._halfExtentsZ;
            this._max.x = this._centerX + this._halfExtentsX;
            this._max.y = this._centerY + this._halfExtentsY;
            this._max.z = this._centerZ + this._halfExtentsZ;
            this._aabbPointsDirty = true;
        };
        return AxisAlignedBoundingBox;
    }(feng3d.BoundingVolumeBase));
    feng3d.AxisAlignedBoundingBox = AxisAlignedBoundingBox;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    var PlaneGeometry = (function (_super) {
        __extends(PlaneGeometry, _super);
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function PlaneGeometry(width, height, segmentsW, segmentsH, yUp) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 1; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._segmentsW = 1;
            _this._segmentsH = 1;
            _this._yUp = true;
            _this.width = width;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(PlaneGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         */
        PlaneGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = this.buildPosition();
            this.setVAData("a_position", vertexPositionData, 3);
            var vertexNormalData = this.buildNormal();
            this.setVAData("a_normal", vertexNormalData, 3);
            var vertexTangentData = this.buildTangent();
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildPosition = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var x, y;
            var positionIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    x = (xi / this.segmentsW - .5) * this.width;
                    y = (yi / this.segmentsH - .5) * this.height;
                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (this.yUp) {
                        vertexPositionData[positionIndex++] = 0;
                        vertexPositionData[positionIndex++] = y;
                    }
                    else {
                        vertexPositionData[positionIndex++] = y;
                        vertexPositionData[positionIndex++] = 0;
                    }
                }
            }
            return vertexPositionData;
        };
        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildNormal = function () {
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var normalIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (this.yUp) {
                        vertexNormalData[normalIndex++] = 1;
                        vertexNormalData[normalIndex++] = 0;
                    }
                    else {
                        vertexNormalData[normalIndex++] = 0;
                        vertexNormalData[normalIndex++] = -1;
                    }
                }
            }
            return vertexNormalData;
        };
        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildTangent = function () {
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var tangentIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            return vertexTangentData;
        };
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var tw = this.segmentsW + 1;
            var numIndices = 0;
            var base;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //生成索引数据
                    if (xi != this.segmentsW && yi != this.segmentsH) {
                        base = xi + yi * tw;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base + 1;
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        PlaneGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = 1 - yi / this.segmentsH;
                }
            }
            return data;
        };
        return PlaneGeometry;
    }(feng3d.Geometry));
    feng3d.PlaneGeometry = PlaneGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    var CubeGeometry = (function (_super) {
        __extends(CubeGeometry, _super);
        /**
         * 创建立方几何体
         * @param   width           宽度，默认为100。
         * @param   height          高度，默认为100。
         * @param   depth           深度，默认为100。
         * @param   segmentsW       宽度方向分割，默认为1。
         * @param   segmentsH       高度方向分割，默认为1。
         * @param   segmentsD       深度方向分割，默认为1。
         * @param   tile6           是否为6块贴图，默认true。
         */
        function CubeGeometry(width, height, depth, segmentsW, segmentsH, segmentsD, tile6) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (depth === void 0) { depth = 100; }
            if (segmentsW === void 0) { segmentsW = 1; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (segmentsD === void 0) { segmentsD = 1; }
            if (tile6 === void 0) { tile6 = true; }
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._depth = 100;
            _this._segmentsW = 1;
            _this._segmentsH = 1;
            _this._segmentsD = 1;
            _this._tile6 = true;
            _this.width = width;
            _this.height = height;
            _this.depth = depth;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.segmentsD = segmentsD;
            _this.tile6 = tile6;
            return _this;
        }
        Object.defineProperty(CubeGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "depth", {
            get: function () {
                return this._depth;
            },
            set: function (value) {
                if (this._depth == value)
                    return;
                this._depth = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsD", {
            get: function () {
                return this._segmentsD;
            },
            set: function (value) {
                if (this._segmentsD == value)
                    return;
                this._segmentsD = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "tile6", {
            get: function () {
                return this._tile6;
            },
            set: function (value) {
                if (this._tile6 == value)
                    return;
                this._tile6 = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        CubeGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = this.buildPosition();
            this.setVAData("a_position", vertexPositionData, 3);
            var vertexNormalData = this.buildNormal();
            this.setVAData("a_normal", vertexNormalData, 3);
            var vertexTangentData = this.buildTangent();
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildPosition = function () {
            var vertexPositionData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            var hw, hh, hd; // halves
            var dw, dh, dd; // deltas
            var outer_pos;
            // Indices
            var positionIndex = 0;
            // half cube dimensions
            hw = this.width / 2;
            hh = this.height / 2;
            hd = this.depth / 2;
            // Segment dimensions
            dw = this.width / this.segmentsW;
            dh = this.height / this.segmentsH;
            dd = this.depth / this.segmentsD;
            for (i = 0; i <= this.segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = -hd;
                    // back
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = hd;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = hh;
                    vertexPositionData[positionIndex++] = -hd + j * dd;
                    // bottom
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh;
                    vertexPositionData[positionIndex++] = -hd + j * dd;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                outer_pos = hd - i * dd;
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexPositionData[positionIndex++] = -hw;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = outer_pos;
                    // right
                    vertexPositionData[positionIndex++] = hw;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = outer_pos;
                }
            }
            return vertexPositionData;
        };
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildNormal = function () {
            var vertexNormalData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var normalIndex = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = -1;
                    // back
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 1;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                    // bottom
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = -1;
                    vertexNormalData[normalIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexNormalData[normalIndex++] = -1;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    // right
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                }
            }
            return new Float32Array(vertexNormalData);
        };
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildTangent = function () {
            var vertexTangentData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var tangentIndex = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    // back
                    vertexTangentData[tangentIndex++] = -1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    // bottom
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = -1;
                    // right
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 1;
                }
            }
            return vertexTangentData;
        };
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array((this.segmentsW * this.segmentsH + this.segmentsW * this.segmentsD + this.segmentsH * this.segmentsD) * 12);
            var tl, tr, bl, br;
            var i, j, inc = 0;
            var fidx = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    // back
                    if (i && j) {
                        tl = 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                        tr = 2 * (i * (this.segmentsH + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            inc += 2 * (this.segmentsW + 1) * (this.segmentsH + 1);
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    // bottom
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (this.segmentsD + 1) + (j - 1));
                        tr = inc + 2 * (i * (this.segmentsD + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            inc += 2 * (this.segmentsW + 1) * (this.segmentsD + 1);
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    // right
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                        tr = inc + 2 * (i * (this.segmentsH + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        CubeGeometry.prototype.buildUVs = function () {
            var i, j, uidx;
            var data = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 2);
            var u_tile_dim, v_tile_dim;
            var u_tile_step, v_tile_step;
            var tl0u, tl0v;
            var tl1u, tl1v;
            var du, dv;
            if (this.tile6) {
                u_tile_dim = u_tile_step = 1 / 3;
                v_tile_dim = v_tile_step = 1 / 2;
            }
            else {
                u_tile_dim = v_tile_dim = 1;
                u_tile_step = v_tile_step = 0;
            }
            // Create planes two and two, the same way that they were
            // constructed in the this.buildGeometry() function. First calculate
            // the top-left UV coordinate for both planes, and then loop
            // over the points, calculating the UVs from these numbers.
            // When this.tile6 is true, the layout is as follows:
            //       .-----.-----.-----. (1,1)
            //       | Bot |  T  | Bak |
            //       |-----+-----+-----|
            //       |  L  |  F  |  R  |
            // (0,0)'-----'-----'-----'
            uidx = 0;
            // FRONT / BACK
            tl0u = 1 * u_tile_step;
            tl0v = 1 * v_tile_step;
            tl1u = 2 * u_tile_step;
            tl1v = 0 * v_tile_step;
            du = u_tile_dim / this.segmentsW;
            dv = v_tile_dim / this.segmentsH;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + (u_tile_dim - i * du);
                    data[uidx++] = tl1v + (v_tile_dim - j * dv);
                }
            }
            // TOP / BOTTOM
            tl0u = 1 * u_tile_step;
            tl0v = 0 * v_tile_step;
            tl1u = 0 * u_tile_step;
            tl1v = 0 * v_tile_step;
            du = u_tile_dim / this.segmentsW;
            dv = v_tile_dim / this.segmentsD;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + i * du;
                    data[uidx++] = tl1v + j * dv;
                }
            }
            // LEFT / RIGHT
            tl0u = 0 * u_tile_step;
            tl0v = 1 * v_tile_step;
            tl1u = 2 * u_tile_step;
            tl1v = 1 * v_tile_step;
            du = u_tile_dim / this.segmentsD;
            dv = v_tile_dim / this.segmentsH;
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + (u_tile_dim - i * du);
                    data[uidx++] = tl1v + (v_tile_dim - j * dv);
                }
            }
            return data;
        };
        return CubeGeometry;
    }(feng3d.Geometry));
    feng3d.CubeGeometry = CubeGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    var SphereGeometry = (function (_super) {
        __extends(SphereGeometry, _super);
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function SphereGeometry(radius, segmentsW, segmentsH, yUp) {
            if (radius === void 0) { radius = 50; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 12; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._segmentsW = 16;
            _this._segmentsH = 12;
            _this._yUp = true;
            _this.radius = radius;
            _this.segmentsW = _this.segmentsW;
            _this.segmentsH = _this.segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(SphereGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         * @param this.radius 球体半径
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        SphereGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / this.segmentsH;
                var z = -this.radius * Math.cos(horangle);
                var ringradius = this.radius * Math.sin(horangle);
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / this.segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    if (this.yUp) {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (xi == this.segmentsW) {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        vertexNormalData[index] = vertexNormalData[startIndex] + x * normLen * 0.5;
                        vertexNormalData[index + 1] = vertexNormalData[startIndex + 1] + comp1 * normLen * 0.5;
                        vertexNormalData[index + 2] = vertexNormalData[startIndex + 2] + comp2 * normLen * 0.5;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    else {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = comp1;
                        vertexPositionData[index + 2] = comp2;
                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    if (xi > 0 && yi > 0) {
                        if (yi == this.segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        SphereGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (this.segmentsW + 1) * yi + xi;
                        var b = (this.segmentsW + 1) * yi + xi - 1;
                        var c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (this.segmentsW + 1) * (yi - 1) + xi;
                        if (yi == this.segmentsH) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        SphereGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = yi / this.segmentsH;
                }
            }
            return data;
        };
        return SphereGeometry;
    }(feng3d.Geometry));
    feng3d.SphereGeometry = SphereGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    var CapsuleGeometry = (function (_super) {
        __extends(CapsuleGeometry, _super);
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function CapsuleGeometry(radius, height, segmentsW, segmentsH, yUp) {
            if (radius === void 0) { radius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 15; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._height = 100;
            _this._segmentsW = 16;
            _this._segmentsH = 15;
            _this._yUp = true;
            _this.radius = radius;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(CapsuleGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CapsuleGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / this.segmentsH;
                var z = -this.radius * Math.cos(horangle);
                var ringradius = this.radius * Math.sin(horangle);
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / this.segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    var offset = yi > this.segmentsH / 2 ? this.height / 2 : -this.height / 2;
                    if (this.yUp) {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (xi == this.segmentsW) {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                        vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                        vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;
                        vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > .007 ? -y / tanLen : 1) * 0.5;
                        vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                        vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                    }
                    else {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = this.yUp ? comp1 - offset : comp1;
                        vertexPositionData[index + 2] = this.yUp ? comp2 : comp2 + offset;
                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    if (xi > 0 && yi > 0) {
                        if (yi == this.segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            this.buildIndices();
        };
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CapsuleGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (this.segmentsW + 1) * yi + xi;
                        var b = (this.segmentsW + 1) * yi + xi - 1;
                        var c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (this.segmentsW + 1) * (yi - 1) + xi;
                        if (yi == this.segmentsH) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            this.setIndices(indices);
        };
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        CapsuleGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = yi / this.segmentsH;
                }
            }
            return data;
        };
        return CapsuleGeometry;
    }(feng3d.Geometry));
    feng3d.CapsuleGeometry = CapsuleGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    var CylinderGeometry = (function (_super) {
        __extends(CylinderGeometry, _super);
        /**
         * 创建圆柱体
         */
        function CylinderGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed, yUp) {
            if (topRadius === void 0) { topRadius = 50; }
            if (bottomRadius === void 0) { bottomRadius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (topClosed === void 0) { topClosed = true; }
            if (bottomClosed === void 0) { bottomClosed = true; }
            if (surfaceClosed === void 0) { surfaceClosed = true; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._topRadius = 50;
            _this._bottomRadius = 50;
            _this._height = 100;
            _this._segmentsW = 16;
            _this._segmentsH = 1;
            _this._topClosed = true;
            _this._bottomClosed = true;
            _this._surfaceClosed = true;
            _this._yUp = true;
            _this.topRadius = topRadius;
            _this.bottomRadius = bottomRadius;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.topClosed = topClosed;
            _this.bottomClosed = bottomClosed;
            _this.surfaceClosed = surfaceClosed;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(CylinderGeometry.prototype, "topRadius", {
            get: function () {
                return this._topRadius;
            },
            set: function (value) {
                if (this._topRadius == value)
                    return;
                this._topRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "bottomRadius", {
            get: function () {
                return this._bottomRadius;
            },
            set: function (value) {
                if (this._bottomRadius == value)
                    return;
                this._bottomRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "topClosed", {
            get: function () {
                return this._topClosed;
            },
            set: function (value) {
                if (this._topClosed == value)
                    return;
                this._topClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "bottomClosed", {
            get: function () {
                return this._bottomClosed;
            },
            set: function (value) {
                if (this._bottomClosed == value)
                    return;
                this._bottomClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "surfaceClosed", {
            get: function () {
                return this._surfaceClosed;
            },
            set: function (value) {
                if (this._surfaceClosed == value)
                    return;
                this._surfaceClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 计算几何体顶点数
         */
        CylinderGeometry.prototype.getNumVertices = function () {
            var numVertices = 0;
            if (this.surfaceClosed)
                numVertices += (this.segmentsH + 1) * (this.segmentsW + 1);
            if (this.topClosed)
                numVertices += 2 * (this.segmentsW + 1);
            if (this.bottomClosed)
                numVertices += 2 * (this.segmentsW + 1);
            return numVertices;
        };
        /**
         * 计算几何体三角形数量
         */
        CylinderGeometry.prototype.getNumTriangles = function () {
            var numTriangles = 0;
            if (this.surfaceClosed)
                numTriangles += this.segmentsH * this.segmentsW * 2;
            if (this.topClosed)
                numTriangles += this.segmentsW;
            if (this.bottomClosed)
                numTriangles += this.segmentsW;
            return numTriangles;
        };
        /**
         * 构建几何体数据
         */
        CylinderGeometry.prototype.buildGeometry = function () {
            var i, j, index = 0;
            var x, y, z, radius, revolutionAngle;
            var dr, latNormElev, latNormBase;
            var comp1, comp2;
            var startIndex = 0;
            var t1, t2;
            var numVertices = this.getNumVertices();
            var vertexPositionData = new Float32Array(numVertices * 3);
            var vertexNormalData = new Float32Array(numVertices * 3);
            var vertexTangentData = new Float32Array(numVertices * 3);
            var revolutionAngleDelta = 2 * Math.PI / this.segmentsW;
            // 顶部
            if (this.topClosed && this.topRadius > 0) {
                z = -0.5 * this.height;
                for (i = 0; i <= this.segmentsW; ++i) {
                    // 中心顶点
                    if (this.yUp) {
                        t1 = 1;
                        t2 = 0;
                        comp1 = -z;
                        comp2 = 0;
                    }
                    else {
                        t1 = 0;
                        t2 = -1;
                        comp1 = 0;
                        comp2 = z;
                    }
                    addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    // 旋转顶点
                    revolutionAngle = i * revolutionAngleDelta;
                    x = this.topRadius * Math.cos(revolutionAngle);
                    y = this.topRadius * Math.sin(revolutionAngle);
                    if (this.yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsW) {
                        addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 底部
            if (this.bottomClosed && this.bottomRadius > 0) {
                z = 0.5 * this.height;
                startIndex = index;
                for (i = 0; i <= this.segmentsW; ++i) {
                    // 中心顶点
                    if (this.yUp) {
                        t1 = -1;
                        t2 = 0;
                        comp1 = -z;
                        comp2 = 0;
                    }
                    else {
                        t1 = 0;
                        t2 = 1;
                        comp1 = 0;
                        comp2 = z;
                    }
                    addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    // 旋转顶点
                    revolutionAngle = i * revolutionAngle;
                    x = this.bottomRadius * Math.cos(revolutionAngle);
                    y = this.bottomRadius * Math.sin(revolutionAngle);
                    if (this.yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsW) {
                        addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 侧面
            dr = this.bottomRadius - this.topRadius;
            latNormElev = dr / this.height;
            latNormBase = (latNormElev == 0) ? 1 : this.height / dr;
            if (this.surfaceClosed) {
                var a, b, c, d;
                var na0, na1, naComp1, naComp2;
                for (j = 0; j <= this.segmentsH; ++j) {
                    radius = this.topRadius - ((j / this.segmentsH) * (this.topRadius - this.bottomRadius));
                    z = -(this.height / 2) + (j / this.segmentsH * this.height);
                    startIndex = index;
                    for (i = 0; i <= this.segmentsW; ++i) {
                        revolutionAngle = i * revolutionAngleDelta;
                        x = radius * Math.cos(revolutionAngle);
                        y = radius * Math.sin(revolutionAngle);
                        na0 = latNormBase * Math.cos(revolutionAngle);
                        na1 = latNormBase * Math.sin(revolutionAngle);
                        if (this.yUp) {
                            t1 = 0;
                            t2 = -na0;
                            comp1 = -z;
                            comp2 = y;
                            naComp1 = latNormElev;
                            naComp2 = na1;
                        }
                        else {
                            t1 = -na0;
                            t2 = 0;
                            comp1 = y;
                            comp2 = z;
                            naComp1 = na1;
                            naComp2 = latNormElev;
                        }
                        if (i == this.segmentsW) {
                            addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], na0, latNormElev, na1, na1, t1, t2);
                        }
                        else {
                            addVertex(x, comp1, comp2, na0, naComp1, naComp2, -na1, t1, t2);
                        }
                    }
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            function addVertex(px, py, pz, nx, ny, nz, tx, ty, tz) {
                vertexPositionData[index] = px;
                vertexPositionData[index + 1] = py;
                vertexPositionData[index + 2] = pz;
                vertexNormalData[index] = nx;
                vertexNormalData[index + 1] = ny;
                vertexNormalData[index + 2] = nz;
                vertexTangentData[index] = tx;
                vertexTangentData[index + 1] = ty;
                vertexTangentData[index + 2] = tz;
                index += 3;
            }
            //
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CylinderGeometry.prototype.buildIndices = function () {
            var i, j, index = 0;
            var numTriangles = this.getNumTriangles();
            var indices = new Uint16Array(numTriangles * 3);
            var numIndices = 0;
            // 顶部
            if (this.topClosed && this.topRadius > 0) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 1, index - 3, index - 2);
                }
            }
            // 底部
            if (this.bottomClosed && this.bottomRadius > 0) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 2, index - 3, index - 1);
                }
            }
            // 侧面
            if (this.surfaceClosed) {
                var a, b, c, d;
                for (j = 0; j <= this.segmentsH; ++j) {
                    for (i = 0; i <= this.segmentsW; ++i) {
                        index++;
                        if (i > 0 && j > 0) {
                            a = index - 1;
                            b = index - 2;
                            c = b - this.segmentsW - 1;
                            d = a - this.segmentsW - 1;
                            addTriangleClockWise(a, b, c);
                            addTriangleClockWise(a, c, d);
                        }
                    }
                }
            }
            return indices;
            function addTriangleClockWise(cwVertexIndex0, cwVertexIndex1, cwVertexIndex2) {
                indices[numIndices++] = cwVertexIndex0;
                indices[numIndices++] = cwVertexIndex1;
                indices[numIndices++] = cwVertexIndex2;
            }
        };
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        CylinderGeometry.prototype.buildUVs = function () {
            var i, j;
            var x, y, revolutionAngle;
            var numVertices = this.getNumVertices();
            var data = new Float32Array(numVertices * 2);
            var revolutionAngleDelta = 2 * Math.PI / this.segmentsW;
            var index = 0;
            // 顶部
            if (this.topClosed) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                    y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                    // 中心顶点
                    data[index++] = 0.5;
                    data[index++] = 0.5;
                    // 旋转顶点
                    data[index++] = x;
                    data[index++] = y;
                }
            }
            // 底部
            if (this.bottomClosed) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                    y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                    // 中心顶点
                    data[index++] = 0.5;
                    data[index++] = 0.5;
                    // 旋转顶点
                    data[index++] = x;
                    data[index++] = y;
                }
            }
            // 侧面
            if (this.surfaceClosed) {
                for (j = 0; j <= this.segmentsH; ++j) {
                    for (i = 0; i <= this.segmentsW; ++i) {
                        // 旋转顶点
                        data[index++] = (i / this.segmentsW);
                        data[index++] = (j / this.segmentsH);
                    }
                }
            }
            return data;
        };
        return CylinderGeometry;
    }(feng3d.Geometry));
    feng3d.CylinderGeometry = CylinderGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆锥体
     * @author feng 2017-02-07
     */
    var ConeGeometry = (function (_super) {
        __extends(ConeGeometry, _super);
        /**
         * 创建圆锥体
         * @param radius 底部半径
         * @param height 高度
         * @param segmentsW
         * @param segmentsH
         * @param yUp
         */
        function ConeGeometry(radius, height, segmentsW, segmentsH, closed, yUp) {
            if (radius === void 0) { radius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (closed === void 0) { closed = true; }
            if (yUp === void 0) { yUp = true; }
            return _super.call(this, 0, radius, height, segmentsW, segmentsH, false, closed, true, yUp) || this;
        }
        return ConeGeometry;
    }(feng3d.CylinderGeometry));
    feng3d.ConeGeometry = ConeGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆环几何体
     */
    var TorusGeometry = (function (_super) {
        __extends(TorusGeometry, _super);
        /**
         * 创建<code>Torus</code>实例
         * @param radius						圆环半径
         * @param tubeRadius					管道半径
         * @param segmentsR						横向段数
         * @param segmentsT						纵向段数
         * @param yUp							Y轴是否朝上
         */
        function TorusGeometry(radius, tubeRadius, segmentsR, segmentsT, yUp) {
            if (radius === void 0) { radius = 50; }
            if (tubeRadius === void 0) { tubeRadius = 10; }
            if (segmentsR === void 0) { segmentsR = 16; }
            if (segmentsT === void 0) { segmentsT = 8; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._tubeRadius = 10;
            _this._segmentsR = 16;
            _this._segmentsT = 8;
            _this._yUp = true;
            _this._vertexPositionStride = 3;
            _this._vertexNormalStride = 3;
            _this._vertexTangentStride = 3;
            _this.radius = radius;
            _this.tubeRadius = tubeRadius;
            _this.segmentR = segmentsR;
            _this.segmentsT = segmentsT;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(TorusGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "tubeRadius", {
            get: function () {
                return this._tubeRadius;
            },
            set: function (value) {
                if (this._tubeRadius == value)
                    return;
                this._tubeRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentsR", {
            get: function () {
                return this._segmentsR;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentR", {
            set: function (value) {
                if (this._segmentsR == value)
                    return;
                this._segmentsR = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentsT", {
            get: function () {
                return this._segmentsT;
            },
            set: function (value) {
                if (this._segmentsT == value)
                    return;
                this._segmentsT = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加顶点数据
         */
        TorusGeometry.prototype.addVertex = function (vertexIndex, px, py, pz, nx, ny, nz, tx, ty, tz) {
            this._vertexPositionData[vertexIndex * this._vertexPositionStride] = px;
            this._vertexPositionData[vertexIndex * this._vertexPositionStride + 1] = py;
            this._vertexPositionData[vertexIndex * this._vertexPositionStride + 2] = pz;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride] = nx;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride + 1] = ny;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride + 2] = nz;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride] = tx;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride + 1] = ty;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride + 2] = tz;
        };
        /**
         * 添加三角形索引数据
         * @param currentTriangleIndex		当前三角形索引
         * @param cwVertexIndex0			索引0
         * @param cwVertexIndex1			索引1
         * @param cwVertexIndex2			索引2
         */
        TorusGeometry.prototype.addTriangleClockWise = function (currentTriangleIndex, cwVertexIndex0, cwVertexIndex1, cwVertexIndex2) {
            this._rawIndices[currentTriangleIndex * 3] = cwVertexIndex0;
            this._rawIndices[currentTriangleIndex * 3 + 1] = cwVertexIndex1;
            this._rawIndices[currentTriangleIndex * 3 + 2] = cwVertexIndex2;
        };
        /**
         * @inheritDoc
         */
        TorusGeometry.prototype.buildGeometry = function () {
            var i, j;
            var x, y, z, nx, ny, nz, revolutionAngleR, revolutionAngleT;
            var numTriangles;
            // reset utility variables
            this._numVertices = 0;
            this._vertexIndex = 0;
            this._currentTriangleIndex = 0;
            // evaluate target number of vertices, triangles and indices
            this._numVertices = (this.segmentsT + 1) * (this.segmentsR + 1); // this.segmentsT + 1 because of closure, this.segmentsR + 1 because of closure
            numTriangles = this.segmentsT * this.segmentsR * 2; // each level has segmentR quads, each of 2 triangles
            this._vertexPositionData = new Float32Array(this._numVertices * this._vertexPositionStride);
            this._vertexNormalData = new Float32Array(this._numVertices * this._vertexNormalStride);
            this._vertexTangentData = new Float32Array(this._numVertices * this._vertexTangentStride);
            this._rawIndices = new Uint16Array(numTriangles * 3);
            this.buildUVs();
            // evaluate revolution steps
            var revolutionAngleDeltaR = 2 * Math.PI / this.segmentsR;
            var revolutionAngleDeltaT = 2 * Math.PI / this.segmentsT;
            var comp1, comp2;
            var t1, t2, n1, n2;
            var startPositionIndex;
            // surface
            var a, b, c, d, length;
            for (j = 0; j <= this.segmentsT; ++j) {
                startPositionIndex = j * (this.segmentsR + 1) * this._vertexPositionStride;
                for (i = 0; i <= this.segmentsR; ++i) {
                    this._vertexIndex = j * (this.segmentsR + 1) + i;
                    // revolution vertex
                    revolutionAngleR = i * revolutionAngleDeltaR;
                    revolutionAngleT = j * revolutionAngleDeltaT;
                    length = Math.cos(revolutionAngleT);
                    nx = length * Math.cos(revolutionAngleR);
                    ny = length * Math.sin(revolutionAngleR);
                    nz = Math.sin(revolutionAngleT);
                    x = this.radius * Math.cos(revolutionAngleR) + this.tubeRadius * nx;
                    y = this.radius * Math.sin(revolutionAngleR) + this.tubeRadius * ny;
                    z = (j == this.segmentsT) ? 0 : this.tubeRadius * nz;
                    if (this.yUp) {
                        n1 = -nz;
                        n2 = ny;
                        t1 = 0;
                        t2 = (length ? nx / length : x / this.radius);
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        n1 = ny;
                        n2 = nz;
                        t1 = (length ? nx / length : x / this.radius);
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsR) {
                        this.addVertex(this._vertexIndex, x, this._vertexPositionData[startPositionIndex + 1], this._vertexPositionData[startPositionIndex + 2], nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
                    }
                    else {
                        this.addVertex(this._vertexIndex, x, comp1, comp2, nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
                    }
                    // close triangle
                    if (i > 0 && j > 0) {
                        a = this._vertexIndex; // current
                        b = this._vertexIndex - 1; // previous
                        c = b - this.segmentsR - 1; // previous of last level
                        d = a - this.segmentsR - 1; // current of last level
                        this.addTriangleClockWise(this._currentTriangleIndex++, a, b, c);
                        this.addTriangleClockWise(this._currentTriangleIndex++, a, c, d);
                    }
                }
            }
            this.setVAData("a_position", this._vertexPositionData, 3);
            this.setVAData("a_normal", this._vertexNormalData, 3);
            this.setVAData("a_tangent", this._vertexTangentData, 3);
            this.setIndices(this._rawIndices);
        };
        /**
         * @inheritDoc
         */
        TorusGeometry.prototype.buildUVs = function () {
            var i, j;
            var stride = 2;
            var data = new Float32Array(this._numVertices * stride);
            // evaluate num uvs
            var numUvs = this._numVertices * stride;
            // current uv component index
            var currentUvCompIndex = 0;
            var index = 0;
            // surface
            for (j = 0; j <= this.segmentsT; ++j) {
                for (i = 0; i <= this.segmentsR; ++i) {
                    index = j * (this.segmentsR + 1) + i;
                    // revolution vertex
                    data[index * stride] = i / this.segmentsR;
                    data[index * stride + 1] = j / this.segmentsT;
                }
            }
            // build real data from raw data
            this.setVAData("a_uv", data, 2);
        };
        return TorusGeometry;
    }(feng3d.Geometry));
    feng3d.TorusGeometry = TorusGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    var SkyBoxGeometry = (function (_super) {
        __extends(SkyBoxGeometry, _super);
        /**
         * 创建天空盒
         */
        function SkyBoxGeometry() {
            var _this = _super.call(this) || this;
            //八个顶点，32个number
            var vertexPositionData = new Float32Array([
                -1, 1, -1,
                1, 1, -1,
                1, 1, 1,
                -1, 1, 1,
                -1, -1, -1,
                1, -1, -1,
                1, -1, 1,
                -1, -1, 1 //
            ]);
            _this.setVAData("a_position", vertexPositionData, 3);
            //6个面，12个三角形，36个顶点索引
            var indices = new Uint16Array([
                0, 1, 2, 2, 3, 0,
                6, 5, 4, 4, 7, 6,
                2, 6, 7, 7, 3, 2,
                4, 5, 1, 1, 0, 4,
                4, 0, 3, 3, 7, 4,
                2, 1, 5, 5, 6, 2 //
            ]);
            _this.setIndices(indices);
            return _this;
        }
        return SkyBoxGeometry;
    }(feng3d.Geometry));
    feng3d.SkyBoxGeometry = SkyBoxGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    var Texture2D = (function (_super) {
        __extends(Texture2D, _super);
        function Texture2D(url) {
            if (url === void 0) { url = ""; }
            var _this = _super.call(this) || this;
            _this._textureType = feng3d.TextureType.TEXTURE_2D;
            _this._pixels = new Image();
            _this._pixels.crossOrigin = "Anonymous";
            _this._pixels.addEventListener("load", _this.onLoad.bind(_this));
            _this._pixels.src = url;
            return _this;
        }
        Object.defineProperty(Texture2D.prototype, "url", {
            get: function () {
                return this._pixels.src;
            },
            set: function (value) {
                this._pixels.src = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理加载完成
         */
        Texture2D.prototype.onLoad = function () {
            this.invalidate();
        };
        /**
         * 判断数据是否满足渲染需求
         */
        Texture2D.prototype.checkRenderData = function () {
            if (!this._pixels)
                return false;
            if (!this._pixels.width || !this._pixels.height)
                return false;
            return true;
        };
        return Texture2D;
    }(feng3d.TextureInfo));
    feng3d.Texture2D = Texture2D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    var TextureCube = (function (_super) {
        __extends(TextureCube, _super);
        function TextureCube(images) {
            var _this = _super.call(this) || this;
            _this._textureType = feng3d.TextureType.TEXTURE_CUBE_MAP;
            _this._pixels = [];
            for (var i = 0; i < 6; i++) {
                _this._pixels[i] = new Image();
                _this._pixels[i].crossOrigin = "Anonymous";
                _this._pixels[i].addEventListener("load", _this.invalidate.bind(_this));
                _this._pixels[i].src = images[i];
            }
            return _this;
        }
        /**
         * 判断数据是否满足渲染需求
         */
        TextureCube.prototype.checkRenderData = function () {
            if (!this._pixels)
                return false;
            for (var i = 0; i < this._pixels.length; i++) {
                var element = this._pixels[i];
                if (!element.width || !element.height)
                    return false;
            }
            return true;
        };
        return TextureCube;
    }(feng3d.TextureInfo));
    feng3d.TextureCube = TextureCube;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染目标纹理
     */
    var RenderTargetTexture = (function (_super) {
        __extends(RenderTargetTexture, _super);
        function RenderTargetTexture() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RenderTargetTexture;
    }(feng3d.TextureInfo));
    feng3d.RenderTargetTexture = RenderTargetTexture;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    var Material = (function (_super) {
        __extends(Material, _super);
        /**
         * 构建材质
         */
        function Material() {
            var _this = _super.call(this) || this;
            _this._pointSize = 1;
            _this._enableBlend = false;
            _this._renderMode = feng3d.RenderMode.TRIANGLES;
            /**
             * 是否渲染双面
             */
            _this.bothSides = true;
            /**
             * 混合方程，默认BlendEquation.FUNC_ADD
             */
            _this.blendEquation = feng3d.BlendEquation.FUNC_ADD;
            /**
             * 源混合因子，默认BlendFactor.SRC_ALPHA
             */
            _this.sfactor = feng3d.BlendFactor.SRC_ALPHA;
            /**
             * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
             */
            _this.dfactor = feng3d.BlendFactor.ONE_MINUS_SRC_ALPHA;
            _this._methods = [];
            _this.createShaderCode(function () { return { vertexCode: _this.vertexCode, fragmentCode: _this.fragmentCode }; });
            _this.createBoolMacro("IS_POINTS_MODE", function () { return _this.renderMode == feng3d.RenderMode.POINTS; });
            _this.createUniformData("u_PointSize", function () { return _this.pointSize; });
            _this.createShaderParam("renderMode", function () { return _this.renderMode; });
            return _this;
        }
        Object.defineProperty(Material.prototype, "renderMode", {
            /**
            * 渲染模式，默认RenderMode.TRIANGLES
            */
            get: function () {
                return this._renderMode;
            },
            set: function (value) {
                this._renderMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "vertexCode", {
            /**
             * 顶点渲染程序代码
             */
            get: function () {
                return this._vertexCode;
            },
            set: function (value) {
                if (this._vertexCode == value)
                    return;
                this._vertexCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "fragmentCode", {
            /**
             * 片段渲染程序代码
             */
            get: function () {
                return this._fragmentCode;
            },
            set: function (value) {
                if (this._fragmentCode == value)
                    return;
                this._fragmentCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "enableBlend", {
            /**
             * 是否开启混合
             * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
             */
            get: function () {
                return this._enableBlend;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "pointSize", {
            /**
             * 点绘制时点的尺寸
             */
            get: function () {
                return this._pointSize;
            },
            set: function (value) {
                this._pointSize = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置渲染程序
         * @param shaderName 渲染程序名称
         */
        Material.prototype.setShader = function (shaderName) {
            this.vertexCode = feng3d.ShaderLib.getShaderCode(shaderName + ".vertex");
            this.fragmentCode = feng3d.ShaderLib.getShaderCode(shaderName + ".fragment");
        };
        /**
         * 添加方法
         */
        Material.prototype.addMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.addRenderDataHolder(method);
        };
        /**
         * 删除方法
         */
        Material.prototype.removeMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1) {
                this._methods.splice(index, 1);
                this.removeRenderDataHolder(method);
            }
        };
        return Material;
    }(feng3d.RenderDataHolder));
    feng3d.Material = Material;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    var PointMaterial = (function (_super) {
        __extends(PointMaterial, _super);
        /**
         * 构建颜色材质
         */
        function PointMaterial() {
            var _this = _super.call(this) || this;
            _this.setShader("point");
            _this.renderMode = feng3d.RenderMode.POINTS;
            return _this;
        }
        return PointMaterial;
    }(feng3d.Material));
    feng3d.PointMaterial = PointMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    var ColorMaterial = (function (_super) {
        __extends(ColorMaterial, _super);
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        function ColorMaterial(color) {
            if (color === void 0) { color = null; }
            var _this = _super.call(this) || this;
            _this.setShader("color");
            _this.color = color || new feng3d.Color();
            //
            _this.createUniformData("u_diffuseInput", function () { return _this.color; });
            return _this;
        }
        Object.defineProperty(ColorMaterial.prototype, "color", {
            /**
             * 颜色
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this._color == value)
                    return;
                this._color = value;
                if (this._color)
                    this.enableBlend = this._color.a != 1;
            },
            enumerable: true,
            configurable: true
        });
        return ColorMaterial;
    }(feng3d.Material));
    feng3d.ColorMaterial = ColorMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    var SegmentMaterial = (function (_super) {
        __extends(SegmentMaterial, _super);
        /**
         * 构建线段材质
         */
        function SegmentMaterial() {
            var _this = _super.call(this) || this;
            /**
             * 线段颜色
             */
            _this.color = new feng3d.Color();
            _this.setShader("segment");
            _this.renderMode = feng3d.RenderMode.LINES;
            _this.createUniformData("u_segmentColor", function () { return _this.color; });
            return _this;
        }
        return SegmentMaterial;
    }(feng3d.Material));
    feng3d.SegmentMaterial = SegmentMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    var TextureMaterial = (function (_super) {
        __extends(TextureMaterial, _super);
        function TextureMaterial() {
            var _this = _super.call(this) || this;
            _this.setShader("texture");
            //
            _this.createUniformData("s_texture", function () { return _this.texture; });
            return _this;
        }
        Object.defineProperty(TextureMaterial.prototype, "texture", {
            /**
             * 纹理数据
             */
            get: function () {
                return this._texture;
            },
            set: function (value) {
                if (this._texture == value)
                    return;
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        return TextureMaterial;
    }(feng3d.Material));
    feng3d.TextureMaterial = TextureMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    var SkyBoxMaterial = (function (_super) {
        __extends(SkyBoxMaterial, _super);
        function SkyBoxMaterial(images) {
            if (images === void 0) { images = null; }
            var _this = _super.call(this) || this;
            _this.setShader("skybox");
            if (images) {
                _this.texture = new feng3d.TextureCube(images);
            }
            //
            _this.createUniformData("s_skyboxTexture", function () { return _this.texture; });
            return _this;
        }
        Object.defineProperty(SkyBoxMaterial.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                if (this._texture == value)
                    return;
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        return SkyBoxMaterial;
    }(feng3d.Material));
    feng3d.SkyBoxMaterial = SkyBoxMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        /**
         * 构建
         */
        function StandardMaterial(diffuseUrl, normalUrl, specularUrl, ambientUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            if (normalUrl === void 0) { normalUrl = ""; }
            if (specularUrl === void 0) { specularUrl = ""; }
            if (ambientUrl === void 0) { ambientUrl = ""; }
            var _this = _super.call(this) || this;
            _this.setShader("standard");
            _this.diffuseMethod = new feng3d.DiffuseMethod(diffuseUrl);
            _this.normalMethod = new feng3d.NormalMethod(normalUrl);
            _this.specularMethod = new feng3d.SpecularMethod(specularUrl);
            _this.ambientMethod = new feng3d.AmbientMethod(ambientUrl);
            return _this;
        }
        Object.defineProperty(StandardMaterial.prototype, "diffuseMethod", {
            /**
             * 漫反射函数
             */
            get: function () {
                return this._diffuseMethod;
            },
            set: function (value) {
                this._diffuseMethod = value;
                if (this._diffuseMethod)
                    this.addMethod(this._diffuseMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "normalMethod", {
            /**
             * 法线函数
             */
            get: function () {
                return this._normalMethod;
            },
            set: function (value) {
                this._normalMethod = value;
                if (this._normalMethod)
                    this.addMethod(this._normalMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "specularMethod", {
            /**
             * 镜面反射函数
             */
            get: function () {
                return this._specularMethod;
            },
            set: function (value) {
                this._specularMethod = value;
                if (this._specularMethod)
                    this.addMethod(this._specularMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "ambientMethod", {
            /**
             * 环境反射函数
             */
            get: function () {
                return this._ambientMethod;
            },
            set: function (value) {
                this._ambientMethod = value;
                if (this._ambientMethod)
                    this.addMethod(this._ambientMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "enableBlend", {
            // /**
            //  * 反射率
            //  */
            // public reflectance: number = 1.0;
            // /**
            //  * 粗糙度
            //  */
            // public roughness: number = 1.0;
            // /**
            //  * 金属度
            //  */
            // public metalic: number = 1.0;
            /**
             * 是否开启混合
             */
            get: function () {
                return this._enableBlend || this.diffuseMethod.color.a != 1.0;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        return StandardMaterial;
    }(feng3d.Material));
    feng3d.StandardMaterial = StandardMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    var DiffuseMethod = (function (_super) {
        __extends(DiffuseMethod, _super);
        /**
         * 构建
         */
        function DiffuseMethod(diffuseUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 基本颜色
             */
            _this.color = new feng3d.Color(1, 1, 1, 1);
            /**
             * 透明阈值，透明度小于该值的像素被片段着色器丢弃
             */
            _this.alphaThreshold = 0;
            _this.difuseTexture = new feng3d.Texture2D(diffuseUrl);
            _this.color = new feng3d.Color(1, 1, 1, 1);
            //
            _this.createUniformData("u_diffuse", function () { return _this.color; });
            _this.createUniformData("s_diffuse", function () { return _this.difuseTexture; });
            _this.createUniformData("u_alphaThreshold", function () { return _this.alphaThreshold; });
            _this.createBoolMacro("HAS_DIFFUSE_SAMPLER", function () { return _this.difuseTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(DiffuseMethod.prototype, "difuseTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._difuseTexture;
            },
            set: function (value) {
                this._difuseTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return DiffuseMethod;
    }(feng3d.RenderDataHolder));
    feng3d.DiffuseMethod = DiffuseMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    var NormalMethod = (function (_super) {
        __extends(NormalMethod, _super);
        /**
         * 构建
         */
        function NormalMethod(normalUrl) {
            if (normalUrl === void 0) { normalUrl = ""; }
            var _this = _super.call(this) || this;
            _this.normalTexture = new feng3d.Texture2D(normalUrl);
            //
            _this.createUniformData("s_normal", function () { return _this.normalTexture; });
            _this.createBoolMacro("HAS_NORMAL_SAMPLER", function () { return _this.normalTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(NormalMethod.prototype, "normalTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._normalTexture;
            },
            set: function (value) {
                this._normalTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return NormalMethod;
    }(feng3d.RenderDataHolder));
    feng3d.NormalMethod = NormalMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    var SpecularMethod = (function (_super) {
        __extends(SpecularMethod, _super);
        /**
         * 构建
         */
        function SpecularMethod(specularUrl) {
            if (specularUrl === void 0) { specularUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 镜面反射颜色
             */
            _this.specularColor = new feng3d.Color();
            /**
             * 高光系数
             */
            _this.glossiness = 50;
            _this.specularTexture = new feng3d.Texture2D(specularUrl);
            //
            _this.createUniformData("s_specular", function () { return _this.specularTexture; });
            _this.createUniformData("u_specular", function () { return _this.specularColor; });
            _this.createUniformData("u_glossiness", function () { return _this.glossiness; });
            _this.createBoolMacro("HAS_SPECULAR_SAMPLER", function () { return _this.specularTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(SpecularMethod.prototype, "specularTexture", {
            /**
             * 镜面反射光泽图
             */
            get: function () {
                return this._specularTexture;
            },
            set: function (value) {
                this._specularTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpecularMethod.prototype, "specular", {
            /**
             * 镜面反射光反射强度
             */
            get: function () {
                return this.specularColor.a;
            },
            set: function (value) {
                this.specularColor.a = value;
            },
            enumerable: true,
            configurable: true
        });
        return SpecularMethod;
    }(feng3d.RenderDataHolder));
    feng3d.SpecularMethod = SpecularMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    var AmbientMethod = (function (_super) {
        __extends(AmbientMethod, _super);
        /**
         * 构建
         */
        function AmbientMethod(ambientUrl, color) {
            if (ambientUrl === void 0) { ambientUrl = ""; }
            if (color === void 0) { color = null; }
            var _this = _super.call(this) || this;
            _this.ambientTexture = new feng3d.Texture2D(ambientUrl);
            _this.color = color || new feng3d.Color();
            //
            _this.createUniformData("u_ambient", function () { return _this._color; });
            _this.createUniformData("s_ambient", function () { return _this._ambientTexture; });
            _this.createBoolMacro("HAS_AMBIENT_SAMPLER", function () { return _this.ambientTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(AmbientMethod.prototype, "ambientTexture", {
            /**
             * 环境纹理
             */
            get: function () {
                return this._ambientTexture;
            },
            set: function (value) {
                this._ambientTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AmbientMethod.prototype, "color", {
            /**
             * 颜色
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        return AmbientMethod;
    }(feng3d.RenderDataHolder));
    feng3d.AmbientMethod = AmbientMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var FogMethod = (function (_super) {
        __extends(FogMethod, _super);
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        function FogMethod(fogColor, minDistance, maxDistance, density, mode) {
            if (fogColor === void 0) { fogColor = new feng3d.Color(); }
            if (minDistance === void 0) { minDistance = 0; }
            if (maxDistance === void 0) { maxDistance = 100; }
            if (density === void 0) { density = 0.1; }
            if (mode === void 0) { mode = FogMode.LINEAR; }
            var _this = _super.call(this) || this;
            _this._minDistance = 0;
            _this._maxDistance = 100;
            _this._fogColor = fogColor;
            _this._minDistance = minDistance;
            _this._maxDistance = maxDistance;
            _this._density = density;
            _this._mode = mode;
            //
            _this.createUniformData("u_fogColor", _this._fogColor);
            _this.createUniformData("u_fogMinDistance", _this._minDistance);
            _this.createUniformData("u_fogMaxDistance", _this._maxDistance);
            _this.createUniformData("u_fogDensity", _this._density);
            _this.createUniformData("u_fogMode", _this._mode);
            _this.createBoolMacro("HAS_FOG_METHOD", true);
            _this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
            return _this;
        }
        Object.defineProperty(FogMethod.prototype, "minDistance", {
            /**
             * 出现雾效果的最近距离
             */
            get: function () {
                return this._minDistance;
            },
            set: function (value) {
                this._minDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "maxDistance", {
            /**
             * 最远距离
             */
            get: function () {
                return this._maxDistance;
            },
            set: function (value) {
                this._maxDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "fogColor", {
            /**
             * 雾的颜色
             */
            get: function () {
                return this._fogColor;
            },
            set: function (value) {
                this._fogColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "density", {
            get: function () {
                return this._density;
            },
            set: function (value) {
                this.density = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "mode", {
            /**
             * 雾模式
             */
            get: function () {
                return this._mode;
            },
            set: function (value) {
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        return FogMethod;
    }(feng3d.RenderDataHolder));
    feng3d.FogMethod = FogMethod;
    /**
     * 雾模式
     */
    var FogMode;
    (function (FogMode) {
        FogMode[FogMode["NONE"] = 0] = "NONE";
        FogMode[FogMode["EXP"] = 1] = "EXP";
        FogMode[FogMode["EXP2"] = 2] = "EXP2";
        FogMode[FogMode["LINEAR"] = 3] = "LINEAR";
    })(FogMode = feng3d.FogMode || (feng3d.FogMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 环境映射函数
     */
    var EnvMapMethod = (function (_super) {
        __extends(EnvMapMethod, _super);
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        function EnvMapMethod(envMap, reflectivity) {
            if (reflectivity === void 0) { reflectivity = 1; }
            var _this = _super.call(this) || this;
            _this._cubeTexture = envMap;
            _this.reflectivity = reflectivity;
            //
            _this.createUniformData("s_envMap", function () { return _this._cubeTexture; });
            _this.createUniformData("u_reflectivity", function () { return _this._reflectivity; });
            _this.createBoolMacro("HAS_ENV_METHOD", true);
            return _this;
        }
        Object.defineProperty(EnvMapMethod.prototype, "envMap", {
            /**
             * 环境映射贴图
             */
            get: function () {
                return this._cubeTexture;
            },
            set: function (value) {
                if (this._cubeTexture == value)
                    return;
                this._cubeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvMapMethod.prototype, "reflectivity", {
            /**
             * 反射率
             */
            get: function () {
                return this._reflectivity;
            },
            set: function (value) {
                if (this._reflectivity == value)
                    return;
                this._reflectivity = value;
            },
            enumerable: true,
            configurable: true
        });
        return EnvMapMethod;
    }(feng3d.RenderDataHolder));
    feng3d.EnvMapMethod = EnvMapMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
    var LightType;
    (function (LightType) {
        /**
         * 点光
         */
        LightType[LightType["Point"] = 0] = "Point";
        /**
         * 方向光
         */
        LightType[LightType["Directional"] = 1] = "Directional";
        /**
         * 聚光灯
         */
        LightType[LightType["Spot"] = 2] = "Spot";
    })(LightType = feng3d.LightType || (feng3d.LightType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    var Light = (function (_super) {
        __extends(Light, _super);
        function Light(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 颜色
             */
            _this.color = new feng3d.Color();
            /**
             * 光照强度
             */
            _this.intensity = 1;
            /**
             * 是否生成阴影（未实现）
             */
            _this.castsShadows = false;
            _this._shadowMap = new feng3d.Texture2D();
            Light._lights.push(_this);
            return _this;
        }
        Object.defineProperty(Light, "lights", {
            get: function () {
                return this._lights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "shadowMap", {
            get: function () {
                return this._shadowMap;
            },
            enumerable: true,
            configurable: true
        });
        return Light;
    }(feng3d.Component));
    Light._lights = [];
    feng3d.Light = Light;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    var DirectionalLight = (function (_super) {
        __extends(DirectionalLight, _super);
        /**
         * 构建
         */
        function DirectionalLight(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.lightType = feng3d.LightType.Directional;
            var xDir = 0, yDir = -1, zDir = 1;
            _this._sceneDirection = new feng3d.Vector3D();
            _this.direction = new feng3d.Vector3D(xDir, yDir, zDir);
            //
            DirectionalLight._directionalLights.push(_this);
            return _this;
        }
        Object.defineProperty(DirectionalLight, "directionalLights", {
            get: function () {
                return this._directionalLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "sceneDirection", {
            get: function () {
                return this._sceneDirection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "direction", {
            /**
             * 光照方向
             */
            get: function () {
                return this._direction;
            },
            set: function (value) {
                this._direction = value;
                if (this.gameObject) {
                    var tmpLookAt = this.gameObject.transform.position;
                    tmpLookAt.incrementBy(this._direction);
                    this.gameObject.transform.lookAt(tmpLookAt);
                    this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
                    this._sceneDirection.normalize();
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理被添加组件事件
         */
        DirectionalLight.prototype.onBeAddedComponent = function (event) {
            feng3d.Event.on(this.gameObject.transform, feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            var tmpLookAt = this.gameObject.transform.position;
            tmpLookAt.incrementBy(this._direction);
            this.gameObject.transform.lookAt(tmpLookAt);
        };
        /**
         * 处理被移除组件事件
         */
        DirectionalLight.prototype.onBeRemovedComponent = function (event) {
            feng3d.Event.off(this.gameObject.transform, feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        };
        DirectionalLight.prototype.onScenetransformChanged = function () {
            this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
            this._sceneDirection.normalize();
        };
        return DirectionalLight;
    }(feng3d.Light));
    DirectionalLight._directionalLights = [];
    feng3d.DirectionalLight = DirectionalLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    var PointLight = (function (_super) {
        __extends(PointLight, _super);
        /**
         * 构建
         */
        function PointLight(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 光照范围
             */
            _this.range = 600;
            _this.lightType = feng3d.LightType.Point;
            PointLight._pointLights.push(_this);
            return _this;
        }
        Object.defineProperty(PointLight, "pointLights", {
            get: function () {
                return this._pointLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointLight.prototype, "position", {
            /**
             * 灯光位置
             */
            get: function () {
                return this.gameObject.transform.scenePosition;
            },
            enumerable: true,
            configurable: true
        });
        return PointLight;
    }(feng3d.Light));
    PointLight._pointLights = [];
    feng3d.PointLight = PointLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ControllerBase = (function () {
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        function ControllerBase(targetObject) {
            this.targetObject = targetObject;
        }
        /**
         * 手动应用更新到目标3D对象
         */
        ControllerBase.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            throw new Error("Abstract method");
        };
        Object.defineProperty(ControllerBase.prototype, "targetObject", {
            get: function () {
                return this._targetObject;
            },
            set: function (val) {
                this._targetObject = val;
            },
            enumerable: true,
            configurable: true
        });
        return ControllerBase;
    }());
    feng3d.ControllerBase = ControllerBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var LookAtController = (function (_super) {
        __extends(LookAtController, _super);
        function LookAtController(target, lookAtObject) {
            if (target === void 0) { target = null; }
            if (lookAtObject === void 0) { lookAtObject = null; }
            var _this = _super.call(this, target) || this;
            _this._origin = new feng3d.Vector3D(0.0, 0.0, 0.0);
            _this._upAxis = feng3d.Vector3D.Y_AXIS;
            _this._pos = new feng3d.Vector3D();
            if (lookAtObject)
                _this.lookAtObject = lookAtObject;
            else
                _this.lookAtPosition = new feng3d.Vector3D();
            return _this;
        }
        Object.defineProperty(LookAtController.prototype, "upAxis", {
            get: function () {
                return this._upAxis;
            },
            set: function (upAxis) {
                this._upAxis = upAxis;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LookAtController.prototype, "lookAtPosition", {
            get: function () {
                return this._lookAtPosition;
            },
            set: function (val) {
                this._lookAtPosition = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LookAtController.prototype, "lookAtObject", {
            get: function () {
                return this._lookAtObject;
            },
            set: function (value) {
                if (this._lookAtObject == value)
                    return;
                this._lookAtObject = value;
            },
            enumerable: true,
            configurable: true
        });
        LookAtController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this._targetObject) {
                if (this._lookAtPosition) {
                    this._targetObject.transform.lookAt(this.lookAtPosition, this._upAxis);
                }
                else if (this._lookAtObject) {
                    this._pos = this._lookAtObject.transform.position;
                    this._targetObject.transform.lookAt(this._pos, this._upAxis);
                }
            }
        };
        return LookAtController;
    }(feng3d.ControllerBase));
    feng3d.LookAtController = LookAtController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var HoverController = (function (_super) {
        __extends(HoverController, _super);
        function HoverController(targetObject, lookAtObject, panAngle, tiltAngle, distance, minTiltAngle, maxTiltAngle, minPanAngle, maxPanAngle, steps, yFactor, wrapPanAngle) {
            if (targetObject === void 0) { targetObject = null; }
            if (lookAtObject === void 0) { lookAtObject = null; }
            if (panAngle === void 0) { panAngle = 0; }
            if (tiltAngle === void 0) { tiltAngle = 90; }
            if (distance === void 0) { distance = 1000; }
            if (minTiltAngle === void 0) { minTiltAngle = -90; }
            if (maxTiltAngle === void 0) { maxTiltAngle = 90; }
            if (minPanAngle === void 0) { minPanAngle = NaN; }
            if (maxPanAngle === void 0) { maxPanAngle = NaN; }
            if (steps === void 0) { steps = 8; }
            if (yFactor === void 0) { yFactor = 2; }
            if (wrapPanAngle === void 0) { wrapPanAngle = false; }
            var _this = _super.call(this, targetObject, lookAtObject) || this;
            _this._currentPanAngle = 0;
            _this._currentTiltAngle = 90;
            _this._panAngle = 0;
            _this._tiltAngle = 90;
            _this._distance = 1000;
            _this._minPanAngle = -Infinity;
            _this._maxPanAngle = Infinity;
            _this._minTiltAngle = -90;
            _this._maxTiltAngle = 90;
            _this._steps = 8;
            _this._yFactor = 2;
            _this._wrapPanAngle = false;
            _this.distance = distance;
            _this.panAngle = panAngle;
            _this.tiltAngle = tiltAngle;
            _this.minPanAngle = minPanAngle || -Infinity;
            _this.maxPanAngle = maxPanAngle || Infinity;
            _this.minTiltAngle = minTiltAngle;
            _this.maxTiltAngle = maxTiltAngle;
            _this.steps = steps;
            _this.yFactor = yFactor;
            _this.wrapPanAngle = wrapPanAngle;
            _this._currentPanAngle = _this._panAngle;
            _this._currentTiltAngle = _this._tiltAngle;
            return _this;
        }
        Object.defineProperty(HoverController.prototype, "steps", {
            get: function () {
                return this._steps;
            },
            set: function (val) {
                val = (val < 1) ? 1 : val;
                if (this._steps == val)
                    return;
                this._steps = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "panAngle", {
            get: function () {
                return this._panAngle;
            },
            set: function (val) {
                val = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, val));
                if (this._panAngle == val)
                    return;
                this._panAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "tiltAngle", {
            get: function () {
                return this._tiltAngle;
            },
            set: function (val) {
                val = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, val));
                if (this._tiltAngle == val)
                    return;
                this._tiltAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "distance", {
            get: function () {
                return this._distance;
            },
            set: function (val) {
                if (this._distance == val)
                    return;
                this._distance = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "minPanAngle", {
            get: function () {
                return this._minPanAngle;
            },
            set: function (val) {
                if (this._minPanAngle == val)
                    return;
                this._minPanAngle = val;
                this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "maxPanAngle", {
            get: function () {
                return this._maxPanAngle;
            },
            set: function (val) {
                if (this._maxPanAngle == val)
                    return;
                this._maxPanAngle = val;
                this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "minTiltAngle", {
            get: function () {
                return this._minTiltAngle;
            },
            set: function (val) {
                if (this._minTiltAngle == val)
                    return;
                this._minTiltAngle = val;
                this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "maxTiltAngle", {
            get: function () {
                return this._maxTiltAngle;
            },
            set: function (val) {
                if (this._maxTiltAngle == val)
                    return;
                this._maxTiltAngle = val;
                this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "yFactor", {
            get: function () {
                return this._yFactor;
            },
            set: function (val) {
                if (this._yFactor == val)
                    return;
                this._yFactor = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "wrapPanAngle", {
            get: function () {
                return this._wrapPanAngle;
            },
            set: function (val) {
                if (this._wrapPanAngle == val)
                    return;
                this._wrapPanAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        HoverController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this._tiltAngle != this._currentTiltAngle || this._panAngle != this._currentPanAngle) {
                if (this._wrapPanAngle) {
                    if (this._panAngle < 0) {
                        this._currentPanAngle += this._panAngle % 360 + 360 - this._panAngle;
                        this._panAngle = this._panAngle % 360 + 360;
                    }
                    else {
                        this._currentPanAngle += this._panAngle % 360 - this._panAngle;
                        this._panAngle = this._panAngle % 360;
                    }
                    while (this._panAngle - this._currentPanAngle < -180)
                        this._currentPanAngle -= 360;
                    while (this._panAngle - this._currentPanAngle > 180)
                        this._currentPanAngle += 360;
                }
                if (interpolate) {
                    this._currentTiltAngle += (this._tiltAngle - this._currentTiltAngle) / (this.steps + 1);
                    this._currentPanAngle += (this._panAngle - this._currentPanAngle) / (this.steps + 1);
                }
                else {
                    this._currentPanAngle = this._panAngle;
                    this._currentTiltAngle = this._tiltAngle;
                }
                if ((Math.abs(this.tiltAngle - this._currentTiltAngle) < 0.01) && (Math.abs(this._panAngle - this._currentPanAngle) < 0.01)) {
                    this._currentTiltAngle = this._tiltAngle;
                    this._currentPanAngle = this._panAngle;
                }
            }
            if (!this._targetObject)
                return;
            if (this._lookAtPosition) {
                this._pos["x"] = this._lookAtPosition["x"];
                this._pos["y"] = this._lookAtPosition["y"];
                this._pos["z"] = this._lookAtPosition["z"];
            }
            else if (this._lookAtObject) {
                if (this._targetObject.transform.parent && this._lookAtObject.transform.parent) {
                    if (this._targetObject.transform.parent != this._lookAtObject.transform.parent) {
                        this._pos["x"] = this._lookAtObject.transform.scenePosition["x"];
                        this._pos["y"] = this._lookAtObject.transform.scenePosition["y"];
                        this._pos["z"] = this._lookAtObject.transform.scenePosition["z"];
                        this._targetObject.transform.parent.worldToLocalMatrix.transformVector(this._pos, this._pos);
                    }
                    else {
                        this._pos.copyFrom(this._lookAtObject.transform.position);
                    }
                }
                else if (this._lookAtObject.transform.scene) {
                    this._pos["x"] = this._lookAtObject.transform.scenePosition["x"];
                    this._pos["y"] = this._lookAtObject.transform.scenePosition["y"];
                    this._pos["z"] = this._lookAtObject.transform.scenePosition["z"];
                }
                else {
                    this._pos.copyFrom(this._lookAtObject.transform.position);
                }
            }
            else {
                this._pos["x"] = this._origin["x"];
                this._pos["y"] = this._origin["y"];
                this._pos["z"] = this._origin["z"];
            }
            this._targetObject.transform.x = this._pos["x"] + this._distance * Math.sin(this._currentPanAngle * Math.DEG2RAD) * Math.cos(this._currentTiltAngle * Math.DEG2RAD);
            this._targetObject.transform.z = this._pos["z"] + this._distance * Math.cos(this._currentPanAngle * Math.DEG2RAD) * Math.cos(this._currentTiltAngle * Math.DEG2RAD);
            this._targetObject.transform.y = this._pos["y"] + this._distance * Math.sin(this._currentTiltAngle * Math.DEG2RAD) * this._yFactor;
            _super.prototype.update.call(this);
        };
        return HoverController;
    }(feng3d.LookAtController));
    feng3d.HoverController = HoverController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    var FPSController = (function (_super) {
        __extends(FPSController, _super);
        function FPSController(transform) {
            if (transform === void 0) { transform = null; }
            var _this = _super.call(this, transform) || this;
            /**
             * 按键记录
             */
            _this.keyDownDic = {};
            /**
             * 按键方向字典
             */
            _this.keyDirectionDic = {};
            /**
             * 加速度
             */
            _this.acceleration = 0.05;
            _this.init();
            return _this;
        }
        Object.defineProperty(FPSController.prototype, "targetObject", {
            get: function () {
                return this._targetObject;
            },
            set: function (value) {
                if (this._targetObject != null) {
                    feng3d.Event.off(feng3d.input, feng3d.inputType.MOUSE_DOWN, this.onMousedown, this);
                    feng3d.Event.off(feng3d.input, feng3d.inputType.MOUSE_UP, this.onMouseup, this);
                }
                this._targetObject = value;
                if (this._targetObject != null) {
                    feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_DOWN, this.onMousedown, this);
                    feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_UP, this.onMouseup, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        FPSController.prototype.onMousedown = function () {
            this.preMousePoint = null;
            this.velocity = new feng3d.Vector3D();
            this.keyDownDic = {};
            feng3d.Event.on(feng3d.input, feng3d.inputType.KEY_DOWN, this.onKeydown, this);
            feng3d.Event.on(feng3d.input, feng3d.inputType.KEY_UP, this.onKeyup, this);
            feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_MOVE, this.onMouseMove, this);
            feng3d.Event.on(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
        };
        FPSController.prototype.onMouseup = function () {
            feng3d.Event.off(feng3d.input, feng3d.inputType.KEY_DOWN, this.onKeydown, this);
            feng3d.Event.off(feng3d.input, feng3d.inputType.KEY_UP, this.onKeyup, this);
            feng3d.Event.off(feng3d.input, feng3d.inputType.MOUSE_MOVE, this.onMouseMove, this);
            feng3d.Event.off(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
        };
        FPSController.prototype.onEnterFrame = function () {
            this.update();
        };
        /**
         * 初始化
         */
        FPSController.prototype.init = function () {
            this.keyDirectionDic["a"] = new feng3d.Vector3D(-1, 0, 0); //左
            this.keyDirectionDic["d"] = new feng3d.Vector3D(1, 0, 0); //右
            this.keyDirectionDic["w"] = new feng3d.Vector3D(0, 0, 1); //前
            this.keyDirectionDic["s"] = new feng3d.Vector3D(0, 0, -1); //后
            this.keyDirectionDic["e"] = new feng3d.Vector3D(0, 1, 0); //上
            this.keyDirectionDic["q"] = new feng3d.Vector3D(0, -1, 0); //下
        };
        /**
         * 手动应用更新到目标3D对象
         */
        FPSController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this.targetObject == null)
                return;
            //计算加速度
            var accelerationVec = new feng3d.Vector3D();
            for (var key in this.keyDirectionDic) {
                if (this.keyDownDic[key] == true) {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.targetObject.transform.rightVector;
            var up = this.targetObject.transform.upVector;
            var forward = this.targetObject.transform.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.targetObject.transform.x += displacement.x;
            this.targetObject.transform.y += displacement.y;
            this.targetObject.transform.z += displacement.z;
        };
        /**
         * 处理鼠标移动事件
         */
        FPSController.prototype.onMouseMove = function (event) {
            if (this.targetObject == null)
                return;
            var mousePoint = new feng3d.Point(feng3d.input.clientX, feng3d.input.clientY);
            if (this.preMousePoint == null) {
                this.preMousePoint = mousePoint;
                return;
            }
            //计算旋转
            var offsetPoint = mousePoint.subtract(this.preMousePoint);
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            // this.targetObject.transform.rotate(Vector3D.X_AXIS, offsetPoint.y, this.targetObject.transform.position);
            // this.targetObject.transform.rotate(Vector3D.Y_AXIS, offsetPoint.x, this.targetObject.transform.position);
            var matrix3d = this.targetObject.transform.localToWorldMatrix;
            matrix3d.appendRotation(offsetPoint.y, matrix3d.right, matrix3d.position);
            var up = feng3d.Vector3D.Y_AXIS;
            if (matrix3d.up.dotProduct(up) < 0) {
                up = up.clone();
                up.scaleBy(-1);
            }
            matrix3d.appendRotation(offsetPoint.x, up, matrix3d.position);
            this.targetObject.transform.localToWorldMatrix = matrix3d;
            //
            this.preMousePoint = mousePoint;
        };
        /**
         * 键盘按下事件
         */
        FPSController.prototype.onKeydown = function (event) {
            var inputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        };
        /**
         * 键盘弹起事件
         */
        FPSController.prototype.onKeyup = function (event) {
            var inputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        };
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        FPSController.prototype.stopDirectionVelocity = function (direction) {
            if (direction == null)
                return;
            if (direction.x != 0) {
                this.velocity.x = 0;
            }
            if (direction.y != 0) {
                this.velocity.y = 0;
            }
            if (direction.z != 0) {
                this.velocity.z = 0;
            }
        };
        return FPSController;
    }(feng3d.ControllerBase));
    feng3d.FPSController = FPSController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 拾取的碰撞数据
     */
    var PickingCollisionVO = (function () {
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        function PickingCollisionVO(entity) {
            /**
             * 本地坐标系射线
             */
            this.localRay = new feng3d.Ray3D();
            /**
             * 场景中碰撞射线
             */
            this.ray3D = new feng3d.Ray3D();
            this.firstEntity = entity;
        }
        Object.defineProperty(PickingCollisionVO.prototype, "scenePosition", {
            /**
             * 实体上碰撞世界坐标
             */
            get: function () {
                return this.firstEntity.transform.localToWorldMatrix.transformVector(this.localPosition);
            },
            enumerable: true,
            configurable: true
        });
        return PickingCollisionVO;
    }());
    feng3d.PickingCollisionVO = PickingCollisionVO;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 使用纯计算与实体相交
     */
    var AS3PickingCollider = (function () {
        /**
         * 创建一个AS碰撞检测器
         * @param findClosestCollision 是否查找最短距离碰撞
         */
        function AS3PickingCollider(findClosestCollision) {
            if (findClosestCollision === void 0) { findClosestCollision = false; }
            this._findClosestCollision = findClosestCollision;
        }
        AS3PickingCollider.prototype.testSubMeshCollision = function (geometry, pickingCollisionVO, shortestCollisionDistance, bothSides) {
            if (shortestCollisionDistance === void 0) { shortestCollisionDistance = 0; }
            if (bothSides === void 0) { bothSides = true; }
            var indexData = geometry.getIndexData().indices;
            var vertexData = geometry.getVAData("a_position").data;
            var hasUV = !!geometry.getVAData("a_uv");
            if (hasUV) {
                var uvData = geometry.getVAData("a_uv").data;
            }
            var t = 0;
            var i0 = 0, i1 = 0, i2 = 0;
            var rx = 0, ry = 0, rz = 0;
            var nx = 0, ny = 0, nz = 0;
            var cx = 0, cy = 0, cz = 0;
            var coeff = 0, u = 0, v = 0, w = 0;
            var p0x = 0, p0y = 0, p0z = 0;
            var p1x = 0, p1y = 0, p1z = 0;
            var p2x = 0, p2y = 0, p2z = 0;
            var s0x = 0, s0y = 0, s0z = 0;
            var s1x = 0, s1y = 0, s1z = 0;
            var nl = 0, nDotV = 0, D = 0, disToPlane = 0;
            var Q1Q2 = 0, Q1Q1 = 0, Q2Q2 = 0, RQ1 = 0, RQ2 = 0;
            var collisionTriangleIndex = -1;
            var vertexStride = 3;
            var vertexOffset = 0;
            var uvStride = 2;
            var numIndices = indexData.length;
            //遍历每个三角形 检测碰撞
            for (var index = 0; index < numIndices; index += 3) {
                //三角形三个顶点索引
                i0 = vertexOffset + indexData[index] * vertexStride;
                i1 = vertexOffset + indexData[index + 1] * vertexStride;
                i2 = vertexOffset + indexData[index + 2] * vertexStride;
                //三角形三个顶点数据
                p0x = vertexData[i0];
                p0y = vertexData[i0 + 1];
                p0z = vertexData[i0 + 2];
                p1x = vertexData[i1];
                p1y = vertexData[i1 + 1];
                p1z = vertexData[i1 + 2];
                p2x = vertexData[i2];
                p2y = vertexData[i2 + 1];
                p2z = vertexData[i2 + 2];
                //计算出三角面的法线
                s0x = p1x - p0x; // s0 = p1 - p0
                s0y = p1y - p0y;
                s0z = p1z - p0z;
                s1x = p2x - p0x; // s1 = p2 - p0
                s1y = p2y - p0y;
                s1z = p2z - p0z;
                nx = s0y * s1z - s0z * s1y; // n = s0 x s1
                ny = s0z * s1x - s0x * s1z;
                nz = s0x * s1y - s0y * s1x;
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); // normalize n
                nx *= nl;
                ny *= nl;
                nz *= nl;
                //初始化射线数据
                var rayPosition = this.ray3D.position;
                var rayDirection = this.ray3D.direction;
                //计算射线与法线的点积，不等于零表示射线所在直线与三角面相交
                nDotV = nx * rayDirection.x + ny * +rayDirection.y + nz * rayDirection.z; // rayDirection . normal
                //判断射线是否与三角面相交
                if ((!bothSides && nDotV < 0.0) || (bothSides && nDotV != 0.0)) {
                    //计算平面方程D值，参考Plane3D
                    D = -(nx * p0x + ny * p0y + nz * p0z);
                    //射线点到平面的距离
                    disToPlane = -(nx * rayPosition.x + ny * rayPosition.y + nz * rayPosition.z + D);
                    t = disToPlane / nDotV;
                    //得到交点
                    cx = rayPosition.x + t * rayDirection.x;
                    cy = rayPosition.y + t * rayDirection.y;
                    cz = rayPosition.z + t * rayDirection.z;
                    //判断交点是否在三角形内( using barycentric coordinates )
                    Q1Q2 = s0x * s1x + s0y * s1y + s0z * s1z;
                    Q1Q1 = s0x * s0x + s0y * s0y + s0z * s0z;
                    Q2Q2 = s1x * s1x + s1y * s1y + s1z * s1z;
                    rx = cx - p0x;
                    ry = cy - p0y;
                    rz = cz - p0z;
                    RQ1 = rx * s0x + ry * s0y + rz * s0z;
                    RQ2 = rx * s1x + ry * s1y + rz * s1z;
                    coeff = 1 / (Q1Q1 * Q2Q2 - Q1Q2 * Q1Q2);
                    v = coeff * (Q2Q2 * RQ1 - Q1Q2 * RQ2);
                    w = coeff * (-Q1Q2 * RQ1 + Q1Q1 * RQ2);
                    if (v < 0)
                        continue;
                    if (w < 0)
                        continue;
                    u = 1 - v - w;
                    //u v w都大于0表示点在三角形内 射线的坐标t大于0表示射线朝向三角面
                    if (!(u < 0) && t > 0 && t < shortestCollisionDistance) {
                        shortestCollisionDistance = t;
                        collisionTriangleIndex = index / 3;
                        pickingCollisionVO.rayEntryDistance = t;
                        pickingCollisionVO.localPosition = new feng3d.Vector3D(cx, cy, cz);
                        pickingCollisionVO.localNormal = new feng3d.Vector3D(nx, ny, nz);
                        if (hasUV) {
                            pickingCollisionVO.uv = this.getCollisionUV(indexData, uvData, index, v, w, u, 0, uvStride);
                        }
                        pickingCollisionVO.index = index;
                        //是否继续寻找最优解
                        if (!this._findClosestCollision)
                            return true;
                    }
                }
            }
            if (collisionTriangleIndex >= 0)
                return true;
            return false;
        };
        /**
         * 获取碰撞法线
         * @param indexData 顶点索引数据
         * @param vertexData 顶点数据
         * @param triangleIndex 三角形索引
         * @param normal 碰撞法线
         * @return 碰撞法线
         *
         */
        AS3PickingCollider.prototype.getCollisionNormal = function (indexData, vertexData, triangleIndex, normal) {
            if (triangleIndex === void 0) { triangleIndex = 0; }
            if (normal === void 0) { normal = null; }
            var i0 = indexData[triangleIndex] * 3;
            var i1 = indexData[triangleIndex + 1] * 3;
            var i2 = indexData[triangleIndex + 2] * 3;
            var side0x = vertexData[i1] - vertexData[i0];
            var side0y = vertexData[i1 + 1] - vertexData[i0 + 1];
            var side0z = vertexData[i1 + 2] - vertexData[i0 + 2];
            var side1x = vertexData[i2] - vertexData[i0];
            var side1y = vertexData[i2 + 1] - vertexData[i0 + 1];
            var side1z = vertexData[i2 + 2] - vertexData[i0 + 2];
            if (!normal)
                normal = new feng3d.Vector3D();
            normal.x = side0y * side1z - side0z * side1y;
            normal.y = side0z * side1x - side0x * side1z;
            normal.z = side0x * side1y - side0y * side1x;
            normal.w = 1;
            normal.normalize();
            return normal;
        };
        /**
         * 获取碰撞uv
         * @param indexData 顶点数据
         * @param uvData uv数据
         * @param triangleIndex 三角形所有
         * @param v
         * @param w
         * @param u
         * @param uvOffset
         * @param uvStride
         * @param uv uv坐标
         * @return 碰撞uv
         */
        AS3PickingCollider.prototype.getCollisionUV = function (indexData, uvData, triangleIndex, v, w, u, uvOffset, uvStride, uv) {
            if (uv === void 0) { uv = null; }
            var uIndex = indexData[triangleIndex] * uvStride + uvOffset;
            var uv0x = uvData[uIndex];
            var uv0y = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 1] * uvStride + uvOffset;
            var uv1x = uvData[uIndex];
            var uv1y = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 2] * uvStride + uvOffset;
            var uv2x = uvData[uIndex];
            var uv2y = uvData[uIndex + 1];
            if (!uv)
                uv = new feng3d.Point();
            uv.x = u * uv0x + v * uv1x + w * uv2x;
            uv.y = u * uv0y + v * uv1y + w * uv2y;
            return uv;
        };
        /**
         * 设置碰撞射线
         */
        AS3PickingCollider.prototype.setLocalRay = function (ray3D) {
            this.ray3D = ray3D;
        };
        return AS3PickingCollider;
    }());
    feng3d.AS3PickingCollider = AS3PickingCollider;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    var RaycastPicker = (function () {
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        function RaycastPicker(findClosestCollision) {
            this._findClosestCollision = findClosestCollision;
            RaycastPicker.pickingCollider = RaycastPicker.pickingCollider || new feng3d.AS3PickingCollider();
        }
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        RaycastPicker.prototype.getViewCollision = function (ray3D, entitys) {
            var _this = this;
            this._entities = [];
            if (entitys.length == 0)
                return null;
            entitys.forEach(function (entity) {
                if (entity.transform.isIntersectingRay(ray3D))
                    _this._entities.push(entity);
            });
            if (this._entities.length == 0)
                return null;
            return this.getPickingCollisionVO();
        };
        /**
         *获取射线穿过的实体
         */
        RaycastPicker.prototype.getPickingCollisionVO = function () {
            // Sort entities from closest to furthest.
            this._entities = this._entities.sort(this.sortOnNearT);
            // ---------------------------------------------------------------------
            // Evaluate triangle collisions when needed.
            // Replaces collision data provided by bounds collider with more precise data.
            // ---------------------------------------------------------------------
            var shortestCollisionDistance = Number.MAX_VALUE;
            var bestCollisionVO;
            var pickingCollisionVO;
            var entity;
            var i;
            for (i = 0; i < this._entities.length; ++i) {
                entity = this._entities[i];
                pickingCollisionVO = entity.transform._pickingCollisionVO;
                if (RaycastPicker.pickingCollider) {
                    // If a collision exists, update the collision data and stop all checks.
                    if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && entity.transform.collidesBefore(RaycastPicker.pickingCollider, shortestCollisionDistance, this._findClosestCollision)) {
                        shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                        bestCollisionVO = pickingCollisionVO;
                        if (!this._findClosestCollision) {
                            this.updateLocalPosition(pickingCollisionVO);
                            return pickingCollisionVO;
                        }
                    }
                }
                else if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) {
                    // Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
                    // to enable the detection of a corresponsding triangle collision.
                    // Therefore, bounds collisions with a ray origin inside its bounds can be ignored
                    // if it has been established that there is NO triangle collider to test
                    if (!pickingCollisionVO.rayOriginIsInsideBounds) {
                        this.updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }
            return bestCollisionVO;
        };
        /**
         * 按与射线原点距离排序
         */
        RaycastPicker.prototype.sortOnNearT = function (entity1, entity2) {
            return entity1.transform.pickingCollisionVO.rayEntryDistance > entity2.transform.pickingCollisionVO.rayEntryDistance ? 1 : -1;
        };
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        RaycastPicker.prototype.updateLocalPosition = function (pickingCollisionVO) {
            pickingCollisionVO.localPosition = pickingCollisionVO.localRay.getPoint(pickingCollisionVO.rayEntryDistance);
        };
        return RaycastPicker;
    }());
    feng3d.RaycastPicker = RaycastPicker;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    var TerrainGeometry = (function (_super) {
        __extends(TerrainGeometry, _super);
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         * @param    heightMap	高度图
         * @param    width	地形宽度
         * @param    height	地形高度
         * @param    depth	地形深度
         * @param    segmentsW	x轴上网格段数
         * @param    segmentsH	y轴上网格段数
         * @param    maxElevation	最大地形高度
         * @param    minElevation	最小地形高度
         */
        function TerrainGeometry(heightMapUrl, width, height, depth, segmentsW, segmentsH, maxElevation, minElevation) {
            if (width === void 0) { width = 1000; }
            if (height === void 0) { height = 100; }
            if (depth === void 0) { depth = 1000; }
            if (segmentsW === void 0) { segmentsW = 30; }
            if (segmentsH === void 0) { segmentsH = 30; }
            if (maxElevation === void 0) { maxElevation = 255; }
            if (minElevation === void 0) { minElevation = 0; }
            var _this = _super.call(this) || this;
            _this._width = 1000;
            _this._height = 100;
            _this._depth = 1000;
            _this._segmentsW = 30;
            _this._segmentsH = 30;
            _this._maxElevation = 255;
            _this._minElevation = 0;
            _this.width = width;
            _this.height = height;
            _this.depth = depth;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.maxElevation = maxElevation;
            _this.minElevation = minElevation;
            _this._heightImage = new Image();
            _this._heightImage.crossOrigin = "Anonymous";
            _this._heightImage.addEventListener("load", _this.onHeightMapLoad.bind(_this));
            _this.heightMapUrl = heightMapUrl;
            return _this;
        }
        Object.defineProperty(TerrainGeometry.prototype, "heightMapUrl", {
            get: function () {
                return this._heightImage.src;
            },
            set: function (value) {
                if (this._heightImage.src == value)
                    return;
                this._heightImage.src = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "depth", {
            get: function () {
                return this._depth;
            },
            set: function (value) {
                if (this._depth == value)
                    return;
                this._depth = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "maxElevation", {
            get: function () {
                return this._maxElevation;
            },
            set: function (value) {
                if (this._maxElevation == value)
                    return;
                this._maxElevation = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "minElevation", {
            get: function () {
                return this._minElevation;
            },
            set: function (value) {
                if (this._minElevation == value)
                    return;
                this._minElevation = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 高度图加载完成
         */
        TerrainGeometry.prototype.onHeightMapLoad = function () {
            var canvasImg = document.createElement("canvas");
            canvasImg.width = this._heightImage.width;
            canvasImg.height = this._heightImage.height;
            var ctxt = canvasImg.getContext('2d');
            ctxt.drawImage(this._heightImage, 0, 0);
            var terrainHeightData = ctxt.getImageData(0, 0, this._heightImage.width, this._heightImage.height); //读取整张图片的像素。
            ctxt.putImageData(terrainHeightData, terrainHeightData.width, terrainHeightData.height);
            this._heightMap = terrainHeightData;
            this.invalidateGeometry();
        };
        /**
         * 创建顶点坐标
         */
        TerrainGeometry.prototype.buildGeometry = function () {
            if (!this._heightMap)
                return;
            var x, z;
            var numInds = 0;
            var base = 0;
            //一排顶点数据
            var tw = this.segmentsW + 1;
            //总顶点数量
            var numVerts = (this.segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv = (this._heightMap.width - 1) / this.segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv = (this._heightMap.height - 1) / this.segmentsH;
            var u, v;
            var y;
            var vertices = new Float32Array(numVerts * 3);
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            numVerts = 0;
            var col;
            for (var zi = 0; zi <= this.segmentsH; ++zi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //顶点坐标
                    x = (xi / this.segmentsW - .5) * this.width;
                    z = (zi / this.segmentsH - .5) * this.depth;
                    //格子对应高度图uv坐标
                    u = xi * uDiv;
                    v = (this.segmentsH - zi) * vDiv;
                    //获取颜色值
                    col = this.getPixel(this._heightMap, u, v) & 0xff;
                    //计算高度值
                    y = (col > this.maxElevation) ? (this.maxElevation / 0xff) * this.height : ((col < this.minElevation) ? (this.minElevation / 0xff) * this.height : (col / 0xff) * this.height);
                    //保存顶点坐标
                    vertices[numVerts++] = x;
                    vertices[numVerts++] = y;
                    vertices[numVerts++] = z;
                    if (xi != this.segmentsW && zi != this.segmentsH) {
                        //增加 一个顶点同时 生成一个格子或两个三角形
                        base = xi + zi * tw;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base + 1;
                    }
                }
            }
            var uvs = this.buildUVs();
            this.setVAData("a_position", vertices, 3);
            this.setVAData("a_uv", uvs, 2);
            this.setIndices(indices);
            var normals = feng3d.GeometryUtils.createVertexNormals(indices, vertices);
            this.normals = new Float32Array(normals);
            //生成切线
            var tangents = feng3d.GeometryUtils.createVertexTangents(indices, vertices, uvs);
            this.tangents = new Float32Array(tangents);
        };
        /**
         * 创建uv坐标
         */
        TerrainGeometry.prototype.buildUVs = function () {
            var numUvs = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
            var uvs = new Float32Array(numUvs);
            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    uvs[numUvs++] = xi / this.segmentsW;
                    uvs[numUvs++] = 1 - yi / this.segmentsH;
                }
            }
            return uvs;
        };
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        TerrainGeometry.prototype.getHeightAt = function (x, z) {
            //得到高度图中的值
            var u = (x / this.width + .5) * (this._heightMap.width - 1);
            var v = (-z / this.depth + .5) * (this._heightMap.height - 1);
            var col = this.getPixel(this._heightMap, u, v) & 0xff;
            var h;
            if (col > this.maxElevation) {
                h = (this.maxElevation / 0xff) * this.height;
            }
            else if (col < this.minElevation) {
                h = (this.minElevation / 0xff) * this.height;
            }
            else {
                h = (col / 0xff) * this.height;
            }
            return h;
        };
        /**
         * 获取像素值
         */
        TerrainGeometry.prototype.getPixel = function (imageData, u, v) {
            //取整
            u = ~~u;
            v = ~~v;
            var index = (v * imageData.width + u) * 4;
            var data = imageData.data;
            var red = data[index]; //红色色深
            var green = data[index + 1]; //绿色色深
            var blue = data[index + 2]; //蓝色色深
            var alpha = data[index + 3]; //透明度
            return blue;
        };
        return TerrainGeometry;
    }(feng3d.Geometry));
    feng3d.TerrainGeometry = TerrainGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    var TerrainMethod = (function (_super) {
        __extends(TerrainMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMethod(blendUrl, splatUrls, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatUrls === void 0) { splatUrls = ["", "", ""]; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatTexture1 = new feng3d.Texture2D(splatUrls[0] || "");
            _this.splatTexture2 = new feng3d.Texture2D(splatUrls[1] || "");
            _this.splatTexture3 = new feng3d.Texture2D(splatUrls[2] || "");
            _this.splatTexture1.generateMipmap = true;
            _this.splatTexture1.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture1.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture1.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture2.generateMipmap = true;
            _this.splatTexture2.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture2.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture2.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture3.generateMipmap = true;
            _this.splatTexture3.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture3.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture3.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", function () { return _this.blendTexture; });
            _this.createUniformData("s_splatTexture1", function () { return _this.splatTexture1; });
            _this.createUniformData("s_splatTexture2", function () { return _this.splatTexture2; });
            _this.createUniformData("s_splatTexture3", function () { return _this.splatTexture3; });
            _this.createUniformData("u_splatRepeats", function () { return _this.splatRepeats; });
            _this.createBoolMacro("HAS_TERRAIN_METHOD", function () {
                return _this.blendTexture.checkRenderData()
                    && _this.splatTexture1.checkRenderData()
                    && _this.splatTexture2.checkRenderData()
                    && _this.splatTexture3.checkRenderData();
            });
            return _this;
        }
        Object.defineProperty(TerrainMethod.prototype, "splatTexture1", {
            get: function () {
                return this._splatTexture1;
            },
            set: function (value) {
                this._splatTexture1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture2", {
            get: function () {
                return this._splatTexture2;
            },
            set: function (value) {
                this._splatTexture2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture3", {
            get: function () {
                return this._splatTexture3;
            },
            set: function (value) {
                this._splatTexture3 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMethod = TerrainMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    var TerrainMergeMethod = (function (_super) {
        __extends(TerrainMergeMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMergeMethod(blendUrl, splatMergeUrl, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatMergeUrl === void 0) { splatMergeUrl = ""; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatMergeTexture = new feng3d.Texture2D(splatMergeUrl || "");
            _this.splatMergeTexture.minFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.magFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.wrapS = feng3d.GL.REPEAT;
            _this.splatMergeTexture.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", _this.blendTexture);
            _this.createUniformData("s_splatMergeTexture", _this.splatMergeTexture);
            _this.createUniformData("u_splatMergeTextureSize", _this.splatMergeTexture.size);
            _this.createUniformData("u_splatRepeats", _this.splatRepeats);
            //
            _this.createUniformData("u_imageSize", new feng3d.Point(2048.0, 1024.0));
            _this.createUniformData("u_tileSize", new feng3d.Point(512.0, 512.0));
            _this.createUniformData("u_maxLod", 7);
            _this.createUniformData("u_uvPositionScale", 0.001);
            _this.createUniformData("u_tileOffset", [
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.5, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.5),
            ]);
            _this.createUniformData("u_lod0vec", new feng3d.Vector3D(0.5, 1, 0, 0));
            _this.createBoolMacro("HAS_TERRAIN_METHOD", true);
            _this.createBoolMacro("USE_TERRAIN_MERGE", true);
            return _this;
        }
        Object.defineProperty(TerrainMergeMethod.prototype, "splatMergeTexture", {
            get: function () {
                return this._splatMergeTexture;
            },
            set: function (value) {
                this._splatMergeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMergeMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMergeMethod = TerrainMergeMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画状态基类
     * @author feng 2015-9-18
     */
    var AnimationStateBase = (function () {
        /**
         * 创建动画状态基类
         * @param animator				动画
         * @param animationNode			动画节点
         */
        function AnimationStateBase(animator, animationNode) {
            this._rootDelta = new feng3d.Vector3D();
            this._positionDeltaDirty = true;
            this._time = 0;
            this._startTime = 0;
            this._animator = animator;
            this._animationNode = animationNode;
        }
        Object.defineProperty(AnimationStateBase.prototype, "positionDelta", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._positionDeltaDirty)
                    this.updatePositionDelta();
                return this._rootDelta;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.offset = function (startTime) {
            this._startTime = startTime;
            this._positionDeltaDirty = true;
        };
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.update = function (time) {
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.phase = function (value) {
        };
        /**
         * 更新时间
         * @param time		当前时间
         */
        AnimationStateBase.prototype.updateTime = function (time) {
            this._time = time - this._startTime;
            this._positionDeltaDirty = true;
        };
        /**
         * 位置偏移
         */
        AnimationStateBase.prototype.updatePositionDelta = function () {
        };
        return AnimationStateBase;
    }());
    feng3d.AnimationStateBase = AnimationStateBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画剪辑状态
     * @author feng 2015-9-18
     */
    var AnimationClipState = (function (_super) {
        __extends(AnimationClipState, _super);
        /**
         * 创建一个帧动画状态
         * @param animator				动画
         * @param animationClipNode		帧动画节点
         */
        function AnimationClipState(animator, animationClipNode) {
            var _this = _super.call(this, animator, animationClipNode) || this;
            _this._currentFrame = 0;
            _this._framesDirty = true;
            _this._animationClipNode = animationClipNode;
            return _this;
        }
        Object.defineProperty(AnimationClipState.prototype, "blendWeight", {
            /**
             * 混合权重	(0[当前帧],1[下一帧])
             * @see #currentFrame
             * @see #nextFrame
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._blendWeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipState.prototype, "currentFrame", {
            /**
             * 当前帧
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._currentFrame;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipState.prototype, "nextFrame", {
            /**
             * 下一帧
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._nextFrame;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.update = function (time) {
            if (!this._animationClipNode.looping) {
                if (time > this._startTime + this._animationClipNode.totalDuration)
                    time = this._startTime + this._animationClipNode.totalDuration;
                else if (time < this._startTime)
                    time = this._startTime;
            }
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.phase = function (value) {
            var time = value * this._animationClipNode.totalDuration + this._startTime;
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.updateTime = function (time) {
            this._framesDirty = true;
            this._timeDir = (time - this._startTime > this._time) ? 1 : -1;
            _super.prototype.updateTime.call(this, time);
        };
        /**
         * 更新帧，计算当前帧、下一帧与混合权重
         *
         * @see #currentFrame
         * @see #nextFrame
         * @see #blendWeight
         */
        AnimationClipState.prototype.updateFrames = function () {
            this._framesDirty = false;
            var looping = this._animationClipNode.looping;
            var totalDuration = this._animationClipNode.totalDuration;
            var lastFrame = this._animationClipNode.lastFrame;
            var time = this._time;
            //trace("time", time, totalDuration)
            if (looping && (time >= totalDuration || time < 0)) {
                time %= totalDuration;
                if (time < 0)
                    time += totalDuration;
            }
            if (!looping && time >= totalDuration) {
                this.notifyPlaybackComplete();
                this._currentFrame = lastFrame;
                this._nextFrame = lastFrame;
                this._blendWeight = 0;
            }
            else if (!looping && time <= 0) {
                this._currentFrame = 0;
                this._nextFrame = 0;
                this._blendWeight = 0;
            }
            else if (this._animationClipNode.fixedFrameRate) {
                var t = time / totalDuration * lastFrame;
                this._currentFrame = ~~t;
                this._blendWeight = t - this._currentFrame;
                this._nextFrame = this._currentFrame + 1;
            }
            else {
                this._currentFrame = 0;
                this._nextFrame = 0;
                var dur = 0, frameTime;
                var durations = this._animationClipNode.durations;
                do {
                    frameTime = dur;
                    dur += durations[this.nextFrame];
                    this._currentFrame = this._nextFrame++;
                } while (time > dur);
                if (this._currentFrame == lastFrame) {
                    this._currentFrame = 0;
                    this._nextFrame = 1;
                }
                this._blendWeight = (time - frameTime) / durations[this._currentFrame];
            }
        };
        /**
         * 通知播放完成
         */
        AnimationClipState.prototype.notifyPlaybackComplete = function () {
            feng3d.Event.dispatch(this._animationClipNode, feng3d.AnimationStateEvent.PLAYBACK_COMPLETE, new feng3d.AnimationStateEvent(this._animator, this, this._animationClipNode));
        };
        return AnimationClipState;
    }(feng3d.AnimationStateBase));
    feng3d.AnimationClipState = AnimationClipState;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    var ParticleComponent = (function (_super) {
        __extends(ParticleComponent, _super);
        function ParticleComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 优先级
             */
            _this.priority = 0;
            return _this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleComponent.prototype.generateParticle = function (particle) {
        };
        ParticleComponent.prototype.setRenderState = function (particleAnimator) {
        };
        return ParticleComponent;
    }(feng3d.RenderDataHolder));
    feng3d.ParticleComponent = ParticleComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    var ParticleEmission = (function (_super) {
        __extends(ParticleEmission, _super);
        function ParticleEmission() {
            var _this = _super.call(this) || this;
            /**
             * 发射率，每秒发射粒子数量
             */
            _this.rate = 10;
            /**
             * 爆发，在time时刻额外喷射particles粒子
             */
            _this.bursts = [];
            _this.isDirty = true;
            _this.priority = Number.MAX_VALUE;
            return _this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleEmission.prototype.generateParticle = function (particle) {
            if (this._numParticles != particle.total)
                this.isDirty = true;
            this._numParticles = particle.total;
            particle.birthTime = this.getBirthTimeArray(particle.total)[particle.index];
        };
        /**
         * 获取出生时间数组
         */
        ParticleEmission.prototype.getBirthTimeArray = function (numParticles) {
            if (this.isDirty) {
                this.isDirty = false;
                var birthTimes = [];
                var bursts = this.bursts.concat();
                //按时间降序排列
                bursts.sort(function (a, b) { return b.time - a.time; });
                var index = 0;
                var time = 0; //以秒为单位
                var i = 0;
                var timeStep = 1 / this.rate;
                while (index < numParticles) {
                    while (bursts.length > 0 && bursts[bursts.length - 1].time <= time) {
                        var burst = bursts.pop();
                        for (i = 0; i < burst.particles; i++) {
                            birthTimes[index++] = burst.time;
                        }
                    }
                    birthTimes[index++] = time;
                    time += timeStep;
                }
                this._birthTimes = birthTimes;
            }
            return this._birthTimes;
        };
        return ParticleEmission;
    }(feng3d.ParticleComponent));
    feng3d.ParticleEmission = ParticleEmission;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    var ParticlePosition = (function (_super) {
        __extends(ParticlePosition, _super);
        function ParticlePosition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticlePosition.prototype.generateParticle = function (particle) {
            var baseRange = 100;
            var x = (Math.random() - 0.5) * baseRange;
            var y = (Math.random() - 0.5) * baseRange;
            var z = (Math.random() - 0.5) * baseRange;
            particle.position = new feng3d.Vector3D(x, y, z);
            particle.position = new feng3d.Vector3D();
        };
        return ParticlePosition;
    }(feng3d.ParticleComponent));
    feng3d.ParticlePosition = ParticlePosition;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    var ParticleVelocity = (function (_super) {
        __extends(ParticleVelocity, _super);
        function ParticleVelocity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleVelocity.prototype.generateParticle = function (particle) {
            var baseVelocity = 100;
            var x = (Math.random() - 0.5) * baseVelocity;
            var y = baseVelocity;
            var z = (Math.random() - 0.5) * baseVelocity;
            particle.velocity = new feng3d.Vector3D(x, y, z);
        };
        return ParticleVelocity;
    }(feng3d.ParticleComponent));
    feng3d.ParticleVelocity = ParticleVelocity;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    var ParticleColor = (function (_super) {
        __extends(ParticleColor, _super);
        function ParticleColor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleColor.prototype.generateParticle = function (particle) {
            particle.color = new feng3d.Color(1, 0, 0, 1).mix(new feng3d.Color(0, 1, 0, 1), particle.index / particle.total);
        };
        return ParticleColor;
    }(feng3d.ParticleComponent));
    feng3d.ParticleColor = ParticleColor;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ParticleBillboard = (function (_super) {
        __extends(ParticleBillboard, _super);
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        function ParticleBillboard(camera, billboardAxis) {
            if (billboardAxis === void 0) { billboardAxis = null; }
            var _this = _super.call(this) || this;
            _this._matrix = new feng3d.Matrix3D;
            _this.billboardAxis = billboardAxis;
            _this._camera = camera;
            return _this;
        }
        ParticleBillboard.prototype.setRenderState = function (particleAnimator) {
            var gameObject = particleAnimator.gameObject;
            var comps;
            if (this._billboardAxis) {
                var pos = gameObject.transform.localToWorldMatrix.position;
                var look = this._camera.sceneTransform.position.subtract(pos);
                var right = look.crossProduct(this._billboardAxis);
                right.normalize();
                look = this._billboardAxis.crossProduct(right);
                look.normalize();
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                this._matrix.copyColumnFrom(0, right);
                this._matrix.copyColumnFrom(1, this._billboardAxis);
                this._matrix.copyColumnFrom(2, look);
                this._matrix.copyColumnFrom(3, pos);
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            else {
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                this._matrix.append(this._camera.inverseSceneTransform);
                //decompose using axis angle rotations
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                //recreate the matrix with just the rotation data
                this._matrix.identity();
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            particleAnimator.animatorSet.setGlobal("billboardMatrix", this._matrix);
        };
        Object.defineProperty(ParticleBillboard.prototype, "billboardAxis", {
            /**
             * 广告牌轴线
             */
            get: function () {
                return this._billboardAxis;
            },
            set: function (value) {
                this._billboardAxis = value ? value.clone() : null;
                if (this._billboardAxis)
                    this._billboardAxis.normalize();
            },
            enumerable: true,
            configurable: true
        });
        return ParticleBillboard;
    }(feng3d.ParticleComponent));
    feng3d.ParticleBillboard = ParticleBillboard;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ParticleAnimationSet = (function (_super) {
        __extends(ParticleAnimationSet, _super);
        function ParticleAnimationSet() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._animations = [];
            /**
             * 生成粒子函数列表，优先级越高先执行
             */
            _this.generateFunctions = [];
            _this.particleGlobal = {};
            /**
             * 粒子数量
             */
            _this.numParticles = 1000;
            _this._isDirty = true;
            _this.createInstanceCount(function () { return _this.numParticles; });
            return _this;
        }
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        ParticleAnimationSet.prototype.setGlobal = function (property, value) {
            this.particleGlobal[property] = value;
            this.createUniformData(("u_particle_" + property), value);
            this.createBoolMacro(("D_u_particle_" + property), true);
        };
        ParticleAnimationSet.prototype.addAnimation = function (animation) {
            if (this._animations.indexOf(animation) == -1)
                this._animations.push(animation);
        };
        ParticleAnimationSet.prototype.update = function (particleAnimator) {
            if (this._isDirty) {
                this.generateParticles();
                this._isDirty = false;
            }
            this._animations.forEach(function (element) {
                element.setRenderState(particleAnimator);
            });
        };
        /**
         * 生成粒子
         */
        ParticleAnimationSet.prototype.generateParticles = function () {
            var generateFunctions = this.generateFunctions.concat();
            var components = this._animations;
            components.forEach(function (element) {
                generateFunctions.push({ generate: element.generateParticle.bind(element), priority: element.priority });
            });
            //按优先级排序，优先级越高先执行
            generateFunctions.sort(function (a, b) { return b.priority - a.priority; });
            //
            for (var i = 0; i < this.numParticles; i++) {
                var particle = {};
                particle.index = i;
                particle.total = this.numParticles;
                generateFunctions.forEach(function (element) {
                    element.generate(particle);
                });
                this.collectionParticle(particle);
            }
            //更新宏定义
            for (var attribute in this._attributes) {
                this.createBoolMacro(("D_" + attribute), true);
            }
        };
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        ParticleAnimationSet.prototype.collectionParticle = function (particle) {
            for (var attribute in particle) {
                this.collectionParticleAttribute(attribute, particle);
            }
        };
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        ParticleAnimationSet.prototype.collectionParticleAttribute = function (attribute, particle) {
            var attributeID = "a_particle_" + attribute;
            var data = particle[attribute];
            var index = particle.index;
            var numParticles = particle.total;
            //
            var attributeRenderData = this._attributes[attributeID];
            var vector3DData;
            if (typeof data == "number") {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles), 1, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            }
            else if (data instanceof feng3d.Vector3D) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 3), 3, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            }
            else if (data instanceof feng3d.Color) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 4), 4, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 3] = data.a;
            }
            else {
                throw new Error("\u65E0\u6CD5\u5904\u7406" + feng3d.ClassUtils.getQualifiedClassName(data) + "\u7C92\u5B50\u5C5E\u6027");
            }
        };
        return ParticleAnimationSet;
    }(feng3d.RenderDataHolder));
    feng3d.ParticleAnimationSet = ParticleAnimationSet;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    var ParticleAnimator = (function (_super) {
        __extends(ParticleAnimator, _super);
        function ParticleAnimator(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /**
             * 粒子时间
             */
            _this.time = 0;
            /**
             * 起始时间
             */
            _this.startTime = 0;
            /**
             * 播放速度
             */
            _this.playbackSpeed = 1;
            /**
             * 周期
             */
            _this.cycle = 10000;
            _this._single = true;
            _this._updateEverytime = true;
            //
            _this.createUniformData("u_particleTime", function () { return _this.time; });
            //
            _this.createBoolMacro("HAS_PARTICLE_ANIMATOR", function () { return _this.isPlaying = true; });
            return _this;
        }
        Object.defineProperty(ParticleAnimator.prototype, "animatorSet", {
            get: function () {
                return this._animatorSet;
            },
            set: function (value) {
                if (this._animatorSet == value)
                    return;
                if (this._animatorSet)
                    this.removeRenderDataHolder(this._animatorSet);
                this._animatorSet = value;
                if (this._animatorSet)
                    this.addRenderDataHolder(this._animatorSet);
            },
            enumerable: true,
            configurable: true
        });
        ParticleAnimator.prototype.play = function () {
            if (this.isPlaying)
                return;
            if (!this.animatorSet) {
                return;
            }
            this.startTime = Date.now();
            this.isPlaying = true;
            feng3d.Event.on(feng3d.ticker, "enterFrame", this.update, this);
        };
        ParticleAnimator.prototype.update = function () {
            this.time = ((Date.now() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        };
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        ParticleAnimator.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            this.animatorSet.collectRenderDataHolder(renderAtomic);
            _super.prototype.collectRenderDataHolder.call(this, renderAtomic);
        };
        return ParticleAnimator;
    }(feng3d.Component));
    feng3d.ParticleAnimator = ParticleAnimator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    var AnimationStateEvent = (function () {
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        function AnimationStateEvent(animator, animationState, animationNode) {
            this.animator = animator;
            this.animationState = animationState;
            this.animationNode = animationNode;
        }
        return AnimationStateEvent;
    }());
    /**
     * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
     */
    AnimationStateEvent.PLAYBACK_COMPLETE = "playbackComplete";
    AnimationStateEvent.TRANSITION_COMPLETE = "transitionComplete";
    feng3d.AnimationStateEvent = AnimationStateEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画事件
     * @author feng 2014-5-27
     */
    var AnimatorEvent = (function () {
        function AnimatorEvent() {
        }
        return AnimatorEvent;
    }());
    /** 开始播放动画 */
    AnimatorEvent.START = "start";
    /** 继续播放动画 */
    AnimatorEvent.PLAY = "play";
    /** 停止播放动画 */
    AnimatorEvent.STOP = "stop";
    feng3d.AnimatorEvent = AnimatorEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    var AnimationNodeBase = (function () {
        function AnimationNodeBase() {
        }
        Object.defineProperty(AnimationNodeBase.prototype, "stateClass", {
            /**
             * 状态类
             */
            get: function () {
                return this._stateClass;
            },
            enumerable: true,
            configurable: true
        });
        return AnimationNodeBase;
    }());
    feng3d.AnimationNodeBase = AnimationNodeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    var AnimatorBase = (function (_super) {
        __extends(AnimatorBase, _super);
        /**
         * 创建一个动画基类
         */
        function AnimatorBase(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this._autoUpdate = true;
            _this._time = 0;
            /** 播放速度 */
            _this._playbackSpeed = 1;
            /** 当前动画时间 */
            _this._absoluteTime = 0;
            _this._animationStates = {};
            /**
             * 是否更新位置
             */
            _this.updatePosition = true;
            return _this;
        }
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        AnimatorBase.prototype.getAnimationState = function (node) {
            var cls = node.stateClass;
            var className = feng3d.ClassUtils.getQualifiedClassName(cls);
            if (this._animationStates[className] == null)
                this._animationStates[className] = new cls(this, node);
            return this._animationStates[className];
        };
        Object.defineProperty(AnimatorBase.prototype, "time", {
            /**
             * 动画时间
             */
            get: function () {
                return this._time;
            },
            set: function (value) {
                if (this._time == value)
                    return;
                this.update(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimatorBase.prototype, "playbackSpeed", {
            /**
             * 播放速度
             * <p>默认为1，表示正常速度</p>
             */
            get: function () {
                return this._playbackSpeed;
            },
            set: function (value) {
                this._playbackSpeed = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 开始动画，当自动更新为true时有效
         */
        AnimatorBase.prototype.start = function () {
            if (this._isPlaying || !this._autoUpdate)
                return;
            this._time = this._absoluteTime = Date.now();
            this._isPlaying = true;
            feng3d.Event.on(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
            if (!feng3d.Event.has(this, feng3d.AnimatorEvent.START))
                return;
            feng3d.Event.dispatch(this, feng3d.AnimatorEvent.START, this);
        };
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        AnimatorBase.prototype.stop = function () {
            if (!this._isPlaying)
                return;
            this._isPlaying = false;
            if (feng3d.Event.has(feng3d.ticker, "enterFrame"))
                feng3d.Event.off(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
            if (!feng3d.Event.has(this, feng3d.AnimatorEvent.STOP))
                return;
            feng3d.Event.dispatch(this, feng3d.AnimatorEvent.STOP, this);
        };
        /**
         * 更新动画
         * @param time			动画时间
         */
        AnimatorBase.prototype.update = function (time) {
            var dt = (time - this._time) * this.playbackSpeed;
            this.updateDeltaTime(dt);
            this._time = time;
        };
        /**
         * 更新偏移时间
         * @private
         */
        AnimatorBase.prototype.updateDeltaTime = function (dt) {
            this._absoluteTime += dt;
            this._activeState.update(this._absoluteTime);
            if (this.updatePosition)
                this.applyPositionDelta();
        };
        /**
         * 自动更新动画时帧更新事件
         */
        AnimatorBase.prototype.onEnterFrame = function (event) {
            if (event === void 0) { event = null; }
            this.update(Date.now());
        };
        /**
         * 应用位置偏移量
         */
        AnimatorBase.prototype.applyPositionDelta = function () {
            var delta = this._activeState.positionDelta;
            var dist = delta.length;
            var len;
            if (dist > 0) {
            }
        };
        return AnimatorBase;
    }(feng3d.Component));
    feng3d.AnimatorBase = AnimatorBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画播放器
     * @author feng 2017-01-04
     */
    var AnimationPlayer = (function () {
        function AnimationPlayer() {
            this._time = 0;
            this.preTime = 0;
            this._isPlaying = false;
            /**
             * 播放速度
             */
            this.playbackSpeed = 1;
        }
        Object.defineProperty(AnimationPlayer.prototype, "time", {
            /**
             * 动画时间
             */
            get: function () {
                return this._time;
            },
            set: function (value) {
                this._time = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 开始
         */
        AnimationPlayer.prototype.start = function () {
            this.time = 0;
            this.continue();
        };
        /**
         * 停止
         */
        AnimationPlayer.prototype.stop = function () {
            this.pause();
        };
        /**
         * 继续
         */
        AnimationPlayer.prototype.continue = function () {
            this._isPlaying;
            this.preTime = Date.now();
            feng3d.Event.on(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
        };
        /**
         * 暂停
         */
        AnimationPlayer.prototype.pause = function () {
            feng3d.Event.off(feng3d.ticker, "enterFrame", this.onEnterFrame, this);
        };
        /**
         * 自动更新动画时帧更新事件
         */
        AnimationPlayer.prototype.onEnterFrame = function (event) {
            var currentTime = Date.now();
            this.time = this.time + (currentTime - this.preTime) * this.playbackSpeed;
            this.preTime = currentTime;
        };
        return AnimationPlayer;
    }());
    feng3d.AnimationPlayer = AnimationPlayer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 帧动画播放器
     * @author feng 2017-01-04
     */
    var AnimationClipPlayer = (function (_super) {
        __extends(AnimationClipPlayer, _super);
        function AnimationClipPlayer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return AnimationClipPlayer;
    }(feng3d.AnimationPlayer));
    feng3d.AnimationClipPlayer = AnimationClipPlayer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼关节数据
     * @author feng 2014-5-20
     */
    var SkeletonJoint = (function () {
        function SkeletonJoint() {
            /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
            this.parentIndex = -1;
        }
        Object.defineProperty(SkeletonJoint.prototype, "matrix3D", {
            get: function () {
                if (!this._matrix3D) {
                    this._matrix3D = this.orientation.toMatrix3D();
                    this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
                }
                return this._matrix3D;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonJoint.prototype, "invertMatrix3D", {
            get: function () {
                if (!this._invertMatrix3D) {
                    this._invertMatrix3D = this.matrix3D.clone();
                    this._invertMatrix3D.invert();
                }
                return this._invertMatrix3D;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonJoint.prototype, "inverseBindPose", {
            get: function () {
                return this.invertMatrix3D.rawData;
            },
            enumerable: true,
            configurable: true
        });
        SkeletonJoint.prototype.invalid = function () {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        };
        return SkeletonJoint;
    }());
    feng3d.SkeletonJoint = SkeletonJoint;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    var Skeleton = (function () {
        function Skeleton() {
            this.joints = [];
        }
        Object.defineProperty(Skeleton.prototype, "numJoints", {
            get: function () {
                return this.joints.length;
            },
            enumerable: true,
            configurable: true
        });
        return Skeleton;
    }());
    feng3d.Skeleton = Skeleton;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 关节pose
     * @author feng 2014-5-20
     */
    var JointPose = (function () {
        function JointPose() {
            /** 旋转信息 */
            this.orientation = new feng3d.Quaternion();
            /** 位移信息 */
            this.translation = new feng3d.Vector3D();
        }
        Object.defineProperty(JointPose.prototype, "matrix3D", {
            get: function () {
                if (!this._matrix3D) {
                    this._matrix3D = this.orientation.toMatrix3D();
                    this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
                }
                return this._matrix3D;
            },
            set: function (value) {
                this._matrix3D = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JointPose.prototype, "invertMatrix3D", {
            get: function () {
                if (!this._invertMatrix3D) {
                    this._invertMatrix3D = this.matrix3D.clone();
                    this._invertMatrix3D.invert();
                }
                return this._invertMatrix3D;
            },
            enumerable: true,
            configurable: true
        });
        JointPose.prototype.invalid = function () {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        };
        return JointPose;
    }());
    feng3d.JointPose = JointPose;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼pose
     * @author feng 2014-5-20
     */
    var SkeletonPose = (function () {
        function SkeletonPose() {
            this.jointPoses = [];
        }
        Object.defineProperty(SkeletonPose.prototype, "numJointPoses", {
            get: function () {
                return this.jointPoses.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonPose.prototype, "globalMatrix3Ds", {
            get: function () {
                if (!this._globalMatrix3Ds) {
                    var matrix3Ds = this._globalMatrix3Ds = [];
                    for (var i = 0; i < this.jointPoses.length; i++) {
                        var jointPose = this.jointPoses[i];
                        matrix3Ds[i] = jointPose.matrix3D.clone();
                        if (jointPose.parentIndex >= 0) {
                            matrix3Ds[i].append(matrix3Ds[jointPose.parentIndex]);
                        }
                    }
                }
                return this._globalMatrix3Ds;
            },
            enumerable: true,
            configurable: true
        });
        SkeletonPose.prototype.invalid = function () {
            this._globalMatrix3Ds = null;
        };
        return SkeletonPose;
    }());
    feng3d.SkeletonPose = SkeletonPose;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    var AnimationClipNodeBase = (function (_super) {
        __extends(AnimationClipNodeBase, _super);
        function AnimationClipNodeBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._looping = true;
            _this._totalDuration = 0;
            _this._stitchDirty = true;
            _this._stitchFinalFrame = false;
            _this._numFrames = 0;
            _this._durations = [];
            _this._totalDelta = new feng3d.Vector3D();
            /** 是否稳定帧率 */
            _this.fixedFrameRate = true;
            return _this;
        }
        Object.defineProperty(AnimationClipNodeBase.prototype, "durations", {
            /**
             * 持续时间列表（ms）
             */
            get: function () {
                return this._durations;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "totalDelta", {
            /**
             * 总坐标偏移量
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._totalDelta;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "looping", {
            /**
             * 是否循环播放
             */
            get: function () {
                return this._looping;
            },
            set: function (value) {
                if (this._looping == value)
                    return;
                this._looping = value;
                this._stitchDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "stitchFinalFrame", {
            /**
             * 是否过渡结束帧
             */
            get: function () {
                return this._stitchFinalFrame;
            },
            set: function (value) {
                if (this._stitchFinalFrame == value)
                    return;
                this._stitchFinalFrame = value;
                this._stitchDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "totalDuration", {
            /**
             * 总持续时间
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._totalDuration;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "lastFrame", {
            /**
             * 最后帧数
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._lastFrame;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新动画播放控制状态
         */
        AnimationClipNodeBase.prototype.updateStitch = function () {
            this._stitchDirty = false;
            this._lastFrame = (this._looping && this._stitchFinalFrame) ? this._numFrames : this._numFrames - 1;
            this._totalDuration = 0;
            this._totalDelta.x = 0;
            this._totalDelta.y = 0;
            this._totalDelta.z = 0;
        };
        return AnimationClipNodeBase;
    }(feng3d.AnimationNodeBase));
    feng3d.AnimationClipNodeBase = AnimationClipNodeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼动画节点（一般用于一个动画的帧列表）
     * 包含基于时间的动画数据作为单独的骨架构成。
     * @author feng 2014-5-20
     */
    var SkeletonClipNode = (function (_super) {
        __extends(SkeletonClipNode, _super);
        /**
         * 创建骨骼动画节点
         */
        function SkeletonClipNode() {
            var _this = _super.call(this) || this;
            _this._frames = [];
            _this._stateClass = feng3d.SkeletonClipState;
            return _this;
        }
        Object.defineProperty(SkeletonClipNode.prototype, "frames", {
            /**
             * 骨骼姿势动画帧列表
             */
            get: function () {
                return this._frames;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加帧到动画
         * @param skeletonPose 骨骼姿势
         * @param duration 持续时间
         */
        SkeletonClipNode.prototype.addFrame = function (skeletonPose, duration) {
            this._frames.push(skeletonPose);
            this._durations.push(duration);
            this._totalDuration += duration;
            this._numFrames = this._durations.length;
            this._stitchDirty = true;
        };
        /**
         * @inheritDoc
         */
        SkeletonClipNode.prototype.updateStitch = function () {
            _super.prototype.updateStitch.call(this);
            var i = this._numFrames - 1;
            var p1, p2, delta;
            while (i--) {
                this._totalDuration += this._durations[i];
                p1 = this._frames[i].jointPoses[0].translation;
                p2 = this._frames[i + 1].jointPoses[0].translation;
                delta = p2.subtract(p1);
                this._totalDelta.x += delta.x;
                this._totalDelta.y += delta.y;
                this._totalDelta.z += delta.z;
            }
            if (this._stitchFinalFrame && this._looping) {
                this._totalDuration += this._durations[this._numFrames - 1];
                if (this._numFrames > 1) {
                    p1 = this._frames[0].jointPoses[0].translation;
                    p2 = this._frames[1].jointPoses[0].translation;
                    delta = p2.subtract(p1);
                    this._totalDelta.x += delta.x;
                    this._totalDelta.y += delta.y;
                    this._totalDelta.z += delta.z;
                }
            }
        };
        return SkeletonClipNode;
    }(feng3d.AnimationClipNodeBase));
    feng3d.SkeletonClipNode = SkeletonClipNode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼剪辑状态
     * @author feng 2015-9-18
     */
    var SkeletonClipState = (function (_super) {
        __extends(SkeletonClipState, _super);
        /**
         * 创建骨骼剪辑状态实例
         * @param animator				动画
         * @param skeletonClipNode		骨骼剪辑节点
         */
        function SkeletonClipState(animator, skeletonClipNode) {
            var _this = _super.call(this, animator, skeletonClipNode) || this;
            _this._rootPos = new feng3d.Vector3D();
            _this._skeletonPose = new feng3d.SkeletonPose();
            _this._skeletonPoseDirty = true;
            _this._skeletonClipNode = skeletonClipNode;
            _this._frames = _this._skeletonClipNode.frames;
            return _this;
        }
        Object.defineProperty(SkeletonClipState.prototype, "currentPose", {
            /**
             * 当前骨骼姿势
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._currentPose;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonClipState.prototype, "nextPose", {
            /**
             * 下个姿势
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._nextPose;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.getSkeletonPose = function () {
            if (this._skeletonPoseDirty)
                this.updateSkeletonPose();
            return this._skeletonPose;
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updateTime = function (time) {
            this._skeletonPoseDirty = true;
            _super.prototype.updateTime.call(this, time);
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updateFrames = function () {
            _super.prototype.updateFrames.call(this);
            this._currentPose = this._frames[this._currentFrame];
            if (this._skeletonClipNode.looping && this._nextFrame >= this._skeletonClipNode.lastFrame) {
                this._nextPose = this._frames[0];
            }
            else
                this._nextPose = this._frames[this._nextFrame];
        };
        /**
         * 更新骨骼姿势
         * @param skeleton 骨骼
         */
        SkeletonClipState.prototype.updateSkeletonPose = function () {
            this._skeletonPoseDirty = false;
            if (!this._skeletonClipNode.totalDuration)
                return;
            if (this._framesDirty)
                this.updateFrames();
            var currentPose = this._currentPose.jointPoses;
            var nextPose = this._nextPose.jointPoses;
            var numJoints = this._currentPose.numJointPoses;
            var p1, p2;
            var pose1, pose2;
            var showPoses = this._skeletonPose.jointPoses;
            var showPose;
            var tr;
            for (var i = 0; i < numJoints; ++i) {
                pose1 = currentPose[i];
                pose2 = nextPose[i];
                //
                showPose = showPoses[i];
                if (showPose == null) {
                    showPose = showPoses[i] = new feng3d.JointPose();
                    showPose.name = pose1.name;
                    showPose.parentIndex = pose1.parentIndex;
                }
                p1 = pose1.translation;
                p2 = pose2.translation;
                //根据前后两个关节姿势计算出当前显示关节姿势
                showPose.orientation.lerp(pose1.orientation, pose2.orientation, this._blendWeight);
                //计算显示的关节位置
                if (i > 0) {
                    tr = showPose.translation;
                    tr.x = p1.x + this._blendWeight * (p2.x - p1.x);
                    tr.y = p1.y + this._blendWeight * (p2.y - p1.y);
                    tr.z = p1.z + this._blendWeight * (p2.z - p1.z);
                }
                showPose.invalid();
            }
            this._skeletonPose.invalid();
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updatePositionDelta = function () {
            this._positionDeltaDirty = false;
            if (this._framesDirty)
                this.updateFrames();
            var p1, p2, p3;
            var totalDelta = this._skeletonClipNode.totalDelta;
            //跳过最后，重置位置
            if ((this._timeDir > 0 && this._nextFrame < this._oldFrame) || (this._timeDir < 0 && this._nextFrame > this._oldFrame)) {
                this._rootPos.x -= totalDelta.x * this._timeDir;
                this._rootPos.y -= totalDelta.y * this._timeDir;
                this._rootPos.z -= totalDelta.z * this._timeDir;
            }
            /** 保存骨骼根节点原位置 */
            var dx = this._rootPos.x;
            var dy = this._rootPos.y;
            var dz = this._rootPos.z;
            //计算骨骼根节点位置
            if (this._skeletonClipNode.stitchFinalFrame && this._nextFrame == this._skeletonClipNode.lastFrame) {
                p1 = this._frames[0].jointPoses[0].translation;
                p2 = this._frames[1].jointPoses[0].translation;
                p3 = this._currentPose.jointPoses[0].translation;
                this._rootPos.x = p3.x + p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p3.y + p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p3.z + p1.z + this._blendWeight * (p2.z - p1.z);
            }
            else {
                p1 = this._currentPose.jointPoses[0].translation;
                p2 = this._frames[this._nextFrame].jointPoses[0].translation; //cover the instances where we wrap the pose but still want the final frame translation values
                this._rootPos.x = p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p1.z + this._blendWeight * (p2.z - p1.z);
            }
            //计算骨骼根节点偏移量
            this._rootDelta.x = this._rootPos.x - dx;
            this._rootDelta.y = this._rootPos.y - dy;
            this._rootDelta.z = this._rootPos.z - dz;
            //保存旧帧编号
            this._oldFrame = this._nextFrame;
        };
        return SkeletonClipState;
    }(feng3d.AnimationClipState));
    feng3d.SkeletonClipState = SkeletonClipState;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var SkeletonAnimationSet = (function () {
        function SkeletonAnimationSet() {
        }
        return SkeletonAnimationSet;
    }());
    feng3d.SkeletonAnimationSet = SkeletonAnimationSet;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼动画
     * @author feng 2014-5-27
     */
    var SkeletonAnimator = (function (_super) {
        __extends(SkeletonAnimator, _super);
        /**
         * 创建一个骨骼动画类
         */
        function SkeletonAnimator(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            /** 动画节点列表 */
            _this.animations = [];
            _this._globalMatrices = [];
            _this._globalPropertiesDirty = true;
            //
            _this.createUniformData("u_skeletonGlobalMatriices", function () { return _this.globalMatrices; });
            _this.createValueMacro("NUM_SKELETONJOINT", function () { return _this._skeleton.numJoints; });
            _this.createBoolMacro("HAS_SKELETON_ANIMATION", function () { return !!_this._activeSkeletonState; });
            return _this;
        }
        Object.defineProperty(SkeletonAnimator.prototype, "skeleton", {
            /**
             * 骨骼
             */
            get: function () {
                return this._skeleton;
            },
            set: function (value) {
                if (this._skeleton == value)
                    return;
                this._skeleton = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonAnimator.prototype, "globalMatrices", {
            /**
             * 当前骨骼姿势的全局矩阵
             * @see #globalPose
             */
            get: function () {
                if (this._globalPropertiesDirty)
                    this.updateGlobalProperties();
                return this._globalMatrices;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 播放动画
         * @param name 动作名称
         */
        SkeletonAnimator.prototype.play = function () {
            if (!this._activeNode)
                this._activeNode = this.animations[0];
            this._activeState = this.getAnimationState(this._activeNode);
            if (this.updatePosition) {
                //this.update straight away to this.reset position deltas
                this._activeState.update(this._absoluteTime);
                this._activeState.positionDelta;
            }
            this._activeSkeletonState = this._activeState;
            this.start();
        };
        /**
         * @inheritDoc
         */
        SkeletonAnimator.prototype.updateDeltaTime = function (dt) {
            _super.prototype.updateDeltaTime.call(this, dt);
            this._globalPropertiesDirty = true;
        };
        /**
         * 更新骨骼全局变换矩阵
         */
        SkeletonAnimator.prototype.updateGlobalProperties = function () {
            if (!this._activeSkeletonState)
                return;
            this._globalPropertiesDirty = false;
            //获取全局骨骼姿势
            var currentSkeletonPose = this._activeSkeletonState.getSkeletonPose();
            var globalMatrix3Ds = currentSkeletonPose.globalMatrix3Ds;
            //姿势变换矩阵
            var joints = this._skeleton.joints;
            //遍历每个关节
            for (var i = 0; i < this._skeleton.numJoints; ++i) {
                var inverseMatrix3D = joints[i].invertMatrix3D;
                var matrix3D = globalMatrix3Ds[i].clone();
                matrix3D.prepend(inverseMatrix3D);
                this._globalMatrices[i] = matrix3D;
            }
        };
        return SkeletonAnimator;
    }(feng3d.AnimatorBase));
    feng3d.SkeletonAnimator = SkeletonAnimator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型解析器
     * @author feng 2017-01-13
     */
    var OBJParser = (function () {
        function OBJParser() {
        }
        OBJParser.parser = function (context) {
            var objData = { mtl: null, objs: [] };
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, objData);
            } while (line);
            currentObj = null;
            currentSubObj = null;
            return objData;
        };
        return OBJParser;
    }());
    feng3d.OBJParser = OBJParser;
    /** mtl正则 */
    var mtlReg = /mtllib\s+([\w.]+)/;
    /** 对象名称正则 */
    var objReg = /o\s+([\w]+)/;
    /** 顶点坐标正则 */
    var vertexReg = /v\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点法线正则 */
    var vnReg = /vn\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点uv正则 */
    var vtReg = /vt\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 使用材质正则 */
    var usemtlReg = /usemtl\s+([\w.]+)/;
    /** 面正则 vertex */
    var faceVReg = /f\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    /** 面正则 vertex/uv/normal */
    var faceVUNReg = /f\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))/;
    var gReg = /g\s+(\w+)/;
    var sReg = /s\s+(\w+)/;
    //
    var currentObj;
    var currentSubObj;
    function parserLine(line, objData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;
        var result;
        if ((result = mtlReg.exec(line)) && result[0] == line) {
            objData.mtl = result[1];
        }
        else if ((result = objReg.exec(line)) && result[0] == line) {
            currentObj = { name: result[1], vertex: [], subObjs: [], vn: [], vt: [] };
            objData.objs.push(currentObj);
        }
        else if ((result = vertexReg.exec(line)) && result[0] == line) {
            if (currentObj == null) {
                currentObj = { name: "", vertex: [], subObjs: [], vn: [], vt: [] };
                objData.objs.push(currentObj);
            }
            currentObj.vertex.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        }
        else if ((result = vnReg.exec(line)) && result[0] == line) {
            currentObj.vn.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        }
        else if ((result = vtReg.exec(line)) && result[0] == line) {
            currentObj.vt.push({ u: parseFloat(result[1]), v: 1 - parseFloat(result[2]), s: parseFloat(result[3]) });
        }
        else if ((result = gReg.exec(line)) && result[0] == line) {
            if (currentSubObj == null) {
                currentSubObj = { faces: [] };
                currentObj.subObjs.push(currentSubObj);
            }
            currentSubObj.g = result[1];
        }
        else if ((result = sReg.exec(line)) && result[0] == line) {
        }
        else if ((result = usemtlReg.exec(line)) && result[0] == line) {
            currentSubObj = { faces: [] };
            currentObj.subObjs.push(currentSubObj);
            currentSubObj.material = result[1];
        }
        else if ((result = faceVReg.exec(line)) && result[0] == line) {
            currentSubObj.faces.push({
                indexIds: [result[1], result[2], result[3], result[3]],
                vertexIndices: [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4])]
            });
        }
        else if ((result = faceVUNReg.exec(line)) && result[0] == line) {
            currentSubObj.faces.push({
                indexIds: [result[1], result[5], result[9]],
                vertexIndices: [parseInt(result[2]), parseInt(result[6]), parseInt(result[10])],
                uvIndices: [parseInt(result[3]), parseInt(result[7]), parseInt(result[11])],
                normalIndices: [parseInt(result[4]), parseInt(result[8]), parseInt(result[12])]
            });
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型Mtl解析器
     * @author feng 2017-01-13
     */
    var MtlParser = (function () {
        function MtlParser() {
        }
        MtlParser.parser = function (context) {
            var mtl = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, mtl);
            } while (line);
            return mtl;
        };
        return MtlParser;
    }());
    feng3d.MtlParser = MtlParser;
    var newmtlReg = /newmtl\s+([\w.]+)/;
    var kaReg = /Ka\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var kdReg = /Kd\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var ksReg = /Ks\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var nsReg = /Ns\s+([\d.]+)/;
    var niReg = /Ni\s+([\d.]+)/;
    var dReg = /d\s+([\d.]+)/;
    var illumReg = /illum\s+([\d]+)/;
    var currentMaterial;
    function parserLine(line, mtl) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;
        var result;
        if ((result = newmtlReg.exec(line)) && result[0] == line) {
            currentMaterial = { name: result[1], ka: [], kd: [], ks: [], ns: 0, ni: 0, d: 0, illum: 0 };
            mtl[currentMaterial.name] = currentMaterial;
        }
        else if ((result = kaReg.exec(line)) && result[0] == line) {
            currentMaterial.ka = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = kdReg.exec(line)) && result[0] == line) {
            currentMaterial.kd = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = ksReg.exec(line)) && result[0] == line) {
            currentMaterial.ks = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = nsReg.exec(line)) && result[0] == line) {
            currentMaterial.ns = parseFloat(result[1]);
        }
        else if ((result = niReg.exec(line)) && result[0] == line) {
            currentMaterial.ni = parseFloat(result[1]);
        }
        else if ((result = dReg.exec(line)) && result[0] == line) {
            currentMaterial.d = parseFloat(result[1]);
        }
        else if ((result = illumReg.exec(line)) && result[0] == line) {
            currentMaterial.illum = parseFloat(result[1]);
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var MD5MeshParser = (function () {
        function MD5MeshParser() {
        }
        MD5MeshParser.parse = function (context) {
            //
            var md5MeshData = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, md5MeshData);
            } while (line);
            return md5MeshData;
        };
        return MD5MeshParser;
    }());
    feng3d.MD5MeshParser = MD5MeshParser;
    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var numMeshesReg = /numMeshes\s+(\d+)/;
    var jointsStartReg = /joints\s+{/;
    var jointsReg = /"(\w+)"\s+([-\d]+)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)(\s+\/\/(\s+\w+)?)?/;
    var endBlockReg = /}/;
    var meshStartReg = /mesh\s+{/;
    var annotationReg = /\/\/[\s\w:]+/;
    var shaderReg = /shader\s+"([\w\/]+)"/;
    var numvertsReg = /numverts\s+(\d+)/;
    var vertReg = /vert\s+(\d+)\s+\(\s+([\d.]+)\s+([\d.]+)\s+\)\s+(\d+)\s+(\d+)/;
    var numtrisReg = /numtris\s+(\d+)/;
    var triReg = /tri\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    var numweightsReg = /numweights\s+(\d+)/;
    var weightReg = /weight\s+(\d+)\s+(\d+)\s+([\d.]+)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)/;
    /**
     * 状态
     */
    var State;
    (function (State) {
        /** 读取关节 */
        State[State["joints"] = 0] = "joints";
        State[State["mesh"] = 1] = "mesh";
    })(State || (State = {}));
    /** 当前处于状态 */
    var states = [];
    var currentMesh;
    function parserLine(line, md5MeshData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        var result;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line) {
            md5MeshData.MD5Version = parseInt(result[1]);
        }
        else if ((result = commandlineReg.exec(line)) && result[0] == line) {
            md5MeshData.commandline = result[1];
        }
        else if ((result = numJointsReg.exec(line)) && result[0] == line) {
            md5MeshData.numJoints = parseInt(result[1]);
        }
        else if ((result = numMeshesReg.exec(line)) && result[0] == line) {
            md5MeshData.numMeshes = parseInt(result[1]);
        }
        else if ((result = jointsStartReg.exec(line)) && result[0] == line) {
            states.push(State.joints);
            md5MeshData.joints = [];
        }
        else if ((result = jointsReg.exec(line)) && result[0] == line) {
            md5MeshData.joints.push({
                name: result[1], parentIndex: parseInt(result[2]),
                position: [parseFloat(result[3]), parseFloat(result[4]), parseFloat(result[5])],
                rotation: [parseFloat(result[6]), parseFloat(result[7]), parseFloat(result[8])]
            });
        }
        else if ((result = endBlockReg.exec(line)) && result[0] == line) {
            var exitState = states.pop();
            if (exitState == State.mesh) {
                currentMesh = null;
            }
        }
        else if ((result = meshStartReg.exec(line)) && result[0] == line) {
            states.push(State.mesh);
            if (!md5MeshData.meshs) {
                md5MeshData.meshs = [];
            }
            currentMesh = {};
            md5MeshData.meshs.push(currentMesh);
        }
        else if ((result = annotationReg.exec(line)) && result[0] == line) {
        }
        else if ((result = shaderReg.exec(line)) && result[0] == line) {
            currentMesh.shader = result[1];
        }
        else if ((result = numvertsReg.exec(line)) && result[0] == line) {
            currentMesh.numverts = parseInt(result[1]);
            currentMesh.verts = [];
        }
        else if ((result = vertReg.exec(line)) && result[0] == line) {
            currentMesh.verts.push({
                index: parseFloat(result[1]), u: parseFloat(result[2]), v: parseFloat(result[3]),
                startWeight: parseFloat(result[4]), countWeight: parseFloat(result[5])
            });
        }
        else if ((result = numtrisReg.exec(line)) && result[0] == line) {
            currentMesh.numtris = parseInt(result[1]);
            currentMesh.tris = [];
        }
        else if ((result = triReg.exec(line)) && result[0] == line) {
            var index = parseInt(result[1]) * 3;
            currentMesh.tris[index] = parseInt(result[2]);
            currentMesh.tris[index + 1] = parseInt(result[3]);
            currentMesh.tris[index + 2] = parseInt(result[4]);
        }
        else if ((result = numweightsReg.exec(line)) && result[0] == line) {
            currentMesh.numweights = parseInt(result[1]);
            currentMesh.weights = [];
        }
        else if ((result = weightReg.exec(line)) && result[0] == line) {
            currentMesh.weights.push({
                index: parseInt(result[1]), joint: parseInt(result[2]), bias: parseFloat(result[3]),
                pos: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])]
            });
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var MD5AnimParser = (function () {
        function MD5AnimParser() {
        }
        MD5AnimParser.parse = function (context) {
            var md5AnimData = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, md5AnimData);
            } while (line);
            return md5AnimData;
        };
        return MD5AnimParser;
    }());
    feng3d.MD5AnimParser = MD5AnimParser;
    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numFramesReg = /numFrames\s+(\d+)/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var frameRateReg = /frameRate\s+(\d+)/;
    var numAnimatedComponentsReg = /numAnimatedComponents\s+(\d+)/;
    var hierarchyStartReg = /hierarchy\s+{/;
    var hierarchyReg = /"(\w+)"\s+([\d-]+)\s+(\d+)\s+(\d+)(\s+\/\/(\s+\w+)?(\s+\([\s\w]+\))?)?/;
    var endBlockReg = /}/;
    var boundsStartReg = /bounds\s+{/;
    //2组3个number
    var number32Reg = /\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)/;
    var baseframeStartReg = /baseframe\s+{/;
    var frameStartReg = /frame\s+(\d+)\s+{/;
    var numbersReg = /(-?[\d.]+)(\s+-?[\d.]+){0,}/;
    /**
     * 状态
     */
    var State;
    (function (State) {
        State[State["hierarchy"] = 0] = "hierarchy";
        State[State["bounds"] = 1] = "bounds";
        State[State["baseframe"] = 2] = "baseframe";
        State[State["frame"] = 3] = "frame";
    })(State || (State = {}));
    /** 当前处于状态 */
    var states = [];
    var currentFrame;
    function parserLine(line, md5AnimData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        var result;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line) {
            md5AnimData.MD5Version = parseInt(result[1]);
        }
        else if ((result = commandlineReg.exec(line)) && result[0] == line) {
            md5AnimData.commandline = result[1];
        }
        else if ((result = numFramesReg.exec(line)) && result[0] == line) {
            md5AnimData.numFrames = parseInt(result[1]);
        }
        else if ((result = numJointsReg.exec(line)) && result[0] == line) {
            md5AnimData.numJoints = parseInt(result[1]);
        }
        else if ((result = frameRateReg.exec(line)) && result[0] == line) {
            md5AnimData.frameRate = parseInt(result[1]);
        }
        else if ((result = numAnimatedComponentsReg.exec(line)) && result[0] == line) {
            md5AnimData.numAnimatedComponents = parseInt(result[1]);
        }
        else if ((result = hierarchyStartReg.exec(line)) && result[0] == line) {
            md5AnimData.hierarchy = [];
            states.push(State.hierarchy);
        }
        else if ((result = hierarchyReg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.hierarchy:
                    md5AnimData.hierarchy.push({
                        name: result[1], parentIndex: parseInt(result[2]),
                        flags: parseInt(result[3]), startIndex: parseInt(result[4])
                    });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else if ((result = endBlockReg.exec(line)) && result[0] == line) {
            var state = states.pop();
            if (state == State.frame) {
                if (currentFrame.components.length != md5AnimData.numAnimatedComponents) {
                    throw new Error("frame中数据不对");
                }
                currentFrame = null;
            }
        }
        else if ((result = boundsStartReg.exec(line)) && result[0] == line) {
            md5AnimData.bounds = [];
            states.push(State.bounds);
        }
        else if ((result = baseframeStartReg.exec(line)) && result[0] == line) {
            md5AnimData.baseframe = [];
            states.push(State.baseframe);
        }
        else if ((result = number32Reg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.bounds:
                    md5AnimData.bounds.push({ min: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], max: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                case State.baseframe:
                    md5AnimData.baseframe.push({ position: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], orientation: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else if ((result = frameStartReg.exec(line)) && result[0] == line) {
            if (!md5AnimData.frame) {
                md5AnimData.frame = [];
            }
            currentFrame = { index: parseInt(result[1]), components: [] };
            md5AnimData.frame.push(currentFrame);
            states.push(State.frame);
        }
        else if ((result = numbersReg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.frame:
                    var numbers = line.split(" ");
                    while (numbers.length > 0) {
                        currentFrame.components.push(parseFloat(numbers.shift()));
                    }
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader = (function () {
        function ObjLoader() {
        }
        /**
         * 加载资源
         * @param url   路径
         */
        ObjLoader.prototype.load = function (url, material, completed) {
            if (completed === void 0) { completed = null; }
            this._completed = completed;
            this._url = url;
            this._material = material;
            var loader = new feng3d.Loader();
            feng3d.Event.on(loader, "complete", this.onComplete, this);
            loader.loadText(url);
        };
        ObjLoader.prototype.onComplete = function (e) {
            var objData = this._objData = feng3d.OBJParser.parser(e.data.content);
            var mtl = objData.mtl;
            if (mtl) {
                var mtlRoot = this._url.substring(0, this._url.lastIndexOf("/") + 1);
                var mtlLoader = new feng3d.Loader();
                mtlLoader.loadText(mtlRoot + mtl);
                feng3d.Event.on(mtlLoader, "complete", function (e) {
                    var mtlData = this._mtlData = feng3d.MtlParser.parser(e.data.content);
                    this.createObj(this._material);
                }, this);
            }
            else {
                this.createObj(this._material);
            }
        };
        ObjLoader.prototype.createObj = function (material) {
            var object = feng3d.GameObject.create();
            var objData = this._objData;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                var object3D = this.createSubObj(obj, material);
                object.transform.addChild(object3D.transform);
            }
            if (this._completed) {
                this._completed(object);
            }
        };
        ObjLoader.prototype.createSubObj = function (obj, material) {
            var object3D = feng3d.GameObject.create(obj.name);
            var subObjs = obj.subObjs;
            for (var i = 0; i < subObjs.length; i++) {
                var materialObj = this.createMaterialObj(obj, subObjs[i], material);
                object3D.transform.addChild(materialObj.transform);
            }
            return object3D;
        };
        ObjLoader.prototype.createMaterialObj = function (obj, subObj, material) {
            var gameObject = feng3d.GameObject.create();
            var model = gameObject.addComponent(feng3d.MeshRenderer);
            model.material = material || new feng3d.ColorMaterial();
            this._vertices = obj.vertex;
            this._vertexNormals = obj.vn;
            this._uvs = obj.vt;
            var meshFilter = gameObject.addComponent(feng3d.MeshFilter);
            var geometry = meshFilter.mesh = new feng3d.Geometry();
            var vertices = [];
            var normals = [];
            var uvs = [];
            this._realIndices = [];
            this._vertexIndex = 0;
            var faces = subObj.faces;
            var indices = [];
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                var numVerts = face.indexIds.length - 1;
                for (var j = 1; j < numVerts; ++j) {
                    this.translateVertexData(face, j, vertices, uvs, indices, normals);
                    this.translateVertexData(face, 0, vertices, uvs, indices, normals);
                    this.translateVertexData(face, j + 1, vertices, uvs, indices, normals);
                }
            }
            geometry.setIndices(new Uint16Array(indices));
            geometry.setVAData("a_position", new Float32Array(vertices), 3);
            geometry.setVAData("a_normal", new Float32Array(normals), 3);
            geometry.setVAData("a_uv", new Float32Array(uvs), 2);
            geometry.createVertexTangents();
            if (this._mtlData && this._mtlData[subObj.material]) {
                var materialInfo = this._mtlData[subObj.material];
                var kd = materialInfo.kd;
                var colorMaterial = new feng3d.ColorMaterial();
                colorMaterial.color.r = kd[0];
                colorMaterial.color.g = kd[1];
                colorMaterial.color.b = kd[2];
                model.material = colorMaterial;
            }
            return gameObject;
        };
        ObjLoader.prototype.translateVertexData = function (face, vertexIndex, vertices, uvs, indices, normals) {
            var index;
            var vertex;
            var vertexNormal;
            var uv;
            if (!this._realIndices[face.indexIds[vertexIndex]]) {
                index = this._vertexIndex;
                this._realIndices[face.indexIds[vertexIndex]] = ++this._vertexIndex;
                vertex = this._vertices[face.vertexIndices[vertexIndex] - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices.length > 0) {
                    vertexNormal = this._vertexNormals[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices.length > 0) {
                    try {
                        uv = this._uvs[face.uvIndices[vertexIndex] - 1];
                        uvs.push(uv.u, uv.v);
                    }
                    catch (e) {
                        switch (vertexIndex) {
                            case 0:
                                uvs.push(0, 1);
                                break;
                            case 1:
                                uvs.push(.5, 0);
                                break;
                            case 2:
                                uvs.push(1, 1);
                        }
                    }
                }
            }
            else
                index = this._realIndices[face.indexIds[vertexIndex]] - 1;
            indices.push(index);
        };
        return ObjLoader;
    }());
    feng3d.ObjLoader = ObjLoader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader = (function (_super) {
        __extends(MD5Loader, _super);
        function MD5Loader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 加载资源
         * @param url   路径
         */
        MD5Loader.prototype.load = function (url, completed) {
            if (completed === void 0) { completed = null; }
            this._url = url;
            this._completed = completed;
            var loader = new feng3d.Loader();
            feng3d.Event.on(loader, "complete", function (e) {
                var objData = feng3d.MD5MeshParser.parse(e.data.content);
                this.createMD5Mesh(objData);
            }, this);
            loader.loadText(url);
        };
        MD5Loader.prototype.loadAnim = function (url, completed) {
            if (completed === void 0) { completed = null; }
            this._url = url;
            this._animCompleted = completed;
            var loader = new feng3d.Loader();
            feng3d.Event.on(loader, "complete", function (e) {
                var objData = feng3d.MD5AnimParser.parse(e.data.content);
                this.createAnimator(objData);
            }, this);
            loader.loadText(url);
        };
        MD5Loader.prototype.createMD5Mesh = function (md5MeshData) {
            var object3D = feng3d.GameObject.create();
            //顶点最大关节关联数
            var _maxJointCount = this.calculateMaxJointCount(md5MeshData);
            feng3d.debuger && console.assert(_maxJointCount <= 8, "顶点最大关节关联数最多支持8个");
            this._skeleton = this.createSkeleton(md5MeshData.joints);
            var skeletonAnimator;
            for (var i = 0; i < md5MeshData.meshs.length; i++) {
                var geometry = this.createGeometry(md5MeshData.meshs[i]);
                var skeletonObject3D = feng3d.GameObject.create();
                skeletonObject3D.addComponent(feng3d.MeshRenderer).material = new feng3d.StandardMaterial();
                skeletonObject3D.addComponent(feng3d.MeshFilter).mesh = geometry;
                skeletonAnimator = skeletonObject3D.addComponent(feng3d.SkeletonAnimator);
                skeletonAnimator.skeleton = this._skeleton;
                object3D.transform.addChild(skeletonObject3D.transform);
            }
            if (this._completed) {
                this._completed(object3D, skeletonAnimator);
            }
        };
        /**
         * 计算最大关节数量
         */
        MD5Loader.prototype.calculateMaxJointCount = function (md5MeshData) {
            var _maxJointCount = 0;
            //遍历所有的网格数据
            var numMeshData = md5MeshData.meshs.length;
            for (var i = 0; i < numMeshData; ++i) {
                var meshData = md5MeshData.meshs[i];
                var vertexData = meshData.verts;
                var numVerts = vertexData.length;
                //遍历每个顶点 寻找关节关联最大数量
                for (var j = 0; j < numVerts; ++j) {
                    var zeroWeights = this.countZeroWeightJoints(vertexData[j], meshData.weights);
                    var totalJoints = vertexData[j].countWeight - zeroWeights;
                    if (totalJoints > _maxJointCount)
                        _maxJointCount = totalJoints;
                }
            }
            return _maxJointCount;
        };
        /**
         * 计算0权重关节数量
         * @param vertex 顶点数据
         * @param weights 关节权重数组
         * @return
         */
        MD5Loader.prototype.countZeroWeightJoints = function (vertex, weights) {
            var start = vertex.startWeight;
            var end = vertex.startWeight + vertex.countWeight;
            var count = 0;
            var weight;
            for (var i = start; i < end; ++i) {
                weight = weights[i].bias;
                if (weight == 0)
                    ++count;
            }
            return count;
        };
        MD5Loader.prototype.createSkeleton = function (joints) {
            var skeleton = new feng3d.Skeleton();
            for (var i = 0; i < joints.length; i++) {
                var skeletonJoint = this.createSkeletonJoint(joints[i]);
                skeleton.joints.push(skeletonJoint);
            }
            return skeleton;
        };
        MD5Loader.prototype.createSkeletonJoint = function (joint) {
            var skeletonJoint = new feng3d.SkeletonJoint();
            skeletonJoint.name = joint.name;
            skeletonJoint.parentIndex = joint.parentIndex;
            var position = joint.position;
            var rotation = joint.rotation;
            var quat = new feng3d.Quaternion(rotation[0], -rotation[1], -rotation[2]);
            // quat supposed to be unit length
            var t = 1 - quat.x * quat.x - quat.y * quat.y - quat.z * quat.z;
            quat.w = t < 0 ? 0 : -Math.sqrt(t);
            //
            skeletonJoint.translation = new feng3d.Vector3D(-position[0], position[1], position[2]);
            skeletonJoint.translation = skeletonJoint.translation;
            //
            skeletonJoint.orientation = quat;
            return skeletonJoint;
        };
        MD5Loader.prototype.createGeometry = function (md5Mesh) {
            var vertexData = md5Mesh.verts;
            var weights = md5Mesh.weights;
            var indices = md5Mesh.tris;
            var geometry = new feng3d.Geometry();
            var len = vertexData.length;
            var vertex;
            var weight;
            var bindPose;
            var pos;
            //uv数据
            var uvs = [];
            uvs.length = len * 2;
            //顶点位置数据
            var vertices = [];
            vertices.length = len * 3;
            //关节索引数据
            var jointIndices0 = [];
            jointIndices0.length = len * 4;
            var jointIndices1 = [];
            jointIndices1.length = len * 4;
            //关节权重数据
            var jointWeights0 = [];
            jointWeights0.length = len * 4;
            var jointWeights1 = [];
            jointWeights1.length = len * 4;
            for (var i = 0; i < len; ++i) {
                vertex = vertexData[i];
                vertices[i * 3] = vertices[i * 3 + 1] = vertices[i * 3 + 2] = 0;
                /**
                 * 参考 http://blog.csdn.net/summerhust/article/details/17421213
                 * VertexPos = (MJ-0 * weight[index0].pos * weight[index0].bias) + ... + (MJ-N * weight[indexN].pos * weight[indexN].bias)
                 * 变量对应  MJ-N -> bindPose; 第J个关节的变换矩阵
                 * weight[indexN].pos -> weight.pos;
                 * weight[indexN].bias -> weight.bias;
                 */
                var weightJoints = [];
                var weightBiass = [];
                for (var j = 0; j < 8; ++j) {
                    weightJoints[j] = 0;
                    weightBiass[j] = 0;
                    if (j < vertex.countWeight) {
                        weight = weights[vertex.startWeight + j];
                        if (weight.bias > 0) {
                            bindPose = this._skeleton.joints[weight.joint].matrix3D;
                            pos = bindPose.transformVector(new feng3d.Vector3D(-weight.pos[0], weight.pos[1], weight.pos[2]));
                            vertices[i * 3] += pos.x * weight.bias;
                            vertices[i * 3 + 1] += pos.y * weight.bias;
                            vertices[i * 3 + 2] += pos.z * weight.bias;
                            weightJoints[j] = weight.joint;
                            weightBiass[j] = weight.bias;
                        }
                    }
                }
                jointIndices0[i * 4] = weightJoints[0];
                jointIndices0[i * 4 + 1] = weightJoints[1];
                jointIndices0[i * 4 + 2] = weightJoints[2];
                jointIndices0[i * 4 + 3] = weightJoints[3];
                jointIndices1[i * 4] = weightJoints[4];
                jointIndices1[i * 4 + 1] = weightJoints[5];
                jointIndices1[i * 4 + 2] = weightJoints[6];
                jointIndices1[i * 4 + 3] = weightJoints[7];
                //
                jointWeights0[i * 4] = weightBiass[0];
                jointWeights0[i * 4 + 1] = weightBiass[1];
                jointWeights0[i * 4 + 2] = weightBiass[2];
                jointWeights0[i * 4 + 3] = weightBiass[3];
                jointWeights1[i * 4] = weightBiass[4];
                jointWeights1[i * 4 + 1] = weightBiass[5];
                jointWeights1[i * 4 + 2] = weightBiass[6];
                jointWeights1[i * 4 + 3] = weightBiass[7];
                uvs[vertex.index * 2] = vertex.u;
                uvs[vertex.index * 2 + 1] = vertex.v;
            }
            //更新索引数据
            geometry.setIndices(new Uint16Array(indices));
            //更新顶点坐标与uv数据
            geometry.setVAData("a_position", new Float32Array(vertices), 3);
            geometry.setVAData("a_uv", new Float32Array(uvs), 2);
            geometry.createVertexNormals();
            //
            var tangents = feng3d.GeometryUtils.createVertexTangents(indices, vertices, uvs);
            geometry.setVAData("a_tangent", new Float32Array(tangents), 3);
            //更新关节索引与权重索引
            geometry.setVAData("a_jointindex0", new Float32Array(jointIndices0), 4);
            geometry.setVAData("a_jointweight0", new Float32Array(jointWeights0), 4);
            geometry.setVAData("a_jointindex1", new Float32Array(jointIndices1), 4);
            geometry.setVAData("a_jointweight1", new Float32Array(jointWeights1), 4);
            return geometry;
        };
        MD5Loader.prototype.createAnimator = function (md5AnimData) {
            var object = feng3d.GameObject.create();
            var _clip = new feng3d.SkeletonClipNode();
            for (var i = 0; i < md5AnimData.numFrames; ++i)
                _clip.addFrame(this.translatePose(md5AnimData, md5AnimData.frame[i]), 1000 / md5AnimData.frameRate);
            if (this._animCompleted) {
                this._animCompleted(_clip);
            }
        };
        /**
         * 将一个关键帧数据转换为SkeletonPose
         * @param frameData 帧数据
         * @return 包含帧数据的SkeletonPose对象
         */
        MD5Loader.prototype.translatePose = function (md5AnimData, frameData) {
            var hierarchy;
            var pose;
            var base;
            var flags;
            var j;
            //偏移量
            var translate = new feng3d.Vector3D();
            //旋转四元素
            var orientation = new feng3d.Quaternion();
            var components = frameData.components;
            //骨骼pose数据
            var skelPose = new feng3d.SkeletonPose();
            //骨骼pose列表
            var jointPoses = skelPose.jointPoses;
            for (var i = 0; i < md5AnimData.numJoints; ++i) {
                //通过原始帧数据与层级数据计算出当前骨骼pose数据
                j = 0;
                //层级数据
                hierarchy = md5AnimData.hierarchy[i];
                //基础帧数据
                base = md5AnimData.baseframe[i];
                //层级标记
                flags = hierarchy.flags;
                translate.x = base.position[0];
                translate.y = base.position[1];
                translate.z = base.position[2];
                orientation.x = base.orientation[0];
                orientation.y = base.orientation[1];
                orientation.z = base.orientation[2];
                //调整位移与角度数据
                if (flags & 1)
                    translate.x = components[hierarchy.startIndex + (j++)];
                if (flags & 2)
                    translate.y = components[hierarchy.startIndex + (j++)];
                if (flags & 4)
                    translate.z = components[hierarchy.startIndex + (j++)];
                if (flags & 8)
                    orientation.x = components[hierarchy.startIndex + (j++)];
                if (flags & 16)
                    orientation.y = components[hierarchy.startIndex + (j++)];
                if (flags & 32)
                    orientation.z = components[hierarchy.startIndex + (j++)];
                //计算四元素w值
                var w = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
                orientation.w = w < 0 ? 0 : -Math.sqrt(w);
                //创建关节pose数据
                pose = new feng3d.JointPose();
                pose.name = hierarchy.name;
                pose.parentIndex = hierarchy.parentIndex;
                pose.orientation.copyFrom(orientation);
                pose.translation.x = translate.x;
                pose.translation.y = translate.y;
                pose.translation.z = translate.z;
                pose.orientation.y = -pose.orientation.y;
                pose.orientation.z = -pose.orientation.z;
                pose.translation.x = -pose.translation.x;
                jointPoses[i] = pose;
            }
            return skelPose;
        };
        return MD5Loader;
    }(feng3d.Loader));
    feng3d.MD5Loader = MD5Loader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    var Trident = (function (_super) {
        __extends(Trident, _super);
        function Trident(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.transform.mouseChildren = false;
            _this.transform.mouseEnabled = false;
            length = 100;
            _this.buildTrident(Math.abs((length == 0) ? 10 : length));
            return _this;
        }
        Trident.prototype.buildTrident = function (length) {
            var xLine = feng3d.GameObject.create("xLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            xLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            xLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(xLine.transform);
            //
            var yLine = feng3d.GameObject.create("yLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            yLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            yLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(yLine.transform);
            //
            var zLine = feng3d.GameObject.create("zLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            zLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            zLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(zLine.transform);
            //
            var xArrow = feng3d.GameObject.create("xArrow");
            xArrow.transform.x = length;
            xArrow.transform.rz = -90;
            xArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            ;
            var material = xArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(1, 0, 0);
            this.transform.addChild(xArrow.transform);
            //
            var yArrow = feng3d.GameObject.create("yArrow");
            yArrow.transform.y = length;
            yArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = yArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 1, 0);
            this.transform.addChild(yArrow.transform);
            //
            var zArrow = feng3d.GameObject.create("zArrow");
            zArrow.transform.z = length;
            zArrow.transform.rx = 90;
            zArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = zArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 0, 1);
            this.transform.addChild(zArrow.transform);
        };
        return Trident;
    }(feng3d.Component));
    feng3d.Trident = Trident;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GameObjectFactory = (function () {
        function GameObjectFactory() {
        }
        GameObjectFactory.create = function (name) {
            if (name === void 0) { name = "GameObject"; }
            var gameobject = feng3d.GameObject.create(name);
            gameobject.transform.mouseEnabled = true;
            if (name == "GameObject")
                return gameobject;
            gameobject.addComponent(feng3d.MeshRenderer).material = new feng3d.StandardMaterial();
            var meshFilter = gameobject.addComponent(feng3d.MeshFilter);
            switch (name) {
                case "Plane":
                    meshFilter.mesh = new feng3d.PlaneGeometry();
                    break;
                case "Cube":
                    meshFilter.mesh = new feng3d.CubeGeometry();
                    break;
                case "Sphere":
                    meshFilter.mesh = new feng3d.SphereGeometry();
                    break;
                case "Capsule":
                    meshFilter.mesh = new feng3d.CapsuleGeometry();
                    break;
                case "Cylinder":
                    meshFilter.mesh = new feng3d.CylinderGeometry();
                    break;
                case "Cone":
                    meshFilter.mesh = new feng3d.ConeGeometry();
                    break;
                case "Torus":
                    meshFilter.mesh = new feng3d.TorusGeometry();
                    break;
            }
            return gameobject;
        };
        GameObjectFactory.createCube = function (name) {
            if (name === void 0) { name = "cube"; }
            var gameobject = feng3d.GameObject.create(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CubeGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createPlane = function (name) {
            if (name === void 0) { name = "plane"; }
            var gameobject = feng3d.GameObject.create(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.PlaneGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createCylinder = function (name) {
            if (name === void 0) { name = "cylinder"; }
            var gameobject = feng3d.GameObject.create(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CylinderGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createSphere = function (name) {
            if (name === void 0) { name = "sphere"; }
            var gameobject = feng3d.GameObject.create(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.SphereGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createCapsule = function (name) {
            if (name === void 0) { name = "capsule"; }
            var gameobject = feng3d.GameObject.create(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CapsuleGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        return GameObjectFactory;
    }());
    feng3d.GameObjectFactory = GameObjectFactory;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    var Mouse3DManager = (function () {
        function Mouse3DManager() {
            this.viewRect = new feng3d.Rectangle(0, 0, 100, 100);
            this.mouseX = 0;
            this.mouseY = 0;
            this.mouseEventTypes = [];
            /** 射线采集器(采集射线穿过场景中物体的列表) */
            this._mousePicker = new feng3d.RaycastPicker(false);
            this._catchMouseMove = false;
            this.mouseRenderer = new feng3d.MouseRenderer();
            //
            mouse3DEventMap[feng3d.inputType.CLICK] = feng3d.Mouse3DEvent.CLICK;
            mouse3DEventMap[feng3d.inputType.DOUBLE_CLICK] = feng3d.Mouse3DEvent.DOUBLE_CLICK;
            mouse3DEventMap[feng3d.inputType.MOUSE_DOWN] = feng3d.Mouse3DEvent.MOUSE_DOWN;
            mouse3DEventMap[feng3d.inputType.MOUSE_MOVE] = feng3d.Mouse3DEvent.MOUSE_MOVE;
            mouse3DEventMap[feng3d.inputType.MOUSE_UP] = feng3d.Mouse3DEvent.MOUSE_UP;
            //
            feng3d.Event.on(feng3d.input, feng3d.inputType.CLICK, this.onMouseEvent, this);
            feng3d.Event.on(feng3d.input, feng3d.inputType.DOUBLE_CLICK, this.onMouseEvent, this);
            feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_DOWN, this.onMouseEvent, this);
            feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_UP, this.onMouseEvent, this);
        }
        Object.defineProperty(Mouse3DManager.prototype, "catchMouseMove", {
            /**
             * 是否捕捉鼠标移动，默认false。
             */
            get: function () {
                return this._catchMouseMove;
            },
            set: function (value) {
                if (this._catchMouseMove == value)
                    return;
                if (this._catchMouseMove) {
                    feng3d.Event.off(feng3d.input, feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
                }
                this._catchMouseMove = value;
                if (this._catchMouseMove) {
                    feng3d.Event.on(feng3d.input, feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听鼠标事件收集事件类型
         */
        Mouse3DManager.prototype.onMouseEvent = function (event) {
            var inputEvent = event.data;
            if (this.mouseEventTypes.indexOf(inputEvent.type) == -1)
                this.mouseEventTypes.push(inputEvent.type);
            this.mouseX = inputEvent.clientX;
            this.mouseY = inputEvent.clientY;
        };
        /**
         * 渲染
         */
        Mouse3DManager.prototype.draw = function (renderContext) {
            if (!this.viewRect.contains(this.mouseX, this.mouseY))
                return;
            if (this.mouseEventTypes.length == 0)
                return;
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            if (mouseCollisionEntitys.length == 0)
                return;
            this.pick(renderContext);
            // this.glPick(renderContext);
        };
        Mouse3DManager.prototype.pick = function (renderContext) {
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            var mouseRay3D = renderContext.view3D.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var _collidingObject = this._mousePicker.getViewCollision(mouseRay3D, mouseCollisionEntitys);
            var object3D = _collidingObject && _collidingObject.firstEntity;
            this.setSelectedObject3D(object3D ? object3D.transform : null);
        };
        Mouse3DManager.prototype.glPick = function (renderContext) {
            var gl = renderContext.gl;
            var offsetX = -(this.mouseX - this.viewRect.x);
            var offsetY = -(this.viewRect.height - (this.mouseY - this.viewRect.y)); //y轴与window中坐标反向，所以需要 h = (maxHeight - h)
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, this.viewRect.width, this.viewRect.height);
            this.mouseRenderer.draw(renderContext);
            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D.transform);
        };
        Mouse3DManager.prototype.getMouseCheckObjects = function (renderContext) {
            var scene3d = renderContext.scene3d;
            var checkList = scene3d.transform.getChildren();
            var results = [];
            var i = 0;
            while (i < checkList.length) {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled && checkObject.getComponents(feng3d.MeshFilter)) {
                    results.push(checkObject.gameObject);
                }
                if (checkObject.mouseChildren) {
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return results;
        };
        /**
         * 设置选中对象
         */
        Mouse3DManager.prototype.setSelectedObject3D = function (value) {
            var _this = this;
            if (this.selectedObject3D != value) {
                if (this.selectedObject3D)
                    feng3d.Event.dispatch(this.selectedObject3D, feng3d.Mouse3DEvent.MOUSE_OUT, null, true);
                if (value)
                    feng3d.Event.dispatch(value, feng3d.Mouse3DEvent.MOUSE_OVER, null, true);
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D) {
                this.mouseEventTypes.forEach(function (element) {
                    switch (element) {
                        case feng3d.inputType.MOUSE_DOWN:
                            if (_this.preMouseDownObject3D != _this.selectedObject3D) {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = _this.selectedObject3D;
                            }
                            feng3d.Event.dispatch(_this.selectedObject3D, mouse3DEventMap[element], null, true);
                            break;
                        case feng3d.inputType.MOUSE_UP:
                            if (_this.selectedObject3D == _this.preMouseDownObject3D) {
                                _this.Object3DClickNum++;
                            }
                            else {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = null;
                            }
                            feng3d.Event.dispatch(_this.selectedObject3D, mouse3DEventMap[element], null, true);
                            break;
                        case feng3d.inputType.MOUSE_MOVE:
                            feng3d.Event.dispatch(_this.selectedObject3D, mouse3DEventMap[element], null, true);
                            break;
                        case feng3d.inputType.CLICK:
                            if (_this.Object3DClickNum > 0)
                                feng3d.Event.dispatch(_this.selectedObject3D, mouse3DEventMap[element], null, true);
                            break;
                        case feng3d.inputType.DOUBLE_CLICK:
                            if (_this.Object3DClickNum > 1)
                                feng3d.Event.dispatch(_this.selectedObject3D, mouse3DEventMap[element], null, true);
                            break;
                    }
                });
            }
            else {
                this.Object3DClickNum = 0;
                this.preMouseDownObject3D = null;
            }
            this.mouseEventTypes.length = 0;
        };
        return Mouse3DManager;
    }());
    feng3d.Mouse3DManager = Mouse3DManager;
    /**
     * 3D鼠标事件
     */
    feng3d.Mouse3DEvent = {
        /** 鼠标单击 */
        CLICK: "click",
        /** 鼠标双击 */
        DOUBLE_CLICK: "doubleClick",
        /** 鼠标按下 */
        MOUSE_DOWN: "mousedown",
        /** 鼠标移动 */
        MOUSE_MOVE: "mousemove",
        /** 鼠标移出 */
        MOUSE_OUT: "mouseout",
        /** 鼠标移入 */
        MOUSE_OVER: "mouseover",
        /** 鼠标弹起 */
        MOUSE_UP: "mouseup",
    };
    /**
     * 鼠标事件与3D鼠标事件类型映射
     */
    var mouse3DEventMap = {};
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    feng3d.shaderFileMap = {
        "shaders/color.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\nuniform vec4 u_diffuseInput;\r\n\r\n\r\n\r\nvoid main(void) {\r\n   \r\n    gl_FragColor = u_diffuseInput;\r\n}\r\n",
        "shaders/color.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/modules/envmap.fragment.glsl": "uniform samplerCube s_envMap;\r\nuniform float u_reflectivity;\r\n\r\nvec4 envmapMethod(vec4 finalColor)\r\n{\r\n    vec3 cameraToVertex = normalize( v_globalPosition - u_cameraMatrix[3].xyz );\r\n    vec3 reflectVec = reflect( cameraToVertex, v_normal );\r\n    vec4 envColor = textureCube( s_envMap, reflectVec );\r\n    finalColor.xyz *= envColor.xyz * u_reflectivity;\r\n    return finalColor;\r\n}",
        "shaders/modules/fog.fragment.glsl": "#define FOGMODE_NONE    0.\r\n#define FOGMODE_EXP     1.\r\n#define FOGMODE_EXP2    2.\r\n#define FOGMODE_LINEAR  3.\r\n#define E 2.71828\r\n\r\nuniform float u_fogMode;\r\nuniform float u_fogMinDistance;\r\nuniform float u_fogMaxDistance;\r\nuniform float u_fogDensity;\r\nuniform vec3 u_fogColor;\r\n\r\nfloat CalcFogFactor(float fogDistance)\r\n{\r\n\tfloat fogCoeff = 1.0;\r\n\tif (FOGMODE_LINEAR == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = (u_fogMaxDistance - fogDistance) / (u_fogMaxDistance - u_fogMinDistance);\r\n\t}\r\n\telse if (FOGMODE_EXP == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fogDistance * u_fogDensity);\r\n\t}\r\n\telse if (FOGMODE_EXP2 == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fogDistance * fogDistance * u_fogDensity * u_fogDensity);\r\n\t}\r\n\r\n\treturn clamp(fogCoeff, 0.0, 1.0);\r\n}\r\n\r\nvec4 fogMethod(vec4 color)\r\n{\r\n    vec3 fogDistance = u_cameraMatrix[3].xyz - v_globalPosition.xyz;\r\n\tfloat fog = CalcFogFactor(length(fogDistance));\r\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * u_fogColor;\r\n    return color;\r\n}",
        "shaders/modules/particle.fragment.glsl": "#ifdef D_a_particle_color\r\n    varying vec4 v_particle_color;\r\n#endif\r\n\r\nvec4 particleAnimation(vec4 color) {\r\n\r\n    #ifdef D_a_particle_color\r\n        color = color * v_particle_color;\r\n    #endif\r\n    return color;\r\n}",
        "shaders/modules/particle.vertex.glsl": "//根据是否提供(a_particle_position)数据自动定义 #define D_(a_particle_position)\r\n\r\n#ifdef D_a_particle_birthTime\r\n    attribute float a_particle_birthTime;\r\n#endif\r\n\r\n#ifdef D_a_particle_position\r\n    attribute vec3 a_particle_position;\r\n#endif\r\n\r\n#ifdef D_a_particle_velocity\r\n    attribute vec3 a_particle_velocity;\r\n#endif\r\n\r\n#ifdef D_a_particle_lifetime\r\n    attribute float a_particle_lifetime;\r\n#endif\r\n\r\n#ifdef D_a_particle_color\r\n    attribute vec4 a_particle_color;\r\n    varying vec4 v_particle_color;\r\n#endif\r\n\r\nuniform float u_particleTime;\r\n\r\n#ifdef D_u_particle_acceleration\r\n    uniform vec3 u_particle_acceleration;\r\n#endif\r\n\r\n#ifdef D_u_particle_billboardMatrix\r\n    uniform mat4 u_particle_billboardMatrix;\r\n#endif\r\n\r\nvec4 particleAnimation(vec4 position) {\r\n\r\n    #ifdef D_a_particle_birthTime\r\n    float pTime = u_particleTime - a_particle_birthTime;\r\n    if(pTime > 0.0){\r\n\r\n        #ifdef D_a_particle_lifetime\r\n            pTime = mod(pTime,a_particle_lifetime);\r\n        #endif\r\n\r\n        vec3 pVelocity = vec3(0.0,0.0,0.0);\r\n\r\n        #ifdef D_u_particle_billboardMatrix\r\n            position = u_particle_billboardMatrix * position;\r\n        #endif\r\n\r\n        #ifdef D_a_particle_position\r\n            position.xyz = position.xyz + a_particle_position;\r\n        #endif\r\n\r\n        #ifdef D_a_particle_velocity\r\n            pVelocity = pVelocity + a_particle_velocity;\r\n        #endif\r\n\r\n        #ifdef D_u_particle_acceleration\r\n            pVelocity = pVelocity + u_particle_acceleration * pTime;\r\n        #endif\r\n        \r\n        #ifdef D_a_particle_color\r\n            v_particle_color = a_particle_color;\r\n        #endif\r\n\r\n        position.xyz = position.xyz + pVelocity * pTime;\r\n    }\r\n    #endif\r\n    \r\n    return position;\r\n}",
        "shaders/modules/pointLightShading.declare.glsl.bak": "//参考资料\r\n//http://blog.csdn.net/leonwei/article/details/44539217\r\n//https://github.com/mcleary/pbr/blob/master/shaders/phong_pbr_frag.glsl\r\n\r\n#if NUM_POINTLIGHT > 0\r\n    //点光源位置列表\r\n    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];\r\n    //点光源漫反射颜色\r\n    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];\r\n    //点光源镜面反射颜色\r\n    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];\r\n    //反射率\r\n    uniform float u_reflectance;\r\n    //粗糙度\r\n    uniform float u_roughness;\r\n    //金属度\r\n    uniform float u_metalic;\r\n\r\n    vec3 fresnelSchlick(float VdotH,vec3 reflectance){\r\n\r\n        return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);\r\n        // return reflectance;\r\n    }\r\n\r\n    float normalDistributionGGX(float NdotH,float alphaG){\r\n\r\n        float alphaG2 = alphaG * alphaG;\r\n        float d = NdotH * NdotH * (alphaG2 - 1.0) + 1.0; \r\n        return alphaG2 / (3.1415926 * d * d);\r\n    }\r\n\r\n    float smithVisibility(float dot,float alphaG){\r\n\r\n        float tanSquared = (1.0 - dot * dot) / (dot * dot);\r\n        return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\r\n    }\r\n\r\n    vec3 calculateLight(vec3 normal,vec3 viewDir,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 baseColor,vec3 reflectance,float roughness){\r\n\r\n        //BRDF = D(h) * F(1, h) * V(l, v, h) / (4 * dot(n, l) * dot(n, v));\r\n\r\n        vec3 halfVec = normalize(lightDir + viewDir);\r\n        float NdotL = clamp(dot(normal,lightDir),0.0,1.0);\r\n        float NdotH = clamp(dot(normal,halfVec),0.0,1.0);\r\n        float NdotV = max(abs(dot(normal,viewDir)),0.000001);\r\n        float VdotH = clamp(dot(viewDir, halfVec),0.0,1.0);\r\n        \r\n        float alphaG = max(roughness * roughness,0.0005);\r\n\r\n        //F(v,h)\r\n        vec3 F = fresnelSchlick(VdotH, reflectance);\r\n\r\n        //D(h)\r\n        float D = normalDistributionGGX(NdotH,alphaG);\r\n\r\n        //V(l,h)\r\n        float V = smithVisibility(NdotL,alphaG) * smithVisibility(NdotV,alphaG) / (4.0 * NdotL * NdotV);\r\n\r\n        vec3 specular = max(0.0, D * V) * 3.1415926 * F;\r\n        \r\n        return (baseColor + specular) * NdotL * lightColor * lightIntensity;\r\n    }\r\n\r\n    //渲染点光源\r\n    vec3 pointLightShading(vec3 normal,vec3 baseColor){\r\n\r\n        float reflectance = u_reflectance;\r\n        float roughness = u_roughness;\r\n        float metalic = u_metalic;\r\n\r\n        reflectance = mix(0.0,0.5,reflectance);\r\n        vec3 realBaseColor = (1.0 - metalic) * baseColor;\r\n        vec3 realReflectance = mix(vec3(reflectance),baseColor,metalic);\r\n\r\n        vec3 totalLightColor = vec3(0.0,0.0,0.0);\r\n        for(int i = 0;i<NUM_POINTLIGHT;i++){\r\n            //光照方向\r\n            vec3 lightDir = normalize(u_pointLightPositions[i] - v_globalPosition);\r\n            //视线方向\r\n            vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);\r\n            //灯光颜色\r\n            vec3 lightColor = u_pointLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_pointLightIntensitys[i];\r\n\r\n            totalLightColor = totalLightColor + calculateLight(normal,viewDir,lightDir,lightColor,lightIntensity,realBaseColor,realReflectance,roughness);\r\n        }\r\n        \r\n        return totalLightColor;\r\n    }\r\n#endif",
        "shaders/modules/pointLightShading.fragment.glsl": "#if NUM_POINTLIGHT > 0\r\n    //点光源位置数组\r\n    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];\r\n    //点光源颜色数组\r\n    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];\r\n    //点光源光照强度数组\r\n    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];\r\n    //点光源光照范围数组\r\n    uniform float u_pointLightRanges[NUM_POINTLIGHT];\r\n#endif\r\n#if NUM_DIRECTIONALLIGHT > 0\r\n    //方向光源方向数组\r\n    uniform vec3 u_directionalLightDirections[NUM_DIRECTIONALLIGHT];\r\n    //方向光源颜色数组\r\n    uniform vec3 u_directionalLightColors[NUM_DIRECTIONALLIGHT];\r\n    //方向光源光照强度数组\r\n    uniform float u_directionalLightIntensitys[NUM_DIRECTIONALLIGHT];\r\n#endif\r\n\r\n//计算光照漫反射系数\r\nvec3 calculateLightDiffuse(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity){\r\n\r\n    vec3 diffuse = lightColor * lightIntensity * clamp(dot(normal,lightDir),0.0,1.0);\r\n    return diffuse;\r\n}\r\n\r\n//计算光照镜面反射系数\r\nvec3 calculateLightSpecular(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 viewDir,float glossiness){\r\n\r\n    vec3 halfVec = normalize(lightDir + viewDir);\r\n    float specComp = clamp(dot(normal,halfVec),0.0,1.0);\r\n    specComp = pow(specComp, max(1., glossiness));\r\n\r\n    vec3 diffuse = lightColor * lightIntensity * specComp;\r\n    return diffuse;\r\n}\r\n\r\n//根据距离计算衰减\r\nfloat computeDistanceLightFalloff(float lightDistance, float range)\r\n{\r\n    #ifdef USEPHYSICALLIGHTFALLOFF\r\n        float lightDistanceFalloff = 1.0 / ((lightDistance * lightDistance + 0.0001));\r\n    #else\r\n        float lightDistanceFalloff = max(0., 1.0 - lightDistance / range);\r\n    #endif\r\n    \r\n    return lightDistanceFalloff;\r\n}\r\n\r\n//渲染点光源\r\nvec3 pointLightShading(vec3 normal,vec3 diffuseColor,vec3 specularColor,vec3 ambientColor,float glossiness){\r\n\r\n    //视线方向\r\n    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);\r\n\r\n    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);\r\n    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);\r\n    #if NUM_POINTLIGHT > 0\r\n        for(int i = 0;i<NUM_POINTLIGHT;i++){\r\n            //\r\n            vec3 lightOffset = u_pointLightPositions[i] - v_globalPosition;\r\n            float lightDistance = length(lightOffset);\r\n            //光照方向\r\n            vec3 lightDir = normalize(lightOffset);\r\n            //灯光颜色\r\n            vec3 lightColor = u_pointLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_pointLightIntensitys[i];\r\n            //光照范围\r\n            float range = u_pointLightRanges[i];\r\n            float attenuation = computeDistanceLightFalloff(lightDistance,range);\r\n            lightIntensity = lightIntensity * attenuation;\r\n            //\r\n            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);\r\n            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);\r\n        }\r\n    #endif\r\n    #if NUM_DIRECTIONALLIGHT > 0\r\n        for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++){\r\n            //光照方向\r\n            vec3 lightDir = normalize(-u_directionalLightDirections[i]);\r\n            //灯光颜色\r\n            vec3 lightColor = u_directionalLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_directionalLightIntensitys[i];\r\n            //\r\n            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);\r\n            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);\r\n        }\r\n    #endif\r\n\r\n    vec3 resultColor = vec3(0.0,0.0,0.0);\r\n    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;\r\n    resultColor = resultColor + totalSpecularLightColor * specularColor;\r\n    resultColor = resultColor + ambientColor * diffuseColor;\r\n    return resultColor;\r\n}",
        "shaders/modules/pointLightShading.main.glsl.bak": "#if NUM_POINTLIGHT > 0\r\n    // finalColor = finalColor * 0.5 +  pointLightShading(v_normal,u_baseColor) * 0.5;\r\n    finalColor.xyz = pointLightShading(v_normal,finalColor.xyz);\r\n#endif",
        "shaders/modules/skeleton.vertex.glsl": "attribute vec4 a_jointindex0;\r\nattribute vec4 a_jointweight0;\r\n\r\nattribute vec4 a_jointindex1;\r\nattribute vec4 a_jointweight1;\r\nuniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];\r\n\r\nvec4 skeletonAnimation(vec4 position) {\r\n\r\n    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);\r\n    for(int i = 0; i < 4; i++){\r\n        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex0[i])] * position * a_jointweight0[i];\r\n    }\r\n    for(int i = 0; i < 4; i++){\r\n        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex1[i])] * position * a_jointweight1[i];\r\n    }\r\n    position.xyz = totalPosition.xyz;\r\n    return position;\r\n}",
        "shaders/modules/terrain.fragment.glsl": "#ifdef USE_TERRAIN_MERGE\r\n    #include<modules/terrainMerge.fragment>\r\n#else\r\n    #include<modules/terrainDefault.fragment>\r\n#endif",
        "shaders/modules/terrainDefault.fragment.glsl": "uniform sampler2D s_splatTexture1;\r\nuniform sampler2D s_splatTexture2;\r\nuniform sampler2D s_splatTexture3;\r\n\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n\r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n\r\n    vec2 t_uv = v_uv.xy * u_splatRepeats.y;\r\n    vec4 tColor = texture2D(s_splatTexture1,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;\r\n\r\n    t_uv = v_uv.xy * u_splatRepeats.z;\r\n    tColor = texture2D(s_splatTexture2,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;\r\n\r\n    t_uv = v_uv.xy * u_splatRepeats.w;\r\n    tColor = texture2D(s_splatTexture3,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment.1.glsl": "//代码实现lod，使用默认线性插值\r\n#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec2 imageSize =    vec2(2048.0,1024.0);\r\nvec4 offset[3];\r\nvec2 tileSize = vec2(512.0,512.0);\r\n// float maxLod = 7.0;\r\nfloat maxLod = 5.0;\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){\r\n\r\n    //计算不同lod像素缩放以及起始坐标\r\n    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n\r\n    //lod块尺寸\r\n    vec2 lodSize = imageSize * lodvec.xy;\r\n    vec2 lodPixelOffset = 1.0 / lodSize;\r\n\r\n    //扩展边缘一像素\r\n    offset.xy = offset.xy - lodPixelOffset * 2.0;\r\n    offset.zw = offset.zw + lodPixelOffset;\r\n    //lod块中uv\r\n    vec2 t_uv = uv * offset.xy + offset.zw;\r\n    t_uv = t_uv * lodvec.xy;\r\n    //取整像素\r\n    t_uv = (t_uv * imageSize + vec2(-0.0,0.0)) / imageSize;\r\n    // t_uv = (t_uv * imageSize + 0.5) / imageSize;\r\n    // t_uv = floor(t_uv * imageSize - 1.0) / imageSize;\r\n    // t_uv = ceil(t_uv * imageSize + 1.0) / imageSize;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * (1.0 - 1.0 / imageSize);\r\n    t_uv = t_uv + lodvec.zw;\r\n    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    return tColor;\r\n\r\n    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);\r\n    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv, vec2 textureSize)\r\n{\r\n    vec2 dx = dFdx(uv * textureSize.x);\r\n    vec2 dy = dFdy(uv * textureSize.y);\r\n    float d = max(dot(dx, dx), dot(dy, dy));  \r\n    return 0.5 * log2(d);\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset);\r\n    #endif\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n    \r\n    offset[0] = vec4(0.5,0.5,0.0,0.0);\r\n    offset[1] = vec4(0.5,0.5,0.5,0.0);\r\n    offset[2] = vec4(0.5,0.5,0.0,0.5);\r\n    \r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec2 t_uv = v_uv.xy * u_splatRepeats[i];\r\n        float lod = mipmapLevel(t_uv,tileSize);\r\n        lod = clamp(lod,0.0,maxLod);\r\n        // lod = 5.0;\r\n        t_uv = fract(t_uv);\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,offset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment.glsl": "//代码实现lod以及线性插值 feng\r\n#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nuniform vec2 u_imageSize;\r\nuniform vec4 u_tileOffset[3];\r\nuniform vec4 u_lod0vec;\r\nuniform vec2 u_tileSize;\r\nuniform float u_maxLod;\r\nuniform float u_scaleByDepth;\r\nuniform float u_uvPositionScale;\r\n\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){\r\n\r\n    //计算不同lod像素缩放以及起始坐标\r\n    vec4 lodvec = u_lod0vec;\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n\r\n    //lod块尺寸\r\n    vec2 lodSize = u_imageSize * lodvec.xy;\r\n    vec2 lodPixelOffset = 1.0 / lodSize * 2.0;\r\n\r\n    // uv = uv - 1.0 / lodPixelOffset;\r\n    vec2 mixFactor = mod(uv, lodPixelOffset) / lodPixelOffset;\r\n\r\n    //lod块中像素索引\r\n    vec2 t_uv = fract(uv + lodPixelOffset * vec2(0.0, 0.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor00 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 0.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor10 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(0.0, 1.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor01 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 1.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor11 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    vec4 tColor0 = mix(tColor00,tColor10,mixFactor.x);\r\n    vec4 tColor1 = mix(tColor01,tColor11,mixFactor.x);\r\n    vec4 tColor = mix(tColor0,tColor1,mixFactor.y);\r\n\r\n    return tColor;\r\n\r\n    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);\r\n    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv)\r\n{\r\n    vec2 dx = dFdx(uv);\r\n    vec2 dy = dFdy(uv);\r\n    float d = max(dot(dx, dx), dot(dy, dy));\r\n    return 0.5 * log2(d);\r\n}\r\n\r\n//根据距离以及法线计算MipMap层函数：\r\nfloat mipmapLevel1(vec2 uv)\r\n{\r\n    //视线方向\r\n    vec3 viewDir = u_cameraMatrix[3].xyz - v_globalPosition.xyz;\r\n    float fogDistance = length(viewDir);\r\n    float value = u_scaleByDepth * fogDistance * u_uvPositionScale;//uv变化率与距离成正比，0.001为顶点位置与uv的变化比率\r\n    viewDir = normalize(viewDir);\r\n    float dd = clamp(dot(viewDir, v_normal),0.05,1.0);//取法线与视线余弦值的倒数，余弦值越大（朝向摄像机时uv变化程度越低）lod越小\r\n    value = value / dd;\r\n    value = value * 0.5;//还没搞懂0.5的来历\r\n    return log2(value);\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset);\r\n    #endif\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n    \r\n    float lod = 0.0;\r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec2 t_uv = v_uv * u_splatRepeats[i];\r\n        // lod = mipmapLevel(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);\r\n        lod = mipmapLevel1(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);\r\n        lod = clamp(lod,0.0,u_maxLod);\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,u_tileOffset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(lod/u_maxLod,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/u_maxLod,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment1.glsl": "#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec2 imageSize =    vec2(2048.0,1024.0);\r\nvec4 offset[3];\r\nvec2 tileSize = vec2(512.0,512.0);\r\nfloat maxLod = 7.0;\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 t_uv,float lod)\r\n{\r\n    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n    \r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    t_uv = floor(t_uv * imageSize) / imageSize;\r\n    \r\n    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);\r\n    return tColor;\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv, vec2 textureSize)\r\n{\r\n    vec2 dx = dFdx(uv * textureSize.x);\r\n    vec2 dy = dFdy(uv * textureSize.y);\r\n    float d = max(dot(dx, dx), dot(dy, dy));  \r\n    return 0.5 * log2(d);\r\n}\r\n\r\nvec4 terrainTexture2DLodMix(sampler2D s_splatMergeTexture,vec2 t_uv,vec4 offset)\r\n{\r\n    float lod = mipmapLevel(t_uv,tileSize);\r\n    lod = clamp(lod,0.0,maxLod);\r\n    t_uv = fract(t_uv);\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod)),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod)),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod));\r\n    #endif\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float splatRepeat,vec4 offset)\r\n{\r\n    t_uv = t_uv.xy * splatRepeat;\r\n    \r\n    vec2 dx = dFdx(t_uv);\r\n    vec2 dy = dFdy(t_uv);\r\n    \r\n    vec4 tColor0 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv, offset);\r\n    vec4 tColor1 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv + dx, offset);\r\n\r\n    vec4 tColor = mix(tColor0,tColor1,0.5);\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) \r\n{\r\n    \r\n    offset[0] = vec4(0.5,0.5,0.0,0.0);\r\n    offset[1] = vec4(0.5,0.5,0.5,0.0);\r\n    offset[2] = vec4(0.5,0.5,0.0,0.5);\r\n    \r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,v_uv,u_splatRepeats[i],offset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/mouse.fragment.glsl": "\r\n\r\nprecision highp float;\r\n\r\nuniform int u_objectID;\r\n\r\nvoid main(){\r\n\r\n    //支持 255*255*255*255 个索引\r\n    const float invColor = 1.0/255.0;\r\n    float temp = float(u_objectID);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.x = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.y = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.z = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.w = fract(temp);\r\n}",
        "shaders/mouse.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(){\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/point.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\n\r\n\r\nvoid main(void) {\r\n   \r\n    gl_FragColor = vec4(1.0,1.0,1.0,1.0);\r\n}\r\n",
        "shaders/point.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform float u_PointSize;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n    gl_PointSize = u_PointSize;\r\n}",
        "shaders/postEffect/fxaa.fragment.glsl": "\r\n\r\n#define FXAA_REDUCE_Mvarying   (1.0/128.0)\r\n#define FXAA_REDUCE_MUL   (1.0/8.0)\r\n#define FXAA_SPAN_MAX     8.0\r\n\r\nvarying vec2 vUV;\r\nuniform sampler2D textureSampler;\r\nuniform vec2 texelSize;\r\n\r\n\r\n\r\nvoid main(){\r\n\tvec2 localTexelSize = texelSize;\r\n\tvec4 rgbNW = texture2D(textureSampler, (vUV + vec2(-1.0, -1.0) * localTexelSize));\r\n\tvec4 rgbNE = texture2D(textureSampler, (vUV + vec2(1.0, -1.0) * localTexelSize));\r\n\tvec4 rgbSW = texture2D(textureSampler, (vUV + vec2(-1.0, 1.0) * localTexelSize));\r\n\tvec4 rgbSE = texture2D(textureSampler, (vUV + vec2(1.0, 1.0) * localTexelSize));\r\n\tvec4 rgbM = texture2D(textureSampler, vUV);\r\n\tvec4 luma = vec4(0.299, 0.587, 0.114, 1.0);\r\n\tfloat lumaNW = dot(rgbNW, luma);\r\n\tfloat lumaNE = dot(rgbNE, luma);\r\n\tfloat lumaSW = dot(rgbSW, luma);\r\n\tfloat lumaSE = dot(rgbSE, luma);\r\n\tfloat lumaM = dot(rgbM, luma);\r\n\tfloat lumaMvarying = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\r\n\tfloat lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\r\n\r\n\tvec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));\r\n\r\n\tfloat dirReduce = max(\r\n\t\t(lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),\r\n\t\tFXAA_REDUCE_MIN);\r\n\r\n\tfloat rcpDirMvarying = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\r\n\tdir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\r\n\t\tmax(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\r\n\t\tdir * rcpDirMin)) * localTexelSize;\r\n\r\n\tvec4 rgbA = 0.5 * (\r\n\t\ttexture2D(textureSampler, vUV + dir * (1.0 / 3.0 - 0.5)) +\r\n\t\ttexture2D(textureSampler, vUV + dir * (2.0 / 3.0 - 0.5)));\r\n\r\n\tvec4 rgbB = rgbA * 0.5 + 0.25 * (\r\n\t\ttexture2D(textureSampler, vUV + dir *  -0.5) +\r\n\t\ttexture2D(textureSampler, vUV + dir * 0.5));\r\n\tfloat lumaB = dot(rgbB, luma);\r\n\tif ((lumaB < lumaMin) || (lumaB > lumaMax)) {\r\n\t\tgl_FragColor = rgbA;\r\n\t}\r\n\telse {\r\n\t\tgl_FragColor = rgbB;\r\n\t}\r\n}",
        "shaders/segment.fragment.glsl": "\r\nprecision mediump float;\r\n\r\nvarying vec4 v_color;\r\n\r\nuniform vec4 u_segmentColor;\r\n\r\nvoid main(void) {\r\n    gl_FragColor = v_color * u_segmentColor;\r\n}",
        "shaders/segment.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\nattribute vec4 a_color;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvarying vec4 v_color;\r\n\r\nvoid main(void) {\r\n    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);\r\n    v_color = a_color;\r\n}",
        "shaders/shadow.fragment.glsl": "precision mediump float;\r\n\r\nvoid main() {\r\n    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\r\n    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\r\n    vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift); // Calculate the value stored into each byte\r\n    rgbaDepth -= rgbaDepth.gbaa * bitMask; // Cut off the value which do not fit in 8 bits\r\n    gl_FragColor = rgbaDepth;\r\n}",
        "shaders/shadow.vertex.glsl": "attribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/skybox.fragment.glsl": "\r\n\r\nprecision highp float;\r\n\r\nuniform samplerCube s_skyboxTexture;\r\nuniform mat4 u_cameraMatrix;\r\n\r\nvarying vec3 v_worldPos;\r\n\r\n\r\n\r\nvoid main(){\r\n    vec3 viewDir = normalize(v_worldPos - u_cameraMatrix[3].xyz);\r\n    gl_FragColor = textureCube(s_skyboxTexture, viewDir);\r\n}",
        "shaders/skybox.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_cameraMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nuniform float u_skyBoxSize;\r\n\r\nvarying vec3 v_worldPos;\r\n\r\nvoid main(){\r\n    vec3 worldPos = a_position.xyz * u_skyBoxSize + u_cameraMatrix[3].xyz;\r\n    gl_Position = u_viewProjection * vec4(worldPos.xyz,1.0);\r\n    v_worldPos = worldPos;\r\n}",
        "shaders/standard.fragment.glsl": "\r\nprecision mediump float;\r\n\r\n//此处将填充宏定义\r\n#define macros\r\n\r\nvarying vec2 v_uv;\r\nvarying vec3 v_globalPosition;\r\nvarying vec3 v_normal;\r\n\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    varying vec3 v_tangent;\r\n    varying vec3 v_bitangent;\r\n#endif\r\n\r\nuniform mat4 u_cameraMatrix;\r\n\r\n\r\nuniform float u_alphaThreshold;\r\n//漫反射\r\nuniform vec4 u_diffuse;\r\n#ifdef HAS_DIFFUSE_SAMPLER\r\n    uniform sampler2D s_diffuse;\r\n#endif\r\n\r\n//法线贴图\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    uniform sampler2D s_normal;\r\n#endif\r\n\r\n//镜面反射\r\nuniform vec3 u_specular;\r\nuniform float u_glossiness;\r\n#ifdef HAS_SPECULAR_SAMPLER\r\n    uniform sampler2D s_specular;\r\n#endif\r\n\r\nuniform vec4 u_sceneAmbientColor;\r\n\r\n//环境\r\nuniform vec4 u_ambient;\r\n#ifdef HAS_AMBIENT_SAMPLER\r\n    uniform sampler2D s_ambient;\r\n#endif\r\n\r\n#ifdef HAS_TERRAIN_METHOD\r\n    #include<modules/terrain.fragment>\r\n#endif\r\n\r\n#include<modules/pointLightShading.fragment>\r\n\r\n#ifdef HAS_FOG_METHOD\r\n    #include<modules/fog.fragment>\r\n#endif\r\n\r\n#ifdef HAS_ENV_METHOD\r\n    #include<modules/envmap.fragment>\r\n#endif\r\n\r\n#ifdef HAS_PARTICLE_ANIMATOR\r\n    #include<modules/particle.fragment>\r\n#endif\r\n\r\nvoid main(void) {\r\n\r\n    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);\r\n\r\n    //获取法线\r\n    vec3 normal;\r\n    #ifdef HAS_NORMAL_SAMPLER\r\n        normal = texture2D(s_normal,v_uv).xyz * 2.0 - 1.0;\r\n        normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);\r\n    #else\r\n        normal = normalize(v_normal);\r\n    #endif\r\n\r\n    //获取漫反射基本颜色\r\n    vec4 diffuseColor = u_diffuse;\r\n    #ifdef HAS_DIFFUSE_SAMPLER\r\n        diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);\r\n    #endif\r\n\r\n    if(diffuseColor.w < u_alphaThreshold)\r\n    {\r\n        discard;\r\n    }\r\n\r\n    #ifdef HAS_TERRAIN_METHOD\r\n        diffuseColor = terrainMethod(diffuseColor, v_uv);\r\n    #endif\r\n\r\n    //环境光\r\n    vec3 ambientColor = u_ambient.w * u_ambient.xyz * u_sceneAmbientColor.xyz * u_sceneAmbientColor.w;\r\n    #ifdef HAS_AMBIENT_SAMPLER\r\n        ambientColor = ambientColor * texture2D(s_ambient, v_uv).xyz;\r\n    #endif\r\n\r\n    finalColor = diffuseColor;\r\n\r\n    //渲染灯光\r\n    #if NUM_LIGHT > 0\r\n\r\n        //获取高光值\r\n        float glossiness = u_glossiness;\r\n        //获取镜面反射基本颜色\r\n        vec3 specularColor = u_specular;\r\n        #ifdef HAS_SPECULAR_SAMPLER\r\n            vec4 specularMapColor = texture2D(s_specular, v_uv);\r\n            specularColor.xyz = specularMapColor.xyz;\r\n            glossiness = glossiness * specularMapColor.w;\r\n        #endif\r\n        \r\n        finalColor.xyz = pointLightShading(normal, diffuseColor.xyz, specularColor, ambientColor, glossiness);\r\n    #endif\r\n\r\n    #ifdef HAS_ENV_METHOD\r\n        finalColor = envmapMethod(finalColor);\r\n    #endif\r\n\r\n    #ifdef HAS_PARTICLE_ANIMATOR\r\n        finalColor = particleAnimation(finalColor);\r\n    #endif\r\n\r\n    #ifdef HAS_FOG_METHOD\r\n        finalColor = fogMethod(finalColor);\r\n    #endif\r\n\r\n    gl_FragColor = finalColor;\r\n}",
        "shaders/standard.vertex.glsl": "//此处将填充宏定义\r\n#define macros\r\n\r\n//坐标属性\r\nattribute vec3 a_position;\r\nattribute vec2 a_uv;\r\nattribute vec3 a_normal;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvarying vec2 v_uv;\r\nvarying vec3 v_globalPosition;\r\nvarying vec3 v_normal;\r\n\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    attribute vec3 a_tangent;\r\n\r\n    varying vec3 v_tangent;\r\n    varying vec3 v_bitangent;\r\n#endif\r\n\r\n#ifdef HAS_SKELETON_ANIMATION\r\n    #include<modules/skeleton.vertex>\r\n#endif\r\n\r\n#ifdef IS_POINTS_MODE\r\n    uniform float u_PointSize;\r\n#endif\r\n\r\n#ifdef HAS_PARTICLE_ANIMATOR\r\n    #include<modules/particle.vertex>\r\n#endif\r\n\r\nvoid main(void) {\r\n\r\n    vec4 position = vec4(a_position,1.0);\r\n\r\n    #ifdef HAS_SKELETON_ANIMATION\r\n        position = skeletonAnimation(position);\r\n    #endif\r\n    \r\n    #ifdef HAS_PARTICLE_ANIMATOR\r\n        position = particleAnimation(position);\r\n    #endif\r\n\r\n    //获取全局坐标\r\n    vec4 globalPosition = u_modelMatrix * position;\r\n    //计算投影坐标\r\n    gl_Position = u_viewProjection * globalPosition;\r\n    //输出全局坐标\r\n    v_globalPosition = globalPosition.xyz;\r\n    //输出uv\r\n    v_uv = a_uv;\r\n\r\n    //计算法线\r\n    v_normal = normalize((u_modelMatrix * vec4(a_normal,0.0)).xyz);\r\n    #ifdef HAS_NORMAL_SAMPLER\r\n        v_tangent = normalize((u_modelMatrix * vec4(a_tangent,0.0)).xyz);\r\n        v_bitangent = cross(v_normal,v_tangent);\r\n    #endif\r\n    \r\n    #ifdef IS_POINTS_MODE\r\n        gl_PointSize = u_PointSize;\r\n    #endif\r\n}",
        "shaders/texture.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\nuniform sampler2D s_texture;\r\nvarying vec2 v_uv;\r\n\r\n\r\n\r\nvoid main(void) {\r\n\r\n    gl_FragColor = texture2D(s_texture, v_uv);\r\n}\r\n",
        "shaders/texture.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\nattribute vec2 a_uv;\r\n\r\nvarying vec2 v_uv;\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);\r\n    v_uv = a_uv;\r\n}"
    };
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    feng3d.revision = "0.0.0";
    /**
     * 是否开启调试(主要用于断言)
     */
    feng3d.debuger = true;
    /**
     * 初始化引擎
     */
    function initEngine() {
        if (feng3d.initFunctions) {
            for (var i = 0; i < feng3d.initFunctions.length; i++) {
                var element = feng3d.initFunctions[i];
                element();
            }
            delete feng3d.initFunctions;
        }
        if (!isInit) {
            isInit = true;
            console.log("Feng3D version " + this.revision);
            feng3d.ShortCut.init();
            feng3d.SystemTicker.init();
            feng3d.defaultMaterial = new feng3d.StandardMaterial();
            feng3d.defaultGeometry = new feng3d.CubeGeometry();
        }
    }
    feng3d.initEngine = initEngine;
    var isInit = false;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=feng3d.js.map