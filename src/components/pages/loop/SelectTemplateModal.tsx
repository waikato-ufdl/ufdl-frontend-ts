import {FunctionComponentReturnType} from "../../../util/react/types";
import LocalModal from "../../../util/react/component/LocalModal";
import {JobTemplateInstance} from "../../../../../ufdl-ts-client/lib/types/core/jobs/job_template";
import {RawJSONObjectSelect} from "../../RawJSONObjectSelect";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import EditParametersModal, {ParameterSpecs, ParameterValues} from "./EditParametersModal";
import useLocalModal from "../../../util/react/hooks/useLocalModal";
import {useContext} from "react";
import {UFDL_SERVER_REACT_CONTEXT} from "../../../server/UFDLServerContextProvider";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";

export type SelectTemplateModalProps = {
    onDone: (template_pk: number, parameter_values: ParameterValues) => void
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

    const [parameterSpecs, setParameterSpecs] = useStateSafe<ParameterSpecs>(constantInitialiser({}))

    const editParametersModal = useLocalModal()

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <RawJSONObjectSelect<JobTemplateInstance>
            labelFunction={(json) => `${json['name']} v${json['version']}`}
            value={templatePK}
            values={props.templates}
            onChange={(_, pk) => {
                if (pk !== undefined) setTemplatePK(pk)
            }}
        />
        <button
            onClick={
                async (event) => {
                    const parameters = await job_template.get_all_parameters(ufdlServerContext, templatePK)
                    setParameterSpecs(parameters);
                    editParametersModal.show(event.clientX, event.clientY)
                }
            }
            disabled={templatePK === -1}
        >
            Edit Parameters
        </button>
        <EditParametersModal
            onDone={(parameterValues) => props.onDone(templatePK, parameterValues)}
            parameterSpecs={parameterSpecs}
            position={editParametersModal.position}
            onCancel={() => editParametersModal.hide()}
        />
    </LocalModal>
}
