## 目标
全部 21+ 个 XxxLogic 从 interface+工厂+普通对象 转为 class。已有的 ComponentLogic 和 EntityLogic 保持不变。

## 继承层次与转换计划

### 第一批：继承链核心（Level 0-1）
按依赖顺序，父类先转：

1. **BehaviourLogic** (extends ComponentLogic) — src/component/Behaviour.ts
2. **ContainerLogic** (独立基类) — src/core/Container.ts
3. **RenderableLogic** (extends BehaviourLogic) — src/core/Renderable.ts
4. **LightLogic** (extends BehaviourLogic) — src/light/Light.ts

### 第二批：叶子类（Level 0 直属 ComponentLogic）
5. **CameraLogic** (extends ComponentLogic) — src/cameras/Camera.ts
6. **SceneLogic** (extends ComponentLogic) — src/scene/Scene.ts
7. **GraphicsLogic** (extends ComponentLogic) — src/component/Graphics.ts
8. **BillboardComponentLogic** (extends ComponentLogic) — src/component/BillboardComponent.ts
9. **HoldSizeComponentLogic** (extends ComponentLogic) — src/component/HoldSizeComponent.ts
10. **TransformLayoutLogic** (extends ComponentLogic) — src/core/TransformLayout.ts
11. **SkeletonComponentLogic** (extends ComponentLogic) — src/animators/skeleton/SkeletonComponent.ts

### 第三批：BehaviourLogic 子类（Level 1）
12. **ScriptComponentLogic** (extends BehaviourLogic) — src/core/ScriptComponent.ts
13. **FPSControllerLogic** (extends BehaviourLogic) — src/controllers/FPSController.ts
14. **AudioListenerLogic** (extends BehaviourLogic) — src/audio/AudioListener.ts
15. **AudioSourceLogic** (extends BehaviourLogic) — src/audio/AudioSource.ts

### 第四批：LightLogic 子类（Level 2）
16. **DirectionalLightLogic** (extends LightLogic) — src/light/DirectionalLight.ts
17. **PointLightLogic** (extends LightLogic) — src/light/PointLight.ts
18. **SpotLightLogic** (extends LightLogic) — src/light/SpotLight.ts

### 第五批：RenderableLogic 子类（Level 2）+ 组合类
19. **SkinnedMeshRenderer** (extends RenderableLogic) — 新建 class
20. **Water** (extends RenderableLogic) — 新建 class
21. **Animation** (extends BehaviourLogic) — 新建 class
22. **SkyBox** (extends ComponentLogic) — 新建 class

### 第六批：复杂多继承
23. **Object3DLogic** (extends ContainerLogic, EntityLogic) — src/core/Object3D.ts
    - JS 单继承限制：Object3DLogic extends ContainerLogic，EntityLogic 方法通过组合（持有 EntityLogic 实例，委托 getComponent/getComponents + 调 createEntityLogic 的 effect）

### 第七批：独立 Logic
24. **GeometryLogic** (独立基类) — src/geometry/Geometry.ts
    - createBaseGeometryLogic → class GeometryLogic，子工厂改为子类构造
25. **MaterialLogic** (独立基类) — src/materials/Material.ts
    - createBaseMaterialLogic → class MaterialLogic，子工厂改为子类构造

## 转换模式
每个 Logic：
- `export interface XxxLogic` → `export class XxxLogic extends ParentLogic`
- `function createXxxLogic(data)` 的闭包变量 → class fields
- computed 作为 protected class fields（lazy，顺序无关）
- effect 在 constructor body 注册（不用 field initializer）
- 工厂注册 `registerLogic('Xxx', (data) => new XxxLogic(data))`
- 保留 `xxxLogic()` accessor 函数（WeakMap 缓存 + toRaw）

## 多继承策略（Object3DLogic）
`Object3DLogic extends ContainerLogic`，在 constructor 里 `new EntityLogic(object3D)` 并委托其方法：
```ts
class Object3DLogic extends ContainerLogic {
    private _entity: EntityLogic;
    constructor(object3D) {
        super(object3D);
        this._entity = new EntityLogic(object3D);
    }
    getComponent<T>(t) { return this._entity.getComponent(t); }
    getComponents<T>(t, r) { return this._entity.getComponents(t, r); }
}
```

## 验证
1. tsc 全绿（root src / webgpu / particlesystem / examples）
2. 浏览器验证 Container3DTest / FPSControllerTest / BillboardTest

## 执行方式
用 node 脚本辅助 + 手动调整。逐批转换，每批 typecheck 验证。
由于工作量大，本次提交可能只完成前 4 批（继承链核心 + 叶子类），剩余批次后续。