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

export default function SelectTemplateModal(
    props: SelectTemplateModalProps
): FunctionComponentReturnType {

    const ufdlServerContext = useContext(UFDL_SERVER_REACT_CONTEXT);

    const [template_pk, set_template_pk] = useStateSafe<number>(constantInitialiser(-1))

    const [parameter_specs, set_parameter_specs] = useStateSafe<ParameterSpecs>(() => { return {}; })

    const edit_parameters_modal = useLocalModal()

    return <LocalModal
        position={props.position}
        onCancel={props.onCancel}
    >
        <RawJSONObjectSelect<JobTemplateInstance>
            labelFunction={(json) => `${json['name']} v${json['version']}`}
            value={template_pk}
            values={props.templates}
            onChange={(_, pk) => {
                if (pk !== undefined) set_template_pk(pk)
            }}
        />
        <button
            onClick={(event) => {
                job_template.get_all_parameters(ufdlServerContext, template_pk).then(
                    (parameters) => {
                        set_parameter_specs(parameters);
                        edit_parameters_modal.show(event.clientX, event.clientY)
                    }
                )
            }}
            disabled={template_pk === -1}
        >
            Edit Parameters
        </button>
        <EditParametersModal
            onDone={(parameter_values) => props.onDone(template_pk, parameter_values)}
            parameter_specs={parameter_specs}
            position={edit_parameters_modal.position}
            onCancel={() => edit_parameters_modal.hide()}
        />
    </LocalModal>
}
