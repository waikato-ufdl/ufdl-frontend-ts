export type PromiseProperties<A extends {}> = {[key in keyof A]: Promise<A[key]>}
