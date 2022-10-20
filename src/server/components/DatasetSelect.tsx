import {DOMAIN_DATASET_METHODS, DomainName} from "../domains";
import {DatasetPK, ProjectPK} from "../pk";
import {Controllable, mapControllable, UNCONTROLLED_KEEP} from "../../util/react/hooks/useControllableState";
import React, {Dispatch} from "react";
import {DatasetInstance} from "../../../../ufdl-ts-client/dist/types/core/dataset";
import nameFromSignature from "../util/nameFromSignature";
import {exactFilter} from "../util/exactFilter";
import {ListSelect} from "./ListSelect";
import {FunctionComponentReturnType} from "../../util/react/types";
import passOnUndefined from "../../util/typescript/functions/passOnUndefined";
import useDerivedState from "../../util/react/hooks/useDerivedState";

/**
 * The props that the {@link DatasetSelect} component takes.
 *
 * @property domain
 *          The domain to select a dataset from.
 * @property projectPK
 *          An optional project to which to restrict the selection.
 * @property value
 *          Which dataset is selected. {@link Controllable}.
 * @property onChanged
 *          Callback to call when the selected dataset changes.
 * @property disabled
 *          Whether to disable changing the selected dataset.
 */
export type DatasetSelectProps<D extends DomainName> = {
    domain: D
    projectPK?: ProjectPK | undefined
    value?: Controllable<DatasetPK | undefined>
    onChanged?: Dispatch<DatasetPK | undefined>
    disabled?: boolean
}

/**
 * Component which lists datasets available in a given domain.
 */
export function DatasetSelect<D extends DomainName>(
    {
        domain,
        projectPK,
        value = UNCONTROLLED_KEEP,
        onChanged,
        disabled = false
    }: DatasetSelectProps<D>
): FunctionComponentReturnType {

    const filter = useDerivedState(
        ([projectPK]) =>
            projectPK === undefined
                ? undefined
                : exactFilter("project", projectPK.asNumber),
        [projectPK] as const
    )

    return <ListSelect<DatasetInstance>
        list={DOMAIN_DATASET_METHODS[domain].list}
        labelFunction={nameFromSignature}
        onChange={(_, pk) => passOnUndefined(onChanged)(projectPK!.dataset(pk))}
        filter={filter}
        forceEmpty={projectPK === undefined}
        value={mapControllable(value, pk => pk?.asNumber ?? -1)}
        disabled={disabled}
    />
}