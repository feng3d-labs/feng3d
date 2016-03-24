module feng3d {
    export class StringUtils {

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