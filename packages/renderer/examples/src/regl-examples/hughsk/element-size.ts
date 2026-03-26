// @see https://github.com/hughsk/element-size

export function getSize(element)
{
    // Handle cases where the element is not already
    // attached to the DOM by briefly appending it
    // to document.body, and removing it again later.
    if (element === window || element === document.body)
    {
        return [window.innerWidth, window.innerHeight];
    }

    let temporary = false;
    if (!element.parentNode)
    {
        temporary = true;
        document.body.appendChild(element);
    }

    const bounds = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const height = (bounds.height | 0)
        + parse(styles.getPropertyValue('margin-top'))
        + parse(styles.getPropertyValue('margin-bottom'));
    const width = (bounds.width | 0)
        + parse(styles.getPropertyValue('margin-left'))
        + parse(styles.getPropertyValue('margin-right'));

    if (temporary)
    {
        document.body.removeChild(element);
    }

    return [width, height];
}

function parse(prop)
{
    return parseFloat(prop) || 0;
}
