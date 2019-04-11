namespace feng3d
{
    /**
     * 常用正则表示式
     */
    export var regExps: RegExps;

    /**
     * 常用正则表示式
     */
    export class RegExps
    {
        /**
         * json文件
         */
        json = /(\.json)\b/i;

        /**
         * 图片
         */
        image = /(\.jpg|\.png|\.jpeg|\.gif)\b/i;

        /**
         * 声音
         */
        audio = /(\.ogg|\.mp3|\.wav)\b/i;

        /**
         * 命名空间
         */
        namespace = /namespace\s+([\w$_\d\.]+)/;

        /**
         * 类
         */
        classReg = /(export\s+)?(abstract\s+)?class\s+([\w$_\d]+)(\s+extends\s+([\w$_\d\.]+))?/;
    }

    regExps = new RegExps();
}