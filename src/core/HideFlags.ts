namespace feng3d
{
    /**
     * 在检查器中控制对象销毁、保存和可见性的位掩码。
     */
    export enum HideFlags
    {
        /**
         * 一个正常的,可见对象。这是默认的。
         */
        None = 0,
        /**
         * 不会出现在层次界面中。
         */
        HideInHierarchy = 1,
        /**
         * 不会出现在检查器界面中。
         */
        HideInInspector = 2,
        /**
         * 不会保存到编辑器中的场景中。
         */
        DontSaveInEditor = 4,
        /**
         * 在检查器中不可编辑。
         */
        NotEditable = 8,
        /**
         * 在构建播放器时对象不会被保存。
         */
        DontSaveInBuild = 16,
        /**
         * 对象不会被Resources.UnloadUnusedAssets卸载。
         */
        DontUnloadUnusedAsset = 32,
        /**
         * 不能被变换
         */
        DontTransform = 64,
        /**
         * 隐藏
         */
        Hide = HideInHierarchy | HideInInspector,
        /**
         * 对象不会保存到场景中。加载新场景时不会被销毁。相当于DontSaveInBuild | HideFlags。DontSaveInEditor | HideFlags.DontUnloadUnusedAsset
         */
        DontSave = DontSaveInEditor | DontSaveInBuild,
        /**
         * 不显示在层次界面中，不保存到场景中，加载新场景时不会被销毁。
         */
        HideAndDontSave = 61
    }
}