module me.feng3d {

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Scene3DNode {

        /**
         * 构造3D场景
         */
        constructor() {
            super(null, null);
        }

        /**
         * 场景名称默认为root
         */
        get name(): string {
            return "root";
        }

        set name(value: string) {
        }
    }
}