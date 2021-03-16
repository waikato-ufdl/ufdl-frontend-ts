/**
 * The type of a class of type T, with constructor arguments A.
 */
export type Class<T extends object, A extends any[] = any[]> = {
    new(...args: A): T
}
