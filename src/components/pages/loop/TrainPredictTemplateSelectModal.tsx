import {FunctionComponentReturnType} from "../../../util/react/types";
import JobTemplateSelectModal, {JobTemplateSelectModalOnDoneCallback} from "./JobTemplateSelectModal";
import getPredictTemplatesMatchingTrainTemplate from "./jobs/getPredictTemplatesMatchingTrainTemplate";
import * as job_template from "ufdl-ts-client/functional/core/jobs/job_template";
import useStateSafe from "../../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../../util/typescript/initialisers";
import {JobTemplateInstance} from "ufdl-ts-client/types/core/jobs/job_template";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import withIgnoredCallbackErrors from "../../../util/typescript/functions/withIgnoredCallbackErrors";
import {
    Controllable,
    UNCONTROLLED_RESET,
    UncontrolledResetOverride,
    useControllableState
} from "../../../util/react/hooks/useControllableState";
import {ParameterValues} from "./parameters/ParameterValues";
import passOnUndefined from "../../../util/typescript/functions/passOnUndefined";
import useDerivedState from "../../../util/react/hooks/useDerivedState";

const FRAMEWORK_REGEXP = /^Framework<'(.*)', '(.*)'>$/

export type TrainPredictTemplateSelectModalProps = {
    ufdlServerContext: UFDLServerContext
    selectableTrainTemplates?: readonly JobTemplateInstance[]
    trainTemplatePK: Controllable<number>
    onTrainTemplateChanged?: (templatePK: number) => void
    initialTrainParameterValues?: ParameterValues
    onPredictTemplatesDetermined?: (templates: readonly JobTemplateInstance[], modelOutputType: string) => [number, ParameterValues] | undefined
    onFrameworkDetermined?: (frameworkName: string, frameworkVersion: string) => void
    onDone?: (
        trainTemplatePK: number,
        trainParameterValues: ParameterValues,
        predictTemplatePK: number,
        predictParameterValues: ParameterValues,
        framework: [string, string],
        modelOutputType: string
    ) => void
    onError?: (error: unknown) => void
    position: [number, number] | undefined
    onCancel?: () => void
}

export default function TrainPredictTemplateSelectModal(
    props: TrainPredictTemplateSelectModalProps
): FunctionComponentReturnType {

    const [selectablePredictTemplates, setSelectablePredictTemplates] = useStateSafe<JobTemplateInstance[] | undefined>(constantInitialiser(undefined))

    const [trainTemplatePK, setTrainTemplatePK] = useControllableState<number | undefined>(
        props.trainTemplatePK,
        constantInitialiser(undefined)
    )
    const [trainParameters, setTrainParameters] = useStateSafe<ParameterValues | undefined>(constantInitialiser(props.initialTrainParameterValues))

    const changeTrainTemplatePK = useDerivedState(
        ([setTrainTemplatePK, onTrainTemplateChanged]) =>
            (templatePK: number) => {
                setTrainTemplatePK(templatePK)
                withIgnoredCallbackErrors(passOnUndefined(onTrainTemplateChanged))(templatePK)
            },
        [setTrainTemplatePK, props.onTrainTemplateChanged] as const
    )

    const [framework, setFramework] = useStateSafe<[string, string] | undefined>(constantInitialiser(undefined))
    const [modelType, setModelType] = useStateSafe<string | undefined>(constantInitialiser(undefined))

    const [predictTemplate, setPredictTemplate] = useStateSafe<[number, ParameterValues] | undefined>(constantInitialiser(undefined))

    const predictTemplatePKControl = useDerivedState(
        ([predictTemplatePK]) => predictTemplatePK === undefined
            ? UNCONTROLLED_RESET
            : new UncontrolledResetOverride(predictTemplatePK),
        [predictTemplate?.[0]] as const
    )

    const trainMode = framework === undefined // false is predict-mode

    const onDone: JobTemplateSelectModalOnDoneCallback = trainMode
        ? async (templatePK, parameterValues) => {
            if (props.position === undefined) return;
            setTrainTemplatePK(templatePK);
            setTrainParameters(parameterValues);
            try {
                const [matchingTemplates, modelOutputType]
                    = await getPredictTemplatesMatchingTrainTemplate(props.ufdlServerContext, templatePK)

                setModelType(modelOutputType);
                setSelectablePredictTemplates(matchingTemplates);
                setPredictTemplate(
                    withIgnoredCallbackErrors(props.onPredictTemplatesDetermined ?? constantInitialiser(undefined))(
                        matchingTemplates,
                        modelOutputType
                    )
                )
            } catch (e) {
                withIgnoredCallbackErrors(passOnUndefined(props.onError))(e)
            }

            try {
                const trainTemplateTypes = await job_template.get_types(props.ufdlServerContext, templatePK)

                const frameworkType = trainTemplateTypes["FrameworkType"]
                if (frameworkType === undefined) return;
                const framework = frameworkType.match(FRAMEWORK_REGEXP);
                if (framework === null) return;
                setFramework([framework[1], framework[2]])
                withIgnoredCallbackErrors(passOnUndefined(props.onFrameworkDetermined))(framework[1], framework[2])
            } catch (e) {
                withIgnoredCallbackErrors(passOnUndefined(props.onError))(e)
            }
        }
        : (templatePK, parameterValues) => {
            withIgnoredCallbackErrors(passOnUndefined(props.onDone))(
                trainTemplatePK!,
                trainParameters!,
                templatePK,
                parameterValues,
                framework!,
                modelType!
            )
        }

    const templates = trainMode
        ? props.selectableTrainTemplates === undefined ? [] : props.selectableTrainTemplates
        : selectablePredictTemplates === undefined ? [] : selectablePredictTemplates

    const templatePK = trainMode
        ? trainTemplatePK ?? -1
        : predictTemplatePKControl

    const onTemplatePKChanged = trainMode
        ? changeTrainTemplatePK
        : undefined

    const initialValues = trainMode
        ? props.initialTrainParameterValues ?? {}
        : predictTemplate?.[1] ?? {}

    return <JobTemplateSelectModal
        key={trainMode ? "train" : "predict"}
        className={"TrainPredictTemplateSelectModal"}
        onDone={onDone}
        templates={templates}
        templatePK={templatePK}
        onTemplatePKChanged={onTemplatePKChanged}
        initialValues={initialValues}
        position={props.position}
        onCancel={passOnUndefined(props.onCancel)}
    />
}