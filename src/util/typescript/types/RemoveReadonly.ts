export type RemoveReadonly<T extends object>
    = { -readonly [K in keyof T]: T[K] }
