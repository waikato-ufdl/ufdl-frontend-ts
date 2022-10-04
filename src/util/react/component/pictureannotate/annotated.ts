import Shape from "./shapes/Shape";

export type Annotated<S extends Shape> = {
    shape: S,
    annotation?: string | undefined
}
