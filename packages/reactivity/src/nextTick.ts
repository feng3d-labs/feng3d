export function nextTick<T = void, R = void>(
    this: T,
    fn?: (this: T) => R,
): Promise<Awaited<R>>
{
    const p = currentFlushPromise || resolvedPromise;

    return fn ? p.then(this ? fn.bind(this) : fn) : p;
}

const resolvedPromise = /* @__PURE__ */ Promise.resolve() as Promise<any>;
const currentFlushPromise: Promise<void> | null = null;