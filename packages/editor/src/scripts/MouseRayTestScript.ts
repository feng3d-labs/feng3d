import { windowEventProxy, serialization, GameObject, Renderable, Material, SphereGeometry } from 'feng3d';
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
        const mouseRay3D = this.gameObject.scene.mouseRay3D;

        const gameobject = serialization.setValue(new GameObject(), { name: 'test' });
        const model = gameobject.addComponent(Renderable);
        model.material = new Material();
        model.geometry = serialization.setValue(new SphereGeometry(), { radius: 10 });
        gameobject.mouseEnabled = false;
        this.gameObject.addChild(gameobject);

        let position = mouseRay3D.origin.clone();
        let direction = mouseRay3D.direction.clone();
        position = gameobject.transform.worldToLocalPoint(position);
        direction = gameobject.transform.inverseTransformDirection(direction);
        gameobject.transform.position = position;

        let num = 1000;
        const translate = () =>
        {
            gameobject.transform.translate(direction, 15);
            if (num > 0)
            {
                setTimeout(function ()
                {
                    translate();
                }, 1000 / 60);
            }
            else
            {
                gameobject.remove();
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
