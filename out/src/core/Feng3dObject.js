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
    var uuidMap = {};
    /**
     * Base class for all objects feng3d can reference.
     *
     * Any variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    var Feng3dObject = (function (_super) {
        __extends(Feng3dObject, _super);
        //------------------------------------------
        // Functions
        //------------------------------------------
        function Feng3dObject() {
            var _this = _super.call(this) || this;
            _this.uuid = Math.generateUUID();
            uuidMap[_this.uuid] = _this;
            return _this;
        }
        //------------------------------------------
        // Static Functions
        //------------------------------------------
        Feng3dObject.get = function (uuid) {
            return uuidMap[uuid];
        };
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
    __decorate([
        feng3d.serialize
    ], Feng3dObject.prototype, "uuid", void 0);
    feng3d.Feng3dObject = Feng3dObject;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Feng3dObject.js.map