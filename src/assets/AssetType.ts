namespace feng3d
{

    /**
     * 资源扩展名
     */
    export enum AssetType
    {
        /**
         * 文件夹
         */
        folder = "folder",

        /**
         * 音频
         */
        audio = "audio",

        /**
         * ts文件
         */
        ts = "ts",
        /**
         * js文件
         */
        js = "js",
        /**
         * 文本文件
         */
        txt = "txt",
        /**
         * json文件
         */
        json = "json",
        /**
         * OBJ模型资源附带的材质文件
         */
        mtl = "mtl",
        /**
         * OBJ模型文件
         */
        obj = "obj",
        /**
         * MD5模型文件
         */
        md5mesh = "md5mesh",
        /**
         * MD5动画
         */
        md5anim = "md5anim",
        /**
         * 魔兽MDL模型
         */
        mdl = "mdl",
        // -- feng3d中的类型
        /**
         * 纹理
         */
        texture = "texture",
        /**
         * 立方体纹理
         */
        texturecube = "texturecube",
        /**
         * 材质
         */
        material = "material",
        /**
         * 几何体
         */
        geometry = "geometry",
        /**
         * 3d节点
         */
        node3d = "node3d",
        /**
         * 场景
         */
        scene = "scene",
        /**
         * 动画
         */
        anim = "anim",
        /**
         * 着色器
         */
        shader = "shader",
        /**
         * 脚本
         */
        script = "script",
    }

}