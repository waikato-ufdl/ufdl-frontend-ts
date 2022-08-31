import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import {JobTemplateInstance} from "../../../../../ufdl-ts-client/lib/types/core/jobs/job_template";
import {RawJSONObjectSelect} from "../../RawJSONObjectSelect";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import EditParametersModal from "./parameters/EditParametersModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";
import {ParameterValue} from "ufdl-ts-client/json/generated/CreateJobSpec";
import {ParameterSpec} from "./parameters/ParameterSpec";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import usePromise from "../../../util/react/hooks/usePromise";

/**
 * @property onDone
 *          What to do when the user has finished specifying the template/parameters to use.
 * @property templates
 *          The job-templates that the user can select from.
 * @property position
 *          Where on screen to display the modal dialogue.
 * @property onCancel
 *          What to do if the user gives up  on selecting a template.
 */
export type SelectTemplateModalProps = {
    onDone: (
        template_pk: number,
        parameter_values: { [parameter_name: string]: ParameterValue }
    ) => void
    templates: JobTemplateInstance[]
    position: [number, number] | undefined
    onCancel: () => void
}

/**
 * Modal dialogue which allows the user to select a template to execute.
 */
export default function SelectTemplateModal(
    props: SelectTemplateModalProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [templatePK, setTemplatePK] = useStateSafe<number>(constantInitialiser(-1))

    // Update the parameter specifications from the server when the selected job-template changes
    const parameterSpecs = usePromise<{ [parameter_name: string]: ParameterSpec }>(
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

    const editParametersModal = useLocalModal()

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        {/* The list of job-templates to select from */}
        <RawJSONObjectSelect<JobTemplateInstance>
            labelFunction={(json) => `${json['name']} v${json['version']}`}
            value={templatePK}
            values={props.templates}
            onChange={(_, pk) => {
                if (pk !== undefined) setTemplatePK(pk)
            }}
        />

        {/* A button to confirm the selected job-template */}
        <button
            onClick={
                async (event) => {
                    editParametersModal.show(event.clientX, event.clientY)
                }
            }
            disabled={templatePK === -1}
        >
            Edit Parameters
        </button>

        {/* A modal dialogue to edit the parameters of the job-template */}
        <EditParametersModal
            onDone={(parameterValues) => props.onDone(templatePK, parameterValues)}
            parameterSpecs={parameterSpecs.status === "resolved" ? parameterSpecs.value : {}}
            position={editParametersModal.position}
            onCancel={() => editParametersModal.hide()}
        />

    </LocalModal>
}
