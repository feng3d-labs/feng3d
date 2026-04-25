import { functionwrap, View } from 'feng3d';
import { PhysicsWorld } from '../components/PhysicsWorld';

// 默认在 Scene.init 添加物理世界模块
functionwrap.extendFunction(View, 'createNewScene', function (r)
{
    r.gameObject.addComponent(PhysicsWorld);

    return r;
});
