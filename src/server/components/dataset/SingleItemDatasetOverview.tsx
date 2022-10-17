import React from "react";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import {undefinedAsAbsent} from "../../../util/typescript/types/Possible";
import {DatasetItem as DatasetItemComponent} from "./DatasetItem";
import {augmentClassName} from "../../../util/react/augmentClass";
import {DomainSortOrderFunction} from "../types";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {
    DatasetDispatch,
    MutableDatasetDispatch,
    MutableDatasetDispatchItem
} from "../../hooks/useDataset/DatasetDispatch";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import {AnnotationComponent, DataComponent, ExpandedComponent} from "./types";
import useDerivedReducer, {UNINITIALISED} from "../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../util/react/hooks/SimpleStateReducer";
import pass from "../../../util/typescript/functions/pass";
import "./SingleItemDatasetOverview.css"

/**
 * Props to the {@link SingleItemDatasetOverview} component.
 *
 * @property dataset
 *          The dataset with which to work. The overview is empty if this is undefined.
 * @property comparisonDataset
 *          An optional dataset against which to compare items in the primary dataset.
 * @property DataComponent
 *          Component which renders the data-type of the domain.
 * @property AnnotationComponent
 *          Component which renders the annotation-type of the domain.
 * @property ExpandedComponent
 *          Component to render the expanded view of an item. Default is just an enlarged
 *          {@link DatasetItem}.
 * @property sortFunction
 *          An optional function to sort the dataset items. By default items are unsorted.
 * @property addFilesSubMenus
 *          The methods for adding new items to the dataset.
 * @property className
 *          An optional CSS-classname.
 */
export type SingleItemDatasetOverviewProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    dataset: MutableDatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>, Item> | undefined
    comparisonDataset?: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    ExpandedComponent?: ExpandedComponent<Domain, Item>
    sortFunction?: WithDefault<DomainSortOrderFunction<Domain>>
    className?: string
}

export default function SingleItemDatasetOverview<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
>(
    {
        dataset,
        comparisonDataset,
        DataComponent,
        AnnotationComponent,
        ExpandedComponent =
            props => <DatasetItemComponent<Domain>
                item={props.item}
                comparisonAnnotation={props.comparisonAnnotation}
                DataComponent={DataComponent}
                AnnotationComponent={AnnotationComponent}
                onClick={props.collapse}
            />,
        sortFunction = DEFAULT,
        className
    }: SingleItemDatasetOverviewProps<Domain, Item>
) {
    // Extract the dataset items, if any
    const items = useDerivedState(
        ([dataset, sortFunction]) => {
            const items = dataset !== undefined
                ? [...dataset.values()]
                : []

            // Sort them according to the given sort function
            if (sortFunction !== DEFAULT) items.sort(sortFunction)

            return items
        },
        [dataset, sortFunction] as const
    )

    const [[expanded], setExpanded] = useDerivedReducer(
        createSimpleStateReducer<[number | undefined, Item[]]>(),
        (items, current) => {
            // Can never select from an empty set
            if (items.length === 0) return [undefined, items]

            // If we had no previous selection, select the first item
            if (current === UNINITIALISED || current[0] === undefined) {
                return [0, items]
            }

            const [lastIndex, lastItems] = current
            const lastFilename = lastItems[lastIndex].filename

            // If an item with the same filename is in the new items, just use it
            const indexOfLastFilename = items.findIndex(item => item.filename === lastFilename)
            if (indexOfLastFilename !== -1) {
                return [indexOfLastFilename, items]
            }

            // We're going to try use either the previous or next item's filename
            // from the previous state, so if neither item exists, just select the first
            // item
            if (lastItems.length === 1) return [0, items]

            // Get the index of the following item, or the previous item if it's the last item
            const nextIndex = lastIndex === items.length - 1
                ? lastIndex - 1
                : lastIndex + 1

            // Get that item's filename
            const nextFilename = lastItems[nextIndex].filename

            // If an item with the same filename is in the new items, use that
            const indexOfNextFilename = items.findIndex(item => item.filename === nextFilename)
            if (indexOfNextFilename !== -1) {
                return [indexOfNextFilename, items]
            }

            // All options for preservation are exhausted, so just select the first item
            return [0, items]
        },
        items
    )

    return <div className={augmentClassName(className, "SingleItemDatasetOverview")}>
        {/* The expanded view of the dataset item. */}
        {
            expanded !== undefined
            &&
            <ExpandedComponent
                item={items[expanded]}
                comparisonAnnotation={undefinedAsAbsent(comparisonDataset?.get(items[expanded].filename)?.annotations)}
                collapse={pass}
                disabled={false}
            />
        }

        {/* Previous button */}
        <button
            className={"Previous"}
            disabled={expanded === undefined || expanded === 0}
            onClick={() => setExpanded([expanded! - 1, items])}
        >
            {"<"}
        </button>

        {/* Next button */}
        <button
            className={"Next"}
            disabled={expanded === undefined || expanded === items.length - 1}
            onClick={() => setExpanded([expanded! + 1, items])}
        >
            {">"}
        </button>
    </div>

}