//参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

interface Map<K, V>
{
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
}

interface MapConstructor
{
    new(): Map<any, any>;
    new <K, V>(entries?: [K, V][]): Map<K, V>;
    readonly prototype: Map<any, any>;
}
declare var Map: MapConstructor;

interface ReadonlyMap<K, V>
{
    forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    readonly size: number;
}

// 参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
interface WeakMap<K extends Object, V>
{
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
}

interface WeakMapConstructor
{
    new(): WeakMap<Object, any>;
    new <K extends Object, V>(entries?: [K, V][]): WeakMap<K, V>;
    readonly prototype: WeakMap<Object, any>;
}
declare var WeakMap: WeakMapConstructor;


// 参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
interface Set<T>
{
    add(value: T): this;
    clear(): void;
    delete(value: T): boolean;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}

interface SetConstructor
{
    new(): Set<any>;
    new <T>(values?: T[]): Set<T>;
    readonly prototype: Set<any>;
}
declare var Set: SetConstructor;

interface ReadonlySet<T>
{
    forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}

// 参考  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet
interface WeakSet<T>
{
    add(value: T): this;
    delete(value: T): boolean;
    has(value: T): boolean;
}

interface WeakSetConstructor
{
    new(): WeakSet<Object>;
    new <T extends Object>(values?: T[]): WeakSet<T>;
    readonly prototype: WeakSet<Object>;
}
declare var WeakSet: WeakSetConstructor;

// 补充 Map
interface Map<K, V>
{
    getKeys(): K[];
    getValues(): V[];
}

Map.prototype.getKeys = function ()
{
    var keys: any[] = [];
    this.forEach((v, k) =>
    {
        keys.push(k);
    });
    return keys;
}

Map.prototype.getValues = function ()
{
    var values: any[] = [];
    this.forEach((v, k) =>
    {
        values.push(v);
    });
    return values;
}