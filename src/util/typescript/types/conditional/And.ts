export type And<bA, bB> = bA extends never ? never : bB extends never ? never : true
