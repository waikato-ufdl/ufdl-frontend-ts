import "./AddFilesButton.css";
import CenterContent from "../../components/CenterContent";
import useLocalModal, {LocalModalDispatch} from "../../util/react/hooks/useLocalModal";
import {FunctionComponentReturnType} from "../../util/react/types";
import {mapFromArray} from "../../util/map";
import selectFiles, {SelectFilesMethod} from "../../util/files/selectFiles";
import doAsync from "../../util/typescript/async/doAsync";
import {isArray} from "../../util/typescript/arrays/isArray";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../util/typescript/initialisers";
import LocalModal from "../../util/react/component/LocalModal";

export type OnSubmitFunction<A> = (getAnnotation: (file: File) => A) => void

export type AnnotationModalContentGenerator<A> = (
    method: SelectFilesMethod,
    onSubmit: OnSubmitFunction<A>,
    onCancel: () => void
) => Exclude<FunctionComponentReturnType, null> | ((file: File) => A)

export type AddFilesButtonProps<A> = {
    disabled?: boolean
    onSelected: (files: ReadonlyMap<string, [Blob, A]>) => void
    annotationModal: AnnotationModalContentGenerator<A>
}

export default function AddFilesButton<A>(
    props: AddFilesButtonProps<A>
): FunctionComponentReturnType {

    const annotationsModal = useLocalModal();

    const [component, setComponent] = useStateSafe<FunctionComponentReturnType>(constantInitialiser(null));

    const onCancel = useDerivedState(
        () => () => {
            annotationsModal.hide();
            setComponent(null);
        },
        [annotationsModal, setComponent]
    )

    function generateComponent(method: SelectFilesMethod) {
        return props.annotationModal(
            method,
            createOnSubmit(method, props.onSelected, annotationsModal),
            onCancel
        )
    }

    return <CenterContent>
        <div className={"AddFilesButton"}>
            <button
                className={"AddFilesByFileButton"}
                onClick={
                    (event) => {
                        const component = generateComponent("multiple");
                        if (typeof component === "function")
                            createOnSubmit("multiple", props.onSelected, annotationsModal)(component)
                        else {
                            setComponent(component);
                            annotationsModal.onClick(event);
                        }
                    }
                }
                disabled={props.disabled}
            >
                Files
            </button>

            <button
                className={"AddFilesByFolderButton"}
                onClick={
                    (event) => {
                        const component = generateComponent("folder");
                        if (typeof component === "function")
                            createOnSubmit("folder", props.onSelected, annotationsModal)(component)
                        else {
                            setComponent(component);
                            annotationsModal.onClick(event);
                        }
                    }
                }
                disabled={props.disabled}
            >
                Folders
            </button>

            <LocalModal
                className={"AddFilesModal"}
                position={annotationsModal.position}
                onCancel={onCancel}
            >
                {component}
            </LocalModal>
        </div>
    </CenterContent>
}

function createOnSubmit<A>(
    method: SelectFilesMethod,
    onSelected: (files: ReadonlyMap<string, [Blob, A]>) => void,
    annotationsModal: LocalModalDispatch
): (getAnnotation: (file: File) => A) => void {
    return (getAnnotation) => {
        annotationsModal.hide();

        doAsync(
            async () => {
                let files = await selectFiles(method);

                if (files === null) return;

                if (!isArray(files)) files = [files];

                if (files.length === 0) return;

                onSelected(
                    mapFromArray(
                        files,
                        (file) => [file.name, [file, getAnnotation(file)]]
                    )
                );
            }
        )
    }
}