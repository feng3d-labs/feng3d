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
//# sourceMappingURL=HideFlags.js.map