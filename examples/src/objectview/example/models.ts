import { oav, ov } from 'feng3d';

/**
 * Vector3 数据类
 */
export class Vector3
{
    x: number;
    y: number;
    z: number;

    constructor(x = 0, y = 0, z = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 * Transform 组件
 */
@ov({ component: 'OVDefault' })
export class Transform
{
    @oav({ component: 'OAVVector3' } as any)
    位移 = new Vector3(0, 2.303, 0);

    @oav({ component: 'OAVVector3' } as any)
    旋转 = new Vector3(0, 0, 0);

    @oav({ component: 'OAVVector3' } as any)
    缩放 = new Vector3(10, 10, 10);
}

/**
 * Water 组件
 */
@ov({ component: 'OVDefault' })
export class Water
{
    @oav({ component: 'OAVEnum', componentParam: { options: ['Plane', 'Cube', 'Sphere', 'Cylinder'] } } as any)
    geometry = 'Plane';

    @oav({ component: 'OAVEnum', componentParam: { options: ['New Material', 'Standard', 'Water Material'] } } as any)
    material = 'New Material';

    @oav({ component: 'OAVBoolean' } as any)
    castShadows = true;

    @oav({ component: 'OAVBoolean' } as any)
    receiveShadows = true;
}

/**
 * GameObject - 类似 Unity Inspector 的完整示例
 */
@ov({ component: 'OVDefault' })
export class GameObject
{
    @oav()
    name = 'water';

    @oav({ component: 'OAVBoolean' } as any)
    enabled = true;

    @oav({ component: 'OAVBoolean' } as any)
    鼠标事件 = true;

    @oav({ component: 'OAVNumber' } as any)
    navigationArea = -1;

    @oav({ block: 'Transform', component: 'OAVVector3' } as any)
    位移 = new Vector3(0, 2.303, 0);

    @oav({ block: 'Transform', component: 'OAVVector3' } as any)
    旋转 = new Vector3(0, 0, 0);

    @oav({ block: 'Transform', component: 'OAVVector3' } as any)
    缩放 = new Vector3(10, 10, 10);

    @oav({ block: 'Water', component: 'OAVEnum', componentParam: { options: ['Plane', 'Cube', 'Sphere', 'Cylinder'] } } as any)
    geometry = 'Plane';

    @oav({ block: 'Water', component: 'OAVEnum', componentParam: { options: ['New Material', 'Standard', 'Water Material'] } } as any)
    material = 'New Material';

    @oav({ block: 'Water', component: 'OAVBoolean' } as any)
    castShadows = true;

    @oav({ block: 'Water', component: 'OAVBoolean' } as any)
    receiveShadows = true;
}

/**
 * GameObject - 类似 Unity Inspector 的完整示例
 */
@ov({ component: 'OVDefault' })
export class GameObject1
{
    @oav()
    name = 'water';

    @oav({ component: 'OAVBoolean' } as any)
    enabled = true;

    @oav({ component: 'OAVBoolean' } as any)
    鼠标事件 = true;

    @oav({ component: 'OAVNumber' } as any)
    navigationArea = -1;

    @oav({ component: 'OAVComponents' } as any)
    components = [
        new Transform(),
        new Water(),
    ];
}
