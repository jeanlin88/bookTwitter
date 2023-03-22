export function isArrayOfString(arr: any): boolean {
    return (
        Array.isArray(arr)
        && arr.filter(ele => typeof ele === 'string').length === arr.length
    )
};
