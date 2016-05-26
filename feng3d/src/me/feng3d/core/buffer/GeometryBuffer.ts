module me.feng3d {

    /**
     * 几何体缓冲
     */
    export class GeometryBuffer extends Context3DBufferOwner {

        geometry: Geometry;

        constructor() {
            super();
            this.addEventListener(ComponentEvent.BE_ADDED_COMPONENT, this.onBeAddedComponent, this);
        }

        private onBeAddedComponent(event: ComponentEvent) {

            this.geometry = <Geometry>event.data.container;
            this.init();
        }

        private init() {

            this.geometry.addEventListener(GeometryEvent.CHANGED_INDEX_DATA, this.onChange, this);
        }

        private onChange(event: Event) {

        }
    }
}