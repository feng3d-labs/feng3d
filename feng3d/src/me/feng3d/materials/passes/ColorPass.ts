module me.feng3d {

    export class ColorPass extends MaterialPass {

        color: number;

        /**
         * Context3D数据缓冲
         */
        get context3DBuffer(): Context3DBuffer {
            return this.getOrCreateComponentByClass(Context3DBuffer);
        }

        constructor(color: number) {

            super();
            this.color = color;
            this.init();
        }

        init() {

            this.context3DBuffer.mapUniformBuffer("",this.color);
        }

    }
}