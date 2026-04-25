/*!
 * @feng3d-plugins/cannon - v0.6.0
 * Compiled Wed, 24 Aug 2022 05:32:32 UTC
 *
 * @feng3d-plugins/cannon is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
this.CANNON = this.CANNON || {};
var _feng3d_plugins_cannon = (function (exports, feng3d) {
    'use strict';

    var Transform = /** @class */ (function () {
        function Transform(position, quaternion) {
            if (position === void 0) { position = new feng3d.Vector3(); }
            if (quaternion === void 0) { quaternion = new feng3d.Quaternion(); }
            this.position = position;
            this.quaternion = quaternion;
        }
        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        Transform.pointToLocalFrame = function (position, quaternion, worldPoint, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            worldPoint.subTo(position, result);
            quaternion.inverseTo(tmpQuat$1);
            tmpQuat$1.vmult(result, result);
            return result;
        };
        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        Transform.prototype.pointToLocal = function (worldPoint, result) {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        };
        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        Transform.pointToWorldFrame = function (position, quaternion, localPoint, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            quaternion.vmult(localPoint, result);
            result.addTo(position, result);
            return result;
        };
        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        Transform.prototype.pointToWorld = function (localPoint, result) {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        };
        Transform.prototype.vectorToWorldFrame = function (localVector, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            this.quaternion.vmult(localVector, result);
            return result;
        };
        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        Transform.prototype.toLocalFrameBox3 = function (box3, target) {
            var corners = transformIntoFrameCorners;
            // Get corners in current frame
            box3.toPoints(corners);
            // Transform them to new local frame
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                this.pointToLocal(corner, corner);
            }
            return target.fromPoints(corners);
        };
        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        Transform.prototype.toWorldFrameBox3 = function (box3, target) {
            var corners = transformIntoFrameCorners;
            // Get corners in current frame
            box3.toPoints(corners);
            // Transform them to new local frame
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                this.pointToWorld(corner, corner);
            }
            return target.fromPoints(corners);
        };
        Transform.vectorToWorldFrame = function (quaternion, localVector, result) {
            quaternion.vmult(localVector, result);
            return result;
        };
        Transform.vectorToLocalFrame = function (position, quaternion, worldVector, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        };
        return Transform;
    }());
    var tmpQuat$1 = new feng3d.Quaternion();
    var transformIntoFrameCorners = [
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3()
    ];

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

    var Shape = /** @class */ (function () {
        /**
         * Base class for shapes
         *
         * @param options
         * @author schteppe
         */
        function Shape(options) {
            if (options === void 0) { options = {}; }
            this.id = Shape.idCounter++;
            this.type = options.type || 0;
            this.boundingSphereRadius = 0;
            this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;
            this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;
            this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;
            this.material = options.material ? options.material : null;
            this.body = null;
        }
        /**
         * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
         */
        Shape.prototype.updateBoundingSphereRadius = function () {
            throw "computeBoundingSphereRadius() not implemented for shape type " + this.type;
        };
        /**
         * Get the volume of this shape
         */
        Shape.prototype.volume = function () {
            throw "volume() not implemented for shape type " + this.type;
        };
        /**
         * Calculates the inertia in the local frame for this shape.
         * @param _mass
         * @param _target
         * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
         */
        Shape.prototype.calculateLocalInertia = function (_mass, _target) {
            throw "calculateLocalInertia() not implemented for shape type " + this.type;
        };
        Shape.prototype.calculateWorldAABB = function (_pos, _quat, _min, _max) {
            throw '未实现';
        };
        Shape.idCounter = 0;
        /**
         * The available shape types.
         */
        Shape.types = {
            SPHERE: 1,
            PLANE: 2,
            BOX: 4,
            COMPOUND: 8,
            CONVEXPOLYHEDRON: 16,
            HEIGHTFIELD: 32,
            PARTICLE: 64,
            CYLINDER: 128,
            TRIMESH: 256
        };
        return Shape;
    }());

    var ConvexPolyhedron = /** @class */ (function (_super) {
        __extends(ConvexPolyhedron, _super);
        /**
         * A set of polygons describing a convex shape.
         * @class ConvexPolyhedron
         * @constructor
         * @extends Shape
         * @description The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
         * in the same 3D plane), instead these should be merged into one polygon.
         *
         * @param {array} points An array of Vec3's
         * @param {array} faces Array of integer arrays, describing which vertices that is included in each face.
         *
         * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
         * @author schteppe / https://github.com/schteppe
         * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         *
         * @todo Move the clipping functions to ContactGenerator?
         * @todo Automatically merge coplanar polygons in constructor.
         */
        function ConvexPolyhedron(points, faces, uniqueAxes) {
            var _this = _super.call(this, {
                type: Shape.types.CONVEXPOLYHEDRON
            }) || this;
            _this.vertices = points || [];
            _this.worldVertices = []; // World transformed version of .vertices
            _this.worldVerticesNeedsUpdate = true;
            _this.faces = faces || [];
            _this.faceNormals = [];
            _this.computeNormals();
            _this.worldFaceNormalsNeedsUpdate = true;
            _this.worldFaceNormals = []; // World transformed version of .faceNormals
            _this.uniqueEdges = [];
            _this.uniqueAxes = uniqueAxes ? uniqueAxes.slice() : null;
            _this.computeEdges();
            _this.updateBoundingSphereRadius();
            return _this;
        }
        /**
         * Computes uniqueEdges
         */
        ConvexPolyhedron.prototype.computeEdges = function () {
            var faces = this.faces;
            var vertices = this.vertices;
            // const nv = vertices.length;
            var edges = this.uniqueEdges;
            edges.length = 0;
            var edge = computeEdgesTmpEdge;
            for (var i = 0; i !== faces.length; i++) {
                var face = faces[i];
                var numVertices = face.length;
                for (var j = 0; j !== numVertices; j++) {
                    var k = (j + 1) % numVertices;
                    vertices[face[j]].subTo(vertices[face[k]], edge);
                    edge.normalize();
                    var found = false;
                    for (var p = 0; p !== edges.length; p++) {
                        if (edges[p].equals(edge) || edges[p].equals(edge)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        edges.push(edge.clone());
                    }
                }
            }
        };
        /**
         * Compute the normals of the faces. Will reuse existing Vec3 objects in the .faceNormals array if they exist.
         */
        ConvexPolyhedron.prototype.computeNormals = function () {
            this.faceNormals.length = this.faces.length;
            // Generate normals
            for (var i = 0; i < this.faces.length; i++) {
                // Check so all vertices exists for this face
                for (var j = 0; j < this.faces[i].length; j++) {
                    if (!this.vertices[this.faces[i][j]]) {
                        throw new Error("Vertex " + this.faces[i][j] + " not found!");
                    }
                }
                var n = this.faceNormals[i] || new feng3d.Vector3();
                this.getFaceNormal(i, n);
                n.negateTo(n);
                this.faceNormals[i] = n;
                var vertex = this.vertices[this.faces[i][0]];
                if (n.dot(vertex) < 0) {
                    console.error(".faceNormals[" + i + "] = Vec3(" + n.toString() + ") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
                    for (var j = 0; j < this.faces[i].length; j++) {
                        console.warn(".vertices[" + this.faces[i][j] + "] = Vec3(" + this.vertices[this.faces[i][j]].toString() + ")");
                    }
                }
            }
        };
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        ConvexPolyhedron.computeNormal = function (va, vb, vc, target) {
            vb.subTo(va, ab$1);
            vc.subTo(vb, cb$1);
            cb$1.crossTo(ab$1, target);
            if (!target.isZero()) {
                target.normalize();
            }
        };
        /**
         * Compute the normal of a face from its vertices
         *
         * @param i
         * @param target
         */
        ConvexPolyhedron.prototype.getFaceNormal = function (i, target) {
            var f = this.faces[i];
            var va = this.vertices[f[0]];
            var vb = this.vertices[f[1]];
            var vc = this.vertices[f[2]];
            return ConvexPolyhedron.computeNormal(va, vb, vc, target);
        };
        /**
         * @param posA
         * @param quatA
         * @param hullB
         * @param posB
         * @param quatB
         * @param separatingNormal
         * @param minDist Clamp distance
         * @param maxDist
         * @param result The an array of contact point objects, see clipFaceAgainstHull
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         */
        ConvexPolyhedron.prototype.clipAgainstHull = function (posA, quatA, hullB, posB, quatB, separatingNormal, minDist, maxDist, result) {
            var WorldNormal = cahWorldNormal;
            // const hullA = this;
            // const curMaxDist = maxDist;
            var closestFaceB = -1;
            var dmax = -Number.MAX_VALUE;
            for (var face = 0; face < hullB.faces.length; face++) {
                WorldNormal.copy(hullB.faceNormals[face]);
                quatB.vmult(WorldNormal, WorldNormal);
                // posB.addTo(WorldNormal,WorldNormal);
                var d = WorldNormal.dot(separatingNormal);
                if (d > dmax) {
                    dmax = d;
                    closestFaceB = face;
                }
            }
            var worldVertsB1 = [];
            var polyB = hullB.faces[closestFaceB];
            var numVertices = polyB.length;
            for (var e0 = 0; e0 < numVertices; e0++) {
                var b = hullB.vertices[polyB[e0]];
                var worldb = new feng3d.Vector3();
                worldb.copy(b);
                quatB.vmult(worldb, worldb);
                posB.addTo(worldb, worldb);
                worldVertsB1.push(worldb);
            }
            if (closestFaceB >= 0) {
                this.clipFaceAgainstHull(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result);
            }
        };
        /**
         * Find the separating axis between this hull and another
         *
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @param target The target vector to save the axis in
         * @param faceListA
         * @param faceListB
         * @returns Returns false if a separation is found, else true
         */
        ConvexPolyhedron.prototype.findSeparatingAxis = function (hullB, posA, quatA, posB, quatB, target, faceListA, faceListB) {
            var faceANormalWS3 = fsaFaceANormalWS3;
            var Worldnormal1 = fsaWorldnormal1;
            var deltaC = fsaDeltaC;
            var worldEdge0 = fsaWorldEdge0;
            var worldEdge1 = fsaWorldEdge1;
            var Cross = fsaCross;
            var dmin = Number.MAX_VALUE;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var hullA = this;
            var curPlaneTests = 0;
            if (!hullA.uniqueAxes) {
                var numFacesA = faceListA ? faceListA.length : hullA.faces.length;
                // Test face normals from hullA
                for (var i = 0; i < numFacesA; i++) {
                    var fi = faceListA ? faceListA[i] : i;
                    // Get world face normal
                    faceANormalWS3.copy(hullA.faceNormals[fi]);
                    quatA.vmult(faceANormalWS3, faceANormalWS3);
                    var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }
            }
            else {
                // Test unique axes
                for (var i = 0; i !== hullA.uniqueAxes.length; i++) {
                    // Get world axis
                    quatA.vmult(hullA.uniqueAxes[i], faceANormalWS3);
                    var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(faceANormalWS3);
                    }
                }
            }
            if (!hullB.uniqueAxes) {
                // Test face normals from hullB
                var numFacesB = faceListB ? faceListB.length : hullB.faces.length;
                for (var i = 0; i < numFacesB; i++) {
                    var fi = faceListB ? faceListB[i] : i;
                    Worldnormal1.copy(hullB.faceNormals[fi]);
                    quatB.vmult(Worldnormal1, Worldnormal1);
                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            }
            else {
                // Test unique axes in B
                for (var i = 0; i !== hullB.uniqueAxes.length; i++) {
                    quatB.vmult(hullB.uniqueAxes[i], Worldnormal1);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    curPlaneTests++;
                    var d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                    if (d === false) {
                        return false;
                    }
                    if (d < dmin) {
                        dmin = d;
                        target.copy(Worldnormal1);
                    }
                }
            }
            // Test edges
            for (var e0 = 0; e0 !== hullA.uniqueEdges.length; e0++) {
                // Get world edge
                quatA.vmult(hullA.uniqueEdges[e0], worldEdge0);
                for (var e1 = 0; e1 !== hullB.uniqueEdges.length; e1++) {
                    // Get world edge 2
                    quatB.vmult(hullB.uniqueEdges[e1], worldEdge1);
                    worldEdge0.crossTo(worldEdge1, Cross);
                    if (!Cross.equals(feng3d.Vector3.ZERO)) {
                        Cross.normalize();
                        var dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB);
                        if (dist === false) {
                            return false;
                        }
                        if (dist < dmin) {
                            dmin = dist;
                            target.copy(Cross);
                        }
                    }
                }
            }
            posB.subTo(posA, deltaC);
            if ((deltaC.dot(target)) > 0.0) {
                target.negateTo(target);
            }
            return true;
        };
        /**
         * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
         *
         * @param axis
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @return The overlap depth, or FALSE if no penetration.
         */
        ConvexPolyhedron.prototype.testSepAxis = function (axis, hullB, posA, quatA, posB, quatB) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var hullA = this;
            ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA);
            ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB);
            var maxA = maxminA[0];
            var minA = maxminA[1];
            var maxB = maxminB[0];
            var minB = maxminB[1];
            if (maxA < minB || maxB < minA) {
                return false; // Separated
            }
            var d0 = maxA - minB;
            var d1 = maxB - minA;
            var depth = d0 < d1 ? d0 : d1;
            return depth;
        };
        /**
         *
         * @param mass
         * @param target
         */
        ConvexPolyhedron.prototype.calculateLocalInertia = function (mass, target) {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            this.computeLocalAABB(cliAabbmin, cliAabbmax);
            var x = cliAabbmax.x - cliAabbmin.x;
            var y = cliAabbmax.y - cliAabbmin.y;
            var z = cliAabbmax.z - cliAabbmin.z;
            target.x = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z);
            target.y = 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z);
            target.z = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x);
        };
        /**
         *
         * @param faceI Index of the face
         */
        ConvexPolyhedron.prototype.getPlaneConstantOfFace = function (faceI) {
            var f = this.faces[faceI];
            var n = this.faceNormals[faceI];
            var v = this.vertices[f[0]];
            var c = -n.dot(v);
            return c;
        };
        /**
         * Clip a face against a hull.
         *
         * @param separatingNormal
         * @param posA
         * @param quatA
         * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
         * @param minDist Distance clamping
         * @param maxDist
         * @param result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
         */
        ConvexPolyhedron.prototype.clipFaceAgainstHull = function (separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist, result) {
            var faceANormalWS = cfahFaceANormalWS;
            var edge0 = cfahEdge0;
            var WorldEdge0 = cfahWorldEdge0;
            var worldPlaneAnormal1 = cfahWorldPlaneAnormal1;
            var planeNormalWS1 = cfahPlaneNormalWS1;
            var worldA1 = cfahWorldA1;
            var localPlaneNormal = cfahLocalPlaneNormal;
            var planeNormalWS = cfahPlaneNormalWS;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var hullA = this;
            var worldVertsB2 = [];
            var pVtxIn = worldVertsB1;
            var pVtxOut = worldVertsB2;
            // Find the face with normal closest to the separating axis
            var closestFaceA = -1;
            var dmin = Number.MAX_VALUE;
            for (var face = 0; face < hullA.faces.length; face++) {
                faceANormalWS.copy(hullA.faceNormals[face]);
                quatA.vmult(faceANormalWS, faceANormalWS);
                // posA.addTo(faceANormalWS,faceANormalWS);
                var d = faceANormalWS.dot(separatingNormal);
                if (d < dmin) {
                    dmin = d;
                    closestFaceA = face;
                }
            }
            if (closestFaceA < 0) {
                // console.log("--- did not find any closest face... ---");
                return;
            }
            // console.log("closest A: ",closestFaceA);
            // Get the face and construct connected faces
            var polyA = hullA.faces[closestFaceA];
            polyA.connectedFaces = [];
            for (var i = 0; i < hullA.faces.length; i++) {
                for (var j = 0; j < hullA.faces[i].length; j++) {
                    if (polyA.indexOf(hullA.faces[i][j]) !== -1 /* Sharing a vertex*/ && i !== closestFaceA /* Not the one we are looking for connections from */ && polyA.connectedFaces.indexOf(i) === -1 /* Not already added */) {
                        polyA.connectedFaces.push(i);
                    }
                }
            }
            // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
            // const numContacts = pVtxIn.length;
            var numVerticesA = polyA.length;
            // const res = [];
            for (var e0 = 0; e0 < numVerticesA; e0++) {
                var a = hullA.vertices[polyA[e0]];
                var b = hullA.vertices[polyA[(e0 + 1) % numVerticesA]];
                a.subTo(b, edge0);
                WorldEdge0.copy(edge0);
                quatA.vmult(WorldEdge0, WorldEdge0);
                posA.addTo(WorldEdge0, WorldEdge0);
                worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]); // transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
                quatA.vmult(worldPlaneAnormal1, worldPlaneAnormal1);
                posA.addTo(worldPlaneAnormal1, worldPlaneAnormal1);
                WorldEdge0.crossTo(worldPlaneAnormal1, planeNormalWS1);
                planeNormalWS1.negateTo(planeNormalWS1);
                worldA1.copy(a);
                quatA.vmult(worldA1, worldA1);
                posA.addTo(worldA1, worldA1);
                var planeEqWS1 = -worldA1.dot(planeNormalWS1);
                var planeEqWS_1 = void 0;
                // eslint-disable-next-line no-constant-condition
                if (true) {
                    var otherFace = polyA.connectedFaces[e0];
                    localPlaneNormal.copy(this.faceNormals[otherFace]);
                    // const localPlaneEq = this.getPlaneConstantOfFace(otherFace);
                    planeNormalWS.copy(localPlaneNormal);
                    quatA.vmult(planeNormalWS, planeNormalWS);
                    // posA.addTo(planeNormalWS,planeNormalWS);
                    // const planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
                }
                else {
                    planeNormalWS.copy(planeNormalWS1);
                    planeEqWS_1 = planeEqWS1;
                }
                // Clip face against our constructed plane
                this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS_1);
                // Throw away all clipped points, but save the reamining until next clip
                while (pVtxIn.length) {
                    pVtxIn.shift();
                }
                while (pVtxOut.length) {
                    pVtxIn.push(pVtxOut.shift());
                }
            }
            // console.log("Resulting points after clip:",pVtxIn);
            // only keep contact points that are behind the witness face
            localPlaneNormal.copy(this.faceNormals[closestFaceA]);
            var localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
            planeNormalWS.copy(localPlaneNormal);
            quatA.vmult(planeNormalWS, planeNormalWS);
            var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            for (var i = 0; i < pVtxIn.length; i++) {
                var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; // ???
                /* console.log("depth calc from normal=",planeNormalWS.toString()," and constant "+planeEqWS+" and vertex ",pVtxIn[i].toString()," gives "+depth);*/
                if (depth <= minDist) {
                    console.log("clamped: depth=" + depth + " to minDist=" + String(minDist));
                    depth = minDist;
                }
                if (depth <= maxDist) {
                    var point = pVtxIn[i];
                    if (depth <= 0) {
                        /* console.log("Got contact point ",point.toString(),
                          ", depth=",depth,
                          "contact normal=",separatingNormal.toString(),
                          "plane",planeNormalWS.toString(),
                          "planeConstant",planeEqWS);*/
                        var p = {
                            point: point,
                            normal: planeNormalWS,
                            depth: depth,
                        };
                        result.push(p);
                    }
                }
            }
        };
        /**
         * Clip a face in a hull against the back of a plane.
         *
         * @param inVertices
         * @param outVertices
         * @param planeNormal
         * @param planeConstant The constant in the mathematical plane equation
         */
        ConvexPolyhedron.prototype.clipFaceAgainstPlane = function (inVertices, outVertices, planeNormal, planeConstant) {
            var nDotFirst;
            var nDotLast;
            var numVerts = inVertices.length;
            if (numVerts < 2) {
                return outVertices;
            }
            var firstVertex = inVertices[inVertices.length - 1];
            var lastVertex = inVertices[0];
            nDotFirst = planeNormal.dot(firstVertex) + planeConstant;
            for (var vi = 0; vi < numVerts; vi++) {
                lastVertex = inVertices[vi];
                nDotLast = planeNormal.dot(lastVertex) + planeConstant;
                if (nDotFirst < 0) {
                    if (nDotLast < 0) {
                        // Start < 0, end < 0, so output lastVertex
                        var newv = new feng3d.Vector3();
                        newv.copy(lastVertex);
                        outVertices.push(newv);
                    }
                    else {
                        // Start < 0, end >= 0, so output intersection
                        var newv = new feng3d.Vector3();
                        firstVertex.lerpNumberTo(lastVertex, nDotFirst / (nDotFirst - nDotLast), newv);
                        outVertices.push(newv);
                    }
                }
                else if (nDotLast < 0) {
                    // Start >= 0, end < 0 so output intersection and end
                    var newv = new feng3d.Vector3();
                    firstVertex.lerpNumberTo(lastVertex, nDotFirst / (nDotFirst - nDotLast), newv);
                    outVertices.push(newv);
                    outVertices.push(lastVertex);
                }
                firstVertex = lastVertex;
                nDotFirst = nDotLast;
            }
            return outVertices;
        };
        // Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
        ConvexPolyhedron.prototype.computeWorldVertices = function (position, quat) {
            var N = this.vertices.length;
            while (this.worldVertices.length < N) {
                this.worldVertices.push(new feng3d.Vector3());
            }
            var verts = this.vertices;
            var worldVerts = this.worldVertices;
            for (var i = 0; i !== N; i++) {
                quat.vmult(verts[i], worldVerts[i]);
                position.addTo(worldVerts[i], worldVerts[i]);
            }
            this.worldVerticesNeedsUpdate = false;
        };
        ConvexPolyhedron.prototype.computeLocalAABB = function (aabbmin, aabbmax) {
            var n = this.vertices.length;
            var vertices = this.vertices;
            // const worldVert = computeLocalAABBWorldVert;
            aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var i = 0; i < n; i++) {
                var v = vertices[i];
                if (v.x < aabbmin.x) {
                    aabbmin.x = v.x;
                }
                else if (v.x > aabbmax.x) {
                    aabbmax.x = v.x;
                }
                if (v.y < aabbmin.y) {
                    aabbmin.y = v.y;
                }
                else if (v.y > aabbmax.y) {
                    aabbmax.y = v.y;
                }
                if (v.z < aabbmin.z) {
                    aabbmin.z = v.z;
                }
                else if (v.z > aabbmax.z) {
                    aabbmax.z = v.z;
                }
            }
        };
        /**
         * Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
         *
         * @param quat
         */
        ConvexPolyhedron.prototype.computeWorldFaceNormals = function (quat) {
            var N = this.faceNormals.length;
            while (this.worldFaceNormals.length < N) {
                this.worldFaceNormals.push(new feng3d.Vector3());
            }
            var normals = this.faceNormals;
            var worldNormals = this.worldFaceNormals;
            for (var i = 0; i !== N; i++) {
                quat.vmult(normals[i], worldNormals[i]);
            }
            this.worldFaceNormalsNeedsUpdate = false;
        };
        ConvexPolyhedron.prototype.updateBoundingSphereRadius = function () {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var verts = this.vertices;
            for (var i = 0, N = verts.length; i !== N; i++) {
                var norm2 = verts[i].lengthSquared;
                if (norm2 > max2) {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        };
        /**
         *
         * @param  pos
         * @param quat
         * @param min
         * @param max
         */
        ConvexPolyhedron.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var n = this.vertices.length;
            var verts = this.vertices;
            var minx;
            var miny;
            var minz;
            var maxx;
            var maxy;
            var maxz;
            for (var i = 0; i < n; i++) {
                tempWorldVertex.copy(verts[i]);
                quat.vmult(tempWorldVertex, tempWorldVertex);
                pos.addTo(tempWorldVertex, tempWorldVertex);
                var v = tempWorldVertex;
                if (v.x < minx || minx === undefined) {
                    minx = v.x;
                }
                else if (v.x > maxx || maxx === undefined) {
                    maxx = v.x;
                }
                if (v.y < miny || miny === undefined) {
                    miny = v.y;
                }
                else if (v.y > maxy || maxy === undefined) {
                    maxy = v.y;
                }
                if (v.z < minz || minz === undefined) {
                    minz = v.z;
                }
                else if (v.z > maxz || maxz === undefined) {
                    maxz = v.z;
                }
            }
            min.set(minx, miny, minz);
            max.set(maxx, maxy, maxz);
        };
        /**
         * Get approximate convex volume
         */
        ConvexPolyhedron.prototype.volume = function () {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        };
        /**
         * Get an average of all the vertices positions
         *
         * @param target
         */
        ConvexPolyhedron.prototype.getAveragePointLocal = function (target) {
            target = target || new feng3d.Vector3();
            var n = this.vertices.length;
            var verts = this.vertices;
            for (var i = 0; i < n; i++) {
                target.addTo(verts[i], target);
            }
            target.scaleNumberTo(1 / n, target);
            return target;
        };
        /**
         * Transform all local points. Will change the .vertices
         *
         * @param  offset
         * @param quat
         */
        ConvexPolyhedron.prototype.transformAllPoints = function (offset, quat) {
            var n = this.vertices.length;
            var verts = this.vertices;
            // Apply rotation
            if (quat) {
                // Rotate vertices
                for (var i = 0; i < n; i++) {
                    var v = verts[i];
                    quat.vmult(v, v);
                }
                // Rotate face normals
                for (var i = 0; i < this.faceNormals.length; i++) {
                    var v = this.faceNormals[i];
                    quat.vmult(v, v);
                }
                /*
                // Rotate edges
                for(let i=0; i<this.uniqueEdges.length; i++){
                    let v = this.uniqueEdges[i];
                    quat.vmult(v,v);
                }*/
            }
            // Apply offset
            if (offset) {
                for (var i = 0; i < n; i++) {
                    var v = verts[i];
                    v.addTo(offset, v);
                }
            }
        };
        /**
         * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
         *
         * @param p      A point given in local coordinates
         */
        ConvexPolyhedron.prototype.pointIsInside = function (p) {
            // const n = this.vertices.length;
            var verts = this.vertices;
            var faces = this.faces;
            var normals = this.faceNormals;
            var positiveResult = null;
            var N = this.faces.length;
            var pointInside = ConvexPolyhedronPointIsInside;
            this.getAveragePointLocal(pointInside);
            for (var i = 0; i < N; i++) {
                // const numVertices = this.faces[i].length;
                var n0 = normals[i];
                var v = verts[faces[i][0]]; // We only need one point in the face
                // This dot product determines which side of the edge the point is
                var vToP = ConvexPolyhedronVToP;
                p.subTo(v, vToP);
                var r1 = n0.dot(vToP);
                var vToPointInside = ConvexPolyhedronVToPointInside;
                pointInside.subTo(v, vToPointInside);
                var r2 = n0.dot(vToPointInside);
                if ((r1 < 0 && r2 > 0) || (r1 > 0 && r2 < 0)) {
                    return false; // Encountered some other sign. Exit.
                }
            }
            // If we got here, all dot products were of the same sign.
            return positiveResult ? 1 : -1;
        };
        /**
         * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
         *
         * @param hull
         * @param axis
         * @param pos
         * @param quat
         * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
         */
        ConvexPolyhedron.project = function (hull, axis, pos, quat, result) {
            var n = hull.vertices.length;
            // const worldVertex = project_worldVertex;
            var localAxis = projectLocalAxis;
            var max = 0;
            var min = 0;
            var localOrigin = projectLocalOrigin;
            var vs = hull.vertices;
            localOrigin.setZero();
            // Transform the axis to local
            Transform.vectorToLocalFrame(pos, quat, axis, localAxis);
            Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin);
            var add = localOrigin.dot(localAxis);
            min = max = vs[0].dot(localAxis);
            for (var i = 1; i < n; i++) {
                var val = vs[i].dot(localAxis);
                if (val > max) {
                    max = val;
                }
                if (val < min) {
                    min = val;
                }
            }
            min -= add;
            max -= add;
            if (min > max) {
                // Inconsistent - swap
                var temp = min;
                min = max;
                max = temp;
            }
            // Output
            result[0] = max;
            result[1] = min;
        };
        return ConvexPolyhedron;
    }(Shape));
    var computeEdgesTmpEdge = new feng3d.Vector3();
    var cb$1 = new feng3d.Vector3();
    var ab$1 = new feng3d.Vector3();
    var cahWorldNormal = new feng3d.Vector3();
    var fsaFaceANormalWS3 = new feng3d.Vector3();
    var fsaWorldnormal1 = new feng3d.Vector3();
    var fsaDeltaC = new feng3d.Vector3();
    var fsaWorldEdge0 = new feng3d.Vector3();
    var fsaWorldEdge1 = new feng3d.Vector3();
    var fsaCross = new feng3d.Vector3();
    var maxminA = [];
    var maxminB = [];
    var cliAabbmin = new feng3d.Vector3();
    var cliAabbmax = new feng3d.Vector3();
    var cfahFaceANormalWS = new feng3d.Vector3();
    var cfahEdge0 = new feng3d.Vector3();
    var cfahWorldEdge0 = new feng3d.Vector3();
    var cfahWorldPlaneAnormal1 = new feng3d.Vector3();
    var cfahPlaneNormalWS1 = new feng3d.Vector3();
    var cfahWorldA1 = new feng3d.Vector3();
    var cfahLocalPlaneNormal = new feng3d.Vector3();
    var cfahPlaneNormalWS = new feng3d.Vector3();
    // const computeLocalAABBWorldVert = new Vector3();
    var tempWorldVertex = new feng3d.Vector3();
    var ConvexPolyhedronPointIsInside = new feng3d.Vector3();
    var ConvexPolyhedronVToP = new feng3d.Vector3();
    var ConvexPolyhedronVToPointInside = new feng3d.Vector3();
    // const project_worldVertex = new Vector3();
    var projectLocalAxis = new feng3d.Vector3();
    var projectLocalOrigin = new feng3d.Vector3();

    var Box = /** @class */ (function (_super) {
        __extends(Box, _super);
        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        function Box(halfExtents) {
            var _this = _super.call(this, {
                type: Shape.types.BOX
            }) || this;
            _this.halfExtents = halfExtents;
            _this.convexPolyhedronRepresentation = null;
            _this.updateConvexPolyhedronRepresentation();
            _this.updateBoundingSphereRadius();
            return _this;
        }
        /**
         * Updates the local convex polyhedron representation used for some collisions.
         */
        Box.prototype.updateConvexPolyhedronRepresentation = function () {
            var sx = this.halfExtents.x;
            var sy = this.halfExtents.y;
            var sz = this.halfExtents.z;
            var V = feng3d.Vector3;
            var vertices = [
                new V(-sx, -sy, -sz),
                new V(sx, -sy, -sz),
                new V(sx, sy, -sz),
                new V(-sx, sy, -sz),
                new V(-sx, -sy, sz),
                new V(sx, -sy, sz),
                new V(sx, sy, sz),
                new V(-sx, sy, sz)
            ];
            var indices = [
                [3, 2, 1, 0],
                [4, 5, 6, 7],
                [5, 4, 0, 1],
                [2, 3, 7, 6],
                [0, 4, 7, 3],
                [1, 2, 6, 5] ];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            var axes = [
                new V(0, 0, 1),
                new V(0, 1, 0),
                new V(1, 0, 0)
            ];
            var h = new ConvexPolyhedron(vertices, indices);
            this.convexPolyhedronRepresentation = h;
            h.material = this.material;
        };
        Box.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            Box.calculateInertia(this.halfExtents, mass, target);
            return target;
        };
        Box.calculateInertia = function (halfExtents, mass, target) {
            var e = halfExtents;
            target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
            target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
            target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
        };
        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        Box.prototype.getSideNormals = function (sixTargetVectors, quat) {
            var sides = sixTargetVectors;
            var ex = this.halfExtents;
            sides[0].set(ex.x, 0, 0);
            sides[1].set(0, ex.y, 0);
            sides[2].set(0, 0, ex.z);
            sides[3].set(-ex.x, 0, 0);
            sides[4].set(0, -ex.y, 0);
            sides[5].set(0, 0, -ex.z);
            if (quat !== undefined) {
                for (var i = 0; i !== sides.length; i++) {
                    quat.vmult(sides[i], sides[i]);
                }
            }
            return sides;
        };
        Box.prototype.volume = function () {
            return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
        };
        Box.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = this.halfExtents.length;
        };
        Box.prototype.forEachWorldCorner = function (pos, quat, callback) {
            var e = this.halfExtents;
            var corners = [[e.x, e.y, e.z],
                [-e.x, e.y, e.z],
                [-e.x, -e.y, e.z],
                [-e.x, -e.y, -e.z],
                [e.x, -e.y, -e.z],
                [e.x, e.y, -e.z],
                [-e.x, e.y, -e.z],
                [e.x, -e.y, e.z]];
            for (var i = 0; i < corners.length; i++) {
                worldCornerTempPos.set(corners[i][0], corners[i][1], corners[i][2]);
                quat.vmult(worldCornerTempPos, worldCornerTempPos);
                pos.addTo(worldCornerTempPos, worldCornerTempPos);
                callback(worldCornerTempPos.x, worldCornerTempPos.y, worldCornerTempPos.z);
            }
        };
        Box.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var e = this.halfExtents;
            worldCornersTemp[0].set(e.x, e.y, e.z);
            worldCornersTemp[1].set(-e.x, e.y, e.z);
            worldCornersTemp[2].set(-e.x, -e.y, e.z);
            worldCornersTemp[3].set(-e.x, -e.y, -e.z);
            worldCornersTemp[4].set(e.x, -e.y, -e.z);
            worldCornersTemp[5].set(e.x, e.y, -e.z);
            worldCornersTemp[6].set(-e.x, e.y, -e.z);
            worldCornersTemp[7].set(e.x, -e.y, e.z);
            var wc = worldCornersTemp[0];
            quat.vmult(wc, wc);
            pos.addTo(wc, wc);
            max.copy(wc);
            min.copy(wc);
            for (var i = 1; i < 8; i++) {
                wc = worldCornersTemp[i];
                quat.vmult(wc, wc);
                pos.addTo(wc, wc);
                var x = wc.x;
                var y = wc.y;
                var z = wc.z;
                if (x > max.x) {
                    max.x = x;
                }
                if (y > max.y) {
                    max.y = y;
                }
                if (z > max.z) {
                    max.z = z;
                }
                if (x < min.x) {
                    min.x = x;
                }
                if (y < min.y) {
                    min.y = y;
                }
                if (z < min.z) {
                    min.z = z;
                }
            }
            // Get each axis max
            // min.set(Infinity,Infinity,Infinity);
            // max.set(-Infinity,-Infinity,-Infinity);
            // this.forEachWorldCorner(pos,quat,function(x,y,z){
            //     if(x > max.x){
            //         max.x = x;
            //     }
            //     if(y > max.y){
            //         max.y = y;
            //     }
            //     if(z > max.z){
            //         max.z = z;
            //     }
            //     if(x < min.x){
            //         min.x = x;
            //     }
            //     if(y < min.y){
            //         min.y = y;
            //     }
            //     if(z < min.z){
            //         min.z = z;
            //     }
            // });
        };
        return Box;
    }(Shape));
    var worldCornerTempPos = new feng3d.Vector3();
    // const worldCornerTempNeg = new Vector3();
    var worldCornersTemp = [
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3(),
        new feng3d.Vector3()
    ];

    var Body = /** @class */ (function (_super) {
        __extends(Body, _super);
        /**
         * Base class for all body types.
         *
         * @param options
         * @param a
         *
         * @example
         *     let body = new Body({
         *         mass: 1
         *     });
         *     let shape = new Sphere(1);
         *     body.addShape(shape);
         *     world.addBody(body);
         */
        function Body(options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this) || this;
            _this.id = Body.idCounter++;
            _this.world = null;
            _this.vlambda = new feng3d.Vector3();
            _this.collisionFilterGroup = typeof (options.collisionFilterGroup) === 'number' ? options.collisionFilterGroup : 1;
            _this.collisionFilterMask = typeof (options.collisionFilterMask) === 'number' ? options.collisionFilterMask : -1;
            _this.collisionResponse = true;
            _this.position = new feng3d.Vector3();
            _this.previousPosition = new feng3d.Vector3();
            _this.interpolatedPosition = new feng3d.Vector3();
            _this.initPosition = new feng3d.Vector3();
            if (options.position) {
                _this.position.copy(options.position);
                _this.previousPosition.copy(options.position);
                _this.interpolatedPosition.copy(options.position);
                _this.initPosition.copy(options.position);
            }
            _this.velocity = new feng3d.Vector3();
            if (options.velocity) {
                _this.velocity.copy(options.velocity);
            }
            _this.initVelocity = new feng3d.Vector3();
            _this.force = new feng3d.Vector3();
            var mass = typeof (options.mass) === 'number' ? options.mass : 0;
            _this.mass = mass;
            _this.invMass = mass > 0 ? 1.0 / mass : 0;
            _this.material = options.material || null;
            _this.linearDamping = typeof (options.linearDamping) === 'number' ? options.linearDamping : 0.01;
            _this.type = (mass <= 0.0 ? Body.STATIC : Body.DYNAMIC);
            if (typeof (options.type) === typeof (Body.STATIC)) {
                _this.type = options.type;
            }
            _this.allowSleep = typeof (options.allowSleep) !== 'undefined' ? options.allowSleep : true;
            _this.sleepState = 0;
            _this.sleepSpeedLimit = typeof (options.sleepSpeedLimit) !== 'undefined' ? options.sleepSpeedLimit : 0.1;
            _this.sleepTimeLimit = typeof (options.sleepTimeLimit) !== 'undefined' ? options.sleepTimeLimit : 1;
            _this.timeLastSleepy = 0;
            _this._wakeUpAfterNarrowphase = false;
            _this.torque = new feng3d.Vector3();
            _this.quaternion = new feng3d.Quaternion();
            _this.initQuaternion = new feng3d.Quaternion();
            _this.previousQuaternion = new feng3d.Quaternion();
            _this.interpolatedQuaternion = new feng3d.Quaternion();
            if (options.quaternion) {
                _this.quaternion.copy(options.quaternion);
                _this.initQuaternion.copy(options.quaternion);
                _this.previousQuaternion.copy(options.quaternion);
                _this.interpolatedQuaternion.copy(options.quaternion);
            }
            _this.angularVelocity = new feng3d.Vector3();
            if (options.angularVelocity) {
                _this.angularVelocity.copy(options.angularVelocity);
            }
            _this.initAngularVelocity = new feng3d.Vector3();
            _this.shapes = [];
            _this.shapeOffsets = [];
            _this.shapeOrientations = [];
            _this.inertia = new feng3d.Vector3();
            _this.invInertia = new feng3d.Vector3();
            _this.invInertiaWorld = new feng3d.Matrix3x3();
            _this.invMassSolve = 0;
            _this.invInertiaSolve = new feng3d.Vector3();
            _this.invInertiaWorldSolve = new feng3d.Matrix3x3();
            _this.fixedRotation = typeof (options.fixedRotation) !== 'undefined' ? options.fixedRotation : false;
            _this.angularDamping = typeof (options.angularDamping) !== 'undefined' ? options.angularDamping : 0.01;
            _this.linearFactor = new feng3d.Vector3(1, 1, 1);
            if (options.linearFactor) {
                _this.linearFactor.copy(options.linearFactor);
            }
            _this.angularFactor = new feng3d.Vector3(1, 1, 1);
            if (options.angularFactor) {
                _this.angularFactor.copy(options.angularFactor);
            }
            _this.aabb = new feng3d.Box3();
            _this.aabbNeedsUpdate = true;
            _this.boundingRadius = 0;
            _this.wlambda = new feng3d.Vector3();
            if (options.shape) {
                _this.addShape(options.shape);
            }
            _this.updateMassProperties();
            return _this;
        }
        /**
         * Wake the body up.
         */
        Body.prototype.wakeUp = function () {
            var s = this.sleepState;
            this.sleepState = 0;
            this._wakeUpAfterNarrowphase = false;
            if (s === Body.SLEEPING) {
                this.emit('wakeup');
            }
        };
        /**
         * Force body sleep
         */
        Body.prototype.sleep = function () {
            this.sleepState = Body.SLEEPING;
            this.velocity.set(0, 0, 0);
            this.angularVelocity.set(0, 0, 0);
            this._wakeUpAfterNarrowphase = false;
        };
        /**
         * Called every timestep to update internal sleep timer and change sleep state if needed.
         */
        Body.prototype.sleepTick = function (time) {
            if (this.allowSleep) {
                var sleepState = this.sleepState;
                var speedSquared = this.velocity.lengthSquared + this.angularVelocity.lengthSquared;
                var speedLimitSquared = Math.pow(this.sleepSpeedLimit, 2);
                if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared) {
                    this.sleepState = Body.SLEEPY; // Sleepy
                    this.timeLastSleepy = time;
                    this.emit('sleepy');
                }
                else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared) {
                    this.wakeUp(); // Wake up
                }
                else if (sleepState === Body.SLEEPY && (time - this.timeLastSleepy) > this.sleepTimeLimit) {
                    this.sleep(); // Sleeping
                    this.emit('sleep');
                }
            }
        };
        /**
         * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
         */
        Body.prototype.updateSolveMassProperties = function () {
            if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC) {
                this.invMassSolve = 0;
                this.invInertiaSolve.setZero();
                this.invInertiaWorldSolve.setZero();
            }
            else {
                this.invMassSolve = this.invMass;
                this.invInertiaSolve.copy(this.invInertia);
                this.invInertiaWorldSolve.copy(this.invInertiaWorld);
            }
        };
        /**
         * Convert a world point to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        Body.prototype.pointToLocalFrame = function (worldPoint, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            worldPoint.subTo(this.position, result);
            this.quaternion.inverseTo().vmult(result, result);
            return result;
        };
        /**
         * Convert a world vector to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        Body.prototype.vectorToLocalFrame = function (worldVector, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            this.quaternion.inverseTo().vmult(worldVector, result);
            return result;
        };
        /**
         * Convert a local body point to world frame.
         *
         * @param localPoint
         * @param result
         */
        Body.prototype.pointToWorldFrame = function (localPoint, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            this.quaternion.vmult(localPoint, result);
            result.addTo(this.position, result);
            return result;
        };
        /**
         * Convert a local body point to world frame.
         *
         * @param localVector
         * @param result
         */
        Body.prototype.vectorToWorldFrame = function (localVector, result) {
            if (result === void 0) { result = new feng3d.Vector3(); }
            this.quaternion.vmult(localVector, result);
            return result;
        };
        /**
         * Add a shape to the body with a local offset and orientation.
         *
         * @param shape
         * @param _offset
         * @param_orientation
         * @return The body object, for chainability.
         */
        Body.prototype.addShape = function (shape, _offset, _orientation) {
            var offset = new feng3d.Vector3();
            var orientation = new feng3d.Quaternion();
            if (_offset) {
                offset.copy(_offset);
            }
            if (_orientation) {
                orientation.copy(_orientation);
            }
            this.shapes.push(shape);
            this.shapeOffsets.push(offset);
            this.shapeOrientations.push(orientation);
            this.updateMassProperties();
            this.updateBoundingRadius();
            this.aabbNeedsUpdate = true;
            shape.body = this;
            return this;
        };
        /**
         * Update the bounding radius of the body. Should be done if any of the shapes are changed.
         */
        Body.prototype.updateBoundingRadius = function () {
            var shapes = this.shapes;
            var shapeOffsets = this.shapeOffsets;
            var N = shapes.length;
            var radius = 0;
            for (var i = 0; i !== N; i++) {
                var shape = shapes[i];
                shape.updateBoundingSphereRadius();
                var offset = shapeOffsets[i].length;
                var r = shape.boundingSphereRadius;
                if (offset + r > radius) {
                    radius = offset + r;
                }
            }
            this.boundingRadius = radius;
        };
        /**
         * Updates the .aabb
         *
         * @todo rename to updateAABB()
         */
        Body.prototype.computeAABB = function () {
            var shapes = this.shapes;
            var shapeOffsets = this.shapeOffsets;
            var shapeOrientations = this.shapeOrientations;
            var N = shapes.length;
            var offset = tmpVec;
            var orientation = tmpQuat;
            var bodyQuat = this.quaternion;
            var aabb = this.aabb;
            var shapeAABB = computeAABB$shapeAABB;
            for (var i = 0; i !== N; i++) {
                var shape = shapes[i];
                // Get shape world position
                bodyQuat.vmult(shapeOffsets[i], offset);
                offset.addTo(this.position, offset);
                // Get shape world quaternion
                shapeOrientations[i].multTo(bodyQuat, orientation);
                // Get shape AABB
                shape.calculateWorldAABB(offset, orientation, shapeAABB.min, shapeAABB.max);
                if (i === 0) {
                    aabb.copy(shapeAABB);
                }
                else {
                    aabb.union(shapeAABB);
                }
            }
            this.aabbNeedsUpdate = false;
        };
        /**
         * Update .inertiaWorld and .invInertiaWorld
         */
        Body.prototype.updateInertiaWorld = function (force) {
            var I = this.invInertia;
            if (I.x === I.y && I.y === I.z && !force) {
                // If inertia M = s*I, where I is identity and s a scalar, then
                //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
                // where R is the rotation matrix.
                // In other words, we don't have to transform the inertia if all
                // inertia diagonal entries are equal.
            }
            else {
                var m1 = uiw$m1;
                var m2 = uiw$m2;
                // const m3 = uiw$m3;
                m1.setRotationFromQuaternion(this.quaternion);
                m1.transposeTo(m2);
                m1.scale(I, m1);
                m1.mmult(m2, this.invInertiaWorld);
            }
        };
        /**
         * Apply force to a world point. This could for example be a point on the Body surface. Applying force this way will add to Body.force and Body.torque.
         *
         * @param force The amount of force to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        Body.prototype.applyForce = function (force, relativePoint) {
            if (this.type !== Body.DYNAMIC) { // Needed?
                return;
            }
            // Compute produced rotational force
            var rotForce = Body$applyForce$rotForce;
            relativePoint.crossTo(force, rotForce);
            // Add linear force
            this.force.addTo(force, this.force);
            // Add rotational force
            this.torque.addTo(rotForce, this.torque);
        };
        /**
         * Apply force to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        Body.prototype.applyLocalForce = function (localForce, localPoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            var worldForce = Body$applyLocalForce$worldForce;
            var relativePointWorld = Body$applyLocalForce$relativePointWorld;
            // Transform the force vector to world space
            this.vectorToWorldFrame(localForce, worldForce);
            this.vectorToWorldFrame(localPoint, relativePointWorld);
            this.applyForce(worldForce, relativePointWorld);
        };
        /**
         * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
         *
         * @param impulse The amount of impulse to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        Body.prototype.applyImpulse = function (impulse, relativePoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            // Compute point position relative to the body center
            var r = relativePoint;
            // Compute produced central impulse velocity
            var velo = Body$applyImpulse$velo;
            velo.copy(impulse);
            velo.scaleNumberTo(this.invMass, velo);
            // Add linear impulse
            this.velocity.addTo(velo, this.velocity);
            // Compute produced rotational impulse velocity
            var rotVelo = Body$applyImpulse$rotVelo;
            r.crossTo(impulse, rotVelo);
            /*
            rotVelo.x *= this.invInertia.x;
            rotVelo.y *= this.invInertia.y;
            rotVelo.z *= this.invInertia.z;
            */
            this.invInertiaWorld.vmult(rotVelo, rotVelo);
            // Add rotational Impulse
            this.angularVelocity.addTo(rotVelo, this.angularVelocity);
        };
        /**
         * Apply locally-defined impulse to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        Body.prototype.applyLocalImpulse = function (localImpulse, localPoint) {
            if (this.type !== Body.DYNAMIC) {
                return;
            }
            var worldImpulse = Body$applyLocalImpulse$worldImpulse;
            var relativePointWorld = Body$applyLocalImpulse$relativePoint;
            // Transform the force vector to world space
            this.vectorToWorldFrame(localImpulse, worldImpulse);
            this.vectorToWorldFrame(localPoint, relativePointWorld);
            this.applyImpulse(worldImpulse, relativePointWorld);
        };
        /**
         * Should be called whenever you change the body shape or mass.
         */
        Body.prototype.updateMassProperties = function () {
            var halfExtents = BodyUpdateMassPropertiesHalfExtents;
            this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
            var I = this.inertia;
            var fixed = this.fixedRotation;
            // Approximate with AABB box
            this.computeAABB();
            halfExtents.set((this.aabb.max.x - this.aabb.min.x) / 2, (this.aabb.max.y - this.aabb.min.y) / 2, (this.aabb.max.z - this.aabb.min.z) / 2);
            Box.calculateInertia(halfExtents, this.mass, I);
            this.invInertia.set(I.x > 0 && !fixed ? 1.0 / I.x : 0, I.y > 0 && !fixed ? 1.0 / I.y : 0, I.z > 0 && !fixed ? 1.0 / I.z : 0);
            this.updateInertiaWorld(true);
        };
        /**
         * Get world velocity of a point in the body.
         * @method getVelocityAtWorldPoint
         * @param  {Vector3} worldPoint
         * @param  {Vector3} result
         * @return {Vector3} The result vector.
         */
        Body.prototype.getVelocityAtWorldPoint = function (worldPoint, result) {
            var r = new feng3d.Vector3();
            worldPoint.subTo(this.position, r);
            this.angularVelocity.crossTo(r, result);
            this.velocity.addTo(result, result);
            return result;
        };
        /**
         * Move the body forward in time.
         * @param dt Time step
         * @param quatNormalize Set to true to normalize the body quaternion
         * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
         */
        Body.prototype.integrate = function (dt, quatNormalize, quatNormalizeFast) {
            // Save previous position
            this.previousPosition.copy(this.position);
            this.previousQuaternion.copy(this.quaternion);
            if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING) { // Only for dynamic
                return;
            }
            var velo = this.velocity;
            var angularVelo = this.angularVelocity;
            var pos = this.position;
            var force = this.force;
            var torque = this.torque;
            var quat = this.quaternion;
            var invMass = this.invMass;
            var invInertia = this.invInertiaWorld;
            var linearFactor = this.linearFactor;
            var iMdt = invMass * dt;
            velo.x += force.x * iMdt * linearFactor.x;
            velo.y += force.y * iMdt * linearFactor.y;
            velo.z += force.z * iMdt * linearFactor.z;
            var e = invInertia.elements;
            var angularFactor = this.angularFactor;
            var tx = torque.x * angularFactor.x;
            var ty = torque.y * angularFactor.y;
            var tz = torque.z * angularFactor.z;
            angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
            angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
            angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);
            // Use new velocity  - leap frog
            pos.x += velo.x * dt;
            pos.y += velo.y * dt;
            pos.z += velo.z * dt;
            quat.integrateTo(this.angularVelocity, dt, this.angularFactor, quat);
            if (quatNormalize) {
                if (quatNormalizeFast) {
                    quat.normalizeFast();
                }
                else {
                    quat.normalize();
                }
            }
            this.aabbNeedsUpdate = true;
            // Update world inertia
            this.updateInertiaWorld();
        };
        /**
         * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
         */
        Body.DYNAMIC = 1;
        /**
         * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
         */
        Body.STATIC = 2;
        /**
         * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
         */
        Body.KINEMATIC = 4;
        Body.AWAKE = 0;
        Body.SLEEPY = 1;
        Body.SLEEPING = 2;
        Body.idCounter = 0;
        return Body;
    }(feng3d.EventEmitter));
    var tmpVec = new feng3d.Vector3();
    var tmpQuat = new feng3d.Quaternion();
    // const torque = new Vector3();
    // const invI_tau_dt = new Vector3();
    // const w = new Quaternion();
    // const wq = new Quaternion();
    var BodyUpdateMassPropertiesHalfExtents = new feng3d.Vector3();
    // const Body_applyForce_r = new Vector3();
    var Body$applyForce$rotForce = new feng3d.Vector3();
    var Body$applyLocalForce$worldForce = new feng3d.Vector3();
    var Body$applyLocalForce$relativePointWorld = new feng3d.Vector3();
    // const Body_applyImpulse_r = new Vector3();
    var Body$applyImpulse$velo = new feng3d.Vector3();
    var Body$applyImpulse$rotVelo = new feng3d.Vector3();
    var Body$applyLocalImpulse$worldImpulse = new feng3d.Vector3();
    var Body$applyLocalImpulse$relativePoint = new feng3d.Vector3();
    var uiw$m1 = new feng3d.Matrix3x3();
    var uiw$m2 = new feng3d.Matrix3x3();
    // const uiw$m3 = new Matrix3x3();
    var computeAABB$shapeAABB = new feng3d.Box3();

    var Broadphase = /** @class */ (function () {
        /**
         * Base class for broadphase implementations
         *
         * @author schteppe
         */
        function Broadphase() {
            this.world = null;
            this.useBoundingBoxes = false;
            this.dirty = true;
        }
        /**
         * Get the collision pairs from the world
         *
         * @param _world The world to search in
         * @param _p1 Empty array to be filled with body objects
         * @param _p2 Empty array to be filled with body objects
         */
        Broadphase.prototype.collisionPairs = function (_world, _p1, _p2) {
            throw new Error('collisionPairs not implemented for this BroadPhase class!');
        };
        /**
         * Check if a body pair needs to be intersection tested at all.
         *
         * @param bodyA
         * @param bodyB
         */
        Broadphase.prototype.needBroadphaseCollision = function (bodyA, bodyB) {
            // Check collision filter masks
            if ((bodyA.collisionFilterGroup & bodyB.collisionFilterMask) === 0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask) === 0) {
                return false;
            }
            // Check types
            if (((bodyA.type & Body.STATIC) !== 0 || bodyA.sleepState === Body.SLEEPING)
                && ((bodyB.type & Body.STATIC) !== 0 || bodyB.sleepState === Body.SLEEPING)) {
                // Both bodies are static or sleeping. Skip.
                return false;
            }
            return true;
        };
        /**
         * Check if the bounding volumes of two bodies intersect.
          *
          * @param bodyA
          * @param bodyB
          * @param pairs1
          * @param pairs2
          */
        Broadphase.prototype.intersectionTest = function (bodyA, bodyB, pairs1, pairs2) {
            if (this.useBoundingBoxes) {
                this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
            else {
                this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
        };
        /**
         * Check if the bounding spheres of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1 bodyA is appended to this array if intersection
         * @param pairs2 bodyB is appended to this array if intersection
         */
        Broadphase.prototype.doBoundingSphereBroadphase = function (bodyA, bodyB, pairs1, pairs2) {
            var r = BroadphaseCollisionPairsR;
            bodyB.position.subTo(bodyA.position, r);
            var boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
            var norm2 = r.lengthSquared;
            if (norm2 < boundingRadiusSum2) {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };
        /**
         * Check if the bounding boxes of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1
         * @param pairs2
         */
        Broadphase.prototype.doBoundingBoxBroadphase = function (bodyA, bodyB, pairs1, pairs2) {
            if (bodyA.aabbNeedsUpdate) {
                bodyA.computeAABB();
            }
            if (bodyB.aabbNeedsUpdate) {
                bodyB.computeAABB();
            }
            // Check AABB / AABB
            if (bodyA.aabb.overlaps(bodyB.aabb)) {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };
        /**
         * Removes duplicate pairs from the pair arrays.
         * @param pairs1
         * @param pairs2
         */
        Broadphase.prototype.makePairsUnique = function (pairs1, pairs2) {
            var t = BroadphaseMakePairsUniqueTemp;
            var p1 = BroadphaseMakePairsUniqueP1;
            var p2 = BroadphaseMakePairsUniqueP2;
            var N = pairs1.length;
            for (var i = 0; i !== N; i++) {
                p1[i] = pairs1[i];
                p2[i] = pairs2[i];
            }
            pairs1.length = 0;
            pairs2.length = 0;
            for (var i = 0; i !== N; i++) {
                var id1 = p1[i].id;
                var id2 = p2[i].id;
                var key = id1 < id2 ? id1 + "," + id2 : id2 + "," + id1;
                t[key] = i;
                t.keys.push(key);
            }
            for (var i = 0; i !== t.keys.length; i++) {
                var key = t.keys.pop();
                var pairIndex = t[key];
                pairs1.push(p1[pairIndex]);
                pairs2.push(p2[pairIndex]);
                delete t[key];
            }
        };
        /**
         * To be implemented by subcasses
         * @method setWorld
         * @param {World} _world
         */
        Broadphase.prototype.setWorld = function (_world) {
        };
        /**
         * Check if the bounding spheres of two bodies overlap.
         * @param bodyA
         * @param bodyB
         */
        Broadphase.boundingSphereCheck = function (bodyA, bodyB) {
            var dist = bscDist;
            bodyA.position.subTo(bodyB.position, dist);
            return Math.pow(bodyA.shape.boundingSphereRadius + bodyB.shape.boundingSphereRadius, 2) > dist.lengthSquared;
        };
        /**
         * Returns all the bodies within the AABB.
         *
         * @param _world
         * @param _aabb
         * @param _result An array to store resulting bodies in.
         */
        Broadphase.prototype.aabbQuery = function (_world, _aabb, _result) {
            console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
            return [];
        };
        return Broadphase;
    }());
    var BroadphaseCollisionPairsR = new feng3d.Vector3(); // Temp objects
    // const Broadphase_collisionPairs_normal = new Vector3();
    // const Broadphase_collisionPairs_quat = new Quaternion();
    // const Broadphase_collisionPairs_relpos = new Vector3();
    var BroadphaseMakePairsUniqueTemp = { keys: [] };
    var BroadphaseMakePairsUniqueP1 = [];
    var BroadphaseMakePairsUniqueP2 = [];
    var bscDist = new feng3d.Vector3();

    var GridBroadphase = /** @class */ (function (_super) {
        __extends(GridBroadphase, _super);
        /**
         * Axis aligned uniform grid broadphase.
         *
         * @param aabbMin
         * @param aabbMax
         * @param nx Number of boxes along x
         * @param ny Number of boxes along y
         * @param nz Number of boxes along z
         *
         * @todo Needs support for more than just planes and spheres.
         */
        function GridBroadphase(aabbMin, aabbMax, nx, ny, nz) {
            var _this = _super.call(this) || this;
            _this.nx = nx || 10;
            _this.ny = ny || 10;
            _this.nz = nz || 10;
            _this.aabbMin = aabbMin || new feng3d.Vector3(100, 100, 100);
            _this.aabbMax = aabbMax || new feng3d.Vector3(-100, -100, -100);
            var nbins = _this.nx * _this.ny * _this.nz;
            if (nbins <= 0) {
                throw 'GridBroadphase: Each dimension\'s n must be >0';
            }
            _this.bins = [];
            _this.binLengths = []; // Rather than continually resizing arrays (thrashing the memory), just record length and allow them to grow
            _this.bins.length = nbins;
            _this.binLengths.length = nbins;
            for (var i = 0; i < nbins; i++) {
                _this.bins[i] = [];
                _this.binLengths[i] = 0;
            }
            return _this;
        }
        /**
         * Get all the collision pairs in the physics world
         *
         * @param world
         * @param pairs1
         * @param pairs2
         */
        GridBroadphase.prototype.collisionPairs = function (world, pairs1, pairs2) {
            var N = world.numObjects();
            var bodies = world.bodies;
            var max = this.aabbMax;
            var min = this.aabbMin;
            var nx = this.nx;
            var ny = this.ny;
            var nz = this.nz;
            var xstep = ny * nz;
            var ystep = nz;
            var zstep = 1;
            var xmax = max.x;
            var ymax = max.y;
            var zmax = max.z;
            var xmin = min.x;
            var ymin = min.y;
            var zmin = min.z;
            var xmult = nx / (xmax - xmin);
            var ymult = ny / (ymax - ymin);
            var zmult = nz / (zmax - zmin);
            var binsizeX = (xmax - xmin) / nx;
            var binsizeY = (ymax - ymin) / ny;
            var binsizeZ = (zmax - zmin) / nz;
            var binRadius = Math.sqrt(binsizeX * binsizeX + binsizeY * binsizeY + binsizeZ * binsizeZ) * 0.5;
            var types = Shape.types;
            var SPHERE = types.SPHERE;
            var PLANE = types.PLANE;
            // const BOX = types.BOX;
            // const COMPOUND = types.COMPOUND;
            // const CONVEXPOLYHEDRON = types.CONVEXPOLYHEDRON;
            var bins = this.bins;
            var binLengths = this.binLengths;
            var Nbins = this.bins.length;
            // Reset bins
            for (var i = 0; i !== Nbins; i++) {
                binLengths[i] = 0;
            }
            var ceil = Math.ceil;
            // var min = Math.min;
            // var max = Math.max;
            function addBoxToBins(x0, y0, z0, x1, y1, z1, bi) {
                var xoff0 = ((x0 - xmin) * xmult) | 0;
                var yoff0 = ((y0 - ymin) * ymult) | 0;
                var zoff0 = ((z0 - zmin) * zmult) | 0;
                var xoff1 = ceil((x1 - xmin) * xmult);
                var yoff1 = ceil((y1 - ymin) * ymult);
                var zoff1 = ceil((z1 - zmin) * zmult);
                if (xoff0 < 0) {
                    xoff0 = 0;
                }
                else if (xoff0 >= nx) {
                    xoff0 = nx - 1;
                }
                if (yoff0 < 0) {
                    yoff0 = 0;
                }
                else if (yoff0 >= ny) {
                    yoff0 = ny - 1;
                }
                if (zoff0 < 0) {
                    zoff0 = 0;
                }
                else if (zoff0 >= nz) {
                    zoff0 = nz - 1;
                }
                if (xoff1 < 0) {
                    xoff1 = 0;
                }
                else if (xoff1 >= nx) {
                    xoff1 = nx - 1;
                }
                if (yoff1 < 0) {
                    yoff1 = 0;
                }
                else if (yoff1 >= ny) {
                    yoff1 = ny - 1;
                }
                if (zoff1 < 0) {
                    zoff1 = 0;
                }
                else if (zoff1 >= nz) {
                    zoff1 = nz - 1;
                }
                xoff0 *= xstep;
                yoff0 *= ystep;
                zoff0 *= zstep;
                xoff1 *= xstep;
                yoff1 *= ystep;
                zoff1 *= zstep;
                for (var xoff = xoff0; xoff <= xoff1; xoff += xstep) {
                    for (var yoff = yoff0; yoff <= yoff1; yoff += ystep) {
                        for (var zoff = zoff0; zoff <= zoff1; zoff += zstep) {
                            var idx = xoff + yoff + zoff;
                            bins[idx][binLengths[idx]++] = bi;
                        }
                    }
                }
            }
            // Put all bodies into the bins
            for (var i = 0; i !== N; i++) {
                var bi = bodies[i];
                var si = bi.shape;
                switch (si.type) {
                    case SPHERE:
                        // Put in bin
                        // check if overlap with other bins
                        var x = bi.position.x;
                        var y = bi.position.y;
                        var z = bi.position.z;
                        var r = si.radius;
                        addBoxToBins(x - r, y - r, z - r, x + r, y + r, z + r, bi);
                        break;
                    case PLANE:
                        var plane = si;
                        if (plane.worldNormalNeedsUpdate) {
                            plane.computeWorldNormal(bi.quaternion);
                        }
                        var planeNormal = plane.worldNormal;
                        // Relative position from origin of plane object to the first bin
                        // Incremented as we iterate through the bins
                        var xreset = xmin + binsizeX * 0.5 - bi.position.x;
                        var yreset = ymin + binsizeY * 0.5 - bi.position.y;
                        var zreset = zmin + binsizeZ * 0.5 - bi.position.z;
                        var d = GridBroadphaseCollisionPairsD;
                        d.set(xreset, yreset, zreset);
                        for (var xi = 0, xoff = 0; xi !== nx; xi++, xoff += xstep, d.y = yreset, d.x += binsizeX) {
                            for (var yi = 0, yoff = 0; yi !== ny; yi++, yoff += ystep, d.z = zreset, d.y += binsizeY) {
                                for (var zi = 0, zoff = 0; zi !== nz; zi++, zoff += zstep, d.z += binsizeZ) {
                                    if (d.dot(planeNormal) < binRadius) {
                                        var idx = xoff + yoff + zoff;
                                        bins[idx][binLengths[idx]++] = bi;
                                    }
                                }
                            }
                        }
                        break;
                    default:
                        if (bi.aabbNeedsUpdate) {
                            bi.computeAABB();
                        }
                        addBoxToBins(bi.aabb.min.x, bi.aabb.min.y, bi.aabb.min.z, bi.aabb.max.x, bi.aabb.max.y, bi.aabb.max.z, bi);
                        break;
                }
            }
            // Check each bin
            for (var i = 0; i !== Nbins; i++) {
                var binLength = binLengths[i];
                // Skip bins with no potential collisions
                if (binLength > 1) {
                    var bin = bins[i];
                    // Do N^2 broadphase inside
                    for (var xi = 0; xi !== binLength; xi++) {
                        var bi = bin[xi];
                        for (var yi = 0; yi !== xi; yi++) {
                            var bj = bin[yi];
                            if (this.needBroadphaseCollision(bi, bj)) {
                                this.intersectionTest(bi, bj, pairs1, pairs2);
                            }
                        }
                    }
                }
            }
            //	for (var zi = 0, zoff=0; zi < nz; zi++, zoff+= zstep) {
            //		console.log("layer "+zi);
            //		for (var yi = 0, yoff=0; yi < ny; yi++, yoff += ystep) {
            //			var row = '';
            //			for (var xi = 0, xoff=0; xi < nx; xi++, xoff += xstep) {
            //				var idx = xoff + yoff + zoff;
            //				row += ' ' + binLengths[idx];
            //			}
            //			console.log(row);
            //		}
            //	}
            this.makePairsUnique(pairs1, pairs2);
        };
        return GridBroadphase;
    }(Broadphase));
    var GridBroadphaseCollisionPairsD = new feng3d.Vector3();
    // const GridBroadphase_collisionPairs_binPos = new Vector3();

    var NaiveBroadphase = /** @class */ (function (_super) {
        __extends(NaiveBroadphase, _super);
        /**
         * Naive broadphase implementation, used in lack of better ones.
         * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
         */
        function NaiveBroadphase() {
            return _super.call(this) || this;
        }
        /**
         * Get all the collision pairs in the physics world
         * @param world
         * @param pairs1
         * @param pairs2
         */
        NaiveBroadphase.prototype.collisionPairs = function (world, pairs1, pairs2) {
            var bodies = world.bodies;
            var n = bodies.length;
            var i;
            var j;
            var bi;
            var bj;
            // Naive N^2 ftw!
            for (i = 0; i !== n; i++) {
                for (j = 0; j !== i; j++) {
                    bi = bodies[i];
                    bj = bodies[j];
                    if (!this.needBroadphaseCollision(bi, bj)) {
                        continue;
                    }
                    this.intersectionTest(bi, bj, pairs1, pairs2);
                }
            }
        };
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        NaiveBroadphase.prototype.aabbQuery = function (world, aabb, result) {
            result = result || [];
            for (var i = 0; i < world.bodies.length; i++) {
                var b = world.bodies[i];
                if (b.aabbNeedsUpdate) {
                    b.computeAABB();
                }
                // Ugly hack until Body gets aabb
                if (b.aabb.overlaps(aabb)) {
                    result.push(b);
                }
            }
            return result;
        };
        return NaiveBroadphase;
    }(Broadphase));
    // const tmpAABB = new Box3();

    var OverlapKeeper = /** @class */ (function () {
        function OverlapKeeper() {
            this.current = [];
            this.previous = [];
            this.current = [];
            this.previous = [];
        }
        OverlapKeeper.prototype.getKey = function (i, j) {
            if (j < i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return (i << 16) | j;
        };
        OverlapKeeper.prototype.set = function (i, j) {
            // Insertion sort. This way the diff will have linear complexity.
            var key = this.getKey(i, j);
            var current = this.current;
            var index = 0;
            while (key > current[index]) {
                index++;
            }
            if (key === current[index]) {
                return; // Pair was already added
            }
            for (var j_1 = current.length - 1; j_1 >= index; j_1--) {
                current[j_1 + 1] = current[j_1];
            }
            current[index] = key;
        };
        OverlapKeeper.prototype.tick = function () {
            var tmp = this.current;
            this.current = this.previous;
            this.previous = tmp;
            this.current.length = 0;
        };
        OverlapKeeper.prototype.unpackAndPush = function (array, key) {
            array.push((key & 0xFFFF0000) >> 16, key & 0x0000FFFF);
        };
        OverlapKeeper.prototype.getDiff = function (additions, removals) {
            var a = this.current;
            var b = this.previous;
            var al = a.length;
            var bl = b.length;
            var j = 0;
            for (var i = 0; i < al; i++) {
                var found = false;
                var keyA = a[i];
                while (keyA > b[j]) {
                    j++;
                }
                found = keyA === b[j];
                if (!found) {
                    this.unpackAndPush(additions, keyA);
                }
            }
            j = 0;
            for (var i = 0; i < bl; i++) {
                var found = false;
                var keyB = b[i];
                while (keyB > a[j]) {
                    j++;
                }
                found = a[j] === keyB;
                if (!found) {
                    this.unpackAndPush(removals, keyB);
                }
            }
        };
        return OverlapKeeper;
    }());

    var worldNormal = new feng3d.Vector3(0, 0, 1);

    var RaycastResult = /** @class */ (function () {
        /**
         * Storage for Ray casting data.
         */
        function RaycastResult() {
            this.rayFromWorld = new feng3d.Vector3();
            this.rayToWorld = new feng3d.Vector3();
            this.hitNormalWorld = new feng3d.Vector3();
            this.hitPointWorld = new feng3d.Vector3();
            this.hasHit = false;
            this.shape = null;
            this.body = null;
            /**
             * The index of the hit triangle, if the hit shape was a trimesh.
             */
            this.hitFaceIndex = -1;
            /**
             * Distance to the hit. Will be set to -1 if there was no hit.
             */
            this.distance = -1;
            /**
             * If the ray should stop traversing the bodies.
             */
            this._shouldStop = false;
        }
        /**
         * Reset all result data.
         */
        RaycastResult.prototype.reset = function () {
            this.rayFromWorld.setZero();
            this.rayToWorld.setZero();
            this.hitNormalWorld.setZero();
            this.hitPointWorld.setZero();
            this.hasHit = false;
            this.shape = null;
            this.body = null;
            this.hitFaceIndex = -1;
            this.distance = -1;
            this._shouldStop = false;
        };
        RaycastResult.prototype.abort = function () {
            this._shouldStop = true;
        };
        RaycastResult.prototype.set = function (rayFromWorld, rayToWorld, hitNormalWorld, hitPointWorld, shape, body, distance) {
            this.rayFromWorld.copy(rayFromWorld);
            this.rayToWorld.copy(rayToWorld);
            this.hitNormalWorld.copy(hitNormalWorld);
            this.hitPointWorld.copy(hitPointWorld);
            this.shape = shape;
            this.body = body;
            this.distance = distance;
        };
        return RaycastResult;
    }());

    var Ray = /** @class */ (function () {
        /**
         * A line in 3D space that intersects bodies and return points.
         * @param from
         * @param to
         */
        function Ray(from, to) {
            this.from = from ? from.clone() : new feng3d.Vector3();
            this.to = to ? to.clone() : new feng3d.Vector3();
            this._direction = new feng3d.Vector3();
            this.precision = 0.0001;
            this.checkCollisionResponse = true;
            this.skipBackfaces = false;
            this.collisionFilterMask = -1;
            this.collisionFilterGroup = -1;
            this.mode = Ray.ANY;
            this.result = new RaycastResult();
            this.hasHit = false;
            this.callback = function (_result) { };
        }
        /**
         * Do itersection against all bodies in the given World.
         * @param world
         * @param options
         * @return True if the ray hit anything, otherwise false.
         */
        Ray.prototype.intersectWorld = function (world, options) {
            this.mode = options.mode || Ray.ANY;
            this.result = options.result || new RaycastResult();
            this.skipBackfaces = !!options.skipBackfaces;
            this.collisionFilterMask = typeof (options.collisionFilterMask) !== 'undefined' ? options.collisionFilterMask : -1;
            this.collisionFilterGroup = typeof (options.collisionFilterGroup) !== 'undefined' ? options.collisionFilterGroup : -1;
            if (options.from) {
                this.from.copy(options.from);
            }
            if (options.to) {
                this.to.copy(options.to);
            }
            this.callback = options.callback || function () { };
            this.hasHit = false;
            this.result.reset();
            this._updateDirection();
            this.getAABB(tmpAABB$1);
            tmpArray.length = 0;
            world.broadphase.aabbQuery(world, tmpAABB$1, tmpArray);
            this.intersectBodies(tmpArray);
            return this.hasHit;
        };
        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        Ray.prototype.intersectBody = function (body, result) {
            if (result) {
                this.result = result;
                this._updateDirection();
            }
            var checkCollisionResponse = this.checkCollisionResponse;
            if (checkCollisionResponse && !body.collisionResponse) {
                return;
            }
            if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0) {
                return;
            }
            var xi = intersectBodyXi;
            var qi = intersectBodyQi;
            for (var i = 0, N = body.shapes.length; i < N; i++) {
                var shape = body.shapes[i];
                if (checkCollisionResponse && !shape.collisionResponse) {
                    continue; // Skip
                }
                body.quaternion.multTo(body.shapeOrientations[i], qi);
                body.quaternion.vmult(body.shapeOffsets[i], xi);
                xi.addTo(body.position, xi);
                this.intersectShape(shape, qi, xi, body);
                if (this.result._shouldStop) {
                    break;
                }
            }
        };
        /**
         * @param bodies An array of Body objects.
         * @param result Deprecated
         */
        Ray.prototype.intersectBodies = function (bodies, result) {
            if (result) {
                this.result = result;
                this._updateDirection();
            }
            for (var i = 0, l = bodies.length; !this.result._shouldStop && i < l; i++) {
                this.intersectBody(bodies[i]);
            }
        };
        /**
         * Updates the _direction vector.
         */
        Ray.prototype._updateDirection = function () {
            this.to.subTo(this.from, this._direction);
            this._direction.normalize();
        };
        Ray.prototype.intersectShape = function (shape, quat, position, body) {
            var from = this.from;
            // Checking boundingSphere
            var distance = distanceFromIntersection(from, this._direction, position);
            if (distance > shape.boundingSphereRadius) {
                return;
            }
            var intersectMethod = this[shape.type];
            if (intersectMethod) {
                intersectMethod.call(this, shape, quat, position, body, shape);
            }
        };
        Ray.prototype.intersectBox = function (shape, quat, position, body, reportedShape) {
            return this.intersectConvex(shape.convexPolyhedronRepresentation, quat, position, body, reportedShape);
        };
        Ray.prototype.intersectPlane = function (_shape, quat, position, body, reportedShape) {
            var from = this.from;
            var to = this.to;
            var direction = this._direction;
            // Get plane normal
            var worldNormal1 = worldNormal.clone();
            quat.vmult(worldNormal1, worldNormal1);
            var len = new feng3d.Vector3();
            from.subTo(position, len);
            var planeToFrom = len.dot(worldNormal1);
            to.subTo(position, len);
            var planeToTo = len.dot(worldNormal1);
            if (planeToFrom * planeToTo > 0) {
                // "from" and "to" are on the same side of the plane... bail out
                return;
            }
            if (from.distance(to) < planeToFrom) {
                return;
            }
            var nDotDir = worldNormal1.dot(direction);
            if (Math.abs(nDotDir) < this.precision) {
                // No intersection
                return;
            }
            var planePointToFrom = new feng3d.Vector3();
            var dirScaledWithT = new feng3d.Vector3();
            var hitPointWorld = new feng3d.Vector3();
            from.subTo(position, planePointToFrom);
            var t = -worldNormal1.dot(planePointToFrom) / nDotDir;
            direction.scaleNumberTo(t, dirScaledWithT);
            from.addTo(dirScaledWithT, hitPointWorld);
            this.reportIntersection(worldNormal1, hitPointWorld, reportedShape, body, -1);
        };
        /**
         * Get the world AABB of the ray.
         */
        Ray.prototype.getAABB = function (result) {
            var to = this.to;
            var from = this.from;
            result.min.x = Math.min(to.x, from.x);
            result.min.y = Math.min(to.y, from.y);
            result.min.z = Math.min(to.z, from.z);
            result.max.x = Math.max(to.x, from.x);
            result.max.y = Math.max(to.y, from.y);
            result.max.z = Math.max(to.z, from.z);
        };
        Ray.prototype.intersectHeightfield = function (shape, quat, position, body, reportedShape) {
            // const data = shape.data;
            // const w = shape.elementSize;
            // Convert the ray to local heightfield coordinates
            var localRay = intersectHeightfieldLocalRay; // new Ray(this.from, this.to);
            localRay.from.copy(this.from);
            localRay.to.copy(this.to);
            Transform.pointToLocalFrame(position, quat, localRay.from, localRay.from);
            Transform.pointToLocalFrame(position, quat, localRay.to, localRay.to);
            localRay._updateDirection();
            // Get the index of the data points to test against
            var index = intersectHeightfieldIndex;
            var iMinX;
            var iMinY;
            var iMaxX;
            var iMaxY;
            // Set to max
            iMinX = iMinY = 0;
            iMaxX = iMaxY = shape.data.length - 1;
            var aabb = new feng3d.Box3();
            localRay.getAABB(aabb);
            shape.getIndexOfPosition(aabb.min.x, aabb.min.y, index, true);
            iMinX = Math.max(iMinX, index[0]);
            iMinY = Math.max(iMinY, index[1]);
            shape.getIndexOfPosition(aabb.max.x, aabb.max.y, index, true);
            iMaxX = Math.min(iMaxX, index[0] + 1);
            iMaxY = Math.min(iMaxY, index[1] + 1);
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    if (this.result._shouldStop) {
                        return;
                    }
                    shape.getAabbAtIndex(i, j, aabb);
                    if (!localRay.overlapsBox3(aabb)) {
                        continue;
                    }
                    // Lower triangle
                    shape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
                    if (this.result._shouldStop) {
                        return;
                    }
                    // Upper triangle
                    shape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                    this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
                }
            }
        };
        Ray.prototype.intersectSphere = function (shape, _quat, position, body, reportedShape) {
            var from = this.from;
            var to = this.to;
            var r = shape.radius;
            var a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
            var b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
            var c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);
            var delta = Math.pow(b, 2) - 4 * a * c;
            var intersectionPoint = RayIntersectSphereIntersectionPoint;
            var normal = RayIntersectSphereNormal;
            if (delta < 0) {
                // No intersection
                return;
            }
            else if (delta === 0) {
                // single intersection point
                from.lerpNumberTo(to, delta, intersectionPoint);
                intersectionPoint.subTo(position, normal);
                normal.normalize();
                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
            }
            else {
                var d1 = (-b - Math.sqrt(delta)) / (2 * a);
                var d2 = (-b + Math.sqrt(delta)) / (2 * a);
                if (d1 >= 0 && d1 <= 1) {
                    from.lerpNumberTo(to, d1, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
                if (this.result._shouldStop) {
                    return;
                }
                if (d2 >= 0 && d2 <= 1) {
                    from.lerpNumberTo(to, d2, intersectionPoint);
                    intersectionPoint.subTo(position, normal);
                    normal.normalize();
                    this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
                }
            }
        };
        Ray.prototype.intersectConvex = function (shape, quat, position, body, reportedShape, options) {
            if (options === void 0) { options = {}; }
            // const minDistNormal = intersectConvexMinDistNormal;
            var normal = intersectConvexNormal;
            var vector = intersectConvexVector;
            // const minDistIntersect = intersectConvexMinDistIntersect;
            var faceList = (options && options.faceList) || null;
            // Checking faces
            var faces = shape.faces;
            var vertices = shape.vertices;
            var normals = shape.faceNormals;
            var direction = this._direction;
            var from = this.from;
            var to = this.to;
            var fromToDistance = from.distance(to);
            // const minDist = -1;
            var Nfaces = faceList ? faceList.length : faces.length;
            var result = this.result;
            for (var j = 0; !result._shouldStop && j < Nfaces; j++) {
                var fi = faceList ? faceList[j] : j;
                var face = faces[fi];
                var faceNormal = normals[fi];
                var q = quat;
                var x = position;
                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal
                // Get plane point in world coordinates...
                vector.copy(vertices[face[0]]);
                q.vmult(vector, vector);
                vector.addTo(x, vector);
                // ...but make it relative to the ray from. We'll fix this later.
                vector.subTo(from, vector);
                // Get plane normal
                q.vmult(faceNormal, normal);
                // If this dot product is negative, we have something interesting
                var dot = direction.dot(normal);
                // Bail out if ray and plane are parallel
                if (Math.abs(dot) < this.precision) {
                    continue;
                }
                // calc distance to plane
                var scalar = normal.dot(vector) / dot;
                // if negative distance, then plane is behind ray
                if (scalar < 0) {
                    continue;
                }
                // if (dot < 0) {
                // Intersection point is from + direction * scalar
                direction.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(from, intersectPoint);
                // a is the point we compare points b and c with.
                a.copy(vertices[face[0]]);
                q.vmult(a, a);
                x.addTo(a, a);
                for (var i = 1; !result._shouldStop && i < face.length - 1; i++) {
                    // Transform 3 vertices to world coords
                    b.copy(vertices[face[i]]);
                    c.copy(vertices[face[i + 1]]);
                    q.vmult(b, b);
                    q.vmult(c, c);
                    x.addTo(b, b);
                    x.addTo(c, c);
                    var distance = intersectPoint.distance(from);
                    if (!(feng3d.Triangle3.containsPoint(a, b, c, intersectPoint) || feng3d.Triangle3.containsPoint(b, a, c, intersectPoint)) || distance > fromToDistance) {
                        continue;
                    }
                    this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
                }
                // }
            }
        };
        /**
         * @method intersectTrimesh
         * @private
         * @param  {Shape} shape
         * @param  {Quaternion} quat
         * @param  {Vector3} position
         * @param  {Body} body
         * @param {object} [options]
         */
        /**
         *
         * @param mesh
         * @param quat
         * @param position
         * @param body
         * @param reportedShape
         * @param _options
         *
         * @todo Optimize by transforming the world to local space first.
         * @todo Use Octree lookup
         */
        Ray.prototype.intersectTrimesh = function (mesh, quat, position, body, reportedShape, _options) {
            var normal = intersectTrimeshNormal;
            var triangles = intersectTrimeshTriangles;
            var treeTransform = intersectTrimeshTreeTransform;
            // const minDistNormal = intersectConvex_minDistNormal;
            var vector = intersectConvexVector;
            // const minDistIntersect = intersectConvex_minDistIntersect;
            // const localAABB = intersectTrimesh_localAABB;
            var localDirection = intersectTrimeshLocalDirection;
            var localFrom = intersectTrimeshLocalFrom;
            var localTo = intersectTrimeshLocalTo;
            var worldIntersectPoint = intersectTrimeshWorldIntersectPoint;
            var worldNormal = intersectTrimeshWorldNormal;
            // const faceList = (options && options.faceList) || null;
            // Checking faces
            var indices = mesh.indices;
            // const vertices = mesh.vertices;
            // const normals = mesh.faceNormals;
            var from = this.from;
            var to = this.to;
            var direction = this._direction;
            // const minDist = -1;
            treeTransform.position.copy(position);
            treeTransform.quaternion.copy(quat);
            // Transform ray to local space!
            Transform.vectorToLocalFrame(position, quat, direction, localDirection);
            Transform.pointToLocalFrame(position, quat, from, localFrom);
            Transform.pointToLocalFrame(position, quat, to, localTo);
            localTo.x *= mesh.scale.x;
            localTo.y *= mesh.scale.y;
            localTo.z *= mesh.scale.z;
            localFrom.x *= mesh.scale.x;
            localFrom.y *= mesh.scale.y;
            localFrom.z *= mesh.scale.z;
            localTo.subTo(localFrom, localDirection);
            localDirection.normalize();
            var fromToDistanceSquared = localFrom.distanceSquared(localTo);
            mesh.tree.rayQuery(this, treeTransform, triangles);
            for (var i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++) {
                var trianglesIndex = triangles[i];
                mesh.getNormal(trianglesIndex, normal);
                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal
                // Get plane point in world coordinates...
                mesh.getVertex(indices[trianglesIndex * 3], a);
                // ...but make it relative to the ray from. We'll fix this later.
                a.subTo(localFrom, vector);
                // If this dot product is negative, we have something interesting
                var dot = localDirection.dot(normal);
                // Bail out if ray and plane are parallel
                // if (Math.abs( dot ) < this.precision){
                //     continue;
                // }
                // calc distance to plane
                var scalar = normal.dot(vector) / dot;
                // if negative distance, then plane is behind ray
                if (scalar < 0) {
                    continue;
                }
                // Intersection point is from + direction * scalar
                localDirection.scaleNumberTo(scalar, intersectPoint);
                intersectPoint.addTo(localFrom, intersectPoint);
                // Get triangle vertices
                mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
                mesh.getVertex(indices[trianglesIndex * 3 + 2], c);
                var squaredDistance = intersectPoint.distanceSquared(localFrom);
                if (!(feng3d.Triangle3.containsPoint(b, a, c, intersectPoint) || feng3d.Triangle3.containsPoint(a, b, c, intersectPoint)) || squaredDistance > fromToDistanceSquared) {
                    continue;
                }
                // transform intersectpoint and normal to world
                Transform.vectorToWorldFrame(quat, normal, worldNormal);
                Transform.pointToWorldFrame(position, quat, intersectPoint, worldIntersectPoint);
                this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
            }
            triangles.length = 0;
        };
        Ray.prototype.reportIntersection = function (normal, hitPointWorld, shape, body, hitFaceIndex) {
            var from = this.from;
            var to = this.to;
            var distance = from.distance(hitPointWorld);
            var result = this.result;
            // Skip back faces?
            if (this.skipBackfaces && normal.dot(this._direction) > 0) {
                return;
            }
            result.hitFaceIndex = typeof (hitFaceIndex) !== 'undefined' ? hitFaceIndex : -1;
            switch (this.mode) {
                case Ray.ALL:
                    this.hasHit = true;
                    result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    result.hasHit = true;
                    this.callback(result);
                    break;
                case Ray.CLOSEST:
                    // Store if closer than current closest
                    if (distance < result.distance || !result.hasHit) {
                        this.hasHit = true;
                        result.hasHit = true;
                        result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    }
                    break;
                case Ray.ANY:
                    // Report and stop.
                    this.hasHit = true;
                    result.hasHit = true;
                    result.set(from, to, normal, hitPointWorld, shape, body, distance);
                    result._shouldStop = true;
                    break;
            }
        };
        /**
         * Check if the AABB is hit by a ray.
         */
        Ray.prototype.overlapsBox3 = function (box3) {
            // const t = 0;
            // ray.direction is unit direction vector of ray
            var dirFracX = 1 / this._direction.x;
            var dirFracY = 1 / this._direction.y;
            var dirFracZ = 1 / this._direction.z;
            // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
            var t1 = (box3.min.x - this.from.x) * dirFracX;
            var t2 = (box3.max.x - this.from.x) * dirFracX;
            var t3 = (box3.min.y - this.from.y) * dirFracY;
            var t4 = (box3.max.y - this.from.y) * dirFracY;
            var t5 = (box3.min.z - this.from.z) * dirFracZ;
            var t6 = (box3.max.z - this.from.z) * dirFracZ;
            // let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
            // let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
            var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
            // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
            if (tmax < 0) {
                // t = tmax;
                return false;
            }
            // if tmin > tmax, ray doesn't intersect AABB
            if (tmin > tmax) {
                // t = tmax;
                return false;
            }
            return true;
        };
        Ray.CLOSEST = 1;
        Ray.ANY = 2;
        Ray.ALL = 4;
        return Ray;
    }());
    var tmpAABB$1 = new feng3d.Box3();
    var tmpArray = [];
    var intersectBodyXi = new feng3d.Vector3();
    var intersectBodyQi = new feng3d.Quaternion();
    var intersectPoint = new feng3d.Vector3();
    var a = new feng3d.Vector3();
    var b = new feng3d.Vector3();
    var c = new feng3d.Vector3();
    var v0 = new feng3d.Vector3();
    var intersect = new feng3d.Vector3();
    var intersectTrimeshNormal = new feng3d.Vector3();
    var intersectTrimeshLocalDirection = new feng3d.Vector3();
    var intersectTrimeshLocalFrom = new feng3d.Vector3();
    var intersectTrimeshLocalTo = new feng3d.Vector3();
    var intersectTrimeshWorldNormal = new feng3d.Vector3();
    var intersectTrimeshWorldIntersectPoint = new feng3d.Vector3();
    // const intersectTrimesh_localAABB = new Box3();
    var intersectTrimeshTriangles = [];
    var intersectTrimeshTreeTransform = new Transform();
    var intersectConvexOptions = {
        faceList: [0]
    };
    var worldPillarOffset = new feng3d.Vector3();
    var intersectHeightfieldLocalRay = new Ray();
    var intersectHeightfieldIndex = [];
    var RayIntersectSphereIntersectionPoint = new feng3d.Vector3();
    var RayIntersectSphereNormal = new feng3d.Vector3();
    var intersectConvexNormal = new feng3d.Vector3();
    // const intersectConvexMinDistNormal = new Vector3();
    // const intersectConvexMinDistIntersect = new Vector3();
    var intersectConvexVector = new feng3d.Vector3();
    Ray.prototype[Shape.types.BOX] = Ray.prototype['intersectBox'];
    Ray.prototype[Shape.types.PLANE] = Ray.prototype['intersectPlane'];
    Ray.prototype[Shape.types.HEIGHTFIELD] = Ray.prototype['intersectHeightfield'];
    Ray.prototype[Shape.types.SPHERE] = Ray.prototype['intersectSphere'];
    Ray.prototype[Shape.types.TRIMESH] = Ray.prototype['intersectTrimesh'];
    Ray.prototype[Shape.types.CONVEXPOLYHEDRON] = Ray.prototype['intersectConvex'];
    function distanceFromIntersection(from, direction, position) {
        // v0 is vector from from to position
        position.subTo(from, v0);
        var dot = v0.dot(direction);
        // intersect = direction*dot + from
        direction.scaleNumberTo(dot, intersect);
        intersect.addTo(from, intersect);
        var distance = position.distance(intersect);
        return distance;
    }

    var SAPBroadphase = /** @class */ (function (_super) {
        __extends(SAPBroadphase, _super);
        /**
         * Sweep and prune broadphase along one axis.
         *
         * @param world
         */
        function SAPBroadphase(world) {
            var _this = _super.call(this) || this;
            _this.axisList = [];
            _this.world = null;
            _this.axisIndex = 0;
            // const axisList = this.axisList;
            if (world) {
                _this.setWorld(world);
            }
            return _this;
        }
        SAPBroadphase.prototype._addBodyHandler = function (event) {
            this.axisList.push(event.data);
        };
        SAPBroadphase.prototype._removeBodyHandler = function (event) {
            var idx = this.axisList.indexOf(event.data);
            if (idx !== -1) {
                this.axisList.splice(idx, 1);
            }
        };
        /**
         * Change the world
         * @param world
         */
        SAPBroadphase.prototype.setWorld = function (world) {
            // Clear the old axis array
            this.axisList.length = 0;
            // Add all bodies from the new world
            for (var i = 0; i < world.bodies.length; i++) {
                this.axisList.push(world.bodies[i]);
            }
            // Remove old handlers, if any
            if (this.world) {
                this.world.off('addBody', this._addBodyHandler, this);
                this.world.off('removeBody', this._removeBodyHandler, this);
            }
            this.world = world;
            // Add handlers to update the list of bodies.
            if (this.world) {
                this.world.on('addBody', this._addBodyHandler, this);
                this.world.on('removeBody', this._removeBodyHandler, this);
            }
            this.dirty = true;
        };
        SAPBroadphase.insertionSortX = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                var j = i - 1;
                for (; j >= 0; j--) {
                    if (a[j].aabb.min.x <= v.aabb.min.x) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        SAPBroadphase.insertionSortY = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                var j = i - 1;
                for (; j >= 0; j--) {
                    if (a[j].aabb.min.y <= v.aabb.min.y) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        SAPBroadphase.insertionSortZ = function (a) {
            for (var i = 1, l = a.length; i < l; i++) {
                var v = a[i];
                var j = i - 1;
                for (; j >= 0; j--) {
                    if (a[j].aabb.min.z <= v.aabb.min.z) {
                        break;
                    }
                    a[j + 1] = a[j];
                }
                a[j + 1] = v;
            }
            return a;
        };
        /**
         * Collect all collision pairs
         * @param _world
         * @param p1
         * @param p2
         */
        SAPBroadphase.prototype.collisionPairs = function (_world, p1, p2) {
            var bodies = this.axisList;
            var N = bodies.length;
            var axisIndex = this.axisIndex;
            var i;
            var j;
            if (this.dirty) {
                this.sortList();
                this.dirty = false;
            }
            // Look through the list
            for (i = 0; i !== N; i++) {
                var bi = bodies[i];
                for (j = i + 1; j < N; j++) {
                    var bj = bodies[j];
                    if (!this.needBroadphaseCollision(bi, bj)) {
                        continue;
                    }
                    if (!SAPBroadphase.checkBounds(bi, bj, axisIndex)) {
                        break;
                    }
                    this.intersectionTest(bi, bj, p1, p2);
                }
            }
        };
        SAPBroadphase.prototype.sortList = function () {
            var axisList = this.axisList;
            var axisIndex = this.axisIndex;
            var N = axisList.length;
            // Update AABBs
            for (var i = 0; i !== N; i++) {
                var bi = axisList[i];
                if (bi.aabbNeedsUpdate) {
                    bi.computeAABB();
                }
            }
            // Sort the list
            if (axisIndex === 0) {
                SAPBroadphase.insertionSortX(axisList);
            }
            else if (axisIndex === 1) {
                SAPBroadphase.insertionSortY(axisList);
            }
            else if (axisIndex === 2) {
                SAPBroadphase.insertionSortZ(axisList);
            }
        };
        /**
         * Check if the bounds of two bodies overlap, along the given SAP axis.
         * @param bi
         * @param bj
         * @param axisIndex
         */
        SAPBroadphase.checkBounds = function (bi, bj, axisIndex) {
            var biPos;
            var bjPos;
            if (axisIndex === 0) {
                biPos = bi.position.x;
                bjPos = bj.position.x;
            }
            else if (axisIndex === 1) {
                biPos = bi.position.y;
                bjPos = bj.position.y;
            }
            else if (axisIndex === 2) {
                biPos = bi.position.z;
                bjPos = bj.position.z;
            }
            var ri = bi.boundingRadius;
            var rj = bj.boundingRadius;
            // const boundA1 = biPos - ri;
            var boundA2 = biPos + ri;
            var boundB1 = bjPos - rj;
            // const boundB2 = bjPos + rj;
            return boundB1 < boundA2;
        };
        /**
         * Computes the variance of the body positions and estimates the best
         * axis to use. Will automatically set property .axisIndex.
         */
        SAPBroadphase.prototype.autoDetectAxis = function () {
            var sumX = 0;
            var sumX2 = 0;
            var sumY = 0;
            var sumY2 = 0;
            var sumZ = 0;
            var sumZ2 = 0;
            var bodies = this.axisList;
            var N = bodies.length;
            var invN = 1 / N;
            for (var i = 0; i !== N; i++) {
                var b = bodies[i];
                var centerX = b.position.x;
                sumX += centerX;
                sumX2 += centerX * centerX;
                var centerY = b.position.y;
                sumY += centerY;
                sumY2 += centerY * centerY;
                var centerZ = b.position.z;
                sumZ += centerZ;
                sumZ2 += centerZ * centerZ;
            }
            var varianceX = sumX2 - sumX * sumX * invN;
            var varianceY = sumY2 - sumY * sumY * invN;
            var varianceZ = sumZ2 - sumZ * sumZ * invN;
            if (varianceX > varianceY) {
                if (varianceX > varianceZ) {
                    this.axisIndex = 0;
                }
                else {
                    this.axisIndex = 2;
                }
            }
            else if (varianceY > varianceZ) {
                this.axisIndex = 1;
            }
            else {
                this.axisIndex = 2;
            }
        };
        /**
         * Returns all the bodies within an AABB.
         * @param _world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        SAPBroadphase.prototype.aabbQuery = function (_world, aabb, result) {
            result = result || [];
            if (this.dirty) {
                this.sortList();
                this.dirty = false;
            }
            // const axisIndex = this.axisIndex; let
            //     axis = 'x';
            // if (axisIndex === 1) { axis = 'y'; }
            // if (axisIndex === 2) { axis = 'z'; }
            var axisList = this.axisList;
            // const lower = aabb.min[axis];
            // const upper = aabb.max[axis];
            for (var i = 0; i < axisList.length; i++) {
                var b = axisList[i];
                if (b.aabbNeedsUpdate) {
                    b.computeAABB();
                }
                if (b.aabb.overlaps(aabb)) {
                    result.push(b);
                }
            }
            return result;
        };
        return SAPBroadphase;
    }(Broadphase));

    var JacobianElement = /** @class */ (function () {
        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        function JacobianElement() {
            this.spatial = new feng3d.Vector3();
            this.rotational = new feng3d.Vector3();
        }
        /**
         * Multiply with other JacobianElement
         * @param element
         */
        JacobianElement.prototype.multiplyElement = function (element) {
            return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
        };
        /**
         * Multiply with two vectors
         * @param spatial
         * @param rotational
         */
        JacobianElement.prototype.multiplyVectors = function (spatial, rotational) {
            return spatial.dot(this.spatial) + rotational.dot(this.rotational);
        };
        return JacobianElement;
    }());

    var Equation = /** @class */ (function () {
        /**
         * Equation base class
         * @class Equation
         * @constructor
         * @author schteppe
         * @param {Body} bi
         * @param {Body} bj
         * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
         * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
         */
        function Equation(bi, bj, minForce, maxForce) {
            if (minForce === void 0) { minForce = -1e6; }
            if (maxForce === void 0) { maxForce = 1e6; }
            this.id = Equation.id++;
            this.minForce = minForce;
            this.maxForce = maxForce;
            this.bi = bi;
            this.bj = bj;
            this.a = 0.0;
            this.b = 0.0;
            this.eps = 0.0;
            this.jacobianElementA = new JacobianElement();
            this.jacobianElementB = new JacobianElement();
            this.enabled = true;
            this.multiplier = 0;
            // Set typical spook params
            this.setSpookParams(1e7, 4, 1 / 60);
        }
        /**
         * Recalculates a,b,eps.
         */
        Equation.prototype.setSpookParams = function (stiffness, relaxation, timeStep) {
            var d = relaxation;
            var k = stiffness;
            var h = timeStep;
            this.a = 4.0 / (h * (1 + 4 * d));
            this.b = (4.0 * d) / (1 + 4 * d);
            this.eps = 4.0 / (h * h * k * (1 + 4 * d));
        };
        /**
         * Computes the RHS of the SPOOK equation
         */
        Equation.prototype.computeB = function (a, b, h) {
            var GW = this.computeGW();
            var Gq = this.computeGq();
            var GiMf = this.computeGiMf();
            return -Gq * a - GW * b - GiMf * h;
        };
        /**
         * Computes G*q, where q are the generalized body coordinates
         */
        Equation.prototype.computeGq = function () {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var xi = bi.position;
            var xj = bj.position;
            return GA.spatial.dot(xi) + GB.spatial.dot(xj);
        };
        /**
         * Computes G*W, where W are the body velocities
         */
        Equation.prototype.computeGW = function () {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var vi = bi.velocity;
            var vj = bj.velocity;
            var wi = bi.angularVelocity;
            var wj = bj.angularVelocity;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        };
        /**
         * Computes G*Wlambda, where W are the body velocities
         */
        Equation.prototype.computeGWlambda = function () {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var vi = bi.vlambda;
            var vj = bj.vlambda;
            var wi = bi.wlambda;
            var wj = bj.wlambda;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        };
        /**
         * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
         */
        Equation.prototype.computeGiMf = function () {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var fi = bi.force;
            var ti = bi.torque;
            var fj = bj.force;
            var tj = bj.torque;
            var invMassi = bi.invMassSolve;
            var invMassj = bj.invMassSolve;
            fi.scaleNumberTo(invMassi, iMfi);
            fj.scaleNumberTo(invMassj, iMfj);
            bi.invInertiaWorldSolve.vmult(ti, invIiVmultTaui);
            bj.invInertiaWorldSolve.vmult(tj, invIjVmultTauj);
            return GA.multiplyVectors(iMfi, invIiVmultTaui) + GB.multiplyVectors(iMfj, invIjVmultTauj);
        };
        /**
         * Computes G*inv(M)*G'
         */
        Equation.prototype.computeGiMGt = function () {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var invMassi = bi.invMassSolve;
            var invMassj = bj.invMassSolve;
            var invIi = bi.invInertiaWorldSolve;
            var invIj = bj.invInertiaWorldSolve;
            var result = invMassi + invMassj;
            invIi.vmult(GA.rotational, tmp);
            result += tmp.dot(GA.rotational);
            invIj.vmult(GB.rotational, tmp);
            result += tmp.dot(GB.rotational);
            return result;
        };
        /**
         * Add constraint velocity to the bodies.
         */
        Equation.prototype.addToWlambda = function (deltalambda) {
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var bi = this.bi;
            var bj = this.bj;
            var temp = addToWlambdaTemp;
            // Add to linear velocity
            // v_lambda += inv(M) * delta_lamba * G
            bi.vlambda.addScaledVectorTo(bi.invMassSolve * deltalambda, GA.spatial, bi.vlambda);
            bj.vlambda.addScaledVectorTo(bj.invMassSolve * deltalambda, GB.spatial, bj.vlambda);
            // Add to angular velocity
            bi.invInertiaWorldSolve.vmult(GA.rotational, temp);
            bi.wlambda.addScaledVectorTo(deltalambda, temp, bi.wlambda);
            bj.invInertiaWorldSolve.vmult(GB.rotational, temp);
            bj.wlambda.addScaledVectorTo(deltalambda, temp, bj.wlambda);
        };
        /**
         * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
         */
        Equation.prototype.computeC = function () {
            return this.computeGiMGt() + this.eps;
        };
        Equation.id = 0;
        return Equation;
    }());
    // const zero = new Vector3();
    var iMfi = new feng3d.Vector3();
    var iMfj = new feng3d.Vector3();
    var invIiVmultTaui = new feng3d.Vector3();
    var invIjVmultTauj = new feng3d.Vector3();
    var tmp = new feng3d.Vector3();
    var addToWlambdaTemp = new feng3d.Vector3();
    // const addToWlambda_Gi = new Vector3();
    // const addToWlambda_Gj = new Vector3();
    // const addToWlambda_ri = new Vector3();
    // const addToWlambda_rj = new Vector3();
    // const addToWlambda_Mdiag = new Vector3();

    var ConeEquation = /** @class */ (function (_super) {
        __extends(ConeEquation, _super);
        /**
         * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function ConeEquation(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new feng3d.Vector3(1, 0, 0);
            _this.axisB = options.axisB ? options.axisB.clone() : new feng3d.Vector3(0, 1, 0);
            _this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
            return _this;
        }
        ConeEquation.prototype.computeB = function (h) {
            var a = this.a;
            var b = this.b;
            var ni = this.axisA;
            var nj = this.axisB;
            var nixnj = tmpVec1$2;
            var njxni = tmpVec2$2;
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            // Caluclate cross products
            ni.crossTo(nj, nixnj);
            nj.crossTo(ni, njxni);
            // The angle between two vector is:
            // cos(theta) = a * b / (length(a) * length(b) = { len(a) = len(b) = 1 } = a * b
            // g = a * b
            // gdot = (b x a) * wi + (a x b) * wj
            // G = [0 bxa 0 axb]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);
            var g = Math.cos(this.angle) - ni.dot(nj);
            var GW = this.computeGW();
            var GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        return ConeEquation;
    }(Equation));
    var tmpVec1$2 = new feng3d.Vector3();
    var tmpVec2$2 = new feng3d.Vector3();

    var RotationalEquation = /** @class */ (function (_super) {
        __extends(RotationalEquation, _super);
        /**
         * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function RotationalEquation(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new feng3d.Vector3(1, 0, 0);
            _this.axisB = options.axisB ? options.axisB.clone() : new feng3d.Vector3(0, 1, 0);
            _this.maxAngle = Math.PI / 2;
            return _this;
        }
        RotationalEquation.prototype.computeB = function (h) {
            var a = this.a;
            var b = this.b;
            var ni = this.axisA;
            var nj = this.axisB;
            var nixnj = tmpVec1$1;
            var njxni = tmpVec2$1;
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            // Caluclate cross products
            ni.crossTo(nj, nixnj);
            nj.crossTo(ni, njxni);
            // g = ni * nj
            // gdot = (nj x ni) * wi + (ni x nj) * wj
            // G = [0 njxni 0 nixnj]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);
            var g = Math.cos(this.maxAngle) - ni.dot(nj);
            var GW = this.computeGW();
            var GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        return RotationalEquation;
    }(Equation));
    var tmpVec1$1 = new feng3d.Vector3();
    var tmpVec2$1 = new feng3d.Vector3();

    var ContactEquation = /** @class */ (function (_super) {
        __extends(ContactEquation, _super);
        /**
         * Contact/non-penetration constraint equation
         *
         * @param bodyA
         * @param bodyB
         *
         * @author schteppe
         */
        function ContactEquation(bodyA, bodyB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB, 0, typeof (maxForce) !== 'undefined' ? maxForce : 1e6) || this;
            _this.restitution = 0.0; // "bounciness": u1 = -e*u0
            _this.ri = new feng3d.Vector3();
            _this.rj = new feng3d.Vector3();
            _this.ni = new feng3d.Vector3();
            return _this;
        }
        ContactEquation.prototype.computeB = function (h) {
            var a = this.a;
            var b = this.b;
            var bi = this.bi;
            var bj = this.bj;
            var ri = this.ri;
            var rj = this.rj;
            var rixn = ContactEquationComputeBTemp1;
            var rjxn = ContactEquationComputeBTemp2;
            var vi = bi.velocity;
            var wi = bi.angularVelocity;
            // const fi = bi.force;
            // const taui = bi.torque;
            var vj = bj.velocity;
            var wj = bj.angularVelocity;
            // const fj = bj.force;
            // const tauj = bj.torque;
            var penetrationVec = ContactEquationComputeBTemp3;
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            var n = this.ni;
            // Caluclate cross products
            ri.crossTo(n, rixn);
            rj.crossTo(n, rjxn);
            // g = xj+rj -(xi+ri)
            // G = [ -ni  -rixn  ni  rjxn ]
            n.negateTo(GA.spatial);
            rixn.negateTo(GA.rotational);
            GB.spatial.copy(n);
            GB.rotational.copy(rjxn);
            // Calculate the penetration vector
            penetrationVec.copy(bj.position);
            penetrationVec.addTo(rj, penetrationVec);
            penetrationVec.subTo(bi.position, penetrationVec);
            penetrationVec.subTo(ri, penetrationVec);
            var g = n.dot(penetrationVec);
            // Compute iteration
            var ePlusOne = this.restitution + 1;
            var GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
            var GiMf = this.computeGiMf();
            var B = -g * a - GW * b - h * GiMf;
            return B;
        };
        /**
         * Get the current relative velocity in the contact point.
         */
        ContactEquation.prototype.getImpactVelocityAlongNormal = function () {
            var vi = ContactEquationGetImpactVelocityAlongNormalVi;
            var vj = ContactEquationGetImpactVelocityAlongNormalVj;
            var xi = ContactEquationGetImpactVelocityAlongNormalXi;
            var xj = ContactEquationGetImpactVelocityAlongNormalXj;
            var relVel = ContactEquationGetImpactVelocityAlongNormalRelVel;
            this.bi.position.addTo(this.ri, xi);
            this.bj.position.addTo(this.rj, xj);
            this.bi.getVelocityAtWorldPoint(xi, vi);
            this.bj.getVelocityAtWorldPoint(xj, vj);
            vi.subTo(vj, relVel);
            return this.ni.dot(relVel);
        };
        return ContactEquation;
    }(Equation));
    var ContactEquationComputeBTemp1 = new feng3d.Vector3(); // Temp vectors
    var ContactEquationComputeBTemp2 = new feng3d.Vector3();
    var ContactEquationComputeBTemp3 = new feng3d.Vector3();
    var ContactEquationGetImpactVelocityAlongNormalVi = new feng3d.Vector3();
    var ContactEquationGetImpactVelocityAlongNormalVj = new feng3d.Vector3();
    var ContactEquationGetImpactVelocityAlongNormalXi = new feng3d.Vector3();
    var ContactEquationGetImpactVelocityAlongNormalXj = new feng3d.Vector3();
    var ContactEquationGetImpactVelocityAlongNormalRelVel = new feng3d.Vector3();

    var Utils = /** @class */ (function () {
        function Utils() {
        }
        /**
         * Extend an options object with default values.
         * @param  options The options object. May be falsy: in this case, a new object is created and returned.
         * @param  defaults An object containing default values.
         * @return The modified options object.
         */
        Utils.defaults = function (options, defaults) {
            options = options || {};
            for (var key in defaults) {
                if (!(key in options)) {
                    options[key] = defaults[key];
                }
            }
            return options;
        };
        return Utils;
    }());

    var Constraint = /** @class */ (function () {
        /**
         * Constraint base class
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function Constraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            options = Utils.defaults(options, {
                collideConnected: true,
                wakeUpBodies: true,
            });
            this.equations = [];
            this.bodyA = bodyA;
            this.bodyB = bodyB;
            this.id = Constraint.idCounter++;
            this.collideConnected = options.collideConnected;
            if (options.wakeUpBodies) {
                if (bodyA) {
                    bodyA.wakeUp();
                }
                if (bodyB) {
                    bodyB.wakeUp();
                }
            }
        }
        /**
         * Update all the equations with data.
         */
        Constraint.prototype.update = function () {
            throw new Error('method update() not implmemented in this Constraint subclass!');
        };
        /**
         * Enables all equations in the constraint.
         */
        Constraint.prototype.enable = function () {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++) {
                eqs[i].enabled = true;
            }
        };
        /**
         * Disables all equations in the constraint.
         */
        Constraint.prototype.disable = function () {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++) {
                eqs[i].enabled = false;
            }
        };
        Constraint.idCounter = 0;
        return Constraint;
    }());

    var PointToPointConstraint = /** @class */ (function (_super) {
        __extends(PointToPointConstraint, _super);
        /**
         * Connects two bodies at given offset points.
         *
         * @param bodyA
         * @param pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
         * @param bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
         * @param pivotB See pivotA.
         * @param maxForce The maximum force that should be applied to constrain the bodies.
         *
         * @example
         *     var bodyA = new Body({ mass: 1 });
         *     var bodyB = new Body({ mass: 1 });
         *     bodyA.position.set(-1, 0, 0);
         *     bodyB.position.set(1, 0, 0);
         *     bodyA.addShape(shapeA);
         *     bodyB.addShape(shapeB);
         *     world.addBody(bodyA);
         *     world.addBody(bodyB);
         *     var localPivotA = new Vector3(1, 0, 0);
         *     var localPivotB = new Vector3(-1, 0, 0);
         *     var constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
         *     world.addConstraint(constraint);
         */
        function PointToPointConstraint(bodyA, pivotA, bodyB, pivotB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB) || this;
            maxForce = typeof (maxForce) !== 'undefined' ? maxForce : 1e6;
            _this.pivotA = pivotA ? pivotA.clone() : new feng3d.Vector3();
            _this.pivotB = pivotB ? pivotB.clone() : new feng3d.Vector3();
            var x = _this.equationX = new ContactEquation(bodyA, bodyB);
            var y = _this.equationY = new ContactEquation(bodyA, bodyB);
            var z = _this.equationZ = new ContactEquation(bodyA, bodyB);
            // Equations to be fed to the solver
            _this.equations.push(x, y, z);
            // Make the equations bidirectional
            x.minForce = y.minForce = z.minForce = -maxForce;
            x.maxForce = y.maxForce = z.maxForce = maxForce;
            x.ni.set(1, 0, 0);
            y.ni.set(0, 1, 0);
            z.ni.set(0, 0, 1);
            return _this;
        }
        PointToPointConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var x = this.equationX;
            var y = this.equationY;
            var z = this.equationZ;
            // Rotate the pivots to world space
            bodyA.quaternion.vmult(this.pivotA, x.ri);
            bodyB.quaternion.vmult(this.pivotB, x.rj);
            y.ri.copy(x.ri);
            y.rj.copy(x.rj);
            z.ri.copy(x.ri);
            z.rj.copy(x.rj);
        };
        return PointToPointConstraint;
    }(Constraint));

    var ConeTwistConstraint = /** @class */ (function (_super) {
        __extends(ConeTwistConstraint, _super);
        /**
         * @class ConeTwistConstraint
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function ConeTwistConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this, bodyA, options.pivotA ? options.pivotA.clone() : new feng3d.Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new feng3d.Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            _this.axisA = options.axisA ? options.axisA.clone() : new feng3d.Vector3();
            _this.axisB = options.axisB ? options.axisB.clone() : new feng3d.Vector3();
            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;
            _this.collideConnected = !!options.collideConnected;
            _this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
            /**
             * @property {ConeEquation} coneEquation
             */
            var c = _this.coneEquation = new ConeEquation(bodyA, bodyB, options);
            /**
             * @property {RotationalEquation} twistEquation
             */
            var t = _this.twistEquation = new RotationalEquation(bodyA, bodyB, options);
            _this.twistAngle = typeof (options.twistAngle) !== 'undefined' ? options.twistAngle : 0;
            // Make the cone equation push the bodies toward the cone axis, not outward
            c.maxForce = 0;
            c.minForce = -maxForce;
            // Make the twist equation add torque toward the initial position
            t.maxForce = 0;
            t.minForce = -maxForce;
            _this.equations.push(c, t);
            return _this;
        }
        ConeTwistConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var cone = this.coneEquation;
            var twist = this.twistEquation;
            _super.prototype.update.call(this);
            // Update the axes to the cone constraint
            bodyA.vectorToWorldFrame(this.axisA, cone.axisA);
            bodyB.vectorToWorldFrame(this.axisB, cone.axisB);
            // Update the world axes in the twist constraint
            this.axisA.tangents(twist.axisA, twist.axisA);
            bodyA.vectorToWorldFrame(twist.axisA, twist.axisA);
            this.axisB.tangents(twist.axisB, twist.axisB);
            bodyB.vectorToWorldFrame(twist.axisB, twist.axisB);
            cone.angle = this.angle;
            twist.maxAngle = this.twistAngle;
        };
        return ConeTwistConstraint;
    }(PointToPointConstraint));
    // var ConeTwistConstraint_update_tmpVec1 = new Vector3();
    // var ConeTwistConstraint_update_tmpVec2 = new Vector3();

    var DistanceConstraint = /** @class */ (function (_super) {
        __extends(DistanceConstraint, _super);
        /**
         * Constrains two bodies to be at a constant distance from each others center of mass.
         *
         * @param bodyA
         * @param bodyB
         * @param distance The distance to keep. If undefined, it will be set to the current distance between bodyA and bodyB
         * @param maxForce
         * @param number
         *
         * @author schteppe
         */
        function DistanceConstraint(bodyA, bodyB, distance, maxForce) {
            var _this = _super.call(this, bodyA, bodyB) || this;
            if (typeof (distance) === 'undefined') {
                distance = bodyA.position.distance(bodyB.position);
            }
            if (typeof (maxForce) === 'undefined') {
                maxForce = 1e6;
            }
            _this.distance = distance;
            /**
             * @property {ContactEquation} distanceEquation
             */
            var eq = _this.distanceEquation = new ContactEquation(bodyA, bodyB);
            _this.equations.push(eq);
            // Make it bidirectional
            eq.minForce = -maxForce;
            eq.maxForce = maxForce;
            return _this;
        }
        DistanceConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var eq = this.distanceEquation;
            var halfDist = this.distance * 0.5;
            var normal = eq.ni;
            bodyB.position.subTo(bodyA.position, normal);
            normal.normalize();
            normal.scaleNumberTo(halfDist, eq.ri);
            normal.scaleNumberTo(-halfDist, eq.rj);
        };
        return DistanceConstraint;
    }(Constraint));

    var RotationalMotorEquation = /** @class */ (function (_super) {
        __extends(RotationalMotorEquation, _super);
        /**
         * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
         *
         * @param bodyA
         * @param bodyB
         * @param maxForce
         *
         * @author schteppe
         */
        function RotationalMotorEquation(bodyA, bodyB, maxForce) {
            var _this = _super.call(this, bodyA, bodyB, -(typeof (maxForce) !== 'undefined' ? maxForce : 1e6), typeof (maxForce) !== 'undefined' ? maxForce : 1e6) || this;
            _this.axisA = new feng3d.Vector3();
            _this.axisB = new feng3d.Vector3(); // World oriented rotational axis
            _this.targetVelocity = 0;
            return _this;
        }
        RotationalMotorEquation.prototype.computeB = function (h) {
            // const a = this.a;
            var b = this.b;
            // const bi = this.bi;
            // const bj = this.bj;
            var axisA = this.axisA;
            var axisB = this.axisB;
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            // g = 0
            // gdot = axisA * wi - axisB * wj
            // gdot = G * W = G * [vi wi vj wj]
            // =>
            // G = [0 axisA 0 -axisB]
            GA.rotational.copy(axisA);
            axisB.negateTo(GB.rotational);
            var GW = this.computeGW() - this.targetVelocity;
            var GiMf = this.computeGiMf();
            var B = -GW * b - h * GiMf;
            return B;
        };
        return RotationalMotorEquation;
    }(Equation));

    var HingeConstraint = /** @class */ (function (_super) {
        __extends(HingeConstraint, _super);
        /**
         * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function HingeConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;
            _this = _super.call(this, bodyA, options.pivotA ? options.pivotA.clone() : new feng3d.Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new feng3d.Vector3(), maxForce) || this;
            var axisA = _this.axisA = options.axisA ? options.axisA.clone() : new feng3d.Vector3(1, 0, 0);
            axisA.normalize();
            var axisB = _this.axisB = options.axisB ? options.axisB.clone() : new feng3d.Vector3(1, 0, 0);
            axisB.normalize();
            var r1 = _this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);
            var r2 = _this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);
            var motor = _this.motorEquation = new RotationalMotorEquation(bodyA, bodyB, maxForce);
            motor.enabled = false; // Not enabled by default
            // Equations to be fed to the solver
            _this.equations.push(r1, // rotational1
            r2, // rotational2
            motor);
            return _this;
        }
        HingeConstraint.prototype.enableMotor = function () {
            this.motorEquation.enabled = true;
        };
        HingeConstraint.prototype.disableMotor = function () {
            this.motorEquation.enabled = false;
        };
        HingeConstraint.prototype.setMotorSpeed = function (speed) {
            this.motorEquation.targetVelocity = speed;
        };
        HingeConstraint.prototype.setMotorMaxForce = function (maxForce) {
            this.motorEquation.maxForce = maxForce;
            this.motorEquation.minForce = -maxForce;
        };
        HingeConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var motor = this.motorEquation;
            var r1 = this.rotationalEquation1;
            var r2 = this.rotationalEquation2;
            var worldAxisA = HingeConstraintUpdateTmpVec1;
            var worldAxisB = HingeConstraintUpdateTmpVec2;
            var axisA = this.axisA;
            var axisB = this.axisB;
            _super.prototype.update.call(this);
            // Get world axes
            bodyA.quaternion.vmult(axisA, worldAxisA);
            bodyB.quaternion.vmult(axisB, worldAxisB);
            worldAxisA.tangents(r1.axisA, r2.axisA);
            r1.axisB.copy(worldAxisB);
            r2.axisB.copy(worldAxisB);
            if (this.motorEquation.enabled) {
                bodyA.quaternion.vmult(this.axisA, motor.axisA);
                bodyB.quaternion.vmult(this.axisB, motor.axisB);
            }
        };
        return HingeConstraint;
    }(PointToPointConstraint));
    var HingeConstraintUpdateTmpVec1 = new feng3d.Vector3();
    var HingeConstraintUpdateTmpVec2 = new feng3d.Vector3();

    var LockConstraint = /** @class */ (function (_super) {
        __extends(LockConstraint, _super);
        /**
         * Lock constraint. Will remove all degrees of freedom between the bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        function LockConstraint(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            var _this = 
            // The point-to-point constraint will keep a point shared between the bodies
            _super.call(this, bodyA, new feng3d.Vector3(), bodyB, new feng3d.Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6) || this;
            // Set pivot point in between
            var pivotA = _this.pivotA;
            var pivotB = _this.pivotB;
            var halfWay = new feng3d.Vector3();
            bodyA.position.addTo(bodyB.position, halfWay);
            halfWay.scaleNumberTo(0.5, halfWay);
            bodyB.pointToLocalFrame(halfWay, pivotB);
            bodyA.pointToLocalFrame(halfWay, pivotA);
            // Store initial rotation of the bodies as unit vectors in the local body spaces
            _this.xA = bodyA.vectorToLocalFrame(feng3d.Vector3.X_AXIS);
            _this.xB = bodyB.vectorToLocalFrame(feng3d.Vector3.X_AXIS);
            _this.yA = bodyA.vectorToLocalFrame(feng3d.Vector3.Y_AXIS);
            _this.yB = bodyB.vectorToLocalFrame(feng3d.Vector3.Y_AXIS);
            _this.zA = bodyA.vectorToLocalFrame(feng3d.Vector3.Z_AXIS);
            _this.zB = bodyB.vectorToLocalFrame(feng3d.Vector3.Z_AXIS);
            // ...and the following rotational equations will keep all rotational DOF's in place
            var r1 = _this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);
            var r2 = _this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);
            var r3 = _this.rotationalEquation3 = new RotationalEquation(bodyA, bodyB, options);
            _this.equations.push(r1, r2, r3);
            return _this;
        }
        LockConstraint.prototype.update = function () {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            // const motor = this.motorEquation;
            var r1 = this.rotationalEquation1;
            var r2 = this.rotationalEquation2;
            var r3 = this.rotationalEquation3;
            // const worldAxisA = LockConstraint_update_tmpVec1;
            // const worldAxisB = LockConstraint_update_tmpVec2;
            _super.prototype.update.call(this);
            // These vector pairs must be orthogonal
            bodyA.vectorToWorldFrame(this.xA, r1.axisA);
            bodyB.vectorToWorldFrame(this.yB, r1.axisB);
            bodyA.vectorToWorldFrame(this.yA, r2.axisA);
            bodyB.vectorToWorldFrame(this.zB, r2.axisB);
            bodyA.vectorToWorldFrame(this.zA, r3.axisA);
            bodyB.vectorToWorldFrame(this.xB, r3.axisB);
        };
        return LockConstraint;
    }(PointToPointConstraint));
    // var LockConstraint_update_tmpVec1 = new Vector3();
    // var LockConstraint_update_tmpVec2 = new Vector3();

    var FrictionEquation = /** @class */ (function (_super) {
        __extends(FrictionEquation, _super);
        /**
         * Constrains the slipping in a contact along a tangent
         * @class FrictionEquation
         * @constructor
         * @author schteppe
         * @param {Body} bodyA
         * @param {Body} bodyB
         * @param {Number} slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
         * @extends Equation
         */
        function FrictionEquation(bodyA, bodyB, slipForce) {
            var _this = _super.call(this, bodyA, bodyB, -slipForce, slipForce) || this;
            _this.ri = new feng3d.Vector3();
            _this.rj = new feng3d.Vector3();
            _this.t = new feng3d.Vector3(); // tangent
            return _this;
        }
        FrictionEquation.prototype.computeB = function (h) {
            // const a = this.a;
            var b = this.b;
            // const bi = this.bi;
            // const bj = this.bj;
            var ri = this.ri;
            var rj = this.rj;
            var rixt = FrictionEquationComputeBTemp1;
            var rjxt = FrictionEquationComputeBTemp2;
            var t = this.t;
            // Caluclate cross products
            ri.crossTo(t, rixt);
            rj.crossTo(t, rjxt);
            // G = [-t -rixt t rjxt]
            // And remember, this is a pure velocity constraint, g is always zero!
            var GA = this.jacobianElementA;
            var GB = this.jacobianElementB;
            t.negateTo(GA.spatial);
            rixt.negateTo(GA.rotational);
            GB.spatial.copy(t);
            GB.rotational.copy(rjxt);
            var GW = this.computeGW();
            var GiMf = this.computeGiMf();
            var B = -GW * b - h * GiMf;
            return B;
        };
        return FrictionEquation;
    }(Equation));
    var FrictionEquationComputeBTemp1 = new feng3d.Vector3();
    var FrictionEquationComputeBTemp2 = new feng3d.Vector3();

    var ContactMaterial = /** @class */ (function () {
        /**
         * Defines what happens when two materials meet.
         *
         * @param m1
         * @param m2
         * @param options
         */
        function ContactMaterial(m1, m2, options) {
            if (options === void 0) { options = {}; }
            options = Utils.defaults(options, {
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 3
            });
            this.id = ContactMaterial.idCounter++;
            this.materials = [m1, m2];
            this.friction = options.friction;
            this.restitution = options.restitution;
            this.contactEquationStiffness = options.contactEquationStiffness;
            this.contactEquationRelaxation = options.contactEquationRelaxation;
            this.frictionEquationStiffness = options.frictionEquationStiffness;
            this.frictionEquationRelaxation = options.frictionEquationRelaxation;
        }
        ContactMaterial.idCounter = 0;
        return ContactMaterial;
    }());

    var Material = /** @class */ (function () {
        /**
         * Defines a physics material.
         *
         * @param options
         * @author schteppe
         */
        function Material(options) {
            if (options === void 0) { options = {}; }
            var name = '';
            // Backwards compatibility fix
            if (typeof (options) === 'string') {
                name = options;
                options = {};
            }
            else if (typeof (options) === 'object') {
                name = '';
            }
            this.name = name;
            this.id = Material.idCounter++;
            this.friction = typeof (options.friction) !== 'undefined' ? options.friction : -1;
            this.restitution = typeof (options.restitution) !== 'undefined' ? options.restitution : -1;
        }
        Material.idCounter = 0;
        return Material;
    }());

    var WheelInfo = /** @class */ (function () {
        /**
         *
         * @param options
         */
        function WheelInfo(options) {
            if (options === void 0) { options = {}; }
            options = Utils.defaults(options, {
                chassisConnectionPointLocal: new feng3d.Vector3(),
                chassisConnectionPointWorld: new feng3d.Vector3(),
                directionLocal: new feng3d.Vector3(),
                directionWorld: new feng3d.Vector3(),
                axleLocal: new feng3d.Vector3(),
                axleWorld: new feng3d.Vector3(),
                suspensionRestLength: 1,
                suspensionMaxLength: 2,
                radius: 1,
                suspensionStiffness: 100,
                dampingCompression: 10,
                dampingRelaxation: 10,
                frictionSlip: 10000,
                steering: 0,
                rotation: 0,
                deltaRotation: 0,
                rollInfluence: 0.01,
                maxSuspensionForce: Number.MAX_VALUE,
                isFrontWheel: true,
                clippedInvContactDotSuspension: 1,
                suspensionRelativeVelocity: 0,
                suspensionForce: 0,
                skidInfo: 0,
                suspensionLength: 0,
                maxSuspensionTravel: 1,
                useCustomSlidingRotationalSpeed: false,
                customSlidingRotationalSpeed: -0.1
            });
            this.maxSuspensionTravel = options.maxSuspensionTravel;
            this.customSlidingRotationalSpeed = options.customSlidingRotationalSpeed;
            this.useCustomSlidingRotationalSpeed = options.useCustomSlidingRotationalSpeed;
            this.sliding = false;
            this.chassisConnectionPointLocal = options.chassisConnectionPointLocal.clone();
            this.chassisConnectionPointWorld = options.chassisConnectionPointWorld.clone();
            this.directionLocal = options.directionLocal.clone();
            this.directionWorld = options.directionWorld.clone();
            this.axleLocal = options.axleLocal.clone();
            this.axleWorld = options.axleWorld.clone();
            this.suspensionRestLength = options.suspensionRestLength;
            this.suspensionMaxLength = options.suspensionMaxLength;
            this.radius = options.radius;
            this.suspensionStiffness = options.suspensionStiffness;
            this.dampingCompression = options.dampingCompression;
            this.dampingRelaxation = options.dampingRelaxation;
            this.frictionSlip = options.frictionSlip;
            this.steering = 0;
            this.rotation = 0;
            this.deltaRotation = 0;
            this.rollInfluence = options.rollInfluence;
            this.maxSuspensionForce = options.maxSuspensionForce;
            this.engineForce = 0;
            this.brake = 0;
            this.isFrontWheel = options.isFrontWheel;
            this.clippedInvContactDotSuspension = 1;
            this.suspensionRelativeVelocity = 0;
            this.suspensionForce = 0;
            this.skidInfo = 0;
            this.suspensionLength = 0;
            this.sideImpulse = 0;
            this.forwardImpulse = 0;
            this.raycastResult = new RaycastResult();
            this.worldTransform = new Transform();
            this.isInContact = false;
        }
        WheelInfo.prototype.updateWheel = function (chassis) {
            var raycastResult = this.raycastResult;
            if (this.isInContact) {
                var project = raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);
                raycastResult.hitPointWorld.subTo(chassis.position, relpos);
                chassis.getVelocityAtWorldPoint(relpos, chassisVelocityAtContactPoint);
                var projVel = raycastResult.hitNormalWorld.dot(chassisVelocityAtContactPoint);
                if (project >= -0.1) {
                    this.suspensionRelativeVelocity = 0.0;
                    this.clippedInvContactDotSuspension = 1.0 / 0.1;
                }
                else {
                    var inv = -1 / project;
                    this.suspensionRelativeVelocity = projVel * inv;
                    this.clippedInvContactDotSuspension = inv;
                }
            }
            else {
                // Not in contact : position wheel in a nice (rest length) position
                raycastResult.suspensionLength = this.suspensionRestLength;
                this.suspensionRelativeVelocity = 0.0;
                raycastResult.directionWorld.scaleNumberTo(-1, raycastResult.hitNormalWorld);
                this.clippedInvContactDotSuspension = 1.0;
            }
        };
        return WheelInfo;
    }());
    var chassisVelocityAtContactPoint = new feng3d.Vector3();
    var relpos = new feng3d.Vector3();

    var RaycastVehicle = /** @class */ (function () {
        /**
         * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
         *
         * @param options
         */
        function RaycastVehicle(options) {
            if (options === void 0) { options = {}; }
            this.chassisBody = options.chassisBody;
            this.wheelInfos = [];
            this.sliding = false;
            this.world = null;
            this.indexRightAxis = typeof (options.indexRightAxis) !== 'undefined' ? options.indexRightAxis : 1;
            this.indexForwardAxis = typeof (options.indexForwardAxis) !== 'undefined' ? options.indexForwardAxis : 0;
            this.indexUpAxis = typeof (options.indexUpAxis) !== 'undefined' ? options.indexUpAxis : 2;
        }
        /**
         * Add a wheel. For information about the options, see WheelInfo.
         *
         * @param options
         */
        RaycastVehicle.prototype.addWheel = function (options) {
            if (options === void 0) { options = {}; }
            var info = new WheelInfo(options);
            var index = this.wheelInfos.length;
            this.wheelInfos.push(info);
            return index;
        };
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         */
        RaycastVehicle.prototype.setSteeringValue = function (value, wheelIndex) {
            var wheel = this.wheelInfos[wheelIndex];
            wheel.steering = value;
        };
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        RaycastVehicle.prototype.applyEngineForce = function (value, wheelIndex) {
            this.wheelInfos[wheelIndex].engineForce = value;
        };
        /**
         * Set the braking force of a wheel
         *
         * @param brake
         * @param wheelIndex
         */
        RaycastVehicle.prototype.setBrake = function (brake, wheelIndex) {
            this.wheelInfos[wheelIndex].brake = brake;
        };
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        RaycastVehicle.prototype.addToWorld = function (world) {
            world.addBody(this.chassisBody);
            world.on('preStep', this._preStepCallback, this);
            this.world = world;
        };
        RaycastVehicle.prototype._preStepCallback = function () {
            this.updateVehicle(this.world.dt);
        };
        /**
         * Get one of the wheel axles, world-oriented.
         * @param axisIndex
         * @param result
         */
        RaycastVehicle.prototype.getVehicleAxisWorld = function (axisIndex, result) {
            result.set(axisIndex === 0 ? 1 : 0, axisIndex === 1 ? 1 : 0, axisIndex === 2 ? 1 : 0);
            this.chassisBody.vectorToWorldFrame(result, result);
        };
        RaycastVehicle.prototype.updateVehicle = function (timeStep) {
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            var chassisBody = this.chassisBody;
            for (var i = 0; i < numWheels; i++) {
                this.updateWheelTransform(i);
            }
            this.currentVehicleSpeedKmHour = 3.6 * chassisBody.velocity.length;
            var forwardWorld = new feng3d.Vector3();
            this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld);
            if (forwardWorld.dot(chassisBody.velocity) < 0) {
                this.currentVehicleSpeedKmHour *= -1;
            }
            // simulate suspension
            for (var i = 0; i < numWheels; i++) {
                this.castRay(wheelInfos[i]);
            }
            this.updateSuspension(timeStep);
            var impulse = new feng3d.Vector3();
            var relpos = new feng3d.Vector3();
            for (var i = 0; i < numWheels; i++) {
                // apply suspension force
                var wheel = wheelInfos[i];
                var suspensionForce = wheel.suspensionForce;
                if (suspensionForce > wheel.maxSuspensionForce) {
                    suspensionForce = wheel.maxSuspensionForce;
                }
                wheel.raycastResult.hitNormalWorld.scaleNumberTo(suspensionForce * timeStep, impulse);
                wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, relpos);
                chassisBody.applyImpulse(impulse, relpos);
            }
            this.updateFriction(timeStep);
            var hitNormalWorldScaledWithProj = new feng3d.Vector3();
            var fwd = new feng3d.Vector3();
            var vel = new feng3d.Vector3();
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                // let relpos = new Vector3();
                // wheel.chassisConnectionPointWorld.subTo(chassisBody.position, relpos);
                chassisBody.getVelocityAtWorldPoint(wheel.chassisConnectionPointWorld, vel);
                // Hack to get the rotation in the correct direction
                var m = 1;
                switch (this.indexUpAxis) {
                    case 1:
                        m = -1;
                        break;
                }
                if (wheel.isInContact) {
                    this.getVehicleAxisWorld(this.indexForwardAxis, fwd);
                    var proj = fwd.dot(wheel.raycastResult.hitNormalWorld);
                    wheel.raycastResult.hitNormalWorld.scaleNumberTo(proj, hitNormalWorldScaledWithProj);
                    fwd.subTo(hitNormalWorldScaledWithProj, fwd);
                    var proj2 = fwd.dot(vel);
                    wheel.deltaRotation = m * proj2 * timeStep / wheel.radius;
                }
                if ((wheel.sliding || !wheel.isInContact) && wheel.engineForce !== 0 && wheel.useCustomSlidingRotationalSpeed) {
                    // Apply custom rotation when accelerating and sliding
                    wheel.deltaRotation = (wheel.engineForce > 0 ? 1 : -1) * wheel.customSlidingRotationalSpeed * timeStep;
                }
                // Lock wheels
                if (Math.abs(wheel.brake) > Math.abs(wheel.engineForce)) {
                    wheel.deltaRotation = 0;
                }
                wheel.rotation += wheel.deltaRotation; // Use the old value
                wheel.deltaRotation *= 0.99; // damping of rotation when not in contact
            }
        };
        RaycastVehicle.prototype.updateSuspension = function (_deltaTime) {
            var chassisBody = this.chassisBody;
            var chassisMass = chassisBody.mass;
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            for (var wIt = 0; wIt < numWheels; wIt++) {
                var wheel = wheelInfos[wIt];
                if (wheel.isInContact) {
                    var force = void 0;
                    // Spring
                    var suspLength = wheel.suspensionRestLength;
                    var currentLength = wheel.suspensionLength;
                    var lengthDiff = (suspLength - currentLength);
                    force = wheel.suspensionStiffness * lengthDiff * wheel.clippedInvContactDotSuspension;
                    // Damper
                    var projectedRelVel = wheel.suspensionRelativeVelocity;
                    var suspDamping = void 0;
                    if (projectedRelVel < 0) {
                        suspDamping = wheel.dampingCompression;
                    }
                    else {
                        suspDamping = wheel.dampingRelaxation;
                    }
                    force -= suspDamping * projectedRelVel;
                    wheel.suspensionForce = force * chassisMass;
                    if (wheel.suspensionForce < 0) {
                        wheel.suspensionForce = 0;
                    }
                }
                else {
                    wheel.suspensionForce = 0;
                }
            }
        };
        /**
         * Remove the vehicle including its constraints from the world.
         *
         * @param world
         */
        RaycastVehicle.prototype.removeFromWorld = function (world) {
            world.removeBody(this.chassisBody);
            world.off('preStep', this._preStepCallback, this);
            this.world = null;
        };
        RaycastVehicle.prototype.castRay = function (wheel) {
            var rayvector = castRay$rayvector;
            var target = castRay$target;
            this.updateWheelTransformWorld(wheel);
            var chassisBody = this.chassisBody;
            var depth = -1;
            var raylen = wheel.suspensionRestLength + wheel.radius;
            wheel.directionWorld.scaleNumberTo(raylen, rayvector);
            var source = wheel.chassisConnectionPointWorld;
            source.addTo(rayvector, target);
            var raycastResult = wheel.raycastResult;
            // const param = 0;
            raycastResult.reset();
            // Turn off ray collision with the chassis temporarily
            var oldState = chassisBody.collisionResponse;
            chassisBody.collisionResponse = false;
            // Cast ray against world
            this.world.raycastClosest(source, target, {
                skipBackfaces: true
            }, raycastResult);
            chassisBody.collisionResponse = oldState;
            var object = raycastResult.body;
            wheel.raycastResult.groundObject = 0; // ?
            if (object) {
                depth = raycastResult.distance;
                wheel.raycastResult.hitNormalWorld = raycastResult.hitNormalWorld;
                wheel.isInContact = true;
                var hitDistance = raycastResult.distance;
                wheel.suspensionLength = hitDistance - wheel.radius;
                // clamp on max suspension travel
                var minSuspensionLength = wheel.suspensionRestLength - wheel.maxSuspensionTravel;
                var maxSuspensionLength = wheel.suspensionRestLength + wheel.maxSuspensionTravel;
                if (wheel.suspensionLength < minSuspensionLength) {
                    wheel.suspensionLength = minSuspensionLength;
                }
                if (wheel.suspensionLength > maxSuspensionLength) {
                    wheel.suspensionLength = maxSuspensionLength;
                    wheel.raycastResult.reset();
                }
                var denominator = wheel.raycastResult.hitNormalWorld.dot(wheel.directionWorld);
                var chassisVelocityAtContactPoint = new feng3d.Vector3();
                chassisBody.getVelocityAtWorldPoint(wheel.raycastResult.hitPointWorld, chassisVelocityAtContactPoint);
                var projVel = wheel.raycastResult.hitNormalWorld.dot(chassisVelocityAtContactPoint);
                if (denominator >= -0.1) {
                    wheel.suspensionRelativeVelocity = 0;
                    wheel.clippedInvContactDotSuspension = 1 / 0.1;
                }
                else {
                    var inv = -1 / denominator;
                    wheel.suspensionRelativeVelocity = projVel * inv;
                    wheel.clippedInvContactDotSuspension = inv;
                }
            }
            else {
                // put wheel info as in rest position
                wheel.suspensionLength = wheel.suspensionRestLength + 0 * wheel.maxSuspensionTravel;
                wheel.suspensionRelativeVelocity = 0.0;
                wheel.directionWorld.scaleNumberTo(-1, wheel.raycastResult.hitNormalWorld);
                wheel.clippedInvContactDotSuspension = 1.0;
            }
            return depth;
        };
        RaycastVehicle.prototype.updateWheelTransformWorld = function (wheel) {
            wheel.isInContact = false;
            var chassisBody = this.chassisBody;
            chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, wheel.chassisConnectionPointWorld);
            chassisBody.vectorToWorldFrame(wheel.directionLocal, wheel.directionWorld);
            chassisBody.vectorToWorldFrame(wheel.axleLocal, wheel.axleWorld);
        };
        /**
         * Update one of the wheel transform.
         * Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
         *
         * @param wheelIndex The wheel index to update.
         */
        RaycastVehicle.prototype.updateWheelTransform = function (wheelIndex) {
            var up = tmpVec4;
            var right = tmpVec5;
            var fwd = tmpVec6;
            var wheel = this.wheelInfos[wheelIndex];
            this.updateWheelTransformWorld(wheel);
            wheel.directionLocal.scaleNumberTo(-1, up);
            right.copy(wheel.axleLocal);
            up.crossTo(right, fwd);
            fwd.normalize();
            right.normalize();
            // Rotate around steering over the wheelAxle
            var steering = wheel.steering;
            var steeringOrn = new feng3d.Quaternion();
            steeringOrn.fromAxisAngle(up, steering);
            var rotatingOrn = new feng3d.Quaternion();
            rotatingOrn.fromAxisAngle(right, wheel.rotation);
            // World rotation of the wheel
            var q = wheel.worldTransform.quaternion;
            this.chassisBody.quaternion.multTo(steeringOrn, q);
            q.multTo(rotatingOrn, q);
            q.normalize();
            // world position of the wheel
            var p = wheel.worldTransform.position;
            p.copy(wheel.directionWorld);
            p.scaleNumberTo(wheel.suspensionLength, p);
            p.addTo(wheel.chassisConnectionPointWorld, p);
        };
        /**
         * Get the world transform of one of the wheels
         *
         * @param wheelIndex
         */
        RaycastVehicle.prototype.getWheelTransformWorld = function (wheelIndex) {
            return this.wheelInfos[wheelIndex].worldTransform;
        };
        RaycastVehicle.prototype.updateFriction = function (timeStep) {
            var surfNormalWS$scaled$proj = updateFriction$surfNormalWS$scaled$proj;
            // calculate the impulse, so that the wheels don't move sidewards
            var wheelInfos = this.wheelInfos;
            var numWheels = wheelInfos.length;
            var chassisBody = this.chassisBody;
            var forwardWS = updateFriction$forwardWS;
            var axle = updateFriction$axle;
            var numWheelsOnGround = 0;
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                if (groundObject) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    numWheelsOnGround++;
                }
                wheel.sideImpulse = 0;
                wheel.forwardImpulse = 0;
                if (!forwardWS[i]) {
                    forwardWS[i] = new feng3d.Vector3();
                }
                if (!axle[i]) {
                    axle[i] = new feng3d.Vector3();
                }
            }
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                if (groundObject) {
                    var axlei = axle[i];
                    var wheelTrans = this.getWheelTransformWorld(i);
                    // Get world axle
                    wheelTrans.vectorToWorldFrame(directions[this.indexRightAxis], axlei);
                    var surfNormalWS = wheel.raycastResult.hitNormalWorld;
                    var proj = axlei.dot(surfNormalWS);
                    surfNormalWS.scaleNumberTo(proj, surfNormalWS$scaled$proj);
                    axlei.subTo(surfNormalWS$scaled$proj, axlei);
                    axlei.normalize();
                    surfNormalWS.crossTo(axlei, forwardWS[i]);
                    forwardWS[i].normalize();
                    wheel.sideImpulse = resolveSingleBilateral(chassisBody, wheel.raycastResult.hitPointWorld, groundObject, wheel.raycastResult.hitPointWorld, axlei);
                    wheel.sideImpulse *= sideFrictionStiffness2;
                }
            }
            var sideFactor = 1;
            var fwdFactor = 0.5;
            this.sliding = false;
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var groundObject = wheel.raycastResult.body;
                var rollingFriction = 0;
                wheel.slipInfo = 1;
                if (groundObject) {
                    var defaultRollingFrictionImpulse = 0;
                    var maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse;
                    // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
                    // rollingFriction = calcRollingFriction(contactPt);
                    rollingFriction = calcRollingFriction(chassisBody, groundObject, wheel.raycastResult.hitPointWorld, forwardWS[i], maxImpulse);
                    rollingFriction += wheel.engineForce * timeStep;
                    // rollingFriction = 0;
                    var factor = maxImpulse / rollingFriction;
                    wheel.slipInfo *= factor;
                }
                // switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)
                wheel.forwardImpulse = 0;
                wheel.skidInfo = 1;
                if (groundObject) {
                    wheel.skidInfo = 1;
                    var maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip;
                    var maximpSide = maximp;
                    var maximpSquared = maximp * maximpSide;
                    wheel.forwardImpulse = rollingFriction; // wheelInfo.engineForce* timeStep;
                    var x = wheel.forwardImpulse * fwdFactor;
                    var y = wheel.sideImpulse * sideFactor;
                    var impulseSquared = x * x + y * y;
                    wheel.sliding = false;
                    if (impulseSquared > maximpSquared) {
                        this.sliding = true;
                        wheel.sliding = true;
                        var factor = maximp / Math.sqrt(impulseSquared);
                        wheel.skidInfo *= factor;
                    }
                }
            }
            if (this.sliding) {
                for (var i = 0; i < numWheels; i++) {
                    var wheel = wheelInfos[i];
                    if (wheel.sideImpulse !== 0) {
                        if (wheel.skidInfo < 1) {
                            wheel.forwardImpulse *= wheel.skidInfo;
                            wheel.sideImpulse *= wheel.skidInfo;
                        }
                    }
                }
            }
            // apply the impulses
            for (var i = 0; i < numWheels; i++) {
                var wheel = wheelInfos[i];
                var relPos = new feng3d.Vector3();
                wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, relPos);
                // cannons applyimpulse is using world coord for the position
                // rel_pos.copy(wheel.raycastResult.hitPointWorld);
                if (wheel.forwardImpulse !== 0) {
                    var impulse = new feng3d.Vector3();
                    forwardWS[i].scaleNumberTo(wheel.forwardImpulse, impulse);
                    chassisBody.applyImpulse(impulse, relPos);
                }
                if (wheel.sideImpulse !== 0) {
                    var groundObject = wheel.raycastResult.body;
                    var relPos2 = new feng3d.Vector3();
                    wheel.raycastResult.hitPointWorld.subTo(groundObject.position, relPos2);
                    // rel_pos2.copy(wheel.raycastResult.hitPointWorld);
                    var sideImp = new feng3d.Vector3();
                    axle[i].scaleNumberTo(wheel.sideImpulse, sideImp);
                    // Scale the relative position in the up direction with rollInfluence.
                    // If rollInfluence is 1, the impulse will be applied on the hitPoint (easy to roll over), if it is zero it will be applied in the same plane as the center of mass (not easy to roll over).
                    chassisBody.vectorToLocalFrame(relPos, relPos);
                    relPos['xyz'[this.indexUpAxis]] *= wheel.rollInfluence;
                    chassisBody.vectorToWorldFrame(relPos, relPos);
                    chassisBody.applyImpulse(sideImp, relPos);
                    // apply friction impulse on the ground
                    sideImp.scaleNumberTo(-1, sideImp);
                    groundObject.applyImpulse(sideImp, relPos2);
                }
            }
        };
        return RaycastVehicle;
    }());
    // const tmpVec1 = new Vector3();
    // const tmpVec2 = new Vector3();
    // const tmpVec3 = new Vector3();
    var tmpVec4 = new feng3d.Vector3();
    var tmpVec5 = new feng3d.Vector3();
    var tmpVec6 = new feng3d.Vector3();
    // const tmpRay = new Ray();
    // const torque = new Vector3();
    var castRay$rayvector = new feng3d.Vector3();
    var castRay$target = new feng3d.Vector3();
    var directions = [
        new feng3d.Vector3(1, 0, 0),
        new feng3d.Vector3(0, 1, 0),
        new feng3d.Vector3(0, 0, 1)
    ];
    var updateFriction$surfNormalWS$scaled$proj = new feng3d.Vector3();
    var updateFriction$axle = [];
    var updateFriction$forwardWS = [];
    var sideFrictionStiffness2 = 1;
    var calcRollingFriction$vel1 = new feng3d.Vector3();
    var calcRollingFriction$vel2 = new feng3d.Vector3();
    var calcRollingFriction$vel = new feng3d.Vector3();
    function calcRollingFriction(body0, body1, frictionPosWorld, frictionDirectionWorld, maxImpulse) {
        var j1 = 0;
        var contactPosWorld = frictionPosWorld;
        // let rel_pos1 = new Vector3();
        // let rel_pos2 = new Vector3();
        var vel1 = calcRollingFriction$vel1;
        var vel2 = calcRollingFriction$vel2;
        var vel = calcRollingFriction$vel;
        // contactPosWorld.subTo(body0.position, rel_pos1);
        // contactPosWorld.subTo(body1.position, rel_pos2);
        body0.getVelocityAtWorldPoint(contactPosWorld, vel1);
        body1.getVelocityAtWorldPoint(contactPosWorld, vel2);
        vel1.subTo(vel2, vel);
        var vrel = frictionDirectionWorld.dot(vel);
        var denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld);
        var denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld);
        var relaxation = 1;
        var jacDiagABInv = relaxation / (denom0 + denom1);
        // calculate j that moves us to zero relative velocity
        j1 = -vrel * jacDiagABInv;
        if (maxImpulse < j1) {
            j1 = maxImpulse;
        }
        if (j1 < -maxImpulse) {
            j1 = -maxImpulse;
        }
        return j1;
    }
    var computeImpulseDenominator$r0 = new feng3d.Vector3();
    var computeImpulseDenominator$c0 = new feng3d.Vector3();
    var computeImpulseDenominator$vec = new feng3d.Vector3();
    var computeImpulseDenominator$m = new feng3d.Vector3();
    function computeImpulseDenominator(body, pos, normal) {
        var r0 = computeImpulseDenominator$r0;
        var c0 = computeImpulseDenominator$c0;
        var vec = computeImpulseDenominator$vec;
        var m = computeImpulseDenominator$m;
        pos.subTo(body.position, r0);
        r0.crossTo(normal, c0);
        body.invInertiaWorld.vmult(c0, m);
        m.crossTo(r0, vec);
        return body.invMass + normal.dot(vec);
    }
    var resolveSingleBilateral$vel1 = new feng3d.Vector3();
    var resolveSingleBilateral$vel2 = new feng3d.Vector3();
    var resolveSingleBilateral$vel = new feng3d.Vector3();
    // bilateral constraint between two dynamic objects
    function resolveSingleBilateral(body1, pos1, body2, pos2, normal) {
        var normalLenSqr = normal.lengthSquared;
        if (normalLenSqr > 1.1) {
            return 0; // no impulse
        }
        // let rel_pos1 = new Vector3();
        // let rel_pos2 = new Vector3();
        // pos1.subTo(body1.position, rel_pos1);
        // pos2.subTo(body2.position, rel_pos2);
        var vel1 = resolveSingleBilateral$vel1;
        var vel2 = resolveSingleBilateral$vel2;
        var vel = resolveSingleBilateral$vel;
        body1.getVelocityAtWorldPoint(pos1, vel1);
        body2.getVelocityAtWorldPoint(pos2, vel2);
        vel1.subTo(vel2, vel);
        var relVel = normal.dot(vel);
        var contactDamping = 0.2;
        var massTerm = 1 / (body1.invMass + body2.invMass);
        var impulse = -contactDamping * relVel * massTerm;
        return impulse;
    }

    var RigidVehicle = /** @class */ (function () {
        /**
         * Simple vehicle helper class with spherical rigid body wheels.
         *
         * @param options
         */
        function RigidVehicle(options) {
            if (options === void 0) { options = {}; }
            this.wheelBodies = [];
            this.coordinateSystem = typeof (options.coordinateSystem) === 'undefined' ? new feng3d.Vector3(1, 2, 3) : options.coordinateSystem.clone();
            this.chassisBody = options.chassisBody;
            if (!this.chassisBody) {
                // No chassis body given. Create it!
                // const chassisShape = new Box(new Vector3(5, 2, 0.5));
                throw '下一行代码有问题？！';
                // this.chassisBody = new Body(1, chassisShape);
            }
            this.constraints = [];
            this.wheelAxes = [];
            this.wheelForces = [];
        }
        /**
         * Add a wheel
         *
         * @param options
         */
        RigidVehicle.prototype.addWheel = function (options) {
            if (options === void 0) { options = {}; }
            var wheelBody = options.body;
            if (!wheelBody) {
                throw '下一行代码有问题？！';
                // wheelBody = new Body(1, new Sphere(1.2));
            }
            this.wheelBodies.push(wheelBody);
            this.wheelForces.push(0);
            // Position constrain wheels
            // const zero = new Vector3();
            var position = typeof (options.position) !== 'undefined' ? options.position.clone() : new feng3d.Vector3();
            // Set position locally to the chassis
            var worldPosition = new feng3d.Vector3();
            this.chassisBody.pointToWorldFrame(position, worldPosition);
            wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
            // Constrain wheel
            var axis = typeof (options.axis) !== 'undefined' ? options.axis.clone() : new feng3d.Vector3(0, 1, 0);
            this.wheelAxes.push(axis);
            var hingeConstraint = new HingeConstraint(this.chassisBody, wheelBody, {
                pivotA: position,
                axisA: axis,
                pivotB: feng3d.Vector3.ZERO,
                axisB: axis,
                collideConnected: false
            });
            this.constraints.push(hingeConstraint);
            return this.wheelBodies.length - 1;
        };
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         *
         * @todo check coordinateSystem
         */
        RigidVehicle.prototype.setSteeringValue = function (value, wheelIndex) {
            // Set angle of the hinge axis
            var axis = this.wheelAxes[wheelIndex];
            var c = Math.cos(value);
            var s = Math.sin(value);
            var x = axis.x;
            var y = axis.y;
            this.constraints[wheelIndex].axisA.set(c * x - s * y, s * x + c * y, 0);
        };
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.setMotorSpeed = function (value, wheelIndex) {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.enableMotor();
            hingeConstraint.motorTargetVelocity = value;
        };
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param wheelIndex
         */
        RigidVehicle.prototype.disableMotor = function (wheelIndex) {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.disableMotor();
        };
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.setWheelForce = function (value, wheelIndex) {
            this.wheelForces[wheelIndex] = value;
        };
        /**
         * Apply a torque on one of the wheels.
         *
         * @param value
         * @param wheelIndex
         */
        RigidVehicle.prototype.applyWheelForce = function (value, wheelIndex) {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var bodyTorque = wheelBody.torque;
            axis.scaleNumberTo(value, torque);
            wheelBody.vectorToWorldFrame(torque, torque);
            bodyTorque.addTo(torque, bodyTorque);
        };
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        RigidVehicle.prototype.addToWorld = function (world) {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);
            for (var i = 0; i < bodies.length; i++) {
                world.addBody(bodies[i]);
            }
            for (var i = 0; i < constraints.length; i++) {
                world.addConstraint(constraints[i]);
            }
            world.on('preStep', this._update, this);
        };
        RigidVehicle.prototype._update = function () {
            var wheelForces = this.wheelForces;
            for (var i = 0; i < wheelForces.length; i++) {
                this.applyWheelForce(wheelForces[i], i);
            }
        };
        /**
         * Remove the vehicle including its constraints from the world.
         * @param world
         */
        RigidVehicle.prototype.removeFromWorld = function (world) {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);
            for (var i = 0; i < bodies.length; i++) {
                world.removeBody(bodies[i]);
            }
            for (var i = 0; i < constraints.length; i++) {
                world.removeConstraint(constraints[i]);
            }
        };
        /**
         * Get current rotational velocity of a wheel
         *
         * @param wheelIndex
         */
        RigidVehicle.prototype.getWheelSpeed = function (wheelIndex) {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var w = wheelBody.angularVelocity;
            this.chassisBody.vectorToWorldFrame(axis, worldAxis);
            return w.dot(worldAxis);
        };
        return RigidVehicle;
    }());
    var torque = new feng3d.Vector3();
    var worldAxis = new feng3d.Vector3();

    var SPHSystem = /** @class */ (function () {
        /**
         * Smoothed-particle hydrodynamics system
         */
        function SPHSystem() {
            this.particles = [];
            this.density = 1;
            this.smoothingRadius = 1;
            this.speedOfSound = 1;
            this.viscosity = 0.01;
            this.eps = 0.000001;
            // Stuff Computed per particle
            this.pressures = [];
            this.densities = [];
            this.neighbors = [];
        }
        /**
         * Add a particle to the system.
         *
         * @param particle
         */
        SPHSystem.prototype.add = function (particle) {
            this.particles.push(particle);
            if (this.neighbors.length < this.particles.length) {
                this.neighbors.push([]);
            }
        };
        /**
         * Remove a particle from the system.
         *
         * @param particle
         */
        SPHSystem.prototype.remove = function (particle) {
            var idx = this.particles.indexOf(particle);
            if (idx !== -1) {
                this.particles.splice(idx, 1);
                if (this.neighbors.length > this.particles.length) {
                    this.neighbors.pop();
                }
            }
        };
        /**
         * Get neighbors within smoothing volume, save in the array neighbors
         *
         * @param particle
         * @param neighbors
         */
        SPHSystem.prototype.getNeighbors = function (particle, neighbors) {
            var N = this.particles.length;
            var id = particle.id;
            var R2 = this.smoothingRadius * this.smoothingRadius;
            var dist = SPHSystemGetNeighborsDist;
            for (var i = 0; i !== N; i++) {
                var p = this.particles[i];
                p.position.subTo(particle.position, dist);
                if (id !== p.id && dist.lengthSquared < R2) {
                    neighbors.push(p);
                }
            }
        };
        SPHSystem.prototype.update = function () {
            var N = this.particles.length;
            var dist = SPHSystemUpdateDist;
            var cs = this.speedOfSound;
            var eps = this.eps;
            for (var i = 0; i !== N; i++) {
                var p = this.particles[i]; // Current particle
                var neighbors = this.neighbors[i];
                // Get neighbors
                neighbors.length = 0;
                this.getNeighbors(p, neighbors);
                neighbors.push(this.particles[i]); // Add current too
                var numNeighbors = neighbors.length;
                // Accumulate density for the particle
                var sum = 0.0;
                for (var j = 0; j !== numNeighbors; j++) {
                    // printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
                    p.position.subTo(neighbors[j].position, dist);
                    var len = dist.length;
                    var weight = this.w(len);
                    sum += neighbors[j].mass * weight;
                }
                // Save
                this.densities[i] = sum;
                this.pressures[i] = cs * cs * (this.densities[i] - this.density);
            }
            // Add forces
            // Sum to these accelerations
            var aPressure = SPHSystemUpdateAPressure;
            var aVisc = SPHSystemUpdateAVisc;
            var gradW = SPHSystemUpdateGradW;
            var rVec = SPHSystemUpdateRVec;
            var u = SPHSystemUpdateU;
            for (var i = 0; i !== N; i++) {
                var particle = this.particles[i];
                aPressure.set(0, 0, 0);
                aVisc.set(0, 0, 0);
                // Init vars
                var Pij = void 0;
                var nabla = void 0;
                // var Vij;
                // Sum up for all other neighbors
                var neighbors = this.neighbors[i];
                var numNeighbors = neighbors.length;
                // printf("Neighbors: ");
                for (var j = 0; j !== numNeighbors; j++) {
                    var neighbor = neighbors[j];
                    // printf("%d ",nj);
                    // Get r once for all..
                    particle.position.subTo(neighbor.position, rVec);
                    var r = rVec.length;
                    // Pressure contribution
                    Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) + this.pressures[j] / (this.densities[j] * this.densities[j] + eps));
                    this.gradw(rVec, gradW);
                    // Add to pressure acceleration
                    gradW.scaleNumberTo(Pij, gradW);
                    aPressure.addTo(gradW, aPressure);
                    // Viscosity contribution
                    neighbor.velocity.subTo(particle.velocity, u);
                    u.scaleNumberTo(1.0 / (0.0001 + this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass, u);
                    nabla = this.nablaw(r);
                    u.scaleNumberTo(nabla, u);
                    // Add to viscosity acceleration
                    aVisc.addTo(u, aVisc);
                }
                // Calculate force
                aVisc.scaleNumberTo(particle.mass, aVisc);
                aPressure.scaleNumberTo(particle.mass, aPressure);
                // Add force to particles
                particle.force.addTo(aVisc, particle.force);
                particle.force.addTo(aPressure, particle.force);
            }
        };
        // Calculate the weight using the W(r) weightfunction
        SPHSystem.prototype.w = function (r) {
            // 315
            var h = this.smoothingRadius;
            return 315.0 / (64.0 * Math.PI * Math.pow(h, 9)) * Math.pow(h * h - r * r, 3);
        };
        // calculate gradient of the weight function
        SPHSystem.prototype.gradw = function (rVec, resultVec) {
            var r = rVec.length;
            var h = this.smoothingRadius;
            rVec.scaleNumberTo(945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * Math.pow((h * h - r * r), 2), resultVec);
        };
        // Calculate nabla(W)
        SPHSystem.prototype.nablaw = function (r) {
            var h = this.smoothingRadius;
            var nabla = 945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);
            return nabla;
        };
        return SPHSystem;
    }());
    var SPHSystemGetNeighborsDist = new feng3d.Vector3();
    var SPHSystemUpdateDist = new feng3d.Vector3();
    var SPHSystemUpdateAPressure = new feng3d.Vector3();
    var SPHSystemUpdateAVisc = new feng3d.Vector3();
    var SPHSystemUpdateGradW = new feng3d.Vector3();
    var SPHSystemUpdateRVec = new feng3d.Vector3();
    var SPHSystemUpdateU = new feng3d.Vector3(); // Relative velocity

    var Spring = /** @class */ (function () {
        /**
         * A spring, connecting two bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         */
        function Spring(bodyA, bodyB, options) {
            if (options === void 0) { options = {}; }
            this.restLength = typeof (options.restLength) === 'number' ? options.restLength : 1;
            this.stiffness = options.stiffness || 100;
            this.damping = options.damping || 1;
            this.bodyA = bodyA;
            this.bodyB = bodyB;
            this.localAnchorA = new feng3d.Vector3();
            this.localAnchorB = new feng3d.Vector3();
            if (options.localAnchorA) {
                this.localAnchorA.copy(options.localAnchorA);
            }
            if (options.localAnchorB) {
                this.localAnchorB.copy(options.localAnchorB);
            }
            if (options.worldAnchorA) {
                this.setWorldAnchorA(options.worldAnchorA);
            }
            if (options.worldAnchorB) {
                this.setWorldAnchorB(options.worldAnchorB);
            }
        }
        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        Spring.prototype.setWorldAnchorA = function (worldAnchorA) {
            this.bodyA.pointToLocalFrame(worldAnchorA, this.localAnchorA);
        };
        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        Spring.prototype.setWorldAnchorB = function (worldAnchorB) {
            this.bodyB.pointToLocalFrame(worldAnchorB, this.localAnchorB);
        };
        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        Spring.prototype.getWorldAnchorA = function (result) {
            this.bodyA.pointToWorldFrame(this.localAnchorA, result);
        };
        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        Spring.prototype.getWorldAnchorB = function (result) {
            this.bodyB.pointToWorldFrame(this.localAnchorB, result);
        };
        /**
         * Apply the spring force to the connected bodies.
         */
        Spring.prototype.applyForce = function () {
            var k = this.stiffness;
            var d = this.damping;
            var l = this.restLength;
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var r = applyForceR;
            var rUnit = applyForceRUnit;
            var u = applyForceU;
            var f = applyForceF;
            var tmp = applyForceTmp;
            var worldAnchorA = applyForceWorldAnchorA;
            var worldAnchorB = applyForceWorldAnchorB;
            var ri = applyForceRi;
            var rj = applyForceRj;
            var riXF = applyForceRiXF;
            var rjXF = applyForceRjXF;
            // Get world anchors
            this.getWorldAnchorA(worldAnchorA);
            this.getWorldAnchorB(worldAnchorB);
            // Get offset points
            worldAnchorA.subTo(bodyA.position, ri);
            worldAnchorB.subTo(bodyB.position, rj);
            // Compute distance vector between world anchor points
            worldAnchorB.subTo(worldAnchorA, r);
            var rlen = r.length;
            rUnit.copy(r);
            rUnit.normalize();
            // Compute relative velocity of the anchor points, u
            bodyB.velocity.subTo(bodyA.velocity, u);
            // Add rotational velocity
            bodyB.angularVelocity.crossTo(rj, tmp);
            u.addTo(tmp, u);
            bodyA.angularVelocity.crossTo(ri, tmp);
            u.subTo(tmp, u);
            // F = - k * ( x - L ) - D * ( u )
            rUnit.scaleNumberTo(-k * (rlen - l) - d * u.dot(rUnit), f);
            // Add forces to bodies
            bodyA.force.subTo(f, bodyA.force);
            bodyB.force.addTo(f, bodyB.force);
            // Angular force
            ri.crossTo(f, riXF);
            rj.crossTo(f, rjXF);
            bodyA.torque.subTo(riXF, bodyA.torque);
            bodyB.torque.addTo(rjXF, bodyB.torque);
        };
        return Spring;
    }());
    var applyForceR = new feng3d.Vector3();
    var applyForceRUnit = new feng3d.Vector3();
    var applyForceU = new feng3d.Vector3();
    var applyForceF = new feng3d.Vector3();
    var applyForceWorldAnchorA = new feng3d.Vector3();
    var applyForceWorldAnchorB = new feng3d.Vector3();
    var applyForceRi = new feng3d.Vector3();
    var applyForceRj = new feng3d.Vector3();
    var applyForceRiXF = new feng3d.Vector3();
    var applyForceRjXF = new feng3d.Vector3();
    var applyForceTmp = new feng3d.Vector3();

    var Cylinder = /** @class */ (function (_super) {
        __extends(Cylinder, _super);
        /**
         * @param radiusTop
         * @param radiusBottom
         * @param height
         * @param numSegments The number of segments to build the cylinder out of
         *
         * @author schteppe / https://github.com/schteppe
         */
        function Cylinder(radiusTop, radiusBottom, height, numSegments) {
            var _this = this;
            var N = numSegments;
            var verts = [];
            var axes = [];
            var faces = [];
            var bottomface = [];
            var topface = [];
            var cos = Math.cos;
            var sin = Math.sin;
            // First bottom point
            verts.push(new feng3d.Vector3(radiusBottom * cos(0), radiusBottom * sin(0), -height * 0.5));
            bottomface.push(0);
            // First top point
            verts.push(new feng3d.Vector3(radiusTop * cos(0), radiusTop * sin(0), height * 0.5));
            topface.push(1);
            for (var i = 0; i < N; i++) {
                var theta = 2 * Math.PI / N * (i + 1);
                var thetaN = 2 * Math.PI / N * (i + 0.5);
                if (i < N - 1) {
                    // Bottom
                    verts.push(new feng3d.Vector3(radiusBottom * cos(theta), radiusBottom * sin(theta), -height * 0.5));
                    bottomface.push(2 * i + 2);
                    // Top
                    verts.push(new feng3d.Vector3(radiusTop * cos(theta), radiusTop * sin(theta), height * 0.5));
                    topface.push(2 * i + 3);
                    // Face
                    faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
                }
                else {
                    faces.push([0, 1, 2 * i + 1, 2 * i]); // Connect
                }
                // Axis: we can cut off half of them if we have even number of segments
                if (N % 2 === 1 || i < N / 2) {
                    axes.push(new feng3d.Vector3(cos(thetaN), sin(thetaN), 0));
                }
            }
            faces.push(topface);
            axes.push(new feng3d.Vector3(0, 0, 1));
            // Reorder bottom face
            var temp = [];
            for (var i = 0; i < bottomface.length; i++) {
                temp.push(bottomface[bottomface.length - i - 1]);
            }
            faces.push(temp);
            _this = _super.call(this, verts, faces, axes) || this;
            return _this;
        }
        return Cylinder;
    }(ConvexPolyhedron));

    var Heightfield = /** @class */ (function (_super) {
        __extends(Heightfield, _super);
        /**
         * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a given distance.
         *
         * @param data An array of Y values that will be used to construct the terrain.
         * @param options
         * @param options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
         * @param options.maxValue Maximum value.
         * @param options.elementSize=0.1 World spacing between the data points in X direction.
         * @todo Should be possible to use along all axes, not just y
         * @todo should be possible to scale along all axes
         *
         * @example
         *     // Generate some height data (y-values).
         *     let data = [];
         *     for(let i = 0; i < 1000; i++){
         *         let y = 0.5 * Math.cos(0.2 * i);
         *         data.push(y);
         *     }
         *
         *     // Create the heightfield shape
         *     let heightfieldShape = new Heightfield(data, {
         *         elementSize: 1 // Distance between the data points in X and Y directions
         *     });
         *     let heightfieldBody = new Body();
         *     heightfieldBody.addShape(heightfieldShape);
         *     world.addBody(heightfieldBody);
         */
        /**
         *
         * @param data
         * @param options
         */
        function Heightfield(data, options) {
            if (options === void 0) { options = {}; }
            var _this = _super.call(this) || this;
            options = Utils.defaults(options, {
                maxValue: null,
                minValue: null,
                elementSize: 1
            });
            _this.data = data;
            _this.maxValue = options.maxValue;
            _this.minValue = options.minValue;
            _this.elementSize = options.elementSize;
            if (options.minValue === null) {
                _this.updateMinValue();
            }
            if (options.maxValue === null) {
                _this.updateMaxValue();
            }
            _this.cacheEnabled = true;
            Shape.call(_this, {
                type: Shape.types.HEIGHTFIELD
            });
            _this.pillarConvex = new ConvexPolyhedron();
            _this.pillarOffset = new feng3d.Vector3();
            _this.updateBoundingSphereRadius();
            // "i_j_isUpper" => { convex: ..., offset: ... }
            // for example:
            // _cachedPillars["0_2_1"]
            _this._cachedPillars = {};
            return _this;
        }
        /**
         * Call whenever you change the data array.
         */
        Heightfield.prototype.update = function () {
            this._cachedPillars = {};
        };
        /**
         * Update the .minValue property
         */
        Heightfield.prototype.updateMinValue = function () {
            var data = this.data;
            var minValue = data[0][0];
            for (var i = 0; i !== data.length; i++) {
                for (var j = 0; j !== data[i].length; j++) {
                    var v = data[i][j];
                    if (v < minValue) {
                        minValue = v;
                    }
                }
            }
            this.minValue = minValue;
        };
        /**
         * Update the .maxValue property
         */
        Heightfield.prototype.updateMaxValue = function () {
            var data = this.data;
            var maxValue = data[0][0];
            for (var i = 0; i !== data.length; i++) {
                for (var j = 0; j !== data[i].length; j++) {
                    var v = data[i][j];
                    if (v > maxValue) {
                        maxValue = v;
                    }
                }
            }
            this.maxValue = maxValue;
        };
        /**
         * Set the height value at an index. Don't forget to update maxValue and minValue after you're done.
         *
         * @param xi
         * @param yi
         * @param value
         */
        Heightfield.prototype.setHeightValueAtIndex = function (xi, yi, value) {
            var data = this.data;
            data[xi][yi] = value;
            // Invalidate cache
            this.clearCachedConvexTrianglePillar(xi, yi, false);
            if (xi > 0) {
                this.clearCachedConvexTrianglePillar(xi - 1, yi, true);
                this.clearCachedConvexTrianglePillar(xi - 1, yi, false);
            }
            if (yi > 0) {
                this.clearCachedConvexTrianglePillar(xi, yi - 1, true);
                this.clearCachedConvexTrianglePillar(xi, yi - 1, false);
            }
            if (yi > 0 && xi > 0) {
                this.clearCachedConvexTrianglePillar(xi - 1, yi - 1, true);
            }
        };
        /**
         * Get max/min in a rectangle in the matrix data
         *
         * @param iMinX
         * @param iMinY
         * @param iMaxX
         * @param iMaxY
         * @param result An array to store the results in.
         * @return The result array, if it was passed in. Minimum will be at position 0 and max at 1.
         */
        Heightfield.prototype.getRectMinMax = function (iMinX, iMinY, iMaxX, iMaxY, result) {
            result = result || [];
            // Get max and min of the data
            var data = this.data;
            var max = this.minValue; // Set first value
            for (var i = iMinX; i <= iMaxX; i++) {
                for (var j = iMinY; j <= iMaxY; j++) {
                    var height = data[i][j];
                    if (height > max) {
                        max = height;
                    }
                }
            }
            result[0] = this.minValue;
            result[1] = max;
        };
        /**
         * Get the index of a local position on the heightfield. The indexes indicate the rectangles, so if your terrain is made of N x N height data points, you will have rectangle indexes ranging from 0 to N-1.
         *
         * @param x
         * @param y
         * @param result Two-element array
         * @param clamp If the position should be clamped to the heightfield edge.
         */
        Heightfield.prototype.getIndexOfPosition = function (x, y, result, clamp) {
            // Get the index of the data points to test against
            var w = this.elementSize;
            var data = this.data;
            var xi = Math.floor(x / w);
            var yi = Math.floor(y / w);
            result[0] = xi;
            result[1] = yi;
            if (clamp) {
                // Clamp index to edges
                if (xi < 0) {
                    xi = 0;
                }
                if (yi < 0) {
                    yi = 0;
                }
                if (xi >= data.length - 1) {
                    xi = data.length - 1;
                }
                if (yi >= data[0].length - 1) {
                    yi = data[0].length - 1;
                }
            }
            // Bail out if we are out of the terrain
            if (xi < 0 || yi < 0 || xi >= data.length - 1 || yi >= data[0].length - 1) {
                return false;
            }
            return true;
        };
        Heightfield.prototype.getTriangleAt = function (x, y, edgeClamp, a, b, c) {
            var idx = getHeightAtIdx;
            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];
            var data = this.data;
            if (edgeClamp) {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }
            var elementSize = this.elementSize;
            var lowerDist2 = Math.pow(x / elementSize - xi, 2) + Math.pow(y / elementSize - yi, 2);
            var upperDist2 = Math.pow(x / elementSize - (xi + 1), 2) + Math.pow(y / elementSize - (yi + 1), 2);
            var upper = lowerDist2 > upperDist2;
            this.getTriangle(xi, yi, upper, a, b, c);
            return upper;
        };
        Heightfield.prototype.getNormalAt = function (x, y, edgeClamp, result) {
            var a = getNormalAtA;
            var b = getNormalAtB;
            var c = getNormalAtC;
            var e0 = getNormalAtE0;
            var e1 = getNormalAtE1;
            this.getTriangleAt(x, y, edgeClamp, a, b, c);
            b.subTo(a, e0);
            c.subTo(a, e1);
            e0.crossTo(e1, result);
            result.normalize();
        };
        /**
         * Get an AABB of a square in the heightfield
         *
         * @param xi
         * @param yi
         * @param result
         */
        Heightfield.prototype.getAabbAtIndex = function (xi, yi, result) {
            var data = this.data;
            var elementSize = this.elementSize;
            result.min.set(xi * elementSize, yi * elementSize, data[xi][yi]);
            result.max.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1]);
        };
        /**
         * Get the height in the heightfield at a given position
         *
         * @param x
         * @param y
         * @param edgeClamp
         */
        Heightfield.prototype.getHeightAt = function (x, y, edgeClamp) {
            var data = this.data;
            var a = getHeightAtA;
            var b = getHeightAtB;
            var c = getHeightAtC;
            var idx = getHeightAtIdx;
            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];
            if (edgeClamp) {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }
            var upper = this.getTriangleAt(x, y, edgeClamp, a, b, c);
            barycentricWeights(x, y, a.x, a.y, b.x, b.y, c.x, c.y, getHeightAtWeights);
            var w = getHeightAtWeights;
            if (upper) {
                // Top triangle verts
                return data[xi + 1][yi + 1] * w.x + data[xi][yi + 1] * w.y + data[xi + 1][yi] * w.z;
            }
            // Top triangle verts
            return data[xi][yi] * w.x + data[xi + 1][yi] * w.y + data[xi][yi + 1] * w.z;
        };
        Heightfield.prototype.getCacheConvexTrianglePillarKey = function (xi, yi, getUpperTriangle) {
            return xi + "_" + yi + "_" + (getUpperTriangle ? 1 : 0);
        };
        Heightfield.prototype.getCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            return this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        };
        Heightfield.prototype.setCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle, convex, offset) {
            this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)] = {
                convex: convex,
                offset: offset
            };
        };
        Heightfield.prototype.clearCachedConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            delete this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        };
        /**
         * Get a triangle from the heightfield
         *
         * @param xi
         * @param yi
         * @param upper
         * @param a
         * @param b
         * @param c
         */
        Heightfield.prototype.getTriangle = function (xi, yi, upper, a, b, c) {
            var data = this.data;
            var elementSize = this.elementSize;
            if (upper) {
                // Top triangle verts
                a.set((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1]);
                b.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
                c.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);
            }
            else {
                // Top triangle verts
                a.set(xi * elementSize, yi * elementSize, data[xi][yi]);
                b.set((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);
                c.set(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
            }
        };
        /**
         * Get a triangle in the terrain in the form of a triangular convex shape.
         *
         * @param i
         * @param j
         * @param getUpperTriangle
         */
        Heightfield.prototype.getConvexTrianglePillar = function (xi, yi, getUpperTriangle) {
            var result = this.pillarConvex;
            var offsetResult = this.pillarOffset;
            if (this.cacheEnabled) {
                var data0 = this.getCachedConvexTrianglePillar(xi, yi, getUpperTriangle);
                if (data0) {
                    this.pillarConvex = data0.convex;
                    this.pillarOffset = data0.offset;
                    return;
                }
                result = new ConvexPolyhedron();
                offsetResult = new feng3d.Vector3();
                this.pillarConvex = result;
                this.pillarOffset = offsetResult;
            }
            var data = this.data;
            var elementSize = this.elementSize;
            var faces = result.faces;
            // Reuse verts if possible
            result.vertices.length = 6;
            for (var i = 0; i < 6; i++) {
                if (!result.vertices[i]) {
                    result.vertices[i] = new feng3d.Vector3();
                }
            }
            // Reuse faces if possible
            faces.length = 5;
            for (var i = 0; i < 5; i++) {
                if (!faces[i]) {
                    faces[i] = [];
                }
            }
            var verts = result.vertices;
            var h = (Math.min(data[xi][yi], data[xi + 1][yi], data[xi][yi + 1], data[xi + 1][yi + 1]) - this.minValue) / 2 + this.minValue;
            if (!getUpperTriangle) {
                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.set((xi + 0.25) * elementSize, // sort of center of a triangle
                (yi + 0.25) * elementSize, h // vertical center
                );
                // Top triangle verts
                verts[0].set(-0.25 * elementSize, -0.25 * elementSize, data[xi][yi] - h);
                verts[1].set(0.75 * elementSize, -0.25 * elementSize, data[xi + 1][yi] - h);
                verts[2].set(-0.25 * elementSize, 0.75 * elementSize, data[xi][yi + 1] - h);
                // bottom triangle verts
                verts[3].set(-0.25 * elementSize, -0.25 * elementSize, -h - 1);
                verts[4].set(0.75 * elementSize, -0.25 * elementSize, -h - 1);
                verts[5].set(-0.25 * elementSize, 0.75 * elementSize, -h - 1);
                // top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;
                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;
                // -x facing quad
                faces[2][0] = 0;
                faces[2][1] = 2;
                faces[2][2] = 5;
                faces[2][3] = 3;
                // -y facing quad
                faces[3][0] = 1;
                faces[3][1] = 0;
                faces[3][2] = 3;
                faces[3][3] = 4;
                // +xy facing quad
                faces[4][0] = 4;
                faces[4][1] = 5;
                faces[4][2] = 2;
                faces[4][3] = 1;
            }
            else {
                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.set((xi + 0.75) * elementSize, // sort of center of a triangle
                (yi + 0.75) * elementSize, h // vertical center
                );
                // Top triangle verts
                verts[0].set(0.25 * elementSize, 0.25 * elementSize, data[xi + 1][yi + 1] - h);
                verts[1].set(-0.75 * elementSize, 0.25 * elementSize, data[xi][yi + 1] - h);
                verts[2].set(0.25 * elementSize, -0.75 * elementSize, data[xi + 1][yi] - h);
                // bottom triangle verts
                verts[3].set(0.25 * elementSize, 0.25 * elementSize, -h - 1);
                verts[4].set(-0.75 * elementSize, 0.25 * elementSize, -h - 1);
                verts[5].set(0.25 * elementSize, -0.75 * elementSize, -h - 1);
                // Top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;
                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;
                // +x facing quad
                faces[2][0] = 2;
                faces[2][1] = 5;
                faces[2][2] = 3;
                faces[2][3] = 0;
                // +y facing quad
                faces[3][0] = 3;
                faces[3][1] = 4;
                faces[3][2] = 1;
                faces[3][3] = 0;
                // -xy facing quad
                faces[4][0] = 1;
                faces[4][1] = 4;
                faces[4][2] = 5;
                faces[4][3] = 2;
            }
            result.computeNormals();
            result.computeEdges();
            result.updateBoundingSphereRadius();
            this.setCachedConvexTrianglePillar(xi, yi, getUpperTriangle, result, offsetResult);
        };
        Heightfield.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            target.set(0, 0, 0);
            return target;
        };
        Heightfield.prototype.volume = function () {
            return Number.MAX_VALUE; // The terrain is infinite
        };
        Heightfield.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // TODO: do it properly
            min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        };
        Heightfield.prototype.updateBoundingSphereRadius = function () {
            // Use the bounding box of the min/max values
            var data = this.data;
            var s = this.elementSize;
            this.boundingSphereRadius = new feng3d.Vector3(data.length * s, data[0].length * s, Math.max(Math.abs(this.maxValue), Math.abs(this.minValue))).length;
        };
        /**
         * Sets the height values from an image. Currently only supported in browser.
         *
         * @param image
         * @param scale
         */
        Heightfield.prototype.setHeightsFromImage = function (image, scale) {
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var imageData = context.getImageData(0, 0, image.width, image.height);
            var matrix = this.data;
            matrix.length = 0;
            this.elementSize = Math.abs(scale.x) / imageData.width;
            for (var i = 0; i < imageData.height; i++) {
                var row = [];
                for (var j = 0; j < imageData.width; j++) {
                    var a = imageData.data[(i * imageData.height + j) * 4];
                    var b = imageData.data[(i * imageData.height + j) * 4 + 1];
                    var c = imageData.data[(i * imageData.height + j) * 4 + 2];
                    var height = (a + b + c) / 4 / 255 * scale.z;
                    if (scale.x < 0) {
                        row.push(height);
                    }
                    else {
                        row.unshift(height);
                    }
                }
                if (scale.y < 0) {
                    matrix.unshift(row);
                }
                else {
                    matrix.push(row);
                }
            }
            this.updateMaxValue();
            this.updateMinValue();
            this.update();
        };
        return Heightfield;
    }(Shape));
    var getHeightAtIdx = [];
    var getHeightAtWeights = new feng3d.Vector3();
    var getHeightAtA = new feng3d.Vector3();
    var getHeightAtB = new feng3d.Vector3();
    var getHeightAtC = new feng3d.Vector3();
    var getNormalAtA = new feng3d.Vector3();
    var getNormalAtB = new feng3d.Vector3();
    var getNormalAtC = new feng3d.Vector3();
    var getNormalAtE0 = new feng3d.Vector3();
    var getNormalAtE1 = new feng3d.Vector3();
    // from https://en.wikipedia.org/wiki/Barycentric_coordinate_system
    function barycentricWeights(x, y, ax, ay, bx, by, cx, cy, result) {
        result.x = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.y = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.z = 1 - result.x - result.y;
    }

    var Particle = /** @class */ (function (_super) {
        __extends(Particle, _super);
        /**
         * Particle shape.
         *
         * @author schteppe
         */
        function Particle() {
            return _super.call(this, {
                type: Shape.types.PARTICLE
            }) || this;
        }
        /**
         * @param mass
         * @param target
         */
        Particle.prototype.calculateLocalInertia = function (mass, target) {
            target = target || new feng3d.Vector3();
            target.set(0, 0, 0);
            return target;
        };
        Particle.prototype.volume = function () {
            return 0;
        };
        Particle.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = 0;
        };
        Particle.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // Get each axis max
            min.copy(pos);
            max.copy(pos);
        };
        return Particle;
    }(Shape));

    var Solver = /** @class */ (function () {
        /**
         * Constraint equation solver base class.
         * @author schteppe / https://github.com/schteppe
         */
        function Solver() {
            this.equations = [];
        }
        /**
         * Should be implemented in subclasses!
         * @param _dt
         * @param _world
         */
        Solver.prototype.solve = function (_dt, _world) {
            // Should return the number of iterations done!
            return 0;
        };
        /**
         * Add an equation
         * @param eq
         */
        Solver.prototype.addEquation = function (eq) {
            if (eq.enabled) {
                this.equations.push(eq);
            }
        };
        /**
         * Remove an equation
         * @param eq
         */
        Solver.prototype.removeEquation = function (eq) {
            var eqs = this.equations;
            var i = eqs.indexOf(eq);
            if (i !== -1) {
                eqs.splice(i, 1);
            }
        };
        /**
         * Add all equations
         */
        Solver.prototype.removeAllEquations = function () {
            this.equations.length = 0;
        };
        return Solver;
    }());

    var GSSolver = /** @class */ (function (_super) {
        __extends(GSSolver, _super);
        /**
         * Constraint equation Gauss-Seidel solver.
         * @todo The spook parameters should be specified for each constraint, not globally.
         * @author schteppe / https://github.com/schteppe
         * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
         */
        function GSSolver() {
            var _this = _super.call(this) || this;
            _this.iterations = 10;
            _this.tolerance = 1e-7;
            return _this;
        }
        GSSolver.prototype.solve = function (dt, world) {
            var iter = 0;
            var maxIter = this.iterations;
            var tolSquared = this.tolerance * this.tolerance;
            var equations = this.equations;
            var Neq = equations.length;
            var bodies = world.bodies;
            var Nbodies = bodies.length;
            var h = dt;
            // let q: any;
            var B;
            var invC;
            var deltalambda;
            var deltalambdaTot;
            var GWlambda;
            var lambdaj;
            // Update solve mass
            if (Neq !== 0) {
                for (var i = 0; i !== Nbodies; i++) {
                    bodies[i].updateSolveMassProperties();
                }
            }
            // Things that does not change during iteration can be computed once
            var invCs = GSSolverSolveInvCs;
            var Bs = GSSolverSolveBs;
            var lambda = GSSolverSolveLambda;
            invCs.length = Neq;
            Bs.length = Neq;
            lambda.length = Neq;
            for (var i = 0; i !== Neq; i++) {
                var c = equations[i];
                lambda[i] = 0.0;
                Bs[i] = c.computeB(h, 0, 0);
                invCs[i] = 1.0 / c.computeC();
            }
            if (Neq !== 0) {
                // Reset vlambda
                for (var i = 0; i !== Nbodies; i++) {
                    var b = bodies[i];
                    var vlambda = b.vlambda;
                    var wlambda = b.wlambda;
                    vlambda.set(0, 0, 0);
                    wlambda.set(0, 0, 0);
                }
                // Iterate over equations
                for (iter = 0; iter !== maxIter; iter++) {
                    // Accumulate the total error for each iteration.
                    deltalambdaTot = 0.0;
                    for (var j = 0; j !== Neq; j++) {
                        var c = equations[j];
                        // Compute iteration
                        B = Bs[j];
                        invC = invCs[j];
                        lambdaj = lambda[j];
                        GWlambda = c.computeGWlambda();
                        deltalambda = invC * (B - GWlambda - c.eps * lambdaj);
                        // Clamp if we are not within the min/max interval
                        if (lambdaj + deltalambda < c.minForce) {
                            deltalambda = c.minForce - lambdaj;
                        }
                        else if (lambdaj + deltalambda > c.maxForce) {
                            deltalambda = c.maxForce - lambdaj;
                        }
                        lambda[j] += deltalambda;
                        deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)
                        c.addToWlambda(deltalambda);
                    }
                    // If the total error is small enough - stop iterate
                    if (deltalambdaTot * deltalambdaTot < tolSquared) {
                        break;
                    }
                }
                // Add result to velocity
                for (var i = 0; i !== Nbodies; i++) {
                    var b = bodies[i];
                    var v = b.velocity;
                    var w = b.angularVelocity;
                    b.vlambda.scaleTo(b.linearFactor, b.vlambda);
                    v.addTo(b.vlambda, v);
                    b.wlambda.scaleTo(b.angularFactor, b.wlambda);
                    w.addTo(b.wlambda, w);
                }
                // Set the .multiplier property of each equation
                var l = equations.length;
                var invDt = 1 / h;
                while (l--) {
                    equations[l].multiplier = lambda[l] * invDt;
                }
            }
            return iter;
        };
        return GSSolver;
    }(Solver));
    var GSSolverSolveLambda = []; // Just temporary number holders that we want to reuse each solve.
    var GSSolverSolveInvCs = [];
    var GSSolverSolveBs = [];

    /* eslint-disable max-params */
    var Narrowphase = /** @class */ (function () {
        /**
         * Helper class for the World. Generates ContactEquations.
         * @class Narrowphase
         * @constructor
         * @todo Sphere-ConvexPolyhedron contacts
         * @todo Contact reduction
         * @todo  should move methods to prototype
         */
        function Narrowphase(world) {
            this.contactPointPool = [];
            this.frictionEquationPool = [];
            this.result = [];
            this.frictionResult = [];
            this.world = world;
            this.currentContactMaterial = null;
            this.enableFrictionReduction = false;
        }
        /**
         * Make a contact object, by using the internal pool or creating a new one.
         *
         * @param bi
         * @param bj
         * @param si
         * @param sj
         * @param overrideShapeA
         * @param overrideShapeB
         */
        Narrowphase.prototype.createContactEquation = function (bi, bj, si, sj, overrideShapeA, overrideShapeB) {
            var c;
            if (this.contactPointPool.length) {
                c = this.contactPointPool.pop();
                c.bi = bi;
                c.bj = bj;
            }
            else {
                c = new ContactEquation(bi, bj);
            }
            c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
            var cm = this.currentContactMaterial;
            c.restitution = cm.restitution;
            c.setSpookParams(cm.contactEquationStiffness, cm.contactEquationRelaxation, this.world.dt);
            var matA = si.material || bi.material;
            var matB = sj.material || bj.material;
            if (matA && matB && matA.restitution >= 0 && matB.restitution >= 0) {
                c.restitution = matA.restitution * matB.restitution;
            }
            c.si = overrideShapeA || si;
            c.sj = overrideShapeB || sj;
            return c;
        };
        Narrowphase.prototype.createFrictionEquationsFromContact = function (contactEquation, outArray) {
            var bodyA = contactEquation.bi;
            var bodyB = contactEquation.bj;
            var shapeA = contactEquation.si;
            var shapeB = contactEquation.sj;
            var world = this.world;
            var cm = this.currentContactMaterial;
            // If friction or restitution were specified in the material, use them
            var friction = cm.friction;
            var matA = shapeA.material || bodyA.material;
            var matB = shapeB.material || bodyB.material;
            if (matA && matB && matA.friction >= 0 && matB.friction >= 0) {
                friction = matA.friction * matB.friction;
            }
            if (friction > 0) {
                // Create 2 tangent equations
                var mug = friction * world.gravity.length;
                var reducedMass = (bodyA.invMass + bodyB.invMass);
                if (reducedMass > 0) {
                    reducedMass = 1 / reducedMass;
                }
                var pool = this.frictionEquationPool;
                var c1 = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);
                var c2 = pool.length ? pool.pop() : new FrictionEquation(bodyA, bodyB, mug * reducedMass);
                c1.bi = c2.bi = bodyA;
                c1.bj = c2.bj = bodyB;
                c1.minForce = c2.minForce = -mug * reducedMass;
                c1.maxForce = c2.maxForce = mug * reducedMass;
                // Copy over the relative vectors
                c1.ri.copy(contactEquation.ri);
                c1.rj.copy(contactEquation.rj);
                c2.ri.copy(contactEquation.ri);
                c2.rj.copy(contactEquation.rj);
                // Construct tangents
                contactEquation.ni.tangents(c1.t, c2.t);
                // Set spook params
                c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
                c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
                c1.enabled = c2.enabled = contactEquation.enabled;
                outArray.push(c1, c2);
                return true;
            }
            return false;
        };
        // Take the average N latest contact point on the plane.
        Narrowphase.prototype.createFrictionFromAverage = function (numContacts) {
            // The last contactEquation
            var c = this.result[this.result.length - 1];
            // Create the result: two "average" friction equations
            if (!this.createFrictionEquationsFromContact(c, this.frictionResult) || numContacts === 1) {
                return;
            }
            var f1 = this.frictionResult[this.frictionResult.length - 2];
            var f2 = this.frictionResult[this.frictionResult.length - 1];
            averageNormal.setZero();
            averageContactPointA.setZero();
            averageContactPointB.setZero();
            var bodyA = c.bi;
            // const bodyB = c.bj;
            for (var i = 0; i !== numContacts; i++) {
                c = this.result[this.result.length - 1 - i];
                if (c.bodyA !== bodyA) {
                    averageNormal.addTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.ri, averageContactPointA);
                    averageContactPointB.addTo(c.rj, averageContactPointB);
                }
                else {
                    averageNormal.subTo(c.ni, averageNormal);
                    averageContactPointA.addTo(c.rj, averageContactPointA);
                    averageContactPointB.addTo(c.ri, averageContactPointB);
                }
            }
            var invNumContacts = 1 / numContacts;
            averageContactPointA.scaleNumberTo(invNumContacts, f1.ri);
            averageContactPointB.scaleNumberTo(invNumContacts, f1.rj);
            f2.ri.copy(f1.ri); // Should be the same
            f2.rj.copy(f1.rj);
            averageNormal.normalize();
            averageNormal.tangents(f1.t, f2.t);
            // return eq;
        };
        /**
         * Generate all contacts between a list of body pairs
         * @method getContacts
         * @param {array} p1 Array of body indices
         * @param {array} p2 Array of body indices
         * @param {World} world
         * @param {array} result Array to store generated contacts
         * @param {array} oldcontacts Optional. Array of reusable contact objects
         */
        Narrowphase.prototype.getContacts = function (p1, p2, world, result, oldcontacts, frictionResult, frictionPool) {
            // Save old contact objects
            this.contactPointPool = oldcontacts;
            this.frictionEquationPool = frictionPool;
            this.result = result;
            this.frictionResult = frictionResult;
            var qi = tmpQuat1;
            var qj = tmpQuat2;
            var xi = tmpVec1;
            var xj = tmpVec2;
            for (var k = 0, N = p1.length; k !== N; k++) {
                // Get current collision bodies
                var bi = p1[k];
                var bj = p2[k];
                // Get contact material
                var bodyContactMaterial = null;
                if (bi.material && bj.material) {
                    bodyContactMaterial = world.getContactMaterial(bi.material, bj.material) || null;
                }
                var justTest = (((bi.type & Body.KINEMATIC) && (bj.type & Body.STATIC)) || ((bi.type & Body.STATIC) && (bj.type & Body.KINEMATIC)) || ((bi.type & Body.KINEMATIC) && (bj.type & Body.KINEMATIC)));
                for (var i = 0; i < bi.shapes.length; i++) {
                    bi.quaternion.multTo(bi.shapeOrientations[i], qi);
                    bi.quaternion.vmult(bi.shapeOffsets[i], xi);
                    xi.addTo(bi.position, xi);
                    var si = bi.shapes[i];
                    for (var j = 0; j < bj.shapes.length; j++) {
                        // Compute world transform of shapes
                        bj.quaternion.multTo(bj.shapeOrientations[j], qj);
                        bj.quaternion.vmult(bj.shapeOffsets[j], xj);
                        xj.addTo(bj.position, xj);
                        var sj = bj.shapes[j];
                        if (!((si.collisionFilterMask & sj.collisionFilterGroup) && (sj.collisionFilterMask & si.collisionFilterGroup))) {
                            continue;
                        }
                        if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
                            continue;
                        }
                        // Get collision material
                        var shapeContactMaterial = null;
                        if (si.material && sj.material) {
                            shapeContactMaterial = world.getContactMaterial(si.material, sj.material) || null;
                        }
                        this.currentContactMaterial = shapeContactMaterial || bodyContactMaterial || world.defaultContactMaterial;
                        // Get contacts
                        var resolver = this[si.type | sj.type];
                        if (resolver) {
                            var retval = false;
                            if (si.type < sj.type) {
                                retval = resolver.call(this, si, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
                            }
                            else {
                                retval = resolver.call(this, sj, si, xj, xi, qj, qi, bj, bi, si, sj, justTest);
                            }
                            if (retval && justTest) {
                                // Register overlap
                                world.shapeOverlapKeeper.set(si.id, sj.id);
                                world.bodyOverlapKeeper.set(bi.id, bj.id);
                            }
                        }
                    }
                }
            }
        };
        Narrowphase.prototype.boxBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            sj.convexPolyhedronRepresentation.material = sj.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.boxConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexConvex(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.boxParticle = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexParticle(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.sphereSphere = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            if (justTest) {
                return xi.distanceSquared(xj) < Math.pow(si.radius + sj.radius, 2);
            }
            // We will have only one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            // Contact normal
            xj.subTo(xi, r.ni);
            r.ni.normalize();
            // Contact point locations
            r.ri.copy(r.ni);
            r.rj.copy(r.ni);
            r.ri.scaleNumberTo(si.radius, r.ri);
            r.rj.scaleNumberTo(-sj.radius, r.rj);
            r.ri.addTo(xi, r.ri);
            r.ri.subTo(bi.position, r.ri);
            r.rj.addTo(xj, r.rj);
            r.rj.subTo(bj.position, r.rj);
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
        };
        /**
         * @method planeTrimesh
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        Narrowphase.prototype.planeTrimesh = function (planeShape, trimeshShape, planePos, trimeshPos, planeQuat, trimeshQuat, planeBody, trimeshBody, rsi, rsj, justTest) {
            // Make contacts!
            var v = new feng3d.Vector3();
            var normal = planeTrimeshNormal;
            normal.copy(World.worldNormal);
            planeQuat.vmult(normal, normal); // Turn normal according to plane
            for (var i = 0; i < trimeshShape.vertices.length / 3; i++) {
                // Get world vertex from trimesh
                trimeshShape.getVertex(i, v);
                // Safe up
                var v2 = new feng3d.Vector3();
                v2.copy(v);
                Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
                // Check plane side
                var relpos = planeTrimeshRelpos;
                v.subTo(planePos, relpos);
                var dot = normal.dot(relpos);
                if (dot <= 0.0) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(planeBody, trimeshBody, planeShape, trimeshShape, rsi, rsj);
                    r.ni.copy(normal); // Contact normal is the plane normal
                    // Get vertex position projected on plane
                    var projected = planeTrimeshProjected;
                    normal.scaleNumberTo(relpos.dot(normal), projected);
                    v.subTo(projected, projected);
                    // ri is the projected world position minus plane position
                    r.ri.copy(projected);
                    r.ri.subTo(planeBody.position, r.ri);
                    r.rj.copy(v);
                    r.rj.subTo(trimeshBody.position, r.rj);
                    // Store result
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
        };
        Narrowphase.prototype.sphereTrimesh = function (sphereShape, trimeshShape, spherePos, trimeshPos, sphereQuat, trimeshQuat, sphereBody, trimeshBody, rsi, rsj, justTest) {
            var edgeVertexA = sphereTrimeshEdgeVertexA;
            var edgeVertexB = sphereTrimeshEdgeVertexB;
            var edgeVector = sphereTrimeshEdgeVector;
            var edgeVectorUnit = sphereTrimeshEdgeVectorUnit;
            var localSpherePos = sphereTrimeshLocalSpherePos;
            var tmp = sphereTrimeshTmp;
            var localSphereAABB = sphereTrimeshLocalSphereAABB;
            var v2 = sphereTrimeshV2;
            var relpos = sphereTrimeshRelpos;
            var triangles = sphereTrimeshTriangles;
            // Convert sphere position to local in the trimesh
            Transform.pointToLocalFrame(trimeshPos, trimeshQuat, spherePos, localSpherePos);
            // Get the aabb of the sphere locally in the trimesh
            var sphereRadius = sphereShape.radius;
            localSphereAABB.min.set(localSpherePos.x - sphereRadius, localSpherePos.y - sphereRadius, localSpherePos.z - sphereRadius);
            localSphereAABB.max.set(localSpherePos.x + sphereRadius, localSpherePos.y + sphereRadius, localSpherePos.z + sphereRadius);
            trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);
            // for (let i = 0; i < trimeshShape.indices.length / 3; i++) triangles.push(i); // All
            // Vertices
            var v = sphereTrimeshV;
            var radiusSquared = sphereShape.radius * sphereShape.radius;
            for (var i = 0; i < triangles.length; i++) {
                for (var j = 0; j < 3; j++) {
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], v);
                    // Check vertex overlap in sphere
                    v.subTo(localSpherePos, relpos);
                    if (relpos.lengthSquared <= radiusSquared) {
                        // Safe up
                        v2.copy(v);
                        Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
                        v.subTo(spherePos, relpos);
                        if (justTest) {
                            return true;
                        }
                        var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                        r.ni.copy(relpos);
                        r.ni.normalize();
                        // ri is the vector from sphere center to the sphere surface
                        r.ri.copy(r.ni);
                        r.ri.scaleNumberTo(sphereShape.radius, r.ri);
                        r.ri.addTo(spherePos, r.ri);
                        r.ri.subTo(sphereBody.position, r.ri);
                        r.rj.copy(v);
                        r.rj.subTo(trimeshBody.position, r.rj);
                        // Store result
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }
            // Check all edges
            for (var i = 0; i < triangles.length; i++) {
                for (var j = 0; j < 3; j++) {
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], edgeVertexA);
                    trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + ((j + 1) % 3)], edgeVertexB);
                    edgeVertexB.subTo(edgeVertexA, edgeVector);
                    // Project sphere position to the edge
                    localSpherePos.subTo(edgeVertexB, tmp);
                    var positionAlongEdgeB = tmp.dot(edgeVector);
                    localSpherePos.subTo(edgeVertexA, tmp);
                    var positionAlongEdgeA = tmp.dot(edgeVector);
                    if (positionAlongEdgeA > 0 && positionAlongEdgeB < 0) {
                        // Now check the orthogonal distance from edge to sphere center
                        localSpherePos.subTo(edgeVertexA, tmp);
                        edgeVectorUnit.copy(edgeVector);
                        edgeVectorUnit.normalize();
                        positionAlongEdgeA = tmp.dot(edgeVectorUnit);
                        edgeVectorUnit.scaleNumberTo(positionAlongEdgeA, tmp);
                        tmp.addTo(edgeVertexA, tmp);
                        // tmp is now the sphere center position projected to the edge, defined locally in the trimesh frame
                        var dist = tmp.distance(localSpherePos);
                        if (dist < sphereShape.radius) {
                            if (justTest) {
                                return true;
                            }
                            var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                            tmp.subTo(localSpherePos, r.ni);
                            r.ni.normalize();
                            r.ni.scaleNumberTo(sphereShape.radius, r.ri);
                            Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                            tmp.subTo(trimeshBody.position, r.rj);
                            Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                            Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                        }
                    }
                }
            }
            // Triangle faces
            var va = sphereTrimeshVa;
            var vb = sphereTrimeshVb;
            var vc = sphereTrimeshVc;
            var normal = sphereTrimeshNormal;
            for (var i = 0, N = triangles.length; i !== N; i++) {
                trimeshShape.getTriangleVertices(triangles[i], va, vb, vc);
                trimeshShape.getNormal(triangles[i], normal);
                localSpherePos.subTo(va, tmp);
                var dist = tmp.dot(normal);
                normal.scaleNumberTo(dist, tmp);
                localSpherePos.subTo(tmp, tmp);
                // tmp is now the sphere position projected to the triangle plane
                dist = tmp.distance(localSpherePos);
                if (feng3d.Triangle3.containsPoint(va, vb, vc, tmp) && dist < sphereShape.radius) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape, rsi, rsj);
                    tmp.subTo(localSpherePos, r.ni);
                    r.ni.normalize();
                    r.ni.scaleNumberTo(sphereShape.radius, r.ri);
                    Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
                    tmp.subTo(trimeshBody.position, r.rj);
                    Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
                    Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
            triangles.length = 0;
        };
        Narrowphase.prototype.spherePlane = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            // We will have one contact in this case
            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
            // Contact normal
            r.ni.copy(World.worldNormal);
            qj.vmult(r.ni, r.ni);
            r.ni.negateTo(r.ni); // body i is the sphere, flip normal
            r.ni.normalize(); // Needed?
            // Vector from sphere center to contact point
            r.ni.scaleNumberTo(si.radius, r.ri);
            // Project down sphere on plane
            xi.subTo(xj, pointOnPlaneToSphere);
            r.ni.scaleNumberTo(r.ni.dot(pointOnPlaneToSphere), planeToSphereOrtho);
            pointOnPlaneToSphere.subTo(planeToSphereOrtho, r.rj); // The sphere position projected to plane
            if (-pointOnPlaneToSphere.dot(r.ni) <= si.radius) {
                if (justTest) {
                    return true;
                }
                // Make it relative to the body
                var ri = r.ri;
                var rj = r.rj;
                ri.addTo(xi, ri);
                ri.subTo(bi.position, ri);
                rj.addTo(xj, rj);
                rj.subTo(bj.position, rj);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.sphereBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            // we refer to the box as body j
            var sides = sphereBoxSides;
            xi.subTo(xj, boxToSphere);
            sj.getSideNormals(sides, qj);
            var R = si.radius;
            // const penetrating_sides = [];
            // Check side (plane) intersections
            var found = false;
            // Store the resulting side penetration info
            var sideNs = sphereBoxSideNs;
            var sideNs1 = sphereBoxSideNs1;
            var sideNs2 = sphereBoxSideNs2;
            var sideH = null;
            var sidePenetrations = 0;
            var sideDot1 = 0;
            var sideDot2 = 0;
            var sideDistance = null;
            // eslint-disable-next-line no-unmodified-loop-condition
            for (var idx = 0, nsides = sides.length; idx !== nsides && found === false; idx++) {
                // Get the plane side normal (ns)
                var ns = sphereBoxNs;
                ns.copy(sides[idx]);
                var h = ns.length;
                ns.normalize();
                // The normal/distance dot product tells which side of the plane we are
                var dot = boxToSphere.dot(ns);
                if (dot < h + R && dot > 0) {
                    // Intersects plane. Now check the other two dimensions
                    var ns1 = sphereBoxNs1;
                    var ns2 = sphereBoxNs2;
                    ns1.copy(sides[(idx + 1) % 3]);
                    ns2.copy(sides[(idx + 2) % 3]);
                    var h1 = ns1.length;
                    var h2 = ns2.length;
                    ns1.normalize();
                    ns2.normalize();
                    var dot1 = boxToSphere.dot(ns1);
                    var dot2 = boxToSphere.dot(ns2);
                    if (dot1 < h1 && dot1 > -h1 && dot2 < h2 && dot2 > -h2) {
                        var dist = Math.abs(dot - h - R);
                        if (sideDistance === null || dist < sideDistance) {
                            sideDistance = dist;
                            sideDot1 = dot1;
                            sideDot2 = dot2;
                            sideH = h;
                            sideNs.copy(ns);
                            sideNs1.copy(ns1);
                            sideNs2.copy(ns2);
                            sidePenetrations++;
                            if (justTest) {
                                return true;
                            }
                        }
                    }
                }
            }
            if (sidePenetrations) {
                found = true;
                var r_1 = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                sideNs.scaleNumberTo(-R, r_1.ri); // Sphere r
                r_1.ni.copy(sideNs);
                r_1.ni.negateTo(r_1.ni); // Normal should be out of sphere
                sideNs.scaleNumberTo(sideH, sideNs);
                sideNs1.scaleNumberTo(sideDot1, sideNs1);
                sideNs.addTo(sideNs1, sideNs);
                sideNs2.scaleNumberTo(sideDot2, sideNs2);
                sideNs.addTo(sideNs2, r_1.rj);
                // Make relative to bodies
                r_1.ri.addTo(xi, r_1.ri);
                r_1.ri.subTo(bi.position, r_1.ri);
                r_1.rj.addTo(xj, r_1.rj);
                r_1.rj.subTo(bj.position, r_1.rj);
                this.result.push(r_1);
                this.createFrictionEquationsFromContact(r_1, this.frictionResult);
            }
            // Check corners
            var rj = new feng3d.Vector3();
            var sphereToCorner = sphereBoxSphereToCorner;
            for (var j = 0; j !== 2 && !found; j++) {
                for (var k = 0; k !== 2 && !found; k++) {
                    for (var l = 0; l !== 2 && !found; l++) {
                        rj.set(0, 0, 0);
                        if (j) {
                            rj.addTo(sides[0], rj);
                        }
                        else {
                            rj.subTo(sides[0], rj);
                        }
                        if (k) {
                            rj.addTo(sides[1], rj);
                        }
                        else {
                            rj.subTo(sides[1], rj);
                        }
                        if (l) {
                            rj.addTo(sides[2], rj);
                        }
                        else {
                            rj.subTo(sides[2], rj);
                        }
                        // World position of corner
                        xj.addTo(rj, sphereToCorner);
                        sphereToCorner.subTo(xi, sphereToCorner);
                        if (sphereToCorner.lengthSquared < R * R) {
                            if (justTest) {
                                return true;
                            }
                            found = true;
                            var r_2 = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            r_2.ri.copy(sphereToCorner);
                            r_2.ri.normalize();
                            r_2.ni.copy(r_2.ri);
                            r_2.ri.scaleNumberTo(R, r_2.ri);
                            r_2.rj.copy(rj);
                            // Make relative to bodies
                            r_2.ri.addTo(xi, r_2.ri);
                            r_2.ri.subTo(bi.position, r_2.ri);
                            r_2.rj.addTo(xj, r_2.rj);
                            r_2.rj.subTo(bj.position, r_2.rj);
                            this.result.push(r_2);
                            this.createFrictionEquationsFromContact(r_2, this.frictionResult);
                        }
                    }
                }
            }
            rj = null;
            // Check edges
            var edgeTangent = new feng3d.Vector3();
            var edgeCenter = new feng3d.Vector3();
            var r = new feng3d.Vector3(); // r = edge center to sphere center
            var orthogonal = new feng3d.Vector3();
            var dist1 = new feng3d.Vector3();
            var Nsides = sides.length;
            for (var j = 0; j !== Nsides && !found; j++) {
                for (var k = 0; k !== Nsides && !found; k++) {
                    if (j % 3 !== k % 3) {
                        // Get edge tangent
                        sides[k].crossTo(sides[j], edgeTangent);
                        edgeTangent.normalize();
                        sides[j].addTo(sides[k], edgeCenter);
                        r.copy(xi);
                        r.subTo(edgeCenter, r);
                        r.subTo(xj, r);
                        var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
                        edgeTangent.scaleNumberTo(orthonorm, orthogonal); // Vector from edge center to sphere center in the tangent direction
                        // Find the third side orthogonal to this one
                        var l = 0;
                        while (l === j % 3 || l === k % 3) {
                            l++;
                        }
                        // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                        dist1.copy(xi);
                        dist1.subTo(orthogonal, dist1);
                        dist1.subTo(edgeCenter, dist1);
                        dist1.subTo(xj, dist1);
                        // Distances in tangent direction and distance in the plane orthogonal to it
                        var tdist = Math.abs(orthonorm);
                        var ndist = dist1.length;
                        if (tdist < sides[l].length && ndist < R) {
                            if (justTest) {
                                return true;
                            }
                            found = true;
                            var res = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            edgeCenter.addTo(orthogonal, res.rj); // box rj
                            res.rj.copy(res.rj);
                            dist1.negateTo(res.ni);
                            res.ni.normalize();
                            res.ri.copy(res.rj);
                            res.ri.addTo(xj, res.ri);
                            res.ri.subTo(xi, res.ri);
                            res.ri.normalize();
                            res.ri.scaleNumberTo(R, res.ri);
                            // Make relative to bodies
                            res.ri.addTo(xi, res.ri);
                            res.ri.subTo(bi.position, res.ri);
                            res.rj.addTo(xj, res.rj);
                            res.rj.subTo(bj.position, res.rj);
                            this.result.push(res);
                            this.createFrictionEquationsFromContact(res, this.frictionResult);
                        }
                    }
                }
            }
        };
        Narrowphase.prototype.sphereConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            xi.subTo(xj, convexToSphere);
            var normals = sj.faceNormals;
            var faces = sj.faces;
            var verts = sj.vertices;
            var R = si.radius;
            // const penetrating_sides = [];
            // if(convex_to_sphere.lengthSquared > si.boundingSphereRadius + sj.boundingSphereRadius){
            //     return;
            // }
            var found = false;
            // Check corners
            for (var i = 0; i !== verts.length; i++) {
                var v = verts[i];
                // World position of corner
                var worldCorner = sphereConvexWorldCorner;
                qj.vmult(v, worldCorner);
                xj.addTo(worldCorner, worldCorner);
                var sphereToCorner = sphereConvexSphereToCorner;
                worldCorner.subTo(xi, sphereToCorner);
                if (sphereToCorner.lengthSquared < R * R) {
                    if (justTest) {
                        return true;
                    }
                    found = true;
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    r.ri.copy(sphereToCorner);
                    r.ri.normalize();
                    r.ni.copy(r.ri);
                    r.ri.scaleNumberTo(R, r.ri);
                    worldCorner.subTo(xj, r.rj);
                    // Should be relative to the body.
                    r.ri.addTo(xi, r.ri);
                    r.ri.subTo(bi.position, r.ri);
                    // Should be relative to the body.
                    r.rj.addTo(xj, r.rj);
                    r.rj.subTo(bj.position, r.rj);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                    return;
                }
            }
            // Check side (plane) intersections
            for (var i = 0, nfaces = faces.length; i !== nfaces && found === false; i++) {
                var normal = normals[i];
                var face = faces[i];
                // Get world-transformed normal of the face
                var worldNormal = sphereConvexWorldNormal;
                qj.vmult(normal, worldNormal);
                // Get a world vertex from the face
                var worldPoint = sphereConvexWorldPoint;
                qj.vmult(verts[face[0]], worldPoint);
                worldPoint.addTo(xj, worldPoint);
                // Get a point on the sphere, closest to the face normal
                var worldSpherePointClosestToPlane = sphereConvexWorldSpherePointClosestToPlane;
                worldNormal.scaleNumberTo(-R, worldSpherePointClosestToPlane);
                xi.addTo(worldSpherePointClosestToPlane, worldSpherePointClosestToPlane);
                // Vector from a face point to the closest point on the sphere
                var penetrationVec = sphereConvexPenetrationVec;
                worldSpherePointClosestToPlane.subTo(worldPoint, penetrationVec);
                // The penetration. Negative value means overlap.
                var penetration = penetrationVec.dot(worldNormal);
                var worldPointToSphere = sphereConvexSphereToWorldPoint;
                xi.subTo(worldPoint, worldPointToSphere);
                if (penetration < 0 && worldPointToSphere.dot(worldNormal) > 0) {
                    // Intersects plane. Now check if the sphere is inside the face polygon
                    var faceVerts = []; // Face vertices, in world coords
                    for (var j = 0, Nverts = face.length; j !== Nverts; j++) {
                        var worldVertex = new feng3d.Vector3();
                        qj.vmult(verts[face[j]], worldVertex);
                        xj.addTo(worldVertex, worldVertex);
                        faceVerts.push(worldVertex);
                    }
                    if (pointInPolygon(faceVerts, worldNormal, xi)) { // Is the sphere center in the face polygon?
                        if (justTest) {
                            return true;
                        }
                        found = true;
                        var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                        worldNormal.scaleNumberTo(-R, r.ri); // Contact offset, from sphere center to contact
                        worldNormal.negateTo(r.ni); // Normal pointing out of sphere
                        var penetrationVec2 = new feng3d.Vector3();
                        worldNormal.scaleNumberTo(-penetration, penetrationVec2);
                        var penetrationSpherePoint = new feng3d.Vector3();
                        worldNormal.scaleNumberTo(-R, penetrationSpherePoint);
                        // xi.subTo(xj).addTo(penetrationSpherePoint).addTo(penetrationVec2 , r.rj);
                        xi.subTo(xj, r.rj);
                        r.rj.addTo(penetrationSpherePoint, r.rj);
                        r.rj.addTo(penetrationVec2, r.rj);
                        // Should be relative to the body.
                        r.rj.addTo(xj, r.rj);
                        r.rj.subTo(bj.position, r.rj);
                        // Should be relative to the body.
                        r.ri.addTo(xi, r.ri);
                        r.ri.subTo(bi.position, r.ri);
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                        return; // We only expect *one* face contact
                    }
                    // Edge?
                    for (var j = 0; j !== face.length; j++) {
                        // Get two world transformed vertices
                        var v1 = new feng3d.Vector3();
                        var v2 = new feng3d.Vector3();
                        qj.vmult(verts[face[(j + 1) % face.length]], v1);
                        qj.vmult(verts[face[(j + 2) % face.length]], v2);
                        xj.addTo(v1, v1);
                        xj.addTo(v2, v2);
                        // Construct edge vector
                        var edge = sphereConvexEdge;
                        v2.subTo(v1, edge);
                        // Construct the same vector, but normalized
                        var edgeUnit = sphereConvexEdgeUnit;
                        edge.unit(edgeUnit);
                        // p is xi projected onto the edge
                        var p = new feng3d.Vector3();
                        var v1ToXi = new feng3d.Vector3();
                        xi.subTo(v1, v1ToXi);
                        var dot = v1ToXi.dot(edgeUnit);
                        edgeUnit.scaleNumberTo(dot, p);
                        p.addTo(v1, p);
                        // Compute a vector from p to the center of the sphere
                        var xiToP = new feng3d.Vector3();
                        p.subTo(xi, xiToP);
                        // Collision if the edge-sphere distance is less than the radius
                        // AND if p is in between v1 and v2
                        if (dot > 0 && dot * dot < edge.lengthSquared && xiToP.lengthSquared < R * R) { // Collision if the edge-sphere distance is less than the radius
                            // Edge contact!
                            if (justTest) {
                                return true;
                            }
                            var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                            p.subTo(xj, r.rj);
                            p.subTo(xi, r.ni);
                            r.ni.normalize();
                            r.ni.scaleNumberTo(R, r.ri);
                            // Should be relative to the body.
                            r.rj.addTo(xj, r.rj);
                            r.rj.subTo(bj.position, r.rj);
                            // Should be relative to the body.
                            r.ri.addTo(xi, r.ri);
                            r.ri.subTo(bi.position, r.ri);
                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
                            return;
                        }
                    }
                }
            }
        };
        Narrowphase.prototype.planeBox = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            sj.convexPolyhedronRepresentation.material = sj.material;
            sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
            sj.convexPolyhedronRepresentation.id = sj.id;
            return this.planeConvex(si, sj.convexPolyhedronRepresentation, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.planeConvex = function (planeShape, convexShape, planePosition, convexPosition, planeQuat, convexQuat, planeBody, convexBody, si, sj, justTest) {
            // Simply return the points behind the plane.
            var worldVertex = planeConvexV;
            var worldNormal = planeConvexNormal;
            worldNormal.copy(World.worldNormal);
            planeQuat.vmult(worldNormal, worldNormal); // Turn normal according to plane orientation
            var numContacts = 0;
            var relpos = planeConvexRelpos;
            for (var i = 0; i !== convexShape.vertices.length; i++) {
                // Get world convex vertex
                worldVertex.copy(convexShape.vertices[i]);
                convexQuat.vmult(worldVertex, worldVertex);
                convexPosition.addTo(worldVertex, worldVertex);
                worldVertex.subTo(planePosition, relpos);
                var dot = worldNormal.dot(relpos);
                if (dot <= 0.0) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(planeBody, convexBody, planeShape, convexShape, si, sj);
                    // Get vertex position projected on plane
                    var projected = planeConvexProjected;
                    worldNormal.scaleNumberTo(worldNormal.dot(relpos), projected);
                    worldVertex.subTo(projected, projected);
                    projected.subTo(planePosition, r.ri); // From plane to vertex projected on plane
                    r.ni.copy(worldNormal); // Contact normal is the plane normal out from plane
                    // rj is now just the vector from the convex center to the vertex
                    worldVertex.subTo(convexPosition, r.rj);
                    // Make it relative to the body
                    r.ri.addTo(planePosition, r.ri);
                    r.ri.subTo(planeBody.position, r.ri);
                    r.rj.addTo(convexPosition, r.rj);
                    r.rj.subTo(convexBody.position, r.rj);
                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction) {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }
            if (this.enableFrictionReduction && numContacts) {
                this.createFrictionFromAverage(numContacts);
            }
        };
        Narrowphase.prototype.convexConvex = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest, faceListA, faceListB) {
            var sepAxis = convexConvexSepAxis;
            if (xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius) {
                return;
            }
            if (si.findSeparatingAxis(sj, xi, qi, xj, qj, sepAxis, faceListA, faceListB)) {
                var res = [];
                var q = convexConvexQ;
                si.clipAgainstHull(xi, qi, sj, xj, qj, sepAxis, -100, 100, res);
                var numContacts = 0;
                for (var j = 0; j !== res.length; j++) {
                    if (justTest) {
                        return true;
                    }
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    var ri = r.ri;
                    var rj = r.rj;
                    sepAxis.negateTo(r.ni);
                    res[j].normal.negateTo(q);
                    q.scaleNumberTo(res[j].depth, q);
                    res[j].point.addTo(q, ri);
                    rj.copy(res[j].point);
                    // Contact points are in world coordinates. Transform back to relative
                    ri.subTo(xi, ri);
                    rj.subTo(xj, rj);
                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);
                    this.result.push(r);
                    numContacts++;
                    if (!this.enableFrictionReduction) {
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
                if (this.enableFrictionReduction && numContacts) {
                    this.createFrictionFromAverage(numContacts);
                }
            }
        };
        /**
         * @method convexTrimesh
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        // Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.TRIMESH] =
        // Narrowphase.prototype.convexTrimesh = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,faceListA,faceListB){
        //     let sepAxis = convexConvex_sepAxis;
        //     if(xi.distance(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
        //         return;
        //     }
        //     // Construct a temp hull for each triangle
        //     let hullB = new ConvexPolyhedron();
        //     hullB.faces = [[0,1,2]];
        //     let va = new Vector3();
        //     let vb = new Vector3();
        //     let vc = new Vector3();
        //     hullB.vertices = [
        //         va,
        //         vb,
        //         vc
        //     ];
        //     for (let i = 0; i < sj.indices.length / 3; i++) {
        //         let triangleNormal = new Vector3();
        //         sj.getNormal(i, triangleNormal);
        //         hullB.faceNormals = [triangleNormal];
        //         sj.getTriangleVertices(i, va, vb, vc);
        //         let d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
        //         if(!d){
        //             triangleNormal.scaleNumberTo(-1, triangleNormal);
        //             d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
        //             if(!d){
        //                 continue;
        //             }
        //         }
        //         let res = [];
        //         let q = convexConvex_q;
        //         si.clipAgainstHull(xi,qi,hullB,xj,qj,triangleNormal,-100,100,res);
        //         for(let j = 0; j !== res.length; j++){
        //             let r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
        //                 ri = r.ri,
        //                 rj = r.rj;
        //             r.ni.copy(triangleNormal);
        //             r.ni.negateTo(r.ni);
        //             res[j].normal.negateTo(q);
        //             q.multTo(res[j].depth, q);
        //             res[j].point.addTo(q, ri);
        //             rj.copy(res[j].point);
        //             // Contact points are in world coordinates. Transform back to relative
        //             ri.subTo(xi,ri);
        //             rj.subTo(xj,rj);
        //             // Make relative to bodies
        //             ri.addTo(xi, ri);
        //             ri.subTo(bi.position, ri);
        //             rj.addTo(xj, rj);
        //             rj.subTo(bj.position, rj);
        //             result.push(r);
        //         }
        //     }
        // };
        Narrowphase.prototype.planeParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            var normal = particlePlaneNormal;
            normal.copy(World.worldNormal);
            bj.quaternion.vmult(normal, normal); // Turn normal according to plane orientation
            var relpos = particlePlaneRelpos;
            xi.subTo(bj.position, relpos);
            var dot = normal.dot(relpos);
            if (dot <= 0.0) {
                if (justTest) {
                    return true;
                }
                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                r.ni.copy(normal); // Contact normal is the plane normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle
                // Get particle position projected on plane
                var projected = particlePlaneProjected;
                normal.scaleNumberTo(normal.dot(xi), projected);
                xi.subTo(projected, projected);
                // projected.addTo(bj.position,projected);
                // rj is now the projected world position minus plane position
                r.rj.copy(projected);
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.sphereParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            // The normal is the unit vector from sphere center to particle center
            var normal = particleSphereNormal;
            normal.copy(World.worldNormal);
            xi.subTo(xj, normal);
            var lengthSquared = normal.lengthSquared;
            if (lengthSquared <= sj.radius * sj.radius) {
                if (justTest) {
                    return true;
                }
                var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                normal.normalize();
                r.rj.copy(normal);
                r.rj.scaleNumberTo(sj.radius, r.rj);
                r.ni.copy(normal); // Contact normal
                r.ni.negateTo(r.ni);
                r.ri.set(0, 0, 0); // Center of particle
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
            }
        };
        Narrowphase.prototype.convexParticle = function (sj, si, xj, xi, qj, qi, bj, bi, rsi, rsj, justTest) {
            var penetratedFaceIndex = -1;
            var penetratedFaceNormal = convexParticlePenetratedFaceNormal;
            var worldPenetrationVec = convexParticleWorldPenetrationVec;
            var minPenetration = null;
            var numDetectedFaces = 0;
            // Convert particle position xi to local coords in the convex
            var local = convexParticleLocal;
            local.copy(xi);
            local.subTo(xj, local); // Convert position to relative the convex origin
            qj.inverseTo(cqj);
            cqj.vmult(local, local);
            if (sj.pointIsInside(local)) {
                if (sj.worldVerticesNeedsUpdate) {
                    sj.computeWorldVertices(xj, qj);
                }
                if (sj.worldFaceNormalsNeedsUpdate) {
                    sj.computeWorldFaceNormals(qj);
                }
                // For each world polygon in the polyhedra
                for (var i = 0, nfaces = sj.faces.length; i !== nfaces; i++) {
                    // Construct world face vertices
                    var verts = [sj.worldVertices[sj.faces[i][0]]];
                    var normal = sj.worldFaceNormals[i];
                    // Check how much the particle penetrates the polygon plane.
                    xi.subTo(verts[0], convexParticleVertexToParticle);
                    var penetration = -normal.dot(convexParticleVertexToParticle);
                    if (minPenetration === null || Math.abs(penetration) < Math.abs(minPenetration)) {
                        if (justTest) {
                            return true;
                        }
                        minPenetration = penetration;
                        penetratedFaceIndex = i;
                        penetratedFaceNormal.copy(normal);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        numDetectedFaces++;
                    }
                }
                if (penetratedFaceIndex !== -1) {
                    // Setup contact
                    var r = this.createContactEquation(bi, bj, si, sj, rsi, rsj);
                    penetratedFaceNormal.scaleNumberTo(minPenetration, worldPenetrationVec);
                    // rj is the particle position projected to the face
                    worldPenetrationVec.addTo(xi, worldPenetrationVec);
                    worldPenetrationVec.subTo(xj, worldPenetrationVec);
                    r.rj.copy(worldPenetrationVec);
                    // let projectedToFace = xi.subTo(xj).addTo(worldPenetrationVec);
                    // projectedToFace.copy(r.rj);
                    // qj.vmult(r.rj,r.rj);
                    penetratedFaceNormal.negateTo(r.ni); // Contact normal
                    r.ri.set(0, 0, 0); // Center of particle
                    var ri = r.ri;
                    var rj = r.rj;
                    // Make relative to bodies
                    ri.addTo(xi, ri);
                    ri.subTo(bi.position, ri);
                    rj.addTo(xj, rj);
                    rj.subTo(bj.position, rj);
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
                else {
                    console.warn('Point found inside convex, but did not find penetrating face!');
                }
            }
        };
        Narrowphase.prototype.boxHeightfield = function (si, sj, xi, xj, qi, qj, bi, bj, rsi, rsj, justTest) {
            si.convexPolyhedronRepresentation.material = si.material;
            si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
            return this.convexHeightfield(si.convexPolyhedronRepresentation, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
        };
        Narrowphase.prototype.convexHeightfield = function (convexShape, hfShape, convexPos, hfPos, convexQuat, hfQuat, convexBody, hfBody, rsi, rsj, justTest) {
            var data = hfShape.data;
            var w = hfShape.elementSize;
            var radius = convexShape.boundingSphereRadius;
            var worldPillarOffset = convexHeightfieldTmp2;
            var faceList = convexHeightfieldFaceList;
            // Get sphere position to heightfield local!
            var localConvexPos = convexHeightfieldTmp1;
            Transform.pointToLocalFrame(hfPos, hfQuat, convexPos, localConvexPos);
            // Get the index of the data points to test against
            var iMinX = Math.floor((localConvexPos.x - radius) / w) - 1;
            var iMaxX = Math.ceil((localConvexPos.x + radius) / w) + 1;
            var iMinY = Math.floor((localConvexPos.y - radius) / w) - 1;
            var iMaxY = Math.ceil((localConvexPos.y + radius) / w) + 1;
            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length) {
                return;
            }
            // Clamp index to edges
            if (iMinX < 0) {
                iMinX = 0;
            }
            if (iMaxX < 0) {
                iMaxX = 0;
            }
            if (iMinY < 0) {
                iMinY = 0;
            }
            if (iMaxY < 0) {
                iMaxY = 0;
            }
            if (iMinX >= data.length) {
                iMinX = data.length - 1;
            }
            if (iMaxX >= data.length) {
                iMaxX = data.length - 1;
            }
            if (iMaxY >= data[0].length) {
                iMaxY = data[0].length - 1;
            }
            if (iMinY >= data[0].length) {
                iMinY = data[0].length - 1;
            }
            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];
            // Bail out if we're cant touch the bounding height box
            if (localConvexPos.z - radius > max || localConvexPos.z + radius < min) {
                return;
            }
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    var intersecting = false;
                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (convexPos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
                        intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                }
            }
        };
        Narrowphase.prototype.sphereHeightfield = function (sphereShape, hfShape, spherePos, hfPos, sphereQuat, hfQuat, sphereBody, hfBody, rsi, rsj, justTest) {
            var data = hfShape.data;
            var radius = sphereShape.radius;
            var w = hfShape.elementSize;
            var worldPillarOffset = sphereHeightfieldTmp2;
            // Get sphere position to heightfield local!
            var localSpherePos = sphereHeightfieldTmp1;
            Transform.pointToLocalFrame(hfPos, hfQuat, spherePos, localSpherePos);
            // Get the index of the data points to test against
            var iMinX = Math.floor((localSpherePos.x - radius) / w) - 1;
            var iMaxX = Math.ceil((localSpherePos.x + radius) / w) + 1;
            var iMinY = Math.floor((localSpherePos.y - radius) / w) - 1;
            var iMaxY = Math.ceil((localSpherePos.y + radius) / w) + 1;
            // Bail out if we are out of the terrain
            if (iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMaxY > data[0].length) {
                return;
            }
            // Clamp index to edges
            if (iMinX < 0) {
                iMinX = 0;
            }
            if (iMaxX < 0) {
                iMaxX = 0;
            }
            if (iMinY < 0) {
                iMinY = 0;
            }
            if (iMaxY < 0) {
                iMaxY = 0;
            }
            if (iMinX >= data.length) {
                iMinX = data.length - 1;
            }
            if (iMaxX >= data.length) {
                iMaxX = data.length - 1;
            }
            if (iMaxY >= data[0].length) {
                iMaxY = data[0].length - 1;
            }
            if (iMinY >= data[0].length) {
                iMinY = data[0].length - 1;
            }
            var minMax = [];
            hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
            var min = minMax[0];
            var max = minMax[1];
            // Bail out if we're cant touch the bounding height box
            if (localSpherePos.z - radius > max || localSpherePos.z + radius < min) {
                return;
            }
            var result = this.result;
            for (var i = iMinX; i < iMaxX; i++) {
                for (var j = iMinY; j < iMaxY; j++) {
                    var numContactsBefore = result.length;
                    var intersecting = false;
                    // Lower triangle
                    hfShape.getConvexTrianglePillar(i, j, false);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    // Upper triangle
                    hfShape.getConvexTrianglePillar(i, j, true);
                    Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
                    if (spherePos.distance(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
                        intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
                    }
                    if (justTest && intersecting) {
                        return true;
                    }
                    var numContacts = result.length - numContactsBefore;
                    if (numContacts > 2) {
                        return;
                    }
                    /*
                    // Skip all but 1
                    for (let k = 0; k < numContacts - 1; k++) {
                        result.pop();
                    }
                    */
                }
            }
        };
        return Narrowphase;
    }());
    var averageNormal = new feng3d.Vector3();
    var averageContactPointA = new feng3d.Vector3();
    var averageContactPointB = new feng3d.Vector3();
    var tmpVec1 = new feng3d.Vector3();
    var tmpVec2 = new feng3d.Vector3();
    var tmpQuat1 = new feng3d.Quaternion();
    var tmpQuat2 = new feng3d.Quaternion();
    var numWarnings = 0;
    var maxWarnings = 10;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function warn(msg) {
        if (numWarnings > maxWarnings) {
            return;
        }
        numWarnings++;
        console.warn(msg);
    }
    var planeTrimeshNormal = new feng3d.Vector3();
    var planeTrimeshRelpos = new feng3d.Vector3();
    var planeTrimeshProjected = new feng3d.Vector3();
    var sphereTrimeshNormal = new feng3d.Vector3();
    var sphereTrimeshRelpos = new feng3d.Vector3();
    // const sphereTrimesh_projected = new Vector3();
    var sphereTrimeshV = new feng3d.Vector3();
    var sphereTrimeshV2 = new feng3d.Vector3();
    var sphereTrimeshEdgeVertexA = new feng3d.Vector3();
    var sphereTrimeshEdgeVertexB = new feng3d.Vector3();
    var sphereTrimeshEdgeVector = new feng3d.Vector3();
    var sphereTrimeshEdgeVectorUnit = new feng3d.Vector3();
    var sphereTrimeshLocalSpherePos = new feng3d.Vector3();
    var sphereTrimeshTmp = new feng3d.Vector3();
    var sphereTrimeshVa = new feng3d.Vector3();
    var sphereTrimeshVb = new feng3d.Vector3();
    var sphereTrimeshVc = new feng3d.Vector3();
    var sphereTrimeshLocalSphereAABB = new feng3d.Box3();
    var sphereTrimeshTriangles = [];
    var pointOnPlaneToSphere = new feng3d.Vector3();
    var planeToSphereOrtho = new feng3d.Vector3();
    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    var pointInPolygonEdge = new feng3d.Vector3();
    var pointInPolygonEdgeXNormal = new feng3d.Vector3();
    var pointInPolygonVtp = new feng3d.Vector3();
    function pointInPolygon(verts, normal, p) {
        var positiveResult = null;
        var N = verts.length;
        for (var i = 0; i !== N; i++) {
            var v = verts[i];
            // Get edge to the next vertex
            var edge = pointInPolygonEdge;
            verts[(i + 1) % (N)].subTo(v, edge);
            // Get cross product between polygon normal and the edge
            var edgeXNormal = pointInPolygonEdgeXNormal;
            // let edge_x_normal = new Vector3();
            edge.crossTo(normal, edgeXNormal);
            // Get vector between point and current vertex
            var vertexToP = pointInPolygonVtp;
            p.subTo(v, vertexToP);
            // This dot product determines which side of the edge the point is
            var r = edgeXNormal.dot(vertexToP);
            // If all such dot products have same sign, we are inside the polygon.
            if (positiveResult === null || (r > 0 && positiveResult === true) || (r <= 0 && positiveResult === false)) {
                if (positiveResult === null) {
                    positiveResult = r > 0;
                }
                continue;
            }
            else {
                return false; // Encountered some other sign. Exit.
            }
        }
        // If we got here, all dot products were of the same sign.
        return true;
    }
    var boxToSphere = new feng3d.Vector3();
    var sphereBoxNs = new feng3d.Vector3();
    var sphereBoxNs1 = new feng3d.Vector3();
    var sphereBoxNs2 = new feng3d.Vector3();
    var sphereBoxSides = [new feng3d.Vector3(), new feng3d.Vector3(), new feng3d.Vector3(), new feng3d.Vector3(), new feng3d.Vector3(), new feng3d.Vector3()];
    var sphereBoxSphereToCorner = new feng3d.Vector3();
    var sphereBoxSideNs = new feng3d.Vector3();
    var sphereBoxSideNs1 = new feng3d.Vector3();
    var sphereBoxSideNs2 = new feng3d.Vector3();
    var convexToSphere = new feng3d.Vector3();
    var sphereConvexEdge = new feng3d.Vector3();
    var sphereConvexEdgeUnit = new feng3d.Vector3();
    var sphereConvexSphereToCorner = new feng3d.Vector3();
    var sphereConvexWorldCorner = new feng3d.Vector3();
    var sphereConvexWorldNormal = new feng3d.Vector3();
    var sphereConvexWorldPoint = new feng3d.Vector3();
    var sphereConvexWorldSpherePointClosestToPlane = new feng3d.Vector3();
    var sphereConvexPenetrationVec = new feng3d.Vector3();
    var sphereConvexSphereToWorldPoint = new feng3d.Vector3();
    // const planeBox_normal = new Vector3();
    // const plane_to_corner = new Vector3();
    var planeConvexV = new feng3d.Vector3();
    var planeConvexNormal = new feng3d.Vector3();
    var planeConvexRelpos = new feng3d.Vector3();
    var planeConvexProjected = new feng3d.Vector3();
    var convexConvexSepAxis = new feng3d.Vector3();
    var convexConvexQ = new feng3d.Vector3();
    var particlePlaneNormal = new feng3d.Vector3();
    var particlePlaneRelpos = new feng3d.Vector3();
    var particlePlaneProjected = new feng3d.Vector3();
    var particleSphereNormal = new feng3d.Vector3();
    // WIP
    var cqj = new feng3d.Quaternion();
    var convexParticleLocal = new feng3d.Vector3();
    // const convexParticle_normal = new Vector3();
    var convexParticlePenetratedFaceNormal = new feng3d.Vector3();
    var convexParticleVertexToParticle = new feng3d.Vector3();
    var convexParticleWorldPenetrationVec = new feng3d.Vector3();
    var convexHeightfieldTmp1 = new feng3d.Vector3();
    var convexHeightfieldTmp2 = new feng3d.Vector3();
    var convexHeightfieldFaceList = [0];
    var sphereHeightfieldTmp1 = new feng3d.Vector3();
    var sphereHeightfieldTmp2 = new feng3d.Vector3();
    Narrowphase.prototype[Shape.types.BOX | Shape.types.BOX] = Narrowphase.prototype.boxBox;
    Narrowphase.prototype[Shape.types.BOX | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.boxConvex;
    Narrowphase.prototype[Shape.types.BOX | Shape.types.PARTICLE] = Narrowphase.prototype.boxParticle;
    Narrowphase.prototype[Shape.types.SPHERE] = Narrowphase.prototype.sphereSphere;
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.TRIMESH] = Narrowphase.prototype.planeTrimesh;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.TRIMESH] = Narrowphase.prototype.sphereTrimesh;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.PLANE] = Narrowphase.prototype.spherePlane;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.BOX] = Narrowphase.prototype.sphereBox;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.sphereConvex;
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.BOX] = Narrowphase.prototype.planeBox;
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.planeConvex;
    Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexConvex;
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.PARTICLE] = Narrowphase.prototype.planeParticle;
    Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.SPHERE] = Narrowphase.prototype.sphereParticle;
    Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.CONVEXPOLYHEDRON] = Narrowphase.prototype.convexParticle;
    Narrowphase.prototype[Shape.types.BOX | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.boxHeightfield;
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.sphereHeightfield;
    Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.HEIGHTFIELD] = Narrowphase.prototype.convexHeightfield;

    var World = /** @class */ (function (_super) {
        __extends(World, _super);
        /**
         * The physics world
         * @param options
         */
        function World(options) {
            if (options === void 0) { options = {}; }
            var _this_1 = _super.call(this) || this;
            _this_1.collisionMatrix = {};
            /**
             * CollisionMatrix from the previous step.
             */
            _this_1.collisionMatrixPrevious = {};
            _this_1.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            _this_1.idToBodyMap = {};
            _this_1.emitContactEvents = (function () {
                var additions = [];
                var removals = [];
                return function () {
                    var _this = this;
                    var hasBeginContact = _this.has('beginContact');
                    var hasEndContact = _this.has('endContact');
                    if (hasBeginContact || hasEndContact) {
                        _this.bodyOverlapKeeper.getDiff(additions, removals);
                    }
                    if (hasBeginContact) {
                        for (var i = 0, l = additions.length; i < l; i += 2) {
                            _this.emit('beginContact', {
                                bodyA: _this.getBodyById(additions[i]),
                                bodyB: _this.getBodyById(additions[i + 1])
                            });
                        }
                    }
                    if (hasEndContact) {
                        for (var i = 0, l = removals.length; i < l; i += 2) {
                            _this.emit('endContact', {
                                bodyA: _this.getBodyById(removals[i]),
                                bodyB: _this.getBodyById(removals[i + 1])
                            });
                        }
                    }
                    additions.length = removals.length = 0;
                    var hasBeginShapeContact = _this.has('beginShapeContact');
                    var hasEndShapeContact = _this.has('endShapeContact');
                    if (hasBeginShapeContact || hasEndShapeContact) {
                        _this.shapeOverlapKeeper.getDiff(additions, removals);
                    }
                    if (hasBeginShapeContact) {
                        for (var i = 0, l = additions.length; i < l; i += 2) {
                            var shapeA = _this.getShapeById(additions[i]);
                            var shapeB = _this.getShapeById(additions[i + 1]);
                            _this.emit('beginShapeContact', { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body });
                        }
                    }
                    if (hasEndShapeContact) {
                        for (var i = 0, l = removals.length; i < l; i += 2) {
                            var shapeA = _this.getShapeById(removals[i]);
                            var shapeB = _this.getShapeById(removals[i + 1]);
                            _this.emit('endShapeContact', { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body });
                        }
                    }
                };
            })();
            _this_1.dt = -1;
            _this_1.allowSleep = !!options.allowSleep;
            _this_1.contacts = [];
            _this_1.frictionEquations = [];
            _this_1.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
            _this_1.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
            _this_1.time = 0.0;
            _this_1.stepnumber = 0;
            _this_1.default_dt = 1 / 60;
            _this_1.nextId = 0;
            _this_1.gravity = new feng3d.Vector3();
            if (options.gravity) {
                _this_1.gravity.copy(options.gravity);
            }
            _this_1.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase();
            _this_1.bodies = [];
            _this_1.solver = options.solver !== undefined ? options.solver : new GSSolver();
            _this_1.constraints = [];
            _this_1.narrowphase = new Narrowphase(_this_1);
            _this_1.collisionMatrix = {};
            _this_1.collisionMatrixPrevious = {};
            _this_1.bodyOverlapKeeper = new OverlapKeeper();
            _this_1.shapeOverlapKeeper = new OverlapKeeper();
            _this_1.materials = [];
            _this_1.contactmaterials = [];
            _this_1.contactMaterialTable = {};
            _this_1.defaultMaterial = new Material('default');
            _this_1.defaultContactMaterial = new ContactMaterial(_this_1.defaultMaterial, _this_1.defaultMaterial, { friction: 0.3, restitution: 0.0 });
            _this_1.doProfiling = false;
            _this_1.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            _this_1.accumulator = 0;
            _this_1.subsystems = [];
            _this_1.idToBodyMap = {};
            _this_1.broadphase.setWorld(_this_1);
            return _this_1;
        }
        Object.defineProperty(World, "worldNormal", {
            // static worldNormal = new Vector3(0, 0, 1);
            get: function () {
                return worldNormal;
            },
            set: function (v) {
                worldNormal.copy(v);
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Get the contact material between materials m1 and m2
         * @param m1
         * @param m2
         * @return  The contact material if it was found.
         */
        World.prototype.getContactMaterial = function (m1, m2) {
            return this.contactMaterialTable[m1.id + "_" + m2.id]; // this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
        };
        /**
         * Get number of objects in the world.
         */
        World.prototype.numObjects = function () {
            return this.bodies.length;
        };
        /**
         * Store old collision state info
         */
        World.prototype.collisionMatrixTick = function () {
            var temp = this.collisionMatrixPrevious;
            this.collisionMatrixPrevious = this.collisionMatrix;
            this.collisionMatrix = temp;
            this.collisionMatrix = {};
            this.bodyOverlapKeeper.tick();
            this.shapeOverlapKeeper.tick();
        };
        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         */
        World.prototype.addBody = function (body) {
            if (this.bodies.indexOf(body) !== -1) {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof Body) {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.idToBodyMap[body.id] = body;
            this.emit('addBody', body);
        };
        /**
         * Add a constraint to the simulation.
         * @param c
         */
        World.prototype.addConstraint = function (c) {
            this.constraints.push(c);
        };
        /**
         * Removes a constraint
         * @param c
         */
        World.prototype.removeConstraint = function (c) {
            var idx = this.constraints.indexOf(c);
            if (idx !== -1) {
                this.constraints.splice(idx, 1);
            }
        };
        /**
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from
         * @param to
         * @param options
         * @param callback
         * @return True if any body was hit.
         */
        World.prototype.raycastAll = function (from, to, options, callback) {
            if (options === void 0) { options = {}; }
            options.mode = Ray.ALL;
            options.from = from;
            options.to = to;
            options.callback = callback;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        World.prototype.raycastAny = function (from, to, options, result) {
            options.mode = Ray.ANY;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Ray cast, and return information of the closest hit.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        World.prototype.raycastClosest = function (from, to, options, result) {
            options.mode = Ray.CLOSEST;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        };
        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        World.prototype.removeBody = function (body) {
            body.world = null;
            // const n = this.bodies.length - 1;
            var bodies = this.bodies;
            var idx = bodies.indexOf(body);
            if (idx !== -1) {
                bodies.splice(idx, 1); // Todo: should use a garbage free method
                // Recompute index
                for (var i = 0; i !== bodies.length; i++) {
                    bodies[i].index = i;
                }
                delete this.idToBodyMap[body.id];
                this.emit('removeBody', body);
            }
        };
        World.prototype.getBodyById = function (id) {
            return this.idToBodyMap[id];
        };
        // TODO Make a faster map
        World.prototype.getShapeById = function (id) {
            var bodies = this.bodies;
            for (var i = 0, bl = bodies.length; i < bl; i++) {
                var shapes = bodies[i].shapes;
                for (var j = 0, sl = shapes.length; j < sl; j++) {
                    var shape = shapes[j];
                    if (shape.id === id) {
                        return shape;
                    }
                }
            }
        };
        /**
         * Adds a material to the World.
         * @param m
         * @todo Necessary?
         */
        World.prototype.addMaterial = function (m) {
            this.materials.push(m);
        };
        /**
         * Adds a contact material to the World
         * @param cmat
         */
        World.prototype.addContactMaterial = function (cmat) {
            // Add contact material
            this.contactmaterials.push(cmat);
            // Add current contact material to the material table
            this.contactMaterialTable[cmat.materials[0].id + "_" + cmat.materials[1].id] = cmat;
        };
        /**
         * Step the physics world forward in time.
         *
         * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
         *
         * @param dt                       The fixed time step size to use.
         * @param timeSinceLastCalled    The time elapsed since the function was last called.
         * @param maxSubSteps         Maximum number of fixed steps to take per function call.
         *
         * @example
         *     // fixed timestepping without interpolation
         *     world.step(1/60);
         *
         * @see http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
         */
        World.prototype.step = function (dt, timeSinceLastCalled, maxSubSteps) {
            if (timeSinceLastCalled === void 0) { timeSinceLastCalled = 0; }
            if (maxSubSteps === void 0) { maxSubSteps = 10; }
            if (timeSinceLastCalled === 0) { // Fixed, simple stepping
                this.internalStep(dt);
                // Increment time
                this.time += dt;
            }
            else {
                this.accumulator += timeSinceLastCalled;
                var substeps = 0;
                while (this.accumulator >= dt && substeps < maxSubSteps) {
                    // Do fixed steps to catch up
                    this.internalStep(dt);
                    this.accumulator -= dt;
                    substeps++;
                }
                var t = (this.accumulator % dt) / dt;
                for (var j = 0; j !== this.bodies.length; j++) {
                    var b = this.bodies[j];
                    b.previousPosition.lerpNumberTo(b.position, t, b.interpolatedPosition);
                    b.previousQuaternion.slerpTo(b.quaternion, t, b.interpolatedQuaternion);
                    b.previousQuaternion.normalize();
                }
                this.time += timeSinceLastCalled;
            }
        };
        World.prototype.internalStep = function (dt) {
            this.dt = dt;
            // const world = this;
            // const that = this;
            var contacts = this.contacts;
            var p1 = WorldStepP1;
            var p2 = WorldStepP2;
            var N = this.numObjects();
            var bodies = this.bodies;
            var solver = this.solver;
            var gravity = this.gravity;
            var doProfiling = this.doProfiling;
            var profile = this.profile;
            var DYNAMIC = Body.DYNAMIC;
            var profilingStart;
            var constraints = this.constraints;
            var frictionEquationPool = WorldStepFrictionEquationPool;
            // const gnorm = gravity.length;
            var gx = gravity.x;
            var gy = gravity.y;
            var gz = gravity.z;
            if (doProfiling) {
                profilingStart = performance.now();
            }
            // Add gravity to all objects
            for (var i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi.type === DYNAMIC) { // Only for dynamic bodies
                    var f = bi.force;
                    var m = bi.mass;
                    f.x += m * gx;
                    f.y += m * gy;
                    f.z += m * gz;
                }
            }
            // Update subsystems
            for (var i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++) {
                this.subsystems[i].update();
            }
            // Collision detection
            if (doProfiling) {
                profilingStart = performance.now();
            }
            p1.length = 0; // Clean up pair arrays from last step
            p2.length = 0;
            this.broadphase.collisionPairs(this, p1, p2);
            if (doProfiling) {
                profile.broadphase = performance.now() - profilingStart;
            }
            // Remove constrained pairs with collideConnected == false
            var Nconstraints = constraints.length;
            for (var i = 0; i !== Nconstraints; i++) {
                var c = constraints[i];
                if (!c.collideConnected) {
                    for (var j = p1.length - 1; j >= 0; j -= 1) {
                        if ((c.bodyA === p1[j] && c.bodyB === p2[j])
                            || (c.bodyB === p1[j] && c.bodyA === p2[j])) {
                            p1.splice(j, 1);
                            p2.splice(j, 1);
                        }
                    }
                }
            }
            this.collisionMatrixTick();
            // Generate contacts
            if (doProfiling) {
                profilingStart = performance.now();
            }
            var oldcontacts = WorldStepOldContacts;
            var NoldContacts = contacts.length;
            for (var i = 0; i !== NoldContacts; i++) {
                oldcontacts.push(contacts[i]);
            }
            contacts.length = 0;
            // Transfer FrictionEquation from current list to the pool for reuse
            var NoldFrictionEquations = this.frictionEquations.length;
            for (var i = 0; i !== NoldFrictionEquations; i++) {
                frictionEquationPool.push(this.frictionEquations[i]);
            }
            this.frictionEquations.length = 0;
            this.narrowphase.getContacts(p1, p2, this, contacts, oldcontacts, // To be reused
            this.frictionEquations, frictionEquationPool);
            if (doProfiling) {
                profile.narrowphase = performance.now() - profilingStart;
            }
            // Loop over all collisions
            if (doProfiling) {
                profilingStart = performance.now();
            }
            // Add all friction eqs
            for (var i = 0; i < this.frictionEquations.length; i++) {
                solver.addEquation(this.frictionEquations[i]);
            }
            var ncontacts = contacts.length;
            for (var k = 0; k !== ncontacts; k++) {
                // Current contact
                var c = contacts[k];
                // Get current collision indeces
                var bi = c.bi;
                var bj = c.bj;
                var si = c.si;
                var sj = c.sj;
                // Get collision properties
                var cm = void 0;
                if (bi.material && bj.material) {
                    cm = this.getContactMaterial(bi.material, bj.material) || this.defaultContactMaterial;
                }
                else {
                    cm = this.defaultContactMaterial;
                }
                // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
                var mu = cm.friction;
                // c.restitution = cm.restitution;
                // If friction or restitution were specified in the material, use them
                if (bi.material && bj.material) {
                    if (bi.material.friction >= 0 && bj.material.friction >= 0) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        mu = bi.material.friction * bj.material.friction;
                    }
                    if (bi.material.restitution >= 0 && bj.material.restitution >= 0) {
                        c.restitution = bi.material.restitution * bj.material.restitution;
                    }
                }
                // c.setSpookParams(
                //           cm.contactEquationStiffness,
                //           cm.contactEquationRelaxation,
                //           dt
                //       );
                solver.addEquation(c);
                // // Add friction constraint equation
                // if(mu > 0){
                // 	// Create 2 tangent equations
                // 	let mug = mu * gnorm;
                // 	let reducedMass = (bi.invMass + bj.invMass);
                // 	if(reducedMass > 0){
                // 		reducedMass = 1/reducedMass;
                // 	}
                // 	let pool = frictionEquationPool;
                // 	let c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	let c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	this.frictionEquations.push(c1, c2);
                // 	c1.bi = c2.bi = bi;
                // 	c1.bj = c2.bj = bj;
                // 	c1.minForce = c2.minForce = -mug*reducedMass;
                // 	c1.maxForce = c2.maxForce = mug*reducedMass;
                // 	// Copy over the relative vectors
                // 	c1.ri.copy(c.ri);
                // 	c1.rj.copy(c.rj);
                // 	c2.ri.copy(c.ri);
                // 	c2.rj.copy(c.rj);
                // 	// Construct tangents
                // 	c.ni.tangents(c1.t, c2.t);
                //           // Set spook params
                //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c1.enabled = c2.enabled = c.enabled;
                // 	// Add equations to solver
                // 	solver.addEquation(c1);
                // 	solver.addEquation(c2);
                // }
                if (bi.allowSleep
                    && bi.type === Body.DYNAMIC
                    && bi.sleepState === Body.SLEEPING
                    && bj.sleepState === Body.AWAKE
                    && bj.type !== Body.STATIC) {
                    var speedSquaredB = bj.velocity.lengthSquared + bj.angularVelocity.lengthSquared;
                    var speedLimitSquaredB = Math.pow(bj.sleepSpeedLimit, 2);
                    if (speedSquaredB >= speedLimitSquaredB * 2) {
                        bi._wakeUpAfterNarrowphase = true;
                    }
                }
                if (bj.allowSleep
                    && bj.type === Body.DYNAMIC
                    && bj.sleepState === Body.SLEEPING
                    && bi.sleepState === Body.AWAKE
                    && bi.type !== Body.STATIC) {
                    var speedSquaredA = bi.velocity.lengthSquared + bi.angularVelocity.lengthSquared;
                    var speedLimitSquaredA = Math.pow(bi.sleepSpeedLimit, 2);
                    if (speedSquaredA >= speedLimitSquaredA * 2) {
                        bj._wakeUpAfterNarrowphase = true;
                    }
                }
                // Now we know that i and j are in contact. Set collision matrix state
                this.collisionMatrix[bi.index + "_" + bj.index] = true;
                if (!this.collisionMatrixPrevious[bi.index + "_" + bj.index]) {
                    // First contact!
                    // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
                    bi.emit('collide', { body: bj, contact: c });
                    bj.emit('collide', { body: bi, contact: c });
                }
                this.bodyOverlapKeeper.set(bi.id, bj.id);
                this.shapeOverlapKeeper.set(si.id, sj.id);
            }
            this.emitContactEvents();
            if (doProfiling) {
                profile.makeContactConstraints = performance.now() - profilingStart;
                profilingStart = performance.now();
            }
            // Wake up bodies
            for (var i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi._wakeUpAfterNarrowphase) {
                    bi.wakeUp();
                    bi._wakeUpAfterNarrowphase = false;
                }
            }
            // Add user-added constraints
            var Nconstraints1 = constraints.length;
            for (var i = 0; i !== Nconstraints1; i++) {
                var c = constraints[i];
                c.update();
                for (var j = 0, Neq = c.equations.length; j !== Neq; j++) {
                    var eq = c.equations[j];
                    solver.addEquation(eq);
                }
            }
            // Solve the constrained system
            solver.solve(dt, this);
            if (doProfiling) {
                profile.solve = performance.now() - profilingStart;
            }
            // Remove all contacts from solver
            solver.removeAllEquations();
            // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
            var pow = Math.pow;
            for (var i = 0; i !== N; i++) {
                var bi = bodies[i];
                if (bi.type & DYNAMIC) { // Only for dynamic bodies
                    var ld = pow(1.0 - bi.linearDamping, dt);
                    var v = bi.velocity;
                    v.scaleNumberTo(ld, v);
                    var av = bi.angularVelocity;
                    if (av) {
                        var ad = pow(1.0 - bi.angularDamping, dt);
                        av.scaleNumberTo(ad, av);
                    }
                }
            }
            this.emit('preStep');
            // Leap frog
            // vnew = v + h*f/m
            // xnew = x + h*vnew
            if (doProfiling) {
                profilingStart = performance.now();
            }
            var stepnumber = this.stepnumber;
            var quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
            var quatNormalizeFast = this.quatNormalizeFast;
            for (var i = 0; i !== N; i++) {
                bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
            }
            this.clearForces();
            this.broadphase.dirty = true;
            if (doProfiling) {
                profile.integrate = performance.now() - profilingStart;
            }
            // Update world time
            this.time += dt;
            this.stepnumber += 1;
            this.emit('postStep');
            // Sleeping update
            if (this.allowSleep) {
                for (var i = 0; i !== N; i++) {
                    bodies[i].sleepTick(this.time);
                }
            }
        };
        /**
         * Sets all body forces in the world to zero.
         * @method clearForces
         */
        World.prototype.clearForces = function () {
            var bodies = this.bodies;
            var N = bodies.length;
            for (var i = 0; i !== N; i++) {
                var b = bodies[i];
                // const force = b.force;
                // const tau = b.torque;
                b.force.set(0, 0, 0);
                b.torque.set(0, 0, 0);
            }
        };
        return World;
    }(feng3d.EventEmitter));
    // Temp stuff
    // const tmpAABB1 = new Box3();
    // const tmpArray1 = [];
    var tmpRay = new Ray();
    // performance.now()
    if (typeof performance === 'undefined') {
        throw 'performance';
        // performance = {};
    }
    if (!performance.now) {
        var nowOffset_1 = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
            nowOffset_1 = performance.timing.navigationStart;
        }
        performance.now = function () {
            return Date.now() - nowOffset_1;
        };
    }
    // const step_tmp1 = new Vector3();
    /**
     * Dispatched before the world steps forward in time.
     */
    var WorldStepOldContacts = []; // Pools for unused objects
    var WorldStepFrictionEquationPool = [];
    var WorldStepP1 = []; // Reusable arrays for collision pairs
    var WorldStepP2 = [];
    // const World_step_gvec = new Vector3(); // Temporary vectors and quats
    // const World_step_vi = new Vector3();
    // const World_step_vj = new Vector3();
    // const World_step_wi = new Vector3();
    // const World_step_wj = new Vector3();
    // const World_step_t1 = new Vector3();
    // const World_step_t2 = new Vector3();
    // const World_step_rixn = new Vector3();
    // const World_step_rjxn = new Vector3();
    // const World_step_step_q = new Quaternion();
    // const World_step_step_w = new Quaternion();
    // const World_step_step_wq = new Quaternion();
    // const invI_tau_dt = new Vector3();

    var Plane = /** @class */ (function (_super) {
        __extends(Plane, _super);
        /**
         * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
         *
         * @author schteppe
         */
        function Plane() {
            var _this = _super.call(this, {
                type: Shape.types.PLANE
            }) || this;
            // World oriented normal
            _this.worldNormal = new feng3d.Vector3();
            _this.worldNormalNeedsUpdate = true;
            _this.boundingSphereRadius = Number.MAX_VALUE;
            return _this;
        }
        Plane.prototype.computeWorldNormal = function (quat) {
            var n = this.worldNormal;
            n.copy(World.worldNormal);
            quat.vmult(n, n);
            this.worldNormalNeedsUpdate = false;
        };
        Plane.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            return target;
        };
        Plane.prototype.volume = function () {
            return Number.MAX_VALUE; // The plane is infinite...
        };
        Plane.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            // The plane AABB is infinite, except if the normal is pointing along any axis
            tempNormal.copy(World.worldNormal); // Default plane normal is z
            quat.vmult(tempNormal, tempNormal);
            var maxVal = Number.MAX_VALUE;
            min.set(-maxVal, -maxVal, -maxVal);
            max.set(maxVal, maxVal, maxVal);
            if (tempNormal.x === 1) {
                max.x = pos.x;
            }
            if (tempNormal.y === 1) {
                max.y = pos.y;
            }
            if (tempNormal.z === 1) {
                max.z = pos.z;
            }
            if (tempNormal.x === -1) {
                min.x = pos.x;
            }
            if (tempNormal.y === -1) {
                min.y = pos.y;
            }
            if (tempNormal.z === -1) {
                min.z = pos.z;
            }
        };
        Plane.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = Number.MAX_VALUE;
        };
        return Plane;
    }(Shape));
    var tempNormal = new feng3d.Vector3();

    var Sphere = /** @class */ (function (_super) {
        __extends(Sphere, _super);
        /**
         * Spherical shape
         *
         * @param radius The radius of the sphere, a non-negative number.
         * @author schteppe / http://github.com/schteppe
         */
        function Sphere(radius) {
            var _this = _super.call(this, {
                type: Shape.types.SPHERE
            }) || this;
            _this.radius = radius !== undefined ? radius : 1.0;
            if (_this.radius < 0) {
                throw new Error('The sphere radius cannot be negative.');
            }
            _this.updateBoundingSphereRadius();
            return _this;
        }
        Sphere.prototype.calculateLocalInertia = function (mass, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            var I = 2.0 * mass * this.radius * this.radius / 5.0;
            target.x = I;
            target.y = I;
            target.z = I;
            return target;
        };
        Sphere.prototype.volume = function () {
            return 4.0 * Math.PI * this.radius / 3.0;
        };
        Sphere.prototype.updateBoundingSphereRadius = function () {
            this.boundingSphereRadius = this.radius;
        };
        Sphere.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            var r = this.radius;
            var axes = ['x', 'y', 'z'];
            for (var i = 0; i < axes.length; i++) {
                var ax = axes[i];
                min[ax] = pos[ax] - r;
                max[ax] = pos[ax] + r;
            }
        };
        return Sphere;
    }(Shape));

    var OctreeNode = /** @class */ (function () {
        /**
         *
         * @param options
         */
        function OctreeNode(options) {
            if (options === void 0) { options = {}; }
            this.root = options.root || null;
            this.aabb = options.aabb ? options.aabb.clone() : new feng3d.Box3();
            this.data = [];
            this.children = [];
        }
        OctreeNode.prototype.reset = function () {
            this.children.length = this.data.length = 0;
        };
        /**
         * Insert data into this node
         *
         * @param aabb
         * @param elementData
         * @return True if successful, otherwise false
         */
        OctreeNode.prototype.insert = function (aabb, elementData, level) {
            if (level === void 0) { level = 0; }
            var nodeData = this.data;
            // Ignore objects that do not belong in this node
            if (!this.aabb.contains(aabb)) {
                return false; // object cannot be added
            }
            var children = this.children;
            if (level < (this.maxDepth || this.root.maxDepth)) {
                // Subdivide if there are no children yet
                var subdivided = false;
                if (!children.length) {
                    this.subdivide();
                    subdivided = true;
                }
                // add to whichever node will accept it
                for (var i = 0; i !== 8; i++) {
                    if (children[i].insert(aabb, elementData, level + 1)) {
                        return true;
                    }
                }
                if (subdivided) {
                    // No children accepted! Might as well just remove em since they contain none
                    children.length = 0;
                }
            }
            // Too deep, or children didnt want it. add it in current node
            nodeData.push(elementData);
            return true;
        };
        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        OctreeNode.prototype.subdivide = function () {
            var aabb = this.aabb;
            var l = aabb.min;
            var u = aabb.max;
            var children = this.children;
            children.push(new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(0, 0, 0)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(1, 0, 0)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(1, 1, 0)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(1, 1, 1)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(0, 1, 1)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(0, 0, 1)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(1, 0, 1)) }), new OctreeNode({ aabb: new feng3d.Box3(new feng3d.Vector3(0, 1, 0)) }));
            u.subTo(l, halfDiagonal);
            halfDiagonal.scaleNumberTo(0.5, halfDiagonal);
            var root = this.root || this;
            for (var i = 0; i !== 8; i++) {
                var child = children[i];
                // Set current node as root
                child.root = root;
                // Compute bounds
                var lowerBound = child.aabb.min;
                lowerBound.x *= halfDiagonal.x;
                lowerBound.y *= halfDiagonal.y;
                lowerBound.z *= halfDiagonal.z;
                lowerBound.addTo(l, lowerBound);
                // Upper bound is always lower bound + halfDiagonal
                lowerBound.addTo(halfDiagonal, child.aabb.max);
            }
        };
        /**
         * Get all data, potentially within an AABB
         *
         * @param aabb
         * @param result
         * @return The "result" object
         */
        OctreeNode.prototype.aabbQuery = function (aabb, result) {
            // const nodeData = this.data;
            // abort if the range does not intersect this node
            // if (!this.aabb.overlaps(aabb)){
            //     return result;
            // }
            // Add objects at this level
            // Array.prototype.push.apply(result, nodeData);
            // Add child data
            // @todo unwrap recursion into a queue / loop, that's faster in JS
            // const children = this.children;
            // for (var i = 0, N = this.children.length; i !== N; i++) {
            //     children[i].aabbQuery(aabb, result);
            // }
            var queue = [this];
            while (queue.length) {
                var node = queue.pop();
                if (node.aabb.overlaps(aabb)) {
                    Array.prototype.push.apply(result, node.data);
                }
                Array.prototype.push.apply(queue, node.children);
            }
            return result;
        };
        /**
         * Get all data, potentially intersected by a ray.
         *
         * @param ray
         * @param treeTransform
         * @param result
         * @return The "result" object
         */
        OctreeNode.prototype.rayQuery = function (ray, treeTransform, result) {
            // Use aabb query for now.
            // @todo implement real ray query which needs less lookups
            ray.getAABB(tmpAABB);
            treeTransform.toLocalFrameBox3(tmpAABB, tmpAABB);
            this.aabbQuery(tmpAABB, result);
            return result;
        };
        OctreeNode.prototype.removeEmptyNodes = function () {
            var queue = [this];
            while (queue.length) {
                var node = queue.pop();
                for (var i = node.children.length - 1; i >= 0; i--) {
                    if (!node.children[i].data.length) {
                        node.children.splice(i, 1);
                    }
                }
                Array.prototype.push.apply(queue, node.children);
            }
        };
        return OctreeNode;
    }());
    var Octree = /** @class */ (function (_super) {
        __extends(Octree, _super);
        /**
         * @class Octree
         * @param {Box3} aabb The total AABB of the tree
         * @param {object} [options]
         * @param {number} [options.maxDepth=8]
         * @extends OctreeNode
         */
        function Octree(aabb, options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            options.root = null;
            options.aabb = aabb;
            _this = _super.call(this, options) || this;
            _this.maxDepth = typeof (options.maxDepth) !== 'undefined' ? options.maxDepth : 8;
            return _this;
        }
        return Octree;
    }(OctreeNode));
    var halfDiagonal = new feng3d.Vector3();
    var tmpAABB = new feng3d.Box3();

    var Trimesh = /** @class */ (function (_super) {
        __extends(Trimesh, _super);
        /**
         * @param vertices
         * @param indices
         *
         * @example
         *     // How to make a mesh with a single triangle
         *     let vertices = [
         *         0, 0, 0, // vertex 0
         *         1, 0, 0, // vertex 1
         *         0, 1, 0  // vertex 2
         *     ];
         *     let indices = [
         *         0, 1, 2  // triangle 0
         *     ];
         *     let trimeshShape = new Trimesh(vertices, indices);
         */
        function Trimesh(vertices, indices) {
            var _this = _super.call(this, {
                type: Shape.types.TRIMESH
            }) || this;
            _this.vertices = vertices.concat();
            /**
             * Array of integers, indicating which vertices each triangle consists of. The length of this array is thus 3 times the number of triangles.
             */
            _this.indices = indices.concat();
            _this.normals = [];
            _this.aabb = new feng3d.Box3();
            _this.edges = null;
            _this.scale = new feng3d.Vector3(1, 1, 1);
            _this.tree = new Octree();
            _this.updateEdges();
            _this.updateNormals();
            _this.updateAABB();
            _this.updateBoundingSphereRadius();
            _this.updateTree();
            return _this;
        }
        Trimesh.prototype.updateTree = function () {
            var tree = this.tree;
            tree.reset();
            tree.aabb.copy(this.aabb);
            var scale = this.scale; // The local mesh AABB is scaled, but the octree AABB should be unscaled
            tree.aabb.min.x *= 1 / scale.x;
            tree.aabb.min.y *= 1 / scale.y;
            tree.aabb.min.z *= 1 / scale.z;
            tree.aabb.max.x *= 1 / scale.x;
            tree.aabb.max.y *= 1 / scale.y;
            tree.aabb.max.z *= 1 / scale.z;
            // Insert all triangles
            var triangleAABB = new feng3d.Box3();
            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var points = [a, b, c];
            for (var i = 0; i < this.indices.length / 3; i++) {
                // this.getTriangleVertices(i, a, b, c);
                // Get unscaled triangle verts
                var i3 = i * 3;
                this._getUnscaledVertex(this.indices[i3], a);
                this._getUnscaledVertex(this.indices[i3 + 1], b);
                this._getUnscaledVertex(this.indices[i3 + 2], c);
                triangleAABB.fromPoints(points);
                tree.insert(triangleAABB, i);
            }
            tree.removeEmptyNodes();
        };
        /**
         * Get triangles in a local AABB from the trimesh.
         *
         * @param aabb
         * @param result An array of integers, referencing the queried triangles.
         */
        Trimesh.prototype.getTrianglesInAABB = function (aabb, result) {
            unscaledAABB.copy(aabb);
            // Scale it to local
            var scale = this.scale;
            var isx = scale.x;
            var isy = scale.y;
            var isz = scale.z;
            var l = unscaledAABB.min;
            var u = unscaledAABB.max;
            l.x /= isx;
            l.y /= isy;
            l.z /= isz;
            u.x /= isx;
            u.y /= isy;
            u.z /= isz;
            return this.tree.aabbQuery(unscaledAABB, result);
        };
        /**
         * @param scale
         */
        Trimesh.prototype.setScale = function (scale) {
            // let wasUniform = this.scale.x === this.scale.y === this.scale.z;// 等价下面代码?
            var wasUniform = this.scale.x === this.scale.y && this.scale.y === this.scale.z; // ?
            // let isUniform = scale.x === scale.y === scale.z;// 等价下面代码?
            var isUniform = scale.x === scale.y && scale.y === scale.z; // ?
            if (!(wasUniform && isUniform)) {
                // Non-uniform scaling. Need to update normals.
                this.updateNormals();
            }
            this.scale.copy(scale);
            this.updateAABB();
            this.updateBoundingSphereRadius();
        };
        /**
         * Compute the normals of the faces. Will save in the .normals array.
         */
        Trimesh.prototype.updateNormals = function () {
            var n = computeNormalsN;
            // Generate normals
            var normals = this.normals;
            for (var i = 0; i < this.indices.length / 3; i++) {
                var i3 = i * 3;
                var a = this.indices[i3];
                var b = this.indices[i3 + 1];
                var c = this.indices[i3 + 2];
                this.getVertex(a, va);
                this.getVertex(b, vb);
                this.getVertex(c, vc);
                Trimesh.computeNormal(vb, va, vc, n);
                normals[i3] = n.x;
                normals[i3 + 1] = n.y;
                normals[i3 + 2] = n.z;
            }
        };
        /**
         * Update the .edges property
         */
        Trimesh.prototype.updateEdges = function () {
            var edges = {};
            // eslint-disable-next-line func-style
            var add = function (a, b) {
                var key = a < b ? a + "_" + b : b + "_" + a;
                edges[key] = true;
            };
            for (var i = 0; i < this.indices.length / 3; i++) {
                var i3 = i * 3;
                var a = this.indices[i3];
                var b = this.indices[i3 + 1];
                var c = this.indices[i3 + 2];
                add(a, b);
                add(b, c);
                add(c, a);
            }
            var keys = Object.keys(edges);
            this.edges = [];
            for (var i = 0; i < keys.length; i++) {
                var indices = keys[i].split('_');
                this.edges[2 * i] = parseInt(indices[0], 10);
                this.edges[2 * i + 1] = parseInt(indices[1], 10);
            }
        };
        /**
         * Get an edge vertex
         *
         * @param edgeIndex
         * @param firstOrSecond 0 or 1, depending on which one of the vertices you need.
         * @param vertexStore Where to store the result
         */
        Trimesh.prototype.getEdgeVertex = function (edgeIndex, firstOrSecond, vertexStore) {
            var vertexIndex = this.edges[edgeIndex * 2 + (firstOrSecond ? 1 : 0)];
            this.getVertex(vertexIndex, vertexStore);
        };
        /**
         * Get a vector along an edge.
         *
         * @param edgeIndex
         * @param vectorStore
         */
        Trimesh.prototype.getEdgeVector = function (edgeIndex, vectorStore) {
            var va = getEdgeVectorVa;
            var vb = getEdgeVectorVb;
            this.getEdgeVertex(edgeIndex, 0, va);
            this.getEdgeVertex(edgeIndex, 1, vb);
            vb.subTo(va, vectorStore);
        };
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        Trimesh.computeNormal = function (va, vb, vc, target) {
            vb.subTo(va, ab);
            vc.subTo(vb, cb);
            cb.crossTo(ab, target);
            if (!target.isZero()) {
                target.normalize();
            }
        };
        /**
         * Get vertex i.
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype.getVertex = function (i, out) {
            var scale = this.scale;
            this._getUnscaledVertex(i, out);
            out.x *= scale.x;
            out.y *= scale.y;
            out.z *= scale.z;
            return out;
        };
        /**
         * Get raw vertex i
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype._getUnscaledVertex = function (i, out) {
            var i3 = i * 3;
            var vertices = this.vertices;
            return out.set(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
        };
        /**
         * Get a vertex from the trimesh,transformed by the given position and quaternion.
         *
         * @param i
         * @param pos
         * @param quat
         * @param out
         * @return The "out" vector object
         */
        Trimesh.prototype.getWorldVertex = function (i, pos, quat, out) {
            this.getVertex(i, out);
            Transform.pointToWorldFrame(pos, quat, out, out);
            return out;
        };
        /**
         * Get the three vertices for triangle i.
         *
         * @param i
         * @param a
         * @param b
         * @param c
         */
        Trimesh.prototype.getTriangleVertices = function (i, a, b, c) {
            var i3 = i * 3;
            this.getVertex(this.indices[i3], a);
            this.getVertex(this.indices[i3 + 1], b);
            this.getVertex(this.indices[i3 + 2], c);
        };
        /**
         * Compute the normal of triangle i.
         *
         * @param i
         * @param target
         * @return The "target" vector object
         */
        Trimesh.prototype.getNormal = function (i, target) {
            var i3 = i * 3;
            return target.set(this.normals[i3], this.normals[i3 + 1], this.normals[i3 + 2]);
        };
        /**
         *
         * @param mass
         * @param target
         * @return The "target" vector object
         */
        Trimesh.prototype.calculateLocalInertia = function (mass, target) {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            this.computeLocalAABB(cliAabb);
            var x = cliAabb.max.x - cliAabb.min.x;
            var y = cliAabb.max.y - cliAabb.min.y;
            var z = cliAabb.max.z - cliAabb.min.z;
            return target.set(1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z), 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z), 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x));
        };
        /**
         * Compute the local AABB for the trimesh
         *
         * @param aabb
         */
        Trimesh.prototype.computeLocalAABB = function (aabb) {
            var l = aabb.min;
            var u = aabb.max;
            var n = this.vertices.length;
            // const vertices = this.vertices;
            var v = computeLocalAABBWorldVert;
            this.getVertex(0, v);
            l.copy(v);
            u.copy(v);
            for (var i = 0; i !== n; i++) {
                this.getVertex(i, v);
                if (v.x < l.x) {
                    l.x = v.x;
                }
                else if (v.x > u.x) {
                    u.x = v.x;
                }
                if (v.y < l.y) {
                    l.y = v.y;
                }
                else if (v.y > u.y) {
                    u.y = v.y;
                }
                if (v.z < l.z) {
                    l.z = v.z;
                }
                else if (v.z > u.z) {
                    u.z = v.z;
                }
            }
        };
        /**
         * Update the .aabb property
         */
        Trimesh.prototype.updateAABB = function () {
            this.computeLocalAABB(this.aabb);
        };
        /**
         * Will update the .boundingSphereRadius property
         */
        Trimesh.prototype.updateBoundingSphereRadius = function () {
            // Assume points are distributed with local (0,0,0) as center
            var max2 = 0;
            var vertices = this.vertices;
            var v = new feng3d.Vector3();
            for (var i = 0, N = vertices.length / 3; i !== N; i++) {
                this.getVertex(i, v);
                var norm2 = v.lengthSquared;
                if (norm2 > max2) {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        };
        Trimesh.prototype.calculateWorldAABB = function (pos, quat, min, max) {
            /*
            let n = this.vertices.length / 3,
                verts = this.vertices;
            let minx,miny,minz,maxx,maxy,maxz;

            let v = tempWorldVertex;
            for(let i=0; i<n; i++){
                this.getVertex(i, v);
                quat.vmult(v, v);
                pos.addTo(v, v);
                if (v.x < minx || minx===undefined){
                    minx = v.x;
                } else if(v.x > maxx || maxx===undefined){
                    maxx = v.x;
                }

                if (v.y < miny || miny===undefined){
                    miny = v.y;
                } else if(v.y > maxy || maxy===undefined){
                    maxy = v.y;
                }

                if (v.z < minz || minz===undefined){
                    minz = v.z;
                } else if(v.z > maxz || maxz===undefined){
                    maxz = v.z;
                }
            }
            min.set(minx,miny,minz);
            max.set(maxx,maxy,maxz);
            */
            // Faster approximation using local AABB
            var frame = calculateWorldAABBFrame;
            var result = calculateWorldAABBAabb;
            frame.position = pos;
            frame.quaternion = quat;
            frame.toWorldFrameBox3(this.aabb, result);
            min.copy(result.min);
            max.copy(result.max);
        };
        /**
         * Get approximate volume
         */
        Trimesh.prototype.volume = function () {
            return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
        };
        /**
         * Create a Trimesh instance, shaped as a torus.
         *
         * @param radius
         * @param tube
         * @param radialSegments
         * @param tubularSegments
         * @param arc
         *
         * @return A torus
         */
        Trimesh.createTorus = function (radius, tube, radialSegments, tubularSegments, arc) {
            if (radius === void 0) { radius = 1; }
            if (tube === void 0) { tube = 0.5; }
            if (radialSegments === void 0) { radialSegments = 8; }
            if (tubularSegments === void 0) { tubularSegments = 6; }
            if (arc === void 0) { arc = Math.PI * 2; }
            var vertices = [];
            var indices = [];
            for (var j = 0; j <= radialSegments; j++) {
                for (var i = 0; i <= tubularSegments; i++) {
                    var u = i / tubularSegments * arc;
                    var v = j / radialSegments * Math.PI * 2;
                    var x = (radius + tube * Math.cos(v)) * Math.cos(u);
                    var y = (radius + tube * Math.cos(v)) * Math.sin(u);
                    var z = tube * Math.sin(v);
                    vertices.push(x, y, z);
                }
            }
            for (var j = 1; j <= radialSegments; j++) {
                for (var i = 1; i <= tubularSegments; i++) {
                    var a = (tubularSegments + 1) * j + i - 1;
                    var b = (tubularSegments + 1) * (j - 1) + i - 1;
                    var c = (tubularSegments + 1) * (j - 1) + i;
                    var d = (tubularSegments + 1) * j + i;
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
            return new Trimesh(vertices, indices);
        };
        return Trimesh;
    }(Shape));
    var computeNormalsN = new feng3d.Vector3();
    var unscaledAABB = new feng3d.Box3();
    var getEdgeVectorVa = new feng3d.Vector3();
    var getEdgeVectorVb = new feng3d.Vector3();
    var cb = new feng3d.Vector3();
    var ab = new feng3d.Vector3();
    var va = new feng3d.Vector3();
    var vb = new feng3d.Vector3();
    var vc = new feng3d.Vector3();
    var cliAabb = new feng3d.Box3();
    var computeLocalAABBWorldVert = new feng3d.Vector3();
    // const tempWorldVertex = new Vector3();
    var calculateWorldAABBFrame = new Transform();
    var calculateWorldAABBAabb = new feng3d.Box3();

    var SplitSolver = /** @class */ (function (_super) {
        __extends(SplitSolver, _super);
        /**
         * Splits the equations into islands and solves them independently. Can improve performance.
         *
         * @param subsolver
         */
        function SplitSolver(subsolver) {
            var _this = _super.call(this) || this;
            _this.iterations = 10;
            _this.tolerance = 1e-7;
            _this.subsolver = subsolver;
            _this.nodes = [];
            _this.nodePool = [];
            // Create needed nodes, reuse if possible
            while (_this.nodePool.length < 128) {
                _this.nodePool.push(_this.createNode());
            }
            return _this;
        }
        SplitSolver.prototype.createNode = function () {
            return { body: null, children: [], eqs: [], visited: false };
        };
        /**
         * Solve the subsystems
         * @method solve
         * @param  {Number} dt
         * @param  {World} world
         */
        SplitSolver.prototype.solve = function (dt, world) {
            var nodes = SplitSolverSolveNodes;
            var nodePool = this.nodePool;
            var bodies = world.bodies;
            var equations = this.equations;
            var Neq = equations.length;
            var Nbodies = bodies.length;
            var subsolver = this.subsolver;
            // Create needed nodes, reuse if possible
            while (nodePool.length < Nbodies) {
                nodePool.push(this.createNode());
            }
            nodes.length = Nbodies;
            for (var i = 0; i < Nbodies; i++) {
                nodes[i] = nodePool[i];
            }
            // Reset node values
            for (var i = 0; i !== Nbodies; i++) {
                var node = nodes[i];
                node.body = bodies[i];
                node.children.length = 0;
                node.eqs.length = 0;
                node.visited = false;
            }
            for (var k = 0; k !== Neq; k++) {
                var eq = equations[k];
                var i0 = bodies.indexOf(eq.bi);
                var j = bodies.indexOf(eq.bj);
                var ni = nodes[i0];
                var nj = nodes[j];
                ni.children.push(nj);
                ni.eqs.push(eq);
                nj.children.push(ni);
                nj.eqs.push(eq);
            }
            var child;
            var n = 0;
            var eqs = SplitSolverSolveEqs;
            subsolver.tolerance = this.tolerance;
            subsolver.iterations = this.iterations;
            var dummyWorld = SplitSolverSolveDummyWorld;
            while ((child = getUnvisitedNode(nodes))) {
                eqs.length = 0;
                dummyWorld.bodies.length = 0;
                bfs(child, visitFunc, dummyWorld.bodies, eqs);
                var Neqs = eqs.length;
                eqs = eqs.sort(sortById);
                for (var i = 0; i !== Neqs; i++) {
                    subsolver.addEquation(eqs[i]);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                var iter = subsolver.solve(dt, dummyWorld);
                subsolver.removeAllEquations();
                n++;
            }
            return n;
        };
        return SplitSolver;
    }(Solver));
    // Returns the number of subsystems
    var SplitSolverSolveNodes = []; // All allocated node objects
    // const SplitSolver_solve_nodePool = []; // All allocated node objects
    var SplitSolverSolveEqs = []; // Temp array
    // const SplitSolver_solve_bds = []; // Temp array
    var SplitSolverSolveDummyWorld = { bodies: [] }; // Temp object
    var STATIC = Body.STATIC;
    function getUnvisitedNode(nodes) {
        var Nnodes = nodes.length;
        for (var i = 0; i !== Nnodes; i++) {
            var node = nodes[i];
            if (!node.visited && !(node.body.type & STATIC)) {
                return node;
            }
        }
        return false;
    }
    var queue = [];
    function bfs(root, visitFunc, bds, eqs) {
        queue.push(root);
        root.visited = true;
        visitFunc(root, bds, eqs);
        while (queue.length) {
            var node = queue.pop();
            // Loop over unvisited child nodes
            var child = void 0;
            while ((child = getUnvisitedNode(node.children))) {
                child.visited = true;
                visitFunc(child, bds, eqs);
                queue.push(child);
            }
        }
    }
    function visitFunc(node, bds, eqs) {
        bds.push(node.body);
        var Neqs = node.eqs.length;
        for (var i = 0; i !== Neqs; i++) {
            var eq = node.eqs[i];
            if (eqs.indexOf(eq) === -1) {
                eqs.push(eq);
            }
        }
    }
    function sortById(a, b) {
        return b.id - a.id;
    }

    exports.Body = Body;
    exports.Box = Box;
    exports.Broadphase = Broadphase;
    exports.ConeEquation = ConeEquation;
    exports.ConeTwistConstraint = ConeTwistConstraint;
    exports.Constraint = Constraint;
    exports.ContactEquation = ContactEquation;
    exports.ContactMaterial = ContactMaterial;
    exports.ConvexPolyhedron = ConvexPolyhedron;
    exports.Cylinder = Cylinder;
    exports.DistanceConstraint = DistanceConstraint;
    exports.Equation = Equation;
    exports.FrictionEquation = FrictionEquation;
    exports.GSSolver = GSSolver;
    exports.GridBroadphase = GridBroadphase;
    exports.Heightfield = Heightfield;
    exports.HingeConstraint = HingeConstraint;
    exports.JacobianElement = JacobianElement;
    exports.LockConstraint = LockConstraint;
    exports.Material = Material;
    exports.NaiveBroadphase = NaiveBroadphase;
    exports.Narrowphase = Narrowphase;
    exports.Octree = Octree;
    exports.OctreeNode = OctreeNode;
    exports.OverlapKeeper = OverlapKeeper;
    exports.Particle = Particle;
    exports.Plane = Plane;
    exports.PointToPointConstraint = PointToPointConstraint;
    exports.Ray = Ray;
    exports.RaycastResult = RaycastResult;
    exports.RaycastVehicle = RaycastVehicle;
    exports.RigidVehicle = RigidVehicle;
    exports.RotationalEquation = RotationalEquation;
    exports.RotationalMotorEquation = RotationalMotorEquation;
    exports.SAPBroadphase = SAPBroadphase;
    exports.SPHSystem = SPHSystem;
    exports.Shape = Shape;
    exports.Solver = Solver;
    exports.Sphere = Sphere;
    exports.SplitSolver = SplitSolver;
    exports.Spring = Spring;
    exports.Transform = Transform;
    exports.Trimesh = Trimesh;
    exports.Utils = Utils;
    exports.WheelInfo = WheelInfo;
    exports.World = World;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, feng3d);
Object.assign(this.CANNON, _feng3d_plugins_cannon);
//# sourceMappingURL=index.js.map
