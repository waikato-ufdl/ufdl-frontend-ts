import React from "react";
import {handleSingleDefault, WithDefault} from "../../util/typescript/default";
import {FlexItemProps} from "../../util/react/component/flex/FlexItem";
import {constantInitialiser} from "../../util/typescript/initialisers";
import {mapMap, mapToArray} from "../../util/map";
import FlexContainer from "../../util/react/component/flex/FlexContainer";
import AddFilesButton, {OnSubmitFunction, SubMenus} from "./AddFilesButton";
import {Absent, Possible, undefinedAsAbsent} from "../../util/typescript/types/Possible";
import DatasetItem, {AnnotationRenderer, DataRenderer} from "./DatasetItem";
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

export type DatasetOverviewProps<D extends DomainName> = {
    dataset: MutableDatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    evalDataset: DatasetDispatch<DomainDataType<D>, DomainAnnotationType<D>> | undefined
    renderData: DataRenderer<DatasetDispatchItemDataType<DomainDataType<D>>>
    renderAnnotation: AnnotationRenderer<DatasetDispatchItemAnnotationType<DomainAnnotationType<D>>>
    onItemClicked: (item: DatasetDispatchItem<DomainDataType<D>, DomainAnnotationType<D>>) => void
    sortFunction: WithDefault<Possible<DomainSortOrderFunction<D>>>
    addFilesSubMenus: SubMenus<DomainDataType<D>, DomainAnnotationType<D>>
    className?: string
}

const ITEM_STYLE: FlexItemProps["style"] = {
    margin: "1.25%",
    border: 0,
    padding: 0,
    height: "16.3125%",
    overflow: "hidden",
    flexGrow: 0,
    width: "22.5%"
};

const ITEM_PROPS = {style: ITEM_STYLE};

const GET_ITEM_PROPS = constantInitialiser(ITEM_PROPS);

const FLEX_CONTAINER_STYLE = {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "initial",
    alignContent: "flex-start"
} as const

const DatasetItemMemo = React.memo(DatasetItem) as typeof DatasetItem

export default function DatasetOverview<D extends DomainName>(
    props: DatasetOverviewProps<D>
) {
    // Handle the default values for the props
    const sortFunction = handleSingleDefault(props.sortFunction, constantInitialiser(Absent))

    // Extract the dataset items, if any
    const items
        = props.dataset === undefined
        ? []
        : mapToArray(
            props.dataset,
            (_filename, item) => item
        );

    // Sort them according to the given sort function
    if (sortFunction !== Absent) items.sort(sortFunction)

    // Create a display item for each dataset item
    const renderedItems = items.map(
        item => <DatasetItemMemo<D>
            key={item.filename}
            item={item}
            evalAnnotation={undefinedAsAbsent(props.evalDataset?.get(item.filename)?.annotations)}
            renderData={props.renderData}
            renderAnnotation={props.renderAnnotation}
            onClick={props.onItemClicked}
        />
    )

    // Create the submission function for adding new files to the dataset
    const onSubmit: OnSubmitFunction<DomainDataType<D>, DomainAnnotationType<D>> = useDerivedState(
        ([dataset]) =>
            (newFiles) =>
                dataset?.addFiles(
                    mapMap(
                        newFiles,
                        (key, value) => [[key, value[0]]] as const
                    )
                ),
        [props.dataset] as const
    )

    return <FlexContainer
        className={augmentClassName(props.className, "DatasetOverview")}
        itemProps={GET_ITEM_PROPS}
        style={FLEX_CONTAINER_STYLE}
    >
        {/* TODO: onSubmit currently discards the annotations */}
        <AddFilesButton<DomainDataType<D>, DomainAnnotationType<D>>
            disabled={props.dataset === undefined}
            onSubmit={onSubmit}
            subMenus={props.addFilesSubMenus}
        />
        {renderedItems}
    </FlexContainer>

}