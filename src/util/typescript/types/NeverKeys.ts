/** Gets the declared key of a type T that map to the never type. */
export type NeverKeys<T extends {}> = Exclude<
    { [K in keyof T]: Required<T>[K] extends never ? K : false }[keyof T],
    false
>
