/**
 * Makes optional the properties of T that are in K.
 */
export type SemiPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
