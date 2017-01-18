module feng3d {

    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    export class MD5Loader extends Loader {

        completed: (object3D: Object3D) => void;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, completed: (object3D: Object3D) => void = null) {

            this.url = url
            this.completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = this.objData = MD5MeshParser.parse(e.data.content);

                this.createObj();
            }, this)
            loader.loadText(url);
        }

        public loadAnim(url: string, completed: (object3D: Object3D) => void = null) {

            this.url = url
            this.completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent) {

                var objData = this.objData = MD5AnimParser.parse(e.data.content);

                this.createObj();
            }, this)
            loader.loadText(url);
        }

        

        private createObj() {

            var object = new Object3D();

            if (this.completed) {
                this.completed(object);
            }
        }
    }
}