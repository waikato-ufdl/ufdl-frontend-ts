import {FunctionComponent} from "../../../util/react/types/FunctionComponent";
import {Possible} from "../../../util/typescript/types/Possible";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {MutableDatasetDispatchItem} from "../../hooks/useDataset/DatasetDispatch";
import {DatasetDispatchItemAnnotationType} from "../../hooks/useDataset/types";

/**
 * The type of properties that a {@link DataComponent} should take.
 *
 * @property filename
 *          The filename of the dataset item.
 * @property selected
 *          Whether the item is currently selected.
 * @property data
 *          The file-data of the dataset item.
 */
export type DataComponentProps<D> = {
    filename: string
    selected: boolean
    data: D
    disabled: boolean
    className?: string
}

/**
 * The type of component that renders the raw item data (e.g. images/videos).
 */
export type DataComponent<D> = FunctionComponent<DataComponentProps<D>>

/**
 * The type of properties that a {@link AnnotationComponent} should take.
 *
 * @property filename
 *          The filename of the dataset item.
 * @property selected
 *          Whether the item is currently selected.
 * @property annotation
 *          The annotation of the dataset item.
 * @property comparisonAnnotation
 *          A possible annotation to which to compare the dataset item's annotation.
 */
export type AnnotationComponentProps<A> = {
    filename: string,
    selected: boolean,
    annotation: A,
    comparisonAnnotation: Possible<A>
    disabled: boolean
}

/**
 * The type of component that renders the dataset item's annotations.
 */
export type AnnotationComponent<A> = FunctionComponent<AnnotationComponentProps<A>>

export type ExpandedComponentProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    item: Item,
    comparisonAnnotation?: Possible<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>,
    collapse: () => void
    disabled: boolean
}

export type ExpandedComponent<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = FunctionComponent<ExpandedComponentProps<Domain, Item>>
