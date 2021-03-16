/**
 * Makes required the properties of T that are in K.
 */
export type SemiRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
