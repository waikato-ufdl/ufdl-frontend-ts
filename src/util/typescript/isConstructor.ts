/**
 * Tests if a given function is a constructor function.
 *
 * See https://stackoverflow.com/a/39336206
 *
 * @param func
 *          The function to test for constructibility.
 */
export function isConstructor<P extends any[], R>(
    func: ((...args: P) => R) | (new (...args: P) => R)
): func is new (...args: P) => R {
    try {
        const proxyFunc = new Proxy<any>(
            func,
            {
                construct() { return {}; }
            }
        );
        new proxyFunc();
        return true;
    } catch (err) {
        return false;
    }
}
