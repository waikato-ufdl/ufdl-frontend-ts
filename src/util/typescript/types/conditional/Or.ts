export type Or<bA, bB> = bA extends never ? bB extends never ? never : true : true
