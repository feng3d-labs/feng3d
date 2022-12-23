export { };

declare global
{
    interface Array<T>
    {
        /**
         * Determines whether an array includes a certain element, returning true or false as appropriate.
         * @param searchElement The element to search for.
         * @param fromIndex The position in this array at which to begin searching for searchElement.
         */
        includes(searchElement: T, fromIndex?: number): boolean;
    }
}

if (!Array.prototype.includes)
{
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'includes', {
        configurable: true,
        enumerable: false,
        value(searchElement: any, fromIndex: number)
        {
            for (let i = fromIndex, n = this.length; i < n; i++)
            {
                if (searchElement === this[i]) return true;
            }

            return false;
        },
        writable: true,
    });
}
