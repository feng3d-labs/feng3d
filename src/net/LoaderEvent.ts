module feng3d
{

    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    export class LoaderEvent extends Event
    {

        /**
         * 加载进度发生改变时调度。
         */
        public static PROGRESS = "progress";

        /**
         * 加载完成后调度。
         */
        public static COMPLETE = "complete";

        /**
         * 加载出错时调度。
         */
        public static ERROR = "error";
    }
}