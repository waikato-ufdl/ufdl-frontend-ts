import {DefiniteIndexType} from "./array/DefiniteIndexType";

export type Union<A, B> = A | B

export type Intersection<A, B> = A & B

export type Difference<A, B> = Exclude<Union<A, B>, Intersection<A, B>>

export type MultiUnion<T extends readonly unknown[]> = T[number]

export type MultiIntersection<T extends readonly unknown[]> = Unfoo<Intersect<Values<Foo<T>>>>

// Based on: https://stackoverflow.com/a/59463385
type Foo<T extends readonly unknown[]> = {
    [K in DefiniteIndexType<T>]: {foo: T[K]}
}
type Values<T> = T[keyof T]
type Unfoo<T> = T extends { foo: any } ? T["foo"] : never
type Intersect<T> = (T extends any ? ((x: T) => 0) : never) extends ((x: infer R) => 0) ? R : never
