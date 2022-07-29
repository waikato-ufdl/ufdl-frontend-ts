import isDefined from "../isDefined";
import pass from "./pass";

export default function passOnUndefined<P extends readonly unknown[]>(
    func: ((...args: P) => void) | undefined
): (...args: P) => void {
    if (!isDefined(func)) return pass
    return func
}
