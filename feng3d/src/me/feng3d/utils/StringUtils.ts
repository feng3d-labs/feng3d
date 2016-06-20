module me.feng3d {
    export class StringUtils {

        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         * @param tail          true（默认）:在尾部添加；false：在首部添加
         */
        public static getString(obj, showLen: number = -1, fill = " ", tail: boolean = true): string {
            var str = "";
            if (obj.toString != null) {
                str = obj.toString();
            } else {
                obj = <string>obj;
            }

            if (showLen != -1) {
                while (str.length < showLen) {
                    if (tail) {
                        str = str + fill;
                    }
                    else {
                        str = fill + str;
                    }
                }
                if (str.length > showLen) {
                    str = str.substr(0, showLen);
                }
            }

            return str;
        }
    }
}