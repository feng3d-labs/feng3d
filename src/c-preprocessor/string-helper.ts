/**
 * Return the last character of the string
 *
 * @param str
 * @returns
 */
export function last(str: string)
{
	return str.slice(-1);
}

/**
 * Remove and add some text in the same time
 *
 * @param str
 * @param idx
 * @param rem
 * @param s
 * @returns
 */
export function splice(str: string, idx: number, rem: number, s: string)
{
	return (str.slice(0, idx) + s + str.slice(idx + rem));
}

/**
 * Get the next "..." string
 *
 * @param str
 * @returns
 */
export function getNextString(str: string)
{
	const str1 = str.match(/^"([A-Za-z0-9\-_\. \/\\]+)"/);

	return (!str1 || !str1[1]) ? '' : str1[1];
}

const StringArray = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

/**
 * Test if a character is alpha numeric or _
 *
 * @param str
 * @param i
 * @returns
 */
export function isAlpha(str: string, i: number)
{
	return StringArray.indexOf(str[i]) !== -1;
}
