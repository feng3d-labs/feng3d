namespace feng3d
{
    /**
     * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
     * 例如 boardKeyDic[17] = "ctrl";
     */
    var boardKeyDic: { [keyCode: number]: string } = {
        17: "ctrl",
        16: "shift",
        32: "escape",
        18: "alt",
        46: "del",
    };

    export class KeyBoard
    {
		/**
		 * 获取键盘按键名称
         * @param code   按键值
		 */
        static getKey(code: number): string
        {
            var key = boardKeyDic[code];
            if (key == null && 65 <= code && code <= 90)
            {
                key = String.fromCharCode(code).toLocaleLowerCase();
            }
            return key;
        }

        /**
         * 获取按键值
         * @param key 按键
         */
        static getCode(key: string)
        {
            key = key.toLocaleLowerCase();
            var code = key.charCodeAt(0);
            if (key.length == 1 && 65 <= code && code <= 90)
            {
                return code;
            }
            for (const code in boardKeyDic)
            {
                if (boardKeyDic.hasOwnProperty(code))
                {
                    if (boardKeyDic[code] == key)
                        return Number(code);
                }
            }
            console.error(`无法获取按键 ${key} 的值！`);
            return code;
        }
    }
}