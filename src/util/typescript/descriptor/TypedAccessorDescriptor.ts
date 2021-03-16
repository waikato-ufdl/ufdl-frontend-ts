export type TypedAccessorDescriptor<T> = {
    enumerable?: boolean
    configurable?: boolean
    get?: () => T
    set?: (value: T) => void
}
