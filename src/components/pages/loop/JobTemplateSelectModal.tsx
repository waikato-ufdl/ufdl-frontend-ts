import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import EditParametersModal from "./parameters/EditParametersModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";
import {ParameterSpec} from "./parameters/ParameterSpec";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import usePromise from "../../../util/react/hooks/usePromise";
import {
    Controllable,
    UncontrolledResetOverride,
    useControllableState
} from "../../../util/react/hooks/useControllableState";
import {RawJSONObjectSelect} from "../../../server/components/RawJSONObjectSelect";
import {ParameterValues} from "./parameters/ParameterValues";
import {any} from "../../../util/typescript/any";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {ownPropertyIterator} from "../../../util/typescript/object";
import {augmentClassName} from "../../../util/react/augmentClass";

/**
 * Callback which is called when the user has finished specifying the job-template/parameters to use.
 *
 * @param templatePK
 *          The primary key of the selected job-template on the server.
 * @param parameterValues
 *          The parameter values selected for the job by the user.
 */
export type JobTemplateSelectModalOnDoneCallback
    = (templatePK: number, parameterValues: ParameterValues) => void

/**
 * Props to the {@link JobTemplateSelectModal} component.
 *
 * @property onDone
 *          What to do when the user has finished specifying the template/parameters to use.
 *          See {@link JobTemplateSelectModalOnDoneCallback}.
 * @property templates
 *          The [job-templates]{@link JobTemplateInstance} that the user can select from.
 * @property templatePK
 *          A [controllable]{@link Controllable} value for the currently-selected template.
 * @property initialValues
 *          The initial set of parameter values that apply to the template [controlled]{@link Controllable}
 *          by {@link templatePK}.
 * @property position
 *          Where on screen to display the modal dialogue.
 * @property onCancel
 *          What to do if the user gives up  on selecting a template.
 */
export type JobTemplateSelectModalProps = {
    className?: string
    onDone: JobTemplateSelectModalOnDoneCallback
    templates: JobTemplateInstance[]
    templatePK: Controllable<number>
    initialValues: ParameterValues
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Modal dialogue which allows the user to select a job-template to execute,
 * and set the arguments to pass to that job-template's parameters.
 *
 * @param props
 *          The [props]{@link JobTemplateSelectModalProps} to the component.
 */
export default function JobTemplateSelectModal(
    props: JobTemplateSelectModalProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [templatePK, setTemplatePK] = useControllableState(props.templatePK, constantInitialiser(-1))

    // Update the parameter specifications from the server when the selected job-template changes
    const parameterSpecs = usePromise<{ [parameterName: string]: ParameterSpec }>(
        useDerivedState(
            ([templatePK, ufdlServerContext]) => {
                // If a template hasn't been selected, return an empty set of parameters
                if (templatePK === -1)
                    return Promise.resolve({})

                return job_template.get_all_parameters(ufdlServerContext, templatePK)
            },
            [templatePK, ufdlServerContext] as const
        )
    )

    // The initial value prop is only valid if we've selected the same template as the control/reset PK
    const initialValues = useDerivedState(
        ([templatePK, templatePKProp, initialValuesProp]) => {
            // Unwrap the reset override value if the prop was given as one
            const templatePKPropUnwrapped = templatePKProp instanceof UncontrolledResetOverride
                ? templatePKProp.initialiserOverride
                : templatePKProp

            if (templatePKPropUnwrapped !== templatePK) return {}

            return initialValuesProp
        },
        [templatePK, props.templatePK, props.initialValues] as const
    )

    // Create state to hold the user's selections for parameter values
    const [parameterValues, setParameterValues] = useStateSafe(
        constantInitialiser(initialValues)
    )

    // Use a modal sub-dialogue for editing the parameter-values of the template
    const editParametersModal = useLocalModal()

    const resolvedParameterSpecs = parameterSpecs.status === "resolved"
        ? parameterSpecs.value
        : {}

    return <LocalModal
        className={augmentClassName(props.className, "JobTemplateSelectModal")}
        position={props.position}
        onCancel={props.onCancel}
    >
        {/* The list of job-templates to select from */}
        <RawJSONObjectSelect<JobTemplateInstance>
            labelFunction={(json) => `${json['name']} v${json['version']}`}
            selectedPK={templatePK}
            values={props.templates}
            onChange={(_, pk) => {
                if (pk !== undefined) setTemplatePK(pk)
            }}
        />

        {/* A button to confirm the selected job-template */}
        <button
            onClick={event => editParametersModal.show(event.clientX, event.clientY)}
            disabled={templatePK === -1}
        >
            Edit Parameters
        </button>

        {/* A button which allows the user to accept the parameter values without opening the editor */}
        <button
            onClick={() => {props.onDone(templatePK, parameterValues)}}
            disabled={
                // The done button is disabled if any required parameter has not had its value set
                templatePK === -1
                ||
                parameterSpecs.status !== "resolved"
                ||
                any(
                    ([parameterName]) => {
                        return (
                            resolvedParameterSpecs[parameterName as string].default === undefined
                            &&
                            !(parameterName in parameterValues)
                        )
                    },
                    ...ownPropertyIterator(resolvedParameterSpecs)
                )
            }
        >
            Start Job
        </button>

        {/* A modal dialogue to edit the parameters of the job-template */}
        <EditParametersModal
            key={templatePK} // Force internal state of parameter editor to reset on template changes
            onParameterValuesChanged={setParameterValues}
            onDone={(parameterValues) => props.onDone(templatePK, parameterValues)}
            parameterSpecs={resolvedParameterSpecs}
            position={editParametersModal.position}
            parameterValues={parameterValues}
            onCancel={() => editParametersModal.hide()}
        />

    </LocalModal>
}
