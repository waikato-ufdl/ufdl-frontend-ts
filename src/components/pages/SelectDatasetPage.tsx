import {DatasetPK, ProjectPK} from "../../server/pk";
import {FunctionComponentReturnType} from "../../util/react/types";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {Optional} from "ufdl-js-client/util";
import {useInterlockedState} from "../../util/react/hooks/useInterlockedState";
import Page from "./Page";
import SelectProjectPage from "./SelectProjectPage";
import NewDatasetPage2 from "./NewDatasetPage2";
import * as ICDataset from "ufdl-js-client/functional/image_classification/dataset";
import {ListSelect} from "../ListSelect";
import React from "react";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../../server/util/exactFilter";
import nameFromSignature from "../../server/util/nameFromSignature";
import {BackButton} from "../BackButton";
import RenderSelectedChildren from "../../util/react/component/RenderSelectedChildren";
import ignoreFirstNArgs from "../../util/typescript/ignoreFirstNArgs";

export type SelectDatasetPageProps = {
    onSelected: (pk: DatasetPK) => void
    onBack?: () => void
    project?: ProjectPK
}

export default function SelectDatasetPage(
    props: SelectDatasetPageProps
): FunctionComponentReturnType {

    const [project, setProject, projectLocked] = useInterlockedState<Optional<ProjectPK>>(
        props.project,
        () => undefined
    );

    const datasetProjectFilter = useDerivedState(
        ([pk]) => pk === undefined ? undefined : exactFilter("project", pk.asNumber),
        [project]
    );

    const [showNewDatasetPage, setShowNewDatasetPage] = useStateSafe(() => false);

    return <RenderSelectedChildren
        selector={project === undefined ? 0 : showNewDatasetPage ? 1 : 2}
    >
        <SelectProjectPage
            onSelected={(pk) => setProject(pk)}
            onBack={props.onBack}
        />
        <NewDatasetPage2
            domain={"ic"}
            lockedPK={project}
            onCreate={(pk) => {props.onSelected(pk); setShowNewDatasetPage(false)} }
            onBack={() => setShowNewDatasetPage(false)}
        />
        <Page>
            <BackButton
                onBack={() => {
                    if (project !== undefined && !projectLocked)
                        setProject(undefined);
                    else if (props.onBack !== undefined)
                        props.onBack()
                }}
                disabled={props.onBack === undefined}
            />
            Dataset:
            <ListSelect
                list={ICDataset.list}
                labelFunction={nameFromSignature}
                onChange={ignoreFirstNArgs(1, (pk?: number) => {
                    if (pk !== undefined && project !== undefined)
                        props.onSelected(project.dataset(pk))
                })}
                filter={datasetProjectFilter}
            />
            <button
                onClick={() => setShowNewDatasetPage(true)}
            >
                New...
            </button>
        </Page>
    </RenderSelectedChildren>


}