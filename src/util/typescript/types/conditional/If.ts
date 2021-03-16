export type If<bC, A, B = never> = bC extends never ? B : A
