import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import React, {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../server/UFDLServerContextProvider";
import {Controllable, useControllableState} from "../../util/react/hooks/useControllableState";
import {constantInitialiser} from "../../util/typescript/initialisers";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import {exactFilter} from "../../server/util/exactFilter";
import Page from "./Page";
import {BackButton} from "../BackButton";
import {Form} from "../Form";
import {DomainSelect} from "../DomainSelect";
import {TeamSelect} from "../TeamSelect";
import {ProjectSelect} from "../ProjectSelect";
import {LicenceSelect} from "../LicenceSelect";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {RawJSONObject} from "ufdl-ts-client/types";
import {CreateFunction} from "../../server/util/types";
import asChangeEventHandler from "../../util/react/asChangeEventHandler";
import {DatasetPK, ProjectPK, TeamPK} from "../../server/pk";
import {
    DEFAULT_HANDLED_ERROR_RESPONSE,
    WithErrorResponseHandler,
    withErrorResponseHandler
} from "../../server/util/responseError";

const AVAILABLE_DOMAINS = ["ic", "od"] as const;

export type Domain = (typeof AVAILABLE_DOMAINS)[number];

const createFunctions: {[key in Domain]: WithErrorResponseHandler<Parameters<CreateFunction>, ReturnType<CreateFunction>>} = {
    "ic": withErrorResponseHandler(ICDataset.create),
    "od": withErrorResponseHandler(ODDataset.create)
} as const;

export type NewDatasetPageProps = {
    domain: Controllable<Domain>
    lockDomain?: boolean
    from: Controllable<TeamPK | ProjectPK | undefined>
    lockFrom?: "team" | "project"
    licencePK: Controllable<number>
    lockLicence?: boolean
    isPublic: Controllable<boolean>
    lockIsPublic?: boolean
    onCreate?: (pk: DatasetPK) => void
    onBack?: () => void
}

export default function NewDatasetPage(props: NewDatasetPageProps) {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [domain, setDomain, domainLocked] = useControllableState<Domain | undefined>(props.domain, constantInitialiser(undefined));
    const [from, setFrom, fromLocked] = useControllableState<ProjectPK | TeamPK | undefined>(props.from, constantInitialiser(undefined));
    const [licencePK, setLicencePK, licencePKLocked] = useControllableState<number | undefined>(props.licencePK, constantInitialiser(undefined));
    const [isPublic, setIsPublic, isPublicLocked] = useControllableState<boolean>(props.isPublic, constantInitialiser(false));

    const [name, setName] = useStateSafe<string>(constantInitialiser(""));
    const [description, setDescription] = useStateSafe<string>(constantInitialiser(""));

    const teamPK = from instanceof ProjectPK ? from.team : from;
    const projectPK = from instanceof ProjectPK ? from : undefined;

    const projectTeamFilter = useDerivedState(
        () => teamPK !== undefined ? exactFilter("team", teamPK.asNumber) : undefined,
        [from]
    );

    const clearForm = useDerivedState(
        ([setName, setDescription, setIsPublic]) => () => {
            setName("");
            setDescription("");
            setIsPublic(false);
        },
        [setName, setDescription, setIsPublic] as const
    );

    const onSubmit = () => submitNewDataset(
        ufdlServerContext,
        from,
        name,
        description,
        isPublic,
        licencePK,
        domain,
        (dataset) => {
            if (props.onCreate !== undefined) {
                props.onCreate((from as ProjectPK).dataset(dataset['pk'] as number));
            }
            clearForm();
        }
    );

    return <Page className={"NewDatasetPage"}>
        {props.onBack && <BackButton onBack={props.onBack} />}
        <Form onSubmit={onSubmit}>
            <label>
                Domain:
                <DomainSelect
                    onChange={setDomain}
                    values={AVAILABLE_DOMAINS}
                    value={domain}
                    disabled={domainLocked}
                />
            </label>
            <label>
                Team:
                <TeamSelect
                    onChange={(_, pk) => setFrom(pk === undefined ? undefined : new TeamPK(pk))}
                    value={teamPK === undefined ? -1 : teamPK.asNumber}
                    disabled={props.lockFrom !== undefined}
                />
            </label>
            <label>
                Project:
                <ProjectSelect
                    onChange={(_, pk) => setFrom(pk === undefined ? undefined : teamPK?.project(pk))}
                    filter={projectTeamFilter}
                    forceEmpty={teamPK === undefined}
                    value={projectPK === undefined ? -1 : projectPK.asNumber}
                    disabled={props.lockFrom === "project"}
                />
            </label>
            <label>
                Name:
                <input
                    value={name}
                    onChange={asChangeEventHandler(setName)}
                />
            </label>
            <label>
                Licence:
                <LicenceSelect
                    value={licencePK === undefined ? -1 : licencePK}
                    disabled={licencePKLocked}
                    onChange={(_, pk) => setLicencePK(pk)}
                />
            </label>
            <label>
                Description:
                <input
                    value={description}
                    onChange={asChangeEventHandler(setDescription)}
                />
            </label>
            <label>
                Public?:
                <input
                    checked={isPublic}
                    type={"checkbox"}
                    onClick={() => setIsPublic(!isPublic)}
                    disabled={isPublicLocked}
                />
            </label>
            <input type={"submit"} value={"Submit"} disabled={!canSubmit(projectPK, name, licencePK, domain)}/>
        </Form>
    </Page>
}

function canSubmit(
    projectPK: ProjectPK | TeamPK | undefined,
    name: string,
    licencePK: number | undefined,
    domain: Domain | undefined
): boolean {
    return projectPK instanceof ProjectPK &&
        name !== "" &&
        licencePK !== undefined &&
        domain !== undefined
}

async function submitNewDataset(
    context: UFDLServerContext,
    projectPK: ProjectPK | TeamPK | undefined,
    name: string,
    description: string,
    isPublic: boolean,
    licencePK: number | undefined,
    domain: Domain | undefined,
    onSuccess: (dataset: RawJSONObject) => void
): Promise<void> {
    if (!canSubmit(projectPK, name, licencePK, domain)) return;

    const response = await createFunctions[domain as Domain](
        context,
        name,
        (projectPK as ProjectPK).asNumber,
        licencePK as number,
        description,
        isPublic
    );

    if (response !== DEFAULT_HANDLED_ERROR_RESPONSE) onSuccess(response);
}