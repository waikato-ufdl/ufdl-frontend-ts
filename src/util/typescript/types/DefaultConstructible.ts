/**
 * The type of classes that have default constructors.
 */
export type DefaultConstructible<T extends object> = {
    new(): T
}
