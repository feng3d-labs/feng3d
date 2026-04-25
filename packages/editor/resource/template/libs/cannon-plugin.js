/*!
 * @feng3d-plugins/cannon-plugin - v0.6.0
 * Compiled Wed, 24 Aug 2022 05:33:39 UTC
 *
 * @feng3d-plugins/cannon-plugin is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
this.feng3d = this.feng3d || {};
var _feng3d_plugins_cannon_plugin = (function (exports, cannon, feng3d) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) { if (Object.prototype.hasOwnProperty.call(b, p)) { d[p] = b[p]; } } };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            { throw new TypeError("Class extends value " + String(b) + " is not a constructor or null"); }
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            var arguments$1 = arguments;

            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments$1[i];
                for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p)) { t[p] = s[p]; } }
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) { if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            { t[p] = s[p]; } }
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            { for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    { t[p[i]] = s[p[i]]; }
            } }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") { r = Reflect.decorate(decorators, target, key, desc); }
        else { for (var i = decorators.length - 1; i >= 0; i--) { if (d = decorators[i]) { r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r; } } }
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") { return Reflect.metadata(metadataKey, metadataValue); }
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) { throw t[1]; } return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) { throw new TypeError("Generator is already executing."); }
            while (_) { try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) { return t; }
                if (y = 0, t) { op = [op[0] & 2, t.value]; }
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) { _.ops.pop(); }
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; } }
            if (op[0] & 5) { throw op[1]; } return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) { k2 = k; }
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
            desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) { k2 = k; }
        o[k2] = m[k];
    });

    function __exportStar(m, o) {
        for (var p in m) { if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) { __createBinding(o, m, p); } }
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) { return m.call(o); }
        if (o && typeof o.length === "number") { return {
            next: function () {
                if (o && i >= o.length) { o = void 0; }
                return { value: o && o[i++], done: !o };
            }
        }; }
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) { return o; }
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) { ar.push(r.value); }
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) { m.call(i); }
            }
            finally { if (e) { throw e.error; } }
        }
        return ar;
    }

    /** @deprecated */
    function __spread() {
        var arguments$1 = arguments;

        for (var ar = [], i = 0; i < arguments.length; i++)
            { ar = ar.concat(__read(arguments$1[i])); }
        return ar;
    }

    /** @deprecated */
    function __spreadArrays() {
        var arguments$1 = arguments;

        for (var s = 0, i = 0, il = arguments.length; i < il; i++) { s += arguments$1[i].length; }
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            { for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                { r[k] = a[j]; } }
        return r;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) { for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) { ar = Array.prototype.slice.call(from, 0, i); }
                ar[i] = from[i];
            }
        } }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) { throw new TypeError("Symbol.asyncIterator is not defined."); }
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; } }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) { resume(q[0][0], q[0][1]); } }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) { throw new TypeError("Symbol.asyncIterator is not defined."); }
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) { return mod; }
        var result = {};
        if (mod != null) { for (var k in mod) { if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) { __createBinding(result, mod, k); } } }
        __setModuleDefault(result, mod);
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f) { throw new TypeError("Private accessor was defined without a getter"); }
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) { throw new TypeError("Cannot read private member from an object whose class did not declare it"); }
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }

    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m") { throw new TypeError("Private method is not writable"); }
        if (kind === "a" && !f) { throw new TypeError("Private accessor was defined without a setter"); }
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) { throw new TypeError("Cannot write private member to an object whose class did not declare it"); }
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    function __classPrivateFieldIn(state, receiver) {
        if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) { throw new TypeError("Cannot use 'in' operator on non-object"); }
        return typeof state === "function" ? receiver === state : state.has(receiver);
    }

    /**
     * 碰撞体
     */
    var Collider = /** @class */ (function (_super) {
        __extends(Collider, _super);
        function Collider() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Collider.prototype, "shape", {
            get: function () {
                return this._shape;
            },
            enumerable: false,
            configurable: true
        });
        Collider = __decorate([
            feng3d.RegisterComponent()
        ], Collider);
        return Collider;
    }(feng3d.Component));

    /**
     * 长方体碰撞体
     */
    var BoxCollider = /** @class */ (function (_super) {
        __extends(BoxCollider, _super);
        function BoxCollider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 宽度
             */
            _this.width = 1;
            /**
             * 高度
             */
            _this.height = 1;
            /**
             * 深度
             */
            _this.depth = 1;
            return _this;
        }
        BoxCollider.prototype.init = function () {
            var halfExtents = new feng3d.Vector3(this.width / 2, this.height / 2, this.depth / 2);
            this._shape = new cannon.Box(halfExtents);
        };
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], BoxCollider.prototype, "width", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], BoxCollider.prototype, "height", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], BoxCollider.prototype, "depth", void 0);
        BoxCollider = __decorate([
            feng3d.AddComponentMenu('Physics/Box Collider'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], BoxCollider);
        return BoxCollider;
    }(Collider));

    /**
     * 胶囊体碰撞体
     */
    var CapsuleCollider = /** @class */ (function (_super) {
        __extends(CapsuleCollider, _super);
        function CapsuleCollider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._radius = 0.5;
            _this._height = 1;
            _this._segmentsW = 16;
            _this._segmentsH = 15;
            _this._yUp = true;
            return _this;
        }
        Object.defineProperty(CapsuleCollider.prototype, "radius", {
            /**
             * 胶囊体半径
             */
            get: function () {
                return this._radius;
            },
            set: function (v) {
                if (this._radius === v)
                    { return; }
                this._radius = v;
                this.invalidateGeometry();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CapsuleCollider.prototype, "height", {
            /**
             * 胶囊体高度
             */
            get: function () {
                return this._height;
            },
            set: function (v) {
                if (this._height === v)
                    { return; }
                this._height = v;
                this.invalidateGeometry();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CapsuleCollider.prototype, "segmentsW", {
            /**
             * 横向分割数
             */
            get: function () {
                return this._segmentsW;
            },
            set: function (v) {
                if (this._segmentsW === v)
                    { return; }
                this._segmentsW = v;
                this.invalidateGeometry();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CapsuleCollider.prototype, "segmentsH", {
            /**
             * 纵向分割数
             */
            get: function () {
                return this._segmentsH;
            },
            set: function (v) {
                if (this._segmentsH === v)
                    { return; }
                this._segmentsH = v;
                this.invalidateGeometry();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CapsuleCollider.prototype, "yUp", {
            /**
             * 正面朝向 true:Y+ false:Z+
             */
            get: function () {
                return this._yUp;
            },
            set: function (v) {
                if (this._yUp === v)
                    { return; }
                this._yUp = v;
                this.invalidateGeometry();
            },
            enumerable: false,
            configurable: true
        });
        CapsuleCollider.prototype.init = function () {
            this.invalidateGeometry();
        };
        CapsuleCollider.prototype.invalidateGeometry = function () {
            var g = new feng3d.CapsuleGeometry();
            g.radius = this._radius;
            g.height = this._height;
            g.segmentsW = this._segmentsW;
            g.segmentsH = this._segmentsH;
            g.yUp = this._yUp;
            g.updateGrometry();
            this._shape = new cannon.Trimesh(g.positions, g.indices);
        };
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], CapsuleCollider.prototype, "radius", null);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], CapsuleCollider.prototype, "height", null);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], CapsuleCollider.prototype, "segmentsW", null);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], CapsuleCollider.prototype, "segmentsH", null);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], CapsuleCollider.prototype, "yUp", null);
        CapsuleCollider = __decorate([
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], CapsuleCollider);
        return CapsuleCollider;
    }(Collider));

    /**
     * 刚体
     */
    var Rigidbody = /** @class */ (function (_super) {
        __extends(Rigidbody, _super);
        function Rigidbody() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.body = new cannon.Body();
            _this.runEnvironment = feng3d.RunEnvironment.feng3d;
            return _this;
        }
        Object.defineProperty(Rigidbody.prototype, "mass", {
            get: function () {
                return this.body.mass;
            },
            set: function (v) {
                this.body.mass = v;
            },
            enumerable: false,
            configurable: true
        });
        Rigidbody.prototype.init = function () {
            var _this = this;
            this.body = new cannon.Body({ mass: this.mass });
            this.body.position = new feng3d.Vector3(this.transform.position.x, this.transform.position.y, this.transform.position.z);
            var colliders = this.gameObject.getComponents(Collider);
            colliders.forEach(function (element) {
                _this.body.addShape(element.shape);
            });
            this.on('transformChanged', this._onTransformChanged, this);
        };
        Rigidbody.prototype._onTransformChanged = function () {
            this.body.position = new feng3d.Vector3(this.transform.position.x, this.transform.position.y, this.transform.position.z);
        };
        /**
         * 每帧执行
         */
        Rigidbody.prototype.update = function (_interval) {
            var scene = this.getComponentsInParent(feng3d.Scene)[0];
            if (scene) {
                this.transform.position = new feng3d.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
            }
        };
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Rigidbody.prototype, "mass", null);
        Rigidbody = __decorate([
            feng3d.AddComponentMenu('Physics/Rigidbody'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], Rigidbody);
        return Rigidbody;
    }(feng3d.Behaviour));

    /**
     * 物理世界组件
     */
    var PhysicsWorld = /** @class */ (function (_super) {
        __extends(PhysicsWorld, _super);
        function PhysicsWorld() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.runEnvironment = feng3d.RunEnvironment.feng3d;
            /**
             * 物理世界
             */
            _this.world = new cannon.World();
            /**
             * 重力加速度
             */
            _this.gravity = new feng3d.Vector3(0, -9.82, 0);
            _this._isInit = false;
            return _this;
        }
        PhysicsWorld.prototype.init = function () {
            _super.prototype.init.call(this);
        };
        PhysicsWorld.prototype.initWorld = function () {
            var _this = this;
            if (this._isInit)
                { return true; }
            this._isInit = true;
            var bodys = this.getComponentsInChildren(Rigidbody).map(function (c) { return c.body; });
            bodys.forEach(function (v) {
                _this.world.addBody(v);
            });
            //
            this.on('addChild', this.onAddChild, this);
            this.on('removeChild', this.onRemoveChild, this);
            this.on('addComponent', this.onAddComponent, this);
            this.on('removeComponent', this.onRemovedComponent, this);
        };
        PhysicsWorld.prototype.onAddComponent = function (e) {
            if (e.data.component instanceof Rigidbody) {
                this.world.addBody(e.data.component.body);
            }
        };
        PhysicsWorld.prototype.onRemovedComponent = function (e) {
            if (e.data.component instanceof Rigidbody) {
                this.world.removeBody(e.data.component.body);
            }
        };
        PhysicsWorld.prototype.onAddChild = function (e) {
            var bodyComponent = e.data.child.getComponent(Rigidbody);
            if (bodyComponent) {
                this.world.addBody(bodyComponent.body);
            }
        };
        PhysicsWorld.prototype.onRemoveChild = function (e) {
            var bodyComponent = e.data.child.getComponent(Rigidbody);
            if (bodyComponent) {
                this.world.removeBody(bodyComponent.body);
            }
        };
        PhysicsWorld.prototype.update = function (interval) {
            this.initWorld();
            this.world.gravity = new feng3d.Vector3(this.gravity.x, this.gravity.y, this.gravity.z);
            this.world.step(1.0 / 60.0, interval / 1000, 3);
        };
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], PhysicsWorld.prototype, "gravity", void 0);
        PhysicsWorld = __decorate([
            feng3d.AddComponentMenu('Physics/PhysicsWorld'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], PhysicsWorld);
        return PhysicsWorld;
    }(feng3d.Behaviour));

    var Cloth = /** @class */ (function (_super) {
        __extends(Cloth, _super);
        function Cloth() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.runEnvironment = feng3d.RunEnvironment.feng3d;
            return _this;
        }
        Cloth.prototype.init = function () {
            _super.prototype.init.call(this);
            var clothMass = 1; // 1 kg in total
            var clothSize = 1; // 1 meter
            var Nx = 12;
            var Ny = 12;
            var mass = clothMass / Nx * Ny;
            var restDistance = clothSize / Nx;
            var clothFunction = plane(restDistance * Nx, restDistance * Ny);
            function plane(width, height) {
                return function (u, v) {
                    var x = (u - 0.5) * width;
                    var y = (v + 0.5) * height;
                    var z = 0;
                    return new feng3d.Vector3(x, y, z);
                };
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            var clothGeometry = this.geometry = new feng3d.ParametricGeometry(clothFunction, Nx, Ny, true);
            var particles = [];
            // Create cannon particles
            for (var i = 0, il = Nx + 1; i !== il; i++) {
                particles.push([]);
                for (var j = 0, jl = Ny + 1; j !== jl; j++) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    var idx = j * (Nx + 1) + i;
                    var p = clothFunction(i / (Nx + 1), j / (Ny + 1));
                    var particle = new cannon.Body({
                        mass: j === Ny ? 0 : mass
                    });
                    particle.addShape(new cannon.Particle());
                    particle.linearDamping = 0.5;
                    particle.position.set(p.x, p.y - Ny * 0.9 * restDistance, p.z);
                    particles[i].push(particle);
                    particle.velocity.set(0, 0, -0.1 * (Ny - j));
                }
            }
            var constraints = [];
            function connect(i1, j1, i2, j2) {
                constraints.push(new cannon.DistanceConstraint(particles[i1][j1], particles[i2][j2], restDistance));
            }
            for (var i = 0; i < Nx + 1; i++) {
                for (var j = 0; j < Ny + 1; j++) {
                    if (i < Nx)
                        { connect(i, j, i + 1, j); }
                    if (j < Ny)
                        { connect(i, j, i, j + 1); }
                }
            }
            this.particles = particles;
            this.constraints = constraints;
        };
        Cloth.prototype.update = function () {
            _super.prototype.update.call(this);
            var physicsWorld = this.getComponentsInParent(PhysicsWorld)[0];
            var world = physicsWorld.world;
            this.particles.forEach(function (p) {
                p.forEach(function (v) {
                    world.addBody(v);
                });
            });
            this.constraints.forEach(function (v) {
                world.addConstraint(v);
            });
        };
        Cloth = __decorate([
            feng3d.RegisterComponent()
        ], Cloth);
        return Cloth;
    }(feng3d.Renderable));

    /**
     * 圆柱体碰撞体
     */
    var CylinderCollider = /** @class */ (function (_super) {
        __extends(CylinderCollider, _super);
        function CylinderCollider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 顶部半径
             */
            _this.topRadius = 0.5;
            /**
             * 底部半径
             */
            _this.bottomRadius = 0.5;
            /**
             * 高度
             */
            _this.height = 2;
            /**
             * 横向分割数
             */
            _this.segmentsW = 16;
            return _this;
        }
        CylinderCollider.prototype.init = function () {
            this._shape = new cannon.Cylinder(this.topRadius, this.bottomRadius, this.height, this.segmentsW);
        };
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], CylinderCollider.prototype, "topRadius", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], CylinderCollider.prototype, "bottomRadius", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], CylinderCollider.prototype, "height", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], CylinderCollider.prototype, "segmentsW", void 0);
        CylinderCollider = __decorate([
            feng3d.AddComponentMenu('Physics/Cylinder Collider'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], CylinderCollider);
        return CylinderCollider;
    }(Collider));

    /**
     * 平面碰撞体
     */
    var PlaneCollider = /** @class */ (function (_super) {
        __extends(PlaneCollider, _super);
        function PlaneCollider() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        PlaneCollider.prototype.init = function () {
            this._shape = new cannon.Plane();
        };
        PlaneCollider = __decorate([
            feng3d.AddComponentMenu('Physics/Plane Collider'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], PlaneCollider);
        return PlaneCollider;
    }(Collider));

    /**
     * 球形碰撞体
     */
    var SphereCollider = /** @class */ (function (_super) {
        __extends(SphereCollider, _super);
        function SphereCollider() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._radius = 0.5;
            return _this;
        }
        Object.defineProperty(SphereCollider.prototype, "radius", {
            /**
             * 半径
             */
            get: function () {
                return this._radius;
            },
            set: function (v) {
                this._radius = v;
                if (this._shape) {
                    this._shape.radius = v;
                }
            },
            enumerable: false,
            configurable: true
        });
        SphereCollider.prototype.init = function () {
            this._shape = new cannon.Sphere(this._radius);
        };
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], SphereCollider.prototype, "radius", null);
        SphereCollider = __decorate([
            feng3d.AddComponentMenu('Physics/Sphere Collider'),
            feng3d.RegisterComponent(),
            feng3d.decoratorRegisterClass()
        ], SphereCollider);
        return SphereCollider;
    }(Collider));

    feng3d.functionwrap.extendFunction(feng3d.GameObject, 'createPrimitive', function (g, type) {
        if (type === 'Cube') {
            g.addComponent(BoxCollider);
            g.addComponent(Rigidbody);
        }
        else if (type === 'Plane') {
            g.addComponent(PlaneCollider);
            g.addComponent(Rigidbody);
        }
        else if (type === 'Cylinder') {
            g.addComponent(CylinderCollider);
            g.addComponent(Rigidbody);
        }
        else if (type === 'Sphere') {
            g.addComponent(SphereCollider);
            g.addComponent(Rigidbody);
        }
        else if (type === 'Capsule') {
            g.addComponent(CapsuleCollider);
            g.addComponent(Rigidbody);
        }
        else if (type === 'Cloth') {
            g.addComponent(Cloth);
        }
        return g;
    });

    // 默认在 Scene.init 添加物理世界模块
    feng3d.functionwrap.extendFunction(feng3d.View, 'createNewScene', function (r) {
        r.gameObject.addComponent(PhysicsWorld);
        return r;
    });

    cannon.World.worldNormal = new feng3d.Vector3(0, 1, 0);

    exports.BoxCollider = BoxCollider;
    exports.CapsuleCollider = CapsuleCollider;
    exports.Cloth = Cloth;
    exports.Collider = Collider;
    exports.CylinderCollider = CylinderCollider;
    exports.PhysicsWorld = PhysicsWorld;
    exports.PlaneCollider = PlaneCollider;
    exports.Rigidbody = Rigidbody;
    exports.SphereCollider = SphereCollider;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, CANNON, feng3d);
Object.assign(this.feng3d, _feng3d_plugins_cannon_plugin);
//# sourceMappingURL=index.js.map
