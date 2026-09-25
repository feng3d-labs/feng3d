import { windowEventProxy, serialization, Object3D, Renderable, ColorMaterial, SphereGeometry, reactive, logic } from 'feng3d';
import { EditorScript } from './EditorScript';

export class MouseRayTestScript extends EditorScript
{
    init()
    {
        super.init();

        windowEventProxy.on('click', this.onclick, this);
    }

    private onclick()
    {
        const mouseRay3D = this.object3D.scene.mouseRay3D;

        const object3D = serialization.setValue(new Object3D(), { name: 'test' });
        const model = object3D.addComponent(Renderable);
        model.material = new ColorMaterial();
        model.geometry = serialization.setValue(new SphereGeometry(), { radius: 10 });
        object3D.mouseEnabled = false;
        this.object3D.addChild(object3D);

        let position = mouseRay3D.origin.clone();
        let direction = mouseRay3D.direction.clone();
        position = logic(object3D.transform).world2localPoint(position);
        direction = logic(object3D.transform).inverseTransformDirection(direction);
        {
            const rp = reactive(object3D.transform.position);
            rp.x = position.x; rp.y = position.y; rp.z = position.z;
        }

        let num = 1000;
        const translate = () =>
        {
            logic(object3D.transform).translate(direction, 15);
            if (num > 0)
            {
                setTimeout(function ()
                {
                    translate();
                }, 1000 / 60);
            }
            else
            {
                object3D.remove();
            }
            num--;
        };
        translate();
    }

    update()
    {
    }

    /**
     * 销毁
     */
    dispose()
    {
        windowEventProxy.off('click', this.onclick, this);
    }
}
