export default function isFunction<T extends (...args: any) => any>(val: any): val is T {
    return typeof val === "function";
}
