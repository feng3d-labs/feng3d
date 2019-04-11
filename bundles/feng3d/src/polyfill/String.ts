interface String
{
    /**
     * Returns true if the sequence of elements of searchString converted to a String is the
     * same as the corresponding elements of this object (converted to a String) starting at
     * position. Otherwise returns false.
     */
    startsWith(searchString: string, position?: number): boolean;

    /**
     * Returns true if searchString appears as a substring of the result of converting this
     * object to a String, at one or more positions that are
     * greater than or equal to position; otherwise, returns false.
     * @param searchString search string
     * @param position If position is undefined, 0 is assumed, so as to search all of the String.
     */
    includes(searchString: string, position?: number): boolean;

    /**
     * Returns true if the sequence of elements of searchString converted to a String is the
     * same as the corresponding elements of this object (converted to a String) starting at
     * endPosition – length(this). Otherwise returns false.
     */
    endsWith(searchString: string, endPosition?: number): boolean;
}

if (!String.prototype.startsWith)
{
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (search: string, pos?: number)
        {
            return this.substring(!pos || pos < 0 ? 0 : +pos, pos + search.length) === search;
        }
    });
}

if (!String.prototype.includes)
{
    Object.defineProperty(String.prototype, 'includes', {
        value: function (search: string, start?: number)
        {
            if (typeof start !== 'number')
            {
                start = 0
            }

            if (start + search.length > this.length)
            {
                return false
            } else
            {
                return this.indexOf(search, start) !== -1
            }
        }
    })
}

if (!String.prototype.endsWith)
{
    String.prototype.endsWith = function (search: string, this_len?: number)
    {
        if (this_len === undefined || this_len > this.length)
        {
            this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
    };
}