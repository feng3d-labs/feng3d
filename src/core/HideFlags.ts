namespace feng3d
{
    /**
     * Bit mask that controls object destruction, saving and visibility in inspectors.
     */
    export enum HideFlags
    {
        /**
         * A normal, visible object. This is the default.
         */
        None = 0,
        /**
         * The object will not appear in the hierarchy.
         */
        HideInHierarchy = 1,
        /**
         * It is not possible to view it in the inspector.
         */
        HideInInspector = 2,
        /**
         * The object will not be saved to the scene in the editor.
         */
        DontSaveInEditor = 4,
        /**
         * The object is not be editable in the inspector.
         */
        NotEditable = 8,
        /**
         * The object will not be saved when building a player.
         */
        DontSaveInBuild = 16,
        /**
         * The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        DontUnloadUnusedAsset = 32,
        /**
         * The object will not be saved to the scene. It will not be destroyed when a new scene is loaded. It is a shortcut for HideFlags.DontSaveInBuild | HideFlags.DontSaveInEditor | HideFlags.DontUnloadUnusedAsset.
         */
        DontSave = 52,
        /**
         * A combination of not shown in the hierarchy, not saved to to scenes and not unloaded by The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideAndDontSave = 61
    }
}