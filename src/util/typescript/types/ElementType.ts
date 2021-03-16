/** The type of elements in an array. */
export type ElementType<A extends readonly any[]> = A extends readonly (infer E)[] ? E : never;
