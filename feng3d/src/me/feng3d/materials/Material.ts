module me.feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends Component {

        pass: MaterialPass;

        /**
         * 构建材质
         */
        constructor() {
            super();
            this.pass = new MaterialPass();
        }
    }
}