import React from "react";
import {DEFAULT, WithDefault} from "../../../util/typescript/default";
import {FlexItemProps} from "../../../util/react/component/flex/FlexItem";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {mapMap} from "../../../util/map";
import FlexContainer from "../../../util/react/component/flex/FlexContainer";
import AddFilesButton, {OnSubmitFunction, SubMenus} from "../AddFilesButton";
import {undefinedAsAbsent} from "../../../util/typescript/types/Possible";
import {DatasetItem as DatasetItemComponent} from "./DatasetItem";
import {augmentClassName} from "../../../util/react/augmentClass";
import {DomainSortOrderFunction} from "../types";
import {DomainAnnotationType, DomainDataType, DomainName} from "../../domains";
import {
    DatasetDispatch,
    MutableDatasetDispatch, MutableDatasetDispatchItem
} from "../../hooks/useDataset/DatasetDispatch";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {DatasetDispatchItemAnnotationType, DatasetDispatchItemDataType} from "../../hooks/useDataset/types";
import UNREACHABLE from "../../../util/typescript/UNREACHABLE";
import {AnnotationComponent, DataComponent, ExpandedComponent} from "./types";
import useDerivedReducer from "../../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../../util/react/hooks/SimpleStateReducer";
import {DatasetItem} from "../../types/DatasetItem";

/**
 * Props to the {@link DefaultDatasetOverview} component.
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
export type DefaultDatasetOverviewProps<
    Domain extends DomainName,
    Item extends MutableDatasetDispatchItem<DomainDataType<Domain>, DomainAnnotationType<Domain>>
> = {
    dataset: MutableDatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>, Item> | undefined
    comparisonDataset?: DatasetDispatch<DomainDataType<Domain>, DomainAnnotationType<Domain>>
    DataComponent: DataComponent<DatasetDispatchItemDataType<DomainDataType<Domain>>>
    AnnotationComponent: AnnotationComponent<DatasetDispatchItemAnnotationType<DomainAnnotationType<Domain>>>
    ExpandedComponent?: ExpandedComponent<Domain, Item>
    sortFunction?: WithDefault<DomainSortOrderFunction<Domain>>
    addFilesSubMenus: SubMenus<DomainDataType<Domain>, DomainAnnotationType<Domain>>
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

export default function DefaultDatasetOverview<
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
        addFilesSubMenus,
        className
    }: DefaultDatasetOverviewProps<Domain, Item>
) {
    // Extract the dataset items, if any
    const items = dataset !== undefined
        ? [...dataset.values()]
        : []

    // Sort them according to the given sort function
    if (sortFunction !== DEFAULT) items.sort(sortFunction)

    const [expanded, setExpanded] = useDerivedReducer(
        createSimpleStateReducer<string | undefined>(),
        (items, current) => items.find(item => item.filename === current)?.filename,
        items
    )

    const onItemClicked = useDerivedState(
        ([setExpanded]) => {
            return (item: DatasetItem<unknown, unknown>) => {
                setExpanded(item.filename)
            }
        },
        [setExpanded] as const
    )

    const collapse = useDerivedState(
        ([setExpanded]) => {
            return () => setExpanded(undefined)
        },
        [setExpanded] as const
    )

    // Create the submission function for adding new files to the dataset
    const onSubmit: OnSubmitFunction<DomainDataType<Domain>, DomainAnnotationType<Domain>> = useDerivedState(
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

    if (expanded !== undefined) {
        return <ExpandedComponent
            item={items.find(item => item.filename === expanded)!}
            comparisonAnnotation={undefinedAsAbsent(comparisonDataset?.get(expanded)?.annotations)}
            collapse={collapse}
        />
    }

    // Create a display item for each dataset item
    const renderedItems = items.map(
        item => <DatasetItemComponent<Domain>
            key={item.filename}
            item={item}
            comparisonAnnotation={undefinedAsAbsent(comparisonDataset?.get(item.filename)?.annotations)}
            DataComponent={DataComponent}
            AnnotationComponent={AnnotationComponent}
            onClick={onItemClicked}
        />
    )

    return <FlexContainer
        className={augmentClassName(className, "DatasetOverview")}
        itemProps={GET_ITEM_PROPS}
        style={FLEX_CONTAINER_STYLE}
    >
        <AddFilesButton<DomainDataType<Domain>, DomainAnnotationType<Domain>>
            disabled={dataset === undefined}
            onSubmit={onSubmit}
            subMenus={addFilesSubMenus}
        />
        {renderedItems}
    </FlexContainer>

}