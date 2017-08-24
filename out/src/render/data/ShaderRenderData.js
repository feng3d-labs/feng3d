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
                this.dispatch("change");
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
            _this.type = MacroType.value;
            _this.name = name;
            _this.value = value;
            return _this;
        }
        return ValueMacro;
    }(Macro));
    feng3d.ValueMacro = ValueMacro;
    var BoolMacro = (function (_super) {
        __extends(BoolMacro, _super);
        function BoolMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.type = MacroType.bool;
            _this.name = name;
            _this.value = value;
            return _this;
        }
        return BoolMacro;
    }(Macro));
    feng3d.BoolMacro = BoolMacro;
    var AddMacro = (function (_super) {
        __extends(AddMacro, _super);
        function AddMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.type = MacroType.add;
            _this.name = name;
            _this.value = value;
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
//# sourceMappingURL=ShaderRenderData.js.map