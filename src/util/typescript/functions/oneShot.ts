import isDefined from "../isDefined";

export default function oneShot<P extends  readonly unknown[]>(
    func: (...args: P) => void
): (...args: P) => void {
    let closure: ((...args: P) => void) | undefined = func

    return (...args: P) => {
        if (isDefined(closure)) {
            closure(...args)
            closure = undefined
        }
    }
}
