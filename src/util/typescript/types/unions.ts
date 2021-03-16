export type Union<A, B> = A | B

export type Intersection<A, B> = A & B

export type Difference<A, B> = Exclude<Union<A, B>, Intersection<A, B>>
