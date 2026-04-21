import { batchRun } from './batch';
import { Reactivity } from './Reactivity';
import { ARRAY_ITERATE_KEY, ITERATE_KEY, MAP_KEY_ITERATE_KEY, TrackOpTypes, TriggerOpTypes } from './shared/constants';
import { isArray, isIntegerKey, isMap, isSymbol } from './shared/general';

/**
 * 反应式属性。
 *
 * @param target 对象。
 * @param key 属性
 * @returns 反应式属性。
 */
function property<T, K extends keyof T>(target: T, key: K)
{
    let depsMap = PropertyReactivity._targetMap.get(target);

    if (!depsMap)
    {
        depsMap = new Map();
        PropertyReactivity._targetMap.set(target, depsMap);
    }

    //
    let dep = depsMap.get(key);

    if (!dep)
    {
        dep = new PropertyReactivity(target, key);
        depsMap.set(key, dep);
    }

    return dep;
}

/**
 * 属性反应式节点。
 */
export class PropertyReactivity<T, K extends keyof T> extends Reactivity<T>
{
    /**
     * 获取当前节点值。
     *
     * 取值时将会建立与父节点的依赖关系。
     */
    get value(): T
    {
        this.track();

        return this._value;
    }

    set value(v)
    {
        // 处理特殊字段，这些字段
        if (this._key === 'length')
        {
            v = (this._target as any)['length'];
        }
        else if (isSymbol(this._key))
        {
            v = ~~this._value + 1 as any;
        }
        if (v === this._value) return;
        // 触发属性的变化。
        this.trigger();
        this._value = v;
    }

    private _target: T;
    private _key: K;

    constructor(target: T, key: K)
    {
        super();
        this._target = target;
        this._key = key;
        if (target instanceof Map
            || target instanceof WeakMap
        )
        {
            this._value = (target as any as WeakMap<any, any>).get(key);
        }
        else if (target instanceof Set
            || target instanceof WeakSet
        )
        {
            this._value = (target as any as WeakSet<any>).has(key) as any;
        }
        else
        {
            this._value = (target as any)[key as any];
        }
    }

    triggerIfChanged()
    {

    }

    /**
     * 追踪属性的变化。
     *
     * 当属性被访问时，将会追踪属性的变化。
     *
     * @param target 目标对象。
     * @param key  属性名。
     * @returns
     */
    static track(target: object, type: TrackOpTypes, key: unknown): void
    {
        if (!Reactivity.activeReactivity) return;

        const dep = property(target as any, key as any);

        // 取值，建立依赖关系。
        dep.track();
    }

    /**
     * @private
     */
    static _targetMap: WeakMap<any, Map<any, PropertyReactivity<any, any>>> = new WeakMap();

    /**
     * 触发属性的变化。
     *
     * @param target 目标对象。
     * @param type    操作类型。
     * @param key 属性名。
     * @param newValue 新值。
     * @param oldValue 旧值。
     * @returns
     */
    static trigger(target: object, type: TriggerOpTypes, key?: unknown, newValue?: unknown, oldValue?: unknown): void
    {
        const depsMap = this._targetMap.get(target);

        if (!depsMap) return;

        const run = (dep: PropertyReactivity<any, any> | undefined) =>
        {
            if (dep)
            {
                // 触发属性的变化。
                dep.value = newValue;
            }
        };

        batchRun(() =>
        {
            if (type === TriggerOpTypes.CLEAR)
            {
                // collection being cleared
                // trigger all effects for target
                depsMap.forEach(run);
            }
            else
            {
                const targetIsArray = isArray(target);
                const isArrayIndex = targetIsArray && isIntegerKey(key);

                if (targetIsArray && key === 'length')
                {
                    const newLength = Number(newValue);

                    depsMap.forEach((dep, key) =>
                    {
                        if (
                            key === 'length'
                            || key === ARRAY_ITERATE_KEY
                            || (!isSymbol(key) && key >= newLength)
                        )
                        {
                            run(dep);
                        }
                    });
                }
                else
                {
                    // schedule runs for SET | ADD | DELETE
                    if (key !== undefined || depsMap.has(undefined))
                    {
                        run(depsMap.get(key));
                    }

                    // schedule ARRAY_ITERATE for any numeric key change (length is handled above)
                    if (isArrayIndex)
                    {
                        run(depsMap.get(ARRAY_ITERATE_KEY));
                    }

                    // also run for iteration key on ADD | DELETE | Map.SET
                    switch (type)
                    {
                        case TriggerOpTypes.ADD:
                            if (!targetIsArray)
                            {
                                run(depsMap.get(ITERATE_KEY));
                                if (isMap(target))
                                {
                                    run(depsMap.get(MAP_KEY_ITERATE_KEY));
                                }
                            }
                            else if (isArrayIndex)
                            {
                                // new index added to array -> length changes
                                run(depsMap.get('length'));
                            }
                            break;
                        case TriggerOpTypes.DELETE:
                            if (!targetIsArray)
                            {
                                run(depsMap.get(ITERATE_KEY));
                                if (isMap(target))
                                {
                                    run(depsMap.get(MAP_KEY_ITERATE_KEY));
                                }
                            }
                            break;
                        case TriggerOpTypes.SET:
                            if (isMap(target))
                            {
                                run(depsMap.get(ITERATE_KEY));
                            }
                            break;
                    }
                }
            }
        });
    }
}
