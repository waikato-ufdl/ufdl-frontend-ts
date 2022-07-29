export type MapArrayElementType<T extends readonly unknown[], R>
    = { [K in keyof T]: K extends number ? R : T[K] }
