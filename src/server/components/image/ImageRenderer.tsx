import {DataRenderer} from "../DatasetItem";
import {Image} from "../../types/data";
import DataImage from "../../../util/react/component/DataImage";
import React from "react";
import {isArray} from "../../../util/typescript/arrays/isArray";
import {anyToString} from "../../../util/typescript/strings/anyToString";

export const ImageRenderer: DataRenderer<Image> = (
    filename,
    _selected,
    data
) => {
    const cacheEntry = data.success
        ? data.value
        : data.success === undefined && !isArray(data.partialResult)
            ? data.partialResult
            : undefined

    const imageData = cacheEntry !== undefined
        ? cacheEntry.cache.getConverted(cacheEntry.handle)
        : data.success === undefined && isArray(data.partialResult)
            ? data.partialResult[0].convert(data.partialResult[1])
            : undefined

    const error = !data.success
        ? anyToString(data.error)
        : imageData === undefined
            ? "Couldn't find image data"
            : undefined

    return <DataImage
        src={imageData}
        title={error === undefined ? filename : `${filename}: ${error}`}
    />
}
