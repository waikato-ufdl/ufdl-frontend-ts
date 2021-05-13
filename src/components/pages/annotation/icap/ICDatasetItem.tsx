import {FunctionComponentReturnType} from "../../../../util/react/types";
import React from "react";
import {DatasetItem as DatasetItemInfo} from "../../../../server/types/DatasetItem";
import {Classification} from "../../../../server/types/annotations";
import {Image} from "../../../../server/types/data";
import {Possible} from "../../../../util/typescript/types/Possible";
import "./ICDatasetItem.css";
import {ClassColours} from "../../../../server/util/classification";
import {PartialResult} from "../../../../util/typescript/result";
import DatasetItem from "../../../../server/components/DatasetItem";
import {ImageRenderer} from "../../../../server/components/image/ImageRenderer";
import useRenderNotify from "../../../../util/react/hooks/useRenderNotify";
import useDerivedState from "../../../../util/react/hooks/useDerivedState";
import createClassificationRenderer from "../../../../server/components/classification/createClassificationRenderer";

export type ICDatasetItemProps = {
    item: DatasetItemInfo<Image, Classification>
    evalClass: Possible<PartialResult<Classification>>,
    onReclassify: (filename: string, oldClass: Classification, newClass: Classification) => void
    onSelect: (item: DatasetItemInfo<Image, Classification>) => void,
    onClick: (item: DatasetItemInfo<Image, Classification>) => void
    colours: ClassColours
}

export default function ICDatasetItem(
    props: ICDatasetItemProps
): FunctionComponentReturnType {

    useRenderNotify("ICDatasetItem", props);

    const classificationRenderer = useDerivedState(
        () => createClassificationRenderer(props.colours, props.onReclassify),
        [props.colours, props.onReclassify]
    )

    return <DatasetItem<Image, Classification>
        item={props.item}
        evalAnnotation={props.evalClass}
        renderData={ImageRenderer}
        renderAnnotation={classificationRenderer}
        onSelect={props.onSelect}
        onClick={props.onClick}
        className={"ICDatasetItem"}
    />
}
