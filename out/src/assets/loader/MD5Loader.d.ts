declare namespace feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader: {
        load: (url: string, completed?: (object3D: GameObject, skeletonAnimator: SkeletonAnimator) => void) => void;
        loadAnim: (url: string, completed?: (object3D: SkeletonClipNode) => void) => void;
    };
}
