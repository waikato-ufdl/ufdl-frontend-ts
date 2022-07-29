/**
 * Represents a single item in a dataset. Only requires that the
 * data and annotations are gettable. Domains can use custom implementations
 * of this type to ensure invariants between the data and annotations.
 */
export type DatasetItem<D, A> = {
    readonly filename: string

    readonly handle: string

    readonly selected: boolean

    readonly data: D

    readonly annotations: A
}
