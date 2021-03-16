export type SemiReadonly<T, K extends keyof T> = Omit<T, K> & Pick<Readonly<T>, K>
