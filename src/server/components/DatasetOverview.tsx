import React from "react";
import {DEFAULT, WithDefault} from "../../util/typescript/default";
import {FlexItemProps} from "../../util/react/component/flex/FlexItem";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {mapMap, mapToArray} from "../../util/map";
import FlexContainer from "../../util/react/component/flex/FlexContainer";
import AddFilesButton, {OnSubmitFunction, SubMenus} from "./AddFilesButton";
import {undefinedAsAbsent} from "../../util/typescript/types/Possible";
import DatasetItem, {AnnotationComponent, DataComponent} from "./DatasetItem";
import {augmentClassName} from "../../util/react/augmentClass";
import {DomainSortOrderFunction} from "./types";
import {DomainAnnotationType, DomainDataType, DomainName} from "../domains";
import {
    DatasetDispatch,
    DatasetDispatchItem,
    MutableDatasetDispatch
} from "../hooks/useDataset/DatasetDispatch";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../hooks/useDataset/types";
import UNREACHABLE from "../../util/typescript/UNREACHABLE";

/**
 * Props to the {@link DatasetOverview} component.
 *
 * @property dataset
 *          The dataset with which to work. The overview is empty if this is undefined.
 * @property comparisonDataset
 *          An optional dataset against which to compare items in the primary dataset.
 * @property DataComponent
 *          Component which renders the data-type of the domain.
 * @property AnnotationComponent
 *          Component which renders the annotation-type of the domain.
 * @property onItemClicked
 *          Callback which is fired whenever an item is clicked.
 * @property sortFunction
 *          An optional function to sort the dataset items. By default items are unsorted.
 * @property addFilesSubMenus
 *          The methods for adding new items to the dataset.
 * @property className
 *          An optional CSS-classname.
 */
export type DatasetOverviewProps<D extends DomainName> = {
    dataset: MutableDatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    comparisonDataset: DatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<D>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onItemClicked: (item: DatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    sortFunction?: WithDefault<DomainSortOrderFunction<D>>
    addFilesSubMenus: SubMenus<DomainDataType<D>, DomainAnnotationType<D>>
    className?: string
}

// TODO: Move to CSS
const ITEM_STYLE: FlexItemProps["style"] = {
    margin: "1.25%",
    border: 0,
    padding: 0,
    height: "16.3125%",
    overflow: "hidden",
    flexGrow: 0,
    width: "22.5%"
};

// TODO: Move to CSS
const ITEM_PROPS = {style: ITEM_STYLE};

// TODO: Move to CSS
const GET_ITEM_PROPS = constantInitialiser(ITEM_PROPS);

// TODO: Move to CSS
const FLEX_CONTAINER_STYLE = {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "initial",
    alignContent: "flex-start"
} as const

const DatasetItemMemo = React.memo(DatasetItem) as typeof DatasetItem

export default function DatasetOverview<D extends DomainName>(
    {
        dataset,
        comparisonDataset,
        DataComponent,
        AnnotationComponent,
        onItemClicked,
        sortFunction = DEFAULT,
        addFilesSubMenus,
        className
    }: DatasetOverviewProps<D>
) {
    // Extract the dataset items, if any
    const items = dataset !== undefined
        ? mapToArray(
            dataset,
            (_filename, item) => item
        )
        : []

    // Sort them according to the given sort function
    if (sortFunction !== DEFAULT) items.sort(sortFunction)

    // Create a display item for each dataset item
    const renderedItems = items.map(
        item => <DatasetItemMemo<D>
            key={item.filename}
            item={item}
            comparisonAnnotation={undefinedAsAbsent(comparisonDataset?.get(item.filename)?.annotations)}
            DataComponent={DataComponent}
            AnnotationComponent={AnnotationComponent}
            onClick={onItemClicked}
        />
    )

    // Create the submission function for adding new files to the dataset
    const onSubmit: OnSubmitFunction<DomainDataType<D>, DomainAnnotationType<D>> = useDerivedState(
        ([dataset]) =>
            (newFiles) => {
                if (dataset === undefined) {
                    UNREACHABLE("dataset is always defined before this is called")
                }

                dataset.addFiles(
                    mapMap(
                        newFiles,
                        (key, value) => [[key, value[0]]] as const
                    )
                ).then(
                    () => {
                        newFiles.forEach(
                            ([, annotations], filename) => {
                                dataset.setAnnotationsForFile(filename, annotations)
                            }
                        )
                    }
                )
            },
        [dataset] as const
    )

    return <FlexContainer
        className={augmentClassName(className, "DatasetOverview")}
        itemProps={GET_ITEM_PROPS}
        style={FLEX_CONTAINER_STYLE}
    >
        <AddFilesButton<DomainDataType<D>, DomainAnnotationType<D>>
            disabled={dataset === undefined}
            onSubmit={onSubmit}
            subMenus={addFilesSubMenus}
        />
        {renderedItems}
    </FlexContainer>

}