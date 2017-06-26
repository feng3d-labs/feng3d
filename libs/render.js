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
// Type definitions for WebGL Extensions
// Project: http://webgl.org/
// Definitions by: Arthur Langereis <https://github.com/zenmumbler/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped/webgl-ext
//参考 
//https://www.khronos.org/registry/webgl/specs/latest/2.0/
//https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/webgl-ext/index.d.ts
//使用工具  
//http://regexr.com/
var feng3d;
(function (feng3d) {
    feng3d.GL = WebGL2RenderingContext || WebGLRenderingContext;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GLProxy = (function () {
        function GLProxy(canvas, options) {
            if (options === void 0) { options = null; }
            options = options || {};
            options.preferWebGl2 = false;
            var gl = this.getWebGLContext(canvas, options);
            //
            Object.defineProperty(this, "gl", { value: gl });
            Object.defineProperty(gl, "proxy", { value: this });
            Object.defineProperty(gl, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(gl, "webgl2", { value: !!gl.drawArraysInstanced });
            gl.programs = {};
            //
            new feng3d.GLExtension(gl);
        }
        /**
         * Initialize and get the rendering for WebGL
         * @param canvas <cavnas> element
         * @param opt_debug flag to initialize the context for debugging
         * @return the rendering context for WebGL
         */
        GLProxy.prototype.getWebGLContext = function (canvas, options) {
            if (options === void 0) { options = null; }
            var preferWebGl2 = (options && options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
            var names = preferWebGl2 ? ["webgl2", "experimental-webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
            var gl = null;
            for (var i = 0; i < names.length; ++i) {
                try {
                    gl = canvas.getContext(names[i], options);
                }
                catch (e) { }
                if (gl) {
                    break;
                }
            }
            if (!gl) {
                throw "无法初始化WEBGL";
            }
            return gl;
        };
        return GLProxy;
    }());
    feng3d.GLProxy = GLProxy;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * GL扩展
     */
    var GLExtension = (function () {
        function GLExtension(gl) {
            this.supportIphone(gl);
            this.cacheGLQuery(gl);
            this.extensionWebGL(gl);
            new feng3d.GLProgramExtension(gl);
        }
        /**
         * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
         * @param gl WebGL对象
         */
        GLExtension.prototype.supportIphone = function (gl) {
            for (var key in gl) {
                var element = gl[key];
                if (typeof element == "number" && feng3d.GL[key] == undefined) {
                    feng3d.GL[key] = element;
                }
            }
        };
        /**
         * 扩展GL
         * @param gl GL实例
         */
        GLExtension.prototype.extensionWebGL = function (gl) {
            //
            gl.anisotropicExt =
                gl.getExtension('EXT_texture_filter_anisotropic')
                    || gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
                    || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            gl.maxAnisotropy = gl.getParameter(gl.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            if (!gl.webgl2) {
                var ext = gl.getExtension('OES_standard_derivatives');
                var ext1 = gl.getExtension('EXT_shader_texture_lod');
                gl.vertexAttribDivisor = function (index, divisor) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.vertexAttribDivisorANGLE(index, divisor);
                };
                gl.drawElementsInstanced = function (mode, count, type, offset, instanceCount) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
                };
            }
        };
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        GLExtension.prototype.cacheGLQuery = function (gl) {
            var extensions = {};
            var oldGetExtension = gl.getExtension;
            gl.getExtension = function (name) {
                extensions[name] = extensions[name] || oldGetExtension.apply(gl, arguments);
                return extensions[name];
            };
            //
            var oldGetParameter = gl.getParameter;
            var parameters = {};
            gl.getParameter = function (pname) {
                parameters[pname] = parameters[pname] || oldGetParameter.apply(gl, arguments);
                return parameters[pname];
            };
        };
        return GLExtension;
    }());
    feng3d.GLExtension = GLExtension;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GLProgramExtension = (function () {
        function GLProgramExtension(gl) {
            var oldCreateProgram = gl.createProgram;
            gl.createProgram = function () {
                if (arguments.length == 2) {
                    return createProgram(gl, arguments[0], arguments[1]);
                }
                var webGLProgram = oldCreateProgram.apply(gl, arguments);
                webGLProgram.destroy = function () {
                    gl.deleteProgram(webGLProgram);
                    gl.deleteShader(webGLProgram.fragmentShader);
                    gl.deleteShader(webGLProgram.vertexShader);
                };
                return webGLProgram;
            };
        }
        return GLProgramExtension;
    }());
    feng3d.GLProgramExtension = GLProgramExtension;
    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    function createProgram(gl, vshader, fshader) {
        // Create shader object
        var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
        var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        // Create a program object
        var program = gl.createProgram();
        if (!program) {
            return null;
        }
        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // Link the program object
        gl.linkProgram(program);
        // Check the result of linking
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            var error = gl.getProgramInfoLog(program);
            feng3d.debuger && alert('Failed to link program: ' + error);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            return null;
        }
        program.gl = gl;
        program.vertexShader = vertexShader;
        program.fragmentShader = fragmentShader;
        initProgram(program);
        return program;
    }
    /**
     * 初始化渲染程序
     * @param shaderProgram WebGL渲染程序
     */
    function initProgram(shaderProgram) {
        var gl = shaderProgram.gl;
        //获取属性信息
        var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
        shaderProgram.attributes = [];
        var i = 0;
        while (i < numAttributes) {
            var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
            activeInfo.location = gl.getAttribLocation(shaderProgram, activeInfo.name);
            shaderProgram.attributes.push(activeInfo);
        }
        //获取uniform信息
        var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        shaderProgram.uniforms = [];
        var i = 0;
        var textureID = 0;
        while (i < numUniforms) {
            var activeInfo = gl.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1) {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                activeInfo.uniformBaseName = baseName;
                var uniformLocation = activeInfo.uniformLocation = [];
                for (var j = 0; j < activeInfo.size; j++) {
                    var location = gl.getUniformLocation(shaderProgram, baseName + ("[" + j + "]"));
                    uniformLocation.push(location);
                }
            }
            else {
                activeInfo.uniformLocation = gl.getUniformLocation(shaderProgram, activeInfo.name);
            }
            if (activeInfo.type == feng3d.GL.SAMPLER_2D || activeInfo.type == feng3d.GL.SAMPLER_CUBE) {
                activeInfo.textureID = textureID;
                textureID++;
            }
            shaderProgram.uniforms.push(activeInfo);
        }
    }
    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    function loadShader(gl, type, source) {
        // Create shader object
        var shader = gl.createShader(type);
        if (shader == null) {
            feng3d.debuger && alert('unable to create shader');
            return null;
        }
        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);
        // Check the result of compilation
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var error = gl.getShaderInfoLog(shader);
            feng3d.debuger && alert('Failed to compile shader: ' + error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    var RenderMode = (function () {
        function RenderMode() {
        }
        return RenderMode;
    }());
    feng3d.RenderMode = RenderMode;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        RenderMode.POINTS = feng3d.GL.POINTS;
        RenderMode.LINE_LOOP = feng3d.GL.LINE_LOOP;
        RenderMode.LINE_STRIP = feng3d.GL.LINE_STRIP;
        RenderMode.LINES = feng3d.GL.LINES;
        RenderMode.TRIANGLES = feng3d.GL.TRIANGLES;
        RenderMode.TRIANGLE_STRIP = feng3d.GL.TRIANGLE_STRIP;
        RenderMode.TRIANGLE_FAN = feng3d.GL.TRIANGLE_FAN;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    var BlendFactor = (function () {
        function BlendFactor() {
        }
        return BlendFactor;
    }());
    feng3d.BlendFactor = BlendFactor;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        BlendFactor.ZERO = feng3d.GL.ZERO;
        BlendFactor.ONE = feng3d.GL.ONE;
        BlendFactor.SRC_COLOR = feng3d.GL.SRC_COLOR;
        BlendFactor.ONE_MINUS_SRC_COLOR = feng3d.GL.ONE_MINUS_SRC_COLOR;
        BlendFactor.DST_COLOR = feng3d.GL.DST_COLOR;
        BlendFactor.ONE_MINUS_DST_COLOR = feng3d.GL.ONE_MINUS_DST_COLOR;
        BlendFactor.SRC_ALPHA = feng3d.GL.SRC_ALPHA;
        BlendFactor.ONE_MINUS_SRC_ALPHA = feng3d.GL.ONE_MINUS_SRC_ALPHA;
        BlendFactor.DST_ALPHA = feng3d.GL.DST_ALPHA;
        BlendFactor.ONE_MINUS_DST_ALPHA = feng3d.GL.ONE_MINUS_DST_ALPHA;
        BlendFactor.SRC_ALPHA_SATURATE = feng3d.GL.SRC_ALPHA_SATURATE;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合方法
     */
    var BlendEquation = (function () {
        function BlendEquation() {
        }
        return BlendEquation;
    }());
    feng3d.BlendEquation = BlendEquation;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        BlendEquation.FUNC_ADD = feng3d.GL.FUNC_ADD;
        BlendEquation.FUNC_SUBTRACT = feng3d.GL.FUNC_SUBTRACT;
        BlendEquation.FUNC_REVERSE_SUBTRACT = feng3d.GL.FUNC_REVERSE_SUBTRACT;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var TextureType = (function () {
        function TextureType() {
        }
        return TextureType;
    }());
    feng3d.TextureType = TextureType;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        TextureType.TEXTURE_2D = feng3d.GL.TEXTURE_2D;
        TextureType.TEXTURE_CUBE_MAP = feng3d.GL.TEXTURE_CUBE_MAP;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var RenderElement = (function (_super) {
        __extends(RenderElement, _super);
        function RenderElement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RenderElement.prototype.invalidate = function () {
            this.dispatchEvent(new feng3d.Event(feng3d.Event.CHANGE));
        };
        return RenderElement;
    }(feng3d.EventDispatcher));
    feng3d.RenderElement = RenderElement;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var UniformData = (function (_super) {
        __extends(UniformData, _super);
        function UniformData(name, data) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.data = data;
            return _this;
        }
        return UniformData;
    }(feng3d.RenderElement));
    feng3d.UniformData = UniformData;
    var RenderInstanceCount = (function (_super) {
        __extends(RenderInstanceCount, _super);
        function RenderInstanceCount() {
            var _this = _super.call(this) || this;
            _this.name = "instanceCount";
            return _this;
        }
        return RenderInstanceCount;
    }(feng3d.RenderElement));
    feng3d.RenderInstanceCount = RenderInstanceCount;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ShaderCode = (function (_super) {
        __extends(ShaderCode, _super);
        function ShaderCode(code) {
            var _this = _super.call(this) || this;
            _this.code = code;
            return _this;
        }
        Object.defineProperty(ShaderCode.prototype, "code", {
            /**
             * 渲染程序代码
             */
            get: function () {
                return this._code;
            },
            set: function (value) {
                this._code = value;
                this.dispatchEvent(new feng3d.Event(feng3d.Event.CHANGE));
            },
            enumerable: true,
            configurable: true
        });
        return ShaderCode;
    }(feng3d.RenderElement));
    feng3d.ShaderCode = ShaderCode;
    var MacroType;
    (function (MacroType) {
        MacroType[MacroType["value"] = 0] = "value";
        MacroType[MacroType["bool"] = 1] = "bool";
        MacroType[MacroType["add"] = 2] = "add";
    })(MacroType = feng3d.MacroType || (feng3d.MacroType = {}));
    var Macro = (function (_super) {
        __extends(Macro, _super);
        function Macro() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Macro;
    }(feng3d.RenderElement));
    feng3d.Macro = Macro;
    var ValueMacro = (function (_super) {
        __extends(ValueMacro, _super);
        function ValueMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.value;
            return _this;
        }
        return ValueMacro;
    }(Macro));
    feng3d.ValueMacro = ValueMacro;
    var BoolMacro = (function (_super) {
        __extends(BoolMacro, _super);
        function BoolMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.bool;
            return _this;
        }
        return BoolMacro;
    }(Macro));
    feng3d.BoolMacro = BoolMacro;
    var AddMacro = (function (_super) {
        __extends(AddMacro, _super);
        function AddMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.add;
            return _this;
        }
        return AddMacro;
    }(Macro));
    feng3d.AddMacro = AddMacro;
    var ShaderParam = (function (_super) {
        __extends(ShaderParam, _super);
        function ShaderParam(name) {
            var _this = _super.call(this) || this;
            _this.name = name;
            return _this;
        }
        return ShaderParam;
    }(feng3d.RenderElement));
    feng3d.ShaderParam = ShaderParam;
    var ShaderRenderData = (function () {
        function ShaderRenderData() {
            //
            this._invalid = true;
            /**
             * 渲染参数
             */
            this.shaderParams = {};
            this.macros = [];
            Object.defineProperty(this, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(this, "version", { value: 0, writable: true });
        }
        ShaderRenderData.prototype.setShaderCode = function (shaderCode) {
            this.shaderCode = shaderCode;
        };
        ShaderRenderData.prototype.addMacro = function (macro) {
            var index = this.macros.indexOf(macro);
            if (index == -1) {
                this.macros.push(macro);
            }
        };
        ShaderRenderData.prototype.removeMacro = function (macro) {
            var index = this.macros.indexOf(macro);
            if (index != -1) {
                this.macros.splice(index, 1);
            }
        };
        /**
         * 激活渲染程序
         */
        ShaderRenderData.prototype.activeShaderProgram = function (gl) {
            if (!this.shaderCode || !this.shaderCode.code)
                return null;
            // if (this._invalid)
            {
                //应用宏
                var shaderMacroStr = this.getMacroCode(this.macros);
                if (this.shaderCode.code instanceof Function) {
                    var code = this.shaderCode.code();
                    var vertexCode = code.vertexCode;
                    var fragmentCode = code.fragmentCode;
                }
                else {
                    var vertexCode = this.shaderCode.code.vertexCode;
                    var fragmentCode = this.shaderCode.code.fragmentCode;
                }
                this._resultVertexCode = vertexCode.replace(/#define\s+macros/, shaderMacroStr);
                this._resultFragmentCode = fragmentCode.replace(/#define\s+macros/, shaderMacroStr);
                this.version++;
            }
            //渲染程序
            var shaderProgram = gl.programs[this.uuid];
            if (shaderProgram) {
                if (shaderProgram.vertexCode != this._resultVertexCode || shaderProgram.fragmentCode != this._resultFragmentCode) 
                // if (shaderProgram.version != this.version)
                {
                    shaderProgram.destroy();
                    shaderProgram = null;
                    delete gl.programs[this.uuid];
                }
            }
            if (!shaderProgram) {
                shaderProgram = gl.programs[this.uuid] = gl.createProgram(this._resultVertexCode, this._resultFragmentCode);
                shaderProgram.version = this.version;
                shaderProgram.vertexCode = this._resultVertexCode;
                shaderProgram.fragmentCode = this._resultFragmentCode;
            }
            gl.useProgram(shaderProgram);
            return shaderProgram;
        };
        ShaderRenderData.prototype.invalidate = function () {
            this._invalid = true;
        };
        ShaderRenderData.prototype.getMacroCode = function (macros) {
            var macro = { valueMacros: {}, boolMacros: {}, addMacros: {} };
            for (var i = 0; i < macros.length; i++) {
                var element = macros[i];
                var value = element.value;
                if (value instanceof Function) {
                    value = value();
                }
                switch (element.type) {
                    case MacroType.value:
                        macro.valueMacros[element.name] = value;
                        break;
                    case MacroType.bool:
                        macro.boolMacros[element.name] = macro.boolMacros[element.name] || value;
                        break;
                    case MacroType.add:
                        macro.boolMacros[element.name] = ~~macro.boolMacros[element.name] + value;
                        break;
                }
            }
            var macroHeader = "";
            var macroNames = Object.keys(macro.valueMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.valueMacros[macroName];
                macroHeader += "#define " + macroName + " " + value + "\n";
            });
            macroNames = Object.keys(macro.boolMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.boolMacros[macroName];
                value && (macroHeader += "#define " + macroName + "\n");
            });
            macroNames = Object.keys(macro.addMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.addMacros[macroName];
                macroHeader += "#define " + macroName + " " + value + "\n";
            });
            return macroHeader;
        };
        return ShaderRenderData;
    }());
    feng3d.ShaderRenderData = ShaderRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    var RenderAtomic = (function () {
        function RenderAtomic() {
            this.elements = [];
            /**
             * 渲染程序
             */
            this.shader = new feng3d.ShaderRenderData();
            /**
             * 属性数据列表
             */
            this.attributes = {};
            /**
             * Uniform渲染数据
             */
            this.uniforms = {};
        }
        RenderAtomic.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.addUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.addAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    this.indexBuffer = element;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.addMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(element);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    this.instanceCount = element.data;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    this.shader.shaderParams[element.name] = element.value;
                }
                else {
                    throw "未知RenderElement！";
                }
                element.addEventListener(feng3d.Event.CHANGE, this.onElementChange, this);
                this.elements.push(element);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.removeUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.removeAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    delete this.indexBuffer;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.removeMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(null);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    delete this.instanceCount;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    delete this.shader.shaderParams[element.name];
                }
                else {
                    throw "未知RenderElement！";
                }
                element.removeEventListener(feng3d.Event.CHANGE, this.onElementChange, this);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.onElementChange = function (event) {
            var element = event.target;
            if (element instanceof feng3d.UniformData) {
            }
            else if (element instanceof feng3d.AttributeRenderData) {
            }
            else if (element instanceof feng3d.IndexRenderData) {
            }
            else if (element instanceof feng3d.Macro) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.ShaderCode) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.RenderInstanceCount) {
            }
            else if (element instanceof feng3d.ShaderParam) {
            }
            else {
                throw "未知RenderElement！";
            }
        };
        RenderAtomic.prototype.addUniform = function (uniformData) {
            this.uniforms[uniformData.name] = uniformData;
        };
        RenderAtomic.prototype.removeUniform = function (uniformData) {
            delete this.uniforms[uniformData.name];
        };
        RenderAtomic.prototype.addAttribute = function (attributeData) {
            this.attributes[attributeData.name] = attributeData;
        };
        RenderAtomic.prototype.removeAttribute = function (attributeData) {
            delete this.attributes[attributeData.name];
        };
        RenderAtomic.prototype.setIndexBuffer = function (indexBuffer) {
            this.indexBuffer = indexBuffer;
        };
        RenderAtomic.prototype.invalidateShader = function () {
            this.shader.invalidate();
        };
        /**
         * 激活属性
         */
        RenderAtomic.prototype.activeAttributes = function (gl, attributeInfos) {
            for (var i = 0; i < attributeInfos.length; i++) {
                var activeInfo = attributeInfos[i];
                var buffer = this.attributes[activeInfo.name];
                buffer.active(gl, activeInfo.location);
            }
        };
        /**
         * 激活常量
         */
        RenderAtomic.prototype.activeUniforms = function (gl, uniformInfos) {
            for (var o = 0; o < uniformInfos.length; o++) {
                var activeInfo = uniformInfos[o];
                if (activeInfo.uniformBaseName) {
                    var baseName = activeInfo.uniformBaseName;
                    var uniformData = this.uniforms[baseName];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    //处理数组
                    for (var j = 0; j < activeInfo.size; j++) {
                        this.setContext3DUniform(gl, { name: baseName + ("[" + j + "]"), type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID }, uniformData[j]);
                    }
                }
                else {
                    var uniformData = this.uniforms[activeInfo.name];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    this.setContext3DUniform(gl, activeInfo, uniformData);
                }
            }
        };
        /**
         * 设置环境Uniform数据
         */
        RenderAtomic.prototype.setContext3DUniform = function (gl, activeInfo, data) {
            var location = activeInfo.uniformLocation;
            switch (activeInfo.type) {
                case feng3d.GL.INT:
                    gl.uniform1i(location, data);
                    break;
                case feng3d.GL.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, data.rawData);
                    break;
                case feng3d.GL.FLOAT:
                    gl.uniform1f(location, data);
                    break;
                case feng3d.GL.FLOAT_VEC2:
                    gl.uniform2f(location, data.x, data.y);
                    break;
                case feng3d.GL.FLOAT_VEC3:
                    gl.uniform3f(location, data.x, data.y, data.z);
                    break;
                case feng3d.GL.FLOAT_VEC4:
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
                    break;
                case feng3d.GL.SAMPLER_2D:
                case feng3d.GL.SAMPLER_CUBE:
                    var textureInfo = data;
                    //激活纹理编号
                    gl.activeTexture(feng3d.GL["TEXTURE" + activeInfo.textureID]);
                    textureInfo.active(gl);
                    //设置纹理所在采样编号
                    gl.uniform1i(location, activeInfo.textureID);
                    break;
                default:
                    throw "\u65E0\u6CD5\u8BC6\u522B\u7684uniform\u7C7B\u578B " + activeInfo.name + " " + data;
            }
        };
        /**
         */
        RenderAtomic.prototype.dodraw = function (gl) {
            var instanceCount = this.instanceCount;
            if (instanceCount instanceof Function) {
                instanceCount = instanceCount();
            }
            instanceCount = ~~instanceCount;
            var indexBuffer = this.indexBuffer;
            var shaderParams = this.shader.shaderParams;
            indexBuffer.active(gl);
            var renderMode = shaderParams.renderMode;
            if (renderMode instanceof Function)
                renderMode = renderMode();
            if (instanceCount > 1) {
                gl.drawElementsInstanced(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount);
            }
            else {
                gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
            }
        };
        return RenderAtomic;
    }());
    feng3d.RenderAtomic = RenderAtomic;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    var IndexRenderData = (function (_super) {
        __extends(IndexRenderData, _super);
        function IndexRenderData() {
            var _this = _super.call(this) || this;
            /**
             * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
             */
            _this.type = feng3d.GL.UNSIGNED_SHORT;
            /**
             * 索引偏移
             */
            _this.offset = 0;
            /**
             * 缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(IndexRenderData.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indices;
            },
            set: function (value) {
                if (this._indices == value)
                    return;
                this._indices = value;
                this._invalid = true;
                this.count = this.indices ? this.indices.length : 0;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 激活缓冲
         * @param gl
         */
        IndexRenderData.prototype.active = function (gl) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
        };
        /**
         * 获取缓冲
         */
        IndexRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ELEMENT_ARRAY_BUFFER, this.indices, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        IndexRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        IndexRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            var indices = new Uint16Array(this.indices.length);
            indices.set(this.indices, 0);
            ins.indices = indices;
            ins.count = this.count;
            ins.type = this.type;
            ins.offset = this.offset;
            return ins;
        };
        return IndexRenderData;
    }(feng3d.RenderElement));
    feng3d.IndexRenderData = IndexRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    var AttributeRenderData = (function (_super) {
        __extends(AttributeRenderData, _super);
        function AttributeRenderData(name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var _this = _super.call(this) || this;
            _this._size = 3;
            /**
             *  A GLenum specifying the data type of each component in the array. Possible values:
                    - gl.BYTE: signed 8-bit integer, with values in [-128, 127]
                    - gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
                    - gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
                    - gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
                    - gl.FLOAT: 32-bit floating point number
                When using a WebGL 2 context, the following values are available additionally:
                   - gl.HALF_FLOAT: 16-bit floating point number
             */
            _this.type = feng3d.GL.FLOAT;
            /**
             * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
                  -  If true, signed integers are normalized to [-1, 1].
                  -  If true, unsigned integers are normalized to [0, 1].
                  -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
             */
            _this.normalized = false;
            /**
             * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
             */
            _this.stride = 0;
            /**
             * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
             */
            _this.offset = 0;
            _this._divisor = 0;
            /**
             * 顶点数据缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            _this.name = name;
            _this._data = data;
            _this._size = size;
            _this._divisor = divisor;
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(AttributeRenderData.prototype, "data", {
            /**
             * 属性数据
             */
            get: function () { return this._data; },
            set: function (value) { this.invalidate(); this._data = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "size", {
            /**
             * 数据尺寸
             *
             * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
             */
            get: function () { return this._size; },
            set: function (value) { this.invalidate(); this._size = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "divisor", {
            /**
             * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
             *
             * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
             * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
             */
            get: function () { return this._divisor; },
            set: function (value) { this.invalidate(); this._divisor = value; },
            enumerable: true,
            configurable: true
        });
        /**
         * 使数据缓冲失效
         */
        AttributeRenderData.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        AttributeRenderData.prototype.active = function (gl, location) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.size, this.type, this.normalized, this.stride, this.offset);
            if (this.divisor > 0) {
                gl.vertexAttribDivisor(location, this.divisor);
            }
        };
        /**
         * 获取缓冲
         */
        AttributeRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                buffer.uuid = Math.generateUUID();
                gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ARRAY_BUFFER, this.data, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        AttributeRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        AttributeRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            ins.name = this.name;
            ins.data = new Float32Array(this.data.length);
            ins.data.set(this.data, 0);
            ins.size = this.size;
            ins.divisor = this.divisor;
            return ins;
        };
        return AttributeRenderData;
    }(feng3d.RenderElement));
    feng3d.AttributeRenderData = AttributeRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    var TextureInfo = (function (_super) {
        __extends(TextureInfo, _super);
        /**
         * 构建纹理
         */
        function TextureInfo() {
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._size = new feng3d.Point(100, 100);
            _this._format = feng3d.GL.RGB;
            _this._type = feng3d.GL.UNSIGNED_BYTE;
            _this._generateMipmap = false;
            _this._flipY = false;
            _this._premulAlpha = false;
            _this.minFilter = feng3d.GL.LINEAR;
            _this.magFilter = feng3d.GL.LINEAR;
            /**
             * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
             */
            _this.wrapS = feng3d.GL.REPEAT;
            /**
             * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
             */
            _this.wrapT = feng3d.GL.REPEAT;
            /**
             * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
             */
            _this.anisotropy = 0;
            /**
             * 纹理缓冲
             */
            _this._textureMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(TextureInfo.prototype, "textureType", {
            /**
             * 纹理类型
             */
            get: function () { return this._textureType; },
            set: function (value) { this._textureType = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "pixels", {
            /**
             * 图片数据
             */
            get: function () { return this._pixels; },
            set: function (value) { this._pixels = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "width", {
            /**
             * 纹理宽度
             */
            get: function () {
                var o = {};
                if (this._pixels && this._pixels.hasOwnProperty("width"))
                    return this._pixels["width"];
                return this._width;
            },
            set: function (value) { this._width = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "height", {
            /**
             * 纹理高度
             */
            get: function () {
                var o = {};
                if (this._pixels && this._pixels.hasOwnProperty("height"))
                    return this._pixels["height"];
                return this._height;
            },
            set: function (value) { this._height = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "size", {
            /**
             * 纹理尺寸
             */
            get: function () { this._size.setTo(this.width, this.height); return this._size; },
            set: function (value) { this.width = value.x; this.height = value.y; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "format", {
            /**
             * 格式
             */
            get: function () { return this._format; },
            set: function (value) { this._format = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "type", {
            /**
             * 数据类型
             */
            get: function () { return this._type; },
            set: function (value) { this._type = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "generateMipmap", {
            /**
             * 是否生成mipmap
             */
            get: function () { return this._generateMipmap; },
            set: function (value) { this._generateMipmap = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "flipY", {
            /**
             * 对图像进行Y轴反转。默认值为false
             */
            get: function () { return this._flipY; },
            set: function (value) { this._flipY = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "premulAlpha", {
            /**
             * 将图像RGB颜色值得每一个分量乘以A。默认为false
             */
            get: function () { return this._premulAlpha; },
            set: function (value) { this._premulAlpha = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        /**
         * 判断数据是否满足渲染需求
         */
        TextureInfo.prototype.checkRenderData = function () {
            feng3d.debuger && feng3d.assert(false);
            return false;
        };
        /**
         * 使纹理失效
         */
        TextureInfo.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         * 激活纹理
         * @param gl
         */
        TextureInfo.prototype.active = function (gl) {
            if (!this.checkRenderData())
                return;
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var texture = this.getTexture(gl);
            //绑定纹理
            gl.bindTexture(this._textureType, texture);
            //设置纹理参数
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MAG_FILTER, this.magFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_T, this.wrapT);
            //
            if (this.anisotropy) {
                if (gl.anisotropicExt) {
                    gl.texParameterf(gl.TEXTURE_2D, gl.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, gl.maxAnisotropy));
                }
                else {
                    feng3d.debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
                }
            }
        };
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        TextureInfo.prototype.getTexture = function (gl) {
            var texture = this._textureMap.get(gl);
            if (!texture) {
                texture = gl.createTexture(); // Create a texture object
                texture.uuid = Math.generateUUID();
                //设置图片y轴方向
                gl.pixelStorei(feng3d.GL.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(this._textureType, texture);
                if (this._textureType == feng3d.GL.TEXTURE_2D) {
                    //设置纹理图片
                    this.initTexture2D(gl);
                }
                else if (this._textureType == feng3d.GL.TEXTURE_CUBE_MAP) {
                    this.initTextureCube(gl);
                }
                if (this._generateMipmap) {
                    gl.generateMipmap(this._textureType);
                }
                this._textureMap.push(gl, texture);
            }
            return texture;
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTexture2D = function (gl) {
            gl.texImage2D(this._textureType, 0, this._format, this._format, this._type, this._pixels);
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTextureCube = function (gl) {
            var faces = [
                feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
                feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];
            for (var i = 0; i < faces.length; i++) {
                gl.texImage2D(faces[i], 0, this._format, this._format, this._type, this._pixels[i]);
            }
        };
        /**
         * 清理纹理
         */
        TextureInfo.prototype.clear = function () {
            var gls = this._textureMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteTexture(this._textureMap.get(gls[i]));
            }
            this._textureMap.clear();
        };
        return TextureInfo;
    }(feng3d.EventDispatcher));
    feng3d.TextureInfo = TextureInfo;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
})(feng3d || (feng3d = {}));
//# sourceMappingURL=render.js.map