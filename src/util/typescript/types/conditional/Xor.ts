export type Xor<bA, bB> = bA extends never ? bB extends never ? never : true : bB extends never ? true : never
