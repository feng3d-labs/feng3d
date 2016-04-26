module me.feng3d {
    export class StringUtils {

        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         */
        public static getString(obj, showLen: number = -1, fill = " "): string {
            var str = "";
            if (obj.toString != null) {
                str = obj.toString();
            } else {
                obj = <string>obj;
            }

            if (showLen != -1) {
                while (str.length < showLen) {
                    str += fill;
                }
                if (str.length > showLen) {
                    str = str.substr(0, showLen);
                }
            }

            return str;
        }
    }
}