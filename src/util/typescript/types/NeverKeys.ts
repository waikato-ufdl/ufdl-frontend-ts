export type NeverKeys<T> = Exclude<
    { [K in keyof T]: Required<T>[K] extends never ? K : false }[keyof T],
    false
>
