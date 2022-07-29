import "./AddFilesButton.css";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import {FunctionComponentReturnType} from "../../util/react/types";
import {mapFromArray} from "../../util/map";
import selectFiles, {SelectFilesMethod} from "../../util/files/selectFiles";
import doAsync from "../../util/typescript/async/doAsync";
import {isArray} from "../../util/typescript/arrays/isArray";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import useStateSafe from "../../util/react/hooks/useStateSafe";
import {constantInitialiser} from "../../util/typescript/initialisers";
import LocalModal from "../../util/react/component/LocalModal";
import {ownPropertyIterator} from "../../util/typescript/object";
import iteratorMap from "../../util/typescript/iterate/map";
import {PossiblePromise} from "../../util/typescript/types/promise";
import isPromise from "../../util/typescript/async/isPromise";
import {Data} from "../types/data";
import {OptionalAnnotations} from "../types/annotations";
import withPromiseParameters from "../../util/typescript/async/withPromiseParameters";

export type AddedFiles<D extends Data, A> = ReadonlyMap<string, [D, OptionalAnnotations<A>]>

/**
 * The type of the function provided to sub-menu components to allow them
 * to submit new files to the dataset.
 */
export type OnSubmitFunction<D extends Data, A> = (newFiles: AddedFiles<D, A>) => void

export type FileAnnotationModalRenderer<D extends Data, A> = (
    onSubmit: OnSubmitFunction<D, A>,
    onCancel: () => void
) => PossiblePromise<FunctionComponentReturnType>

export type SubMenus<D extends Data, A> = {
    files: FileAnnotationModalRenderer<D, A>
    folders: FileAnnotationModalRenderer<D, A>
    [key: string]: FileAnnotationModalRenderer<D, A>
}

/**
 * Properties for the add-files button on a dataset page.
 *
 * @property disabled
 *          Whether to disable interaction with the button.
 * @property onSelected
 *          Callback which gets called when files for addition are selected.
 * @property subMenus
 *          A mapping from menu items to modal components for handling the menu item.
 */
export type AddFilesButtonProps<D extends Data, A> = {
    disabled?: boolean
    onSubmit: OnSubmitFunction<D, A>
    subMenus: SubMenus<D, A>
}

export default function AddFilesButton<D extends Data, A>(
    props: AddFilesButtonProps<D, A>
): FunctionComponentReturnType {

    const {
        disabled,
        onSubmit,
        subMenus
    } = props;

    const annotationsModal = useLocalModal();

    const [
        menuItemModalComponent,
        setMenuItemModalComponent
    ] = useStateSafe<FunctionComponentReturnType>(constantInitialiser(null));

    const onCancel = useDerivedState(
        () => () => {
            annotationsModal.hide();
            setMenuItemModalComponent(null);
        },
        [annotationsModal, setMenuItemModalComponent]
    )

    function AddFilesMenu(
        props: SubMenus<D, A>
    ): FunctionComponentReturnType {

        const menuButtons = iteratorMap(
            ownPropertyIterator(props),
            ([menuLabel, renderer]) => <button
                className={"AddFilesMenuButton"}
                onClick={
                    () => {
                        const rendered = renderer(onSubmit, onCancel);
                        if (isPromise(rendered)) {
                            rendered.then((value) => {
                                if (rendered !== null) setMenuItemModalComponent(value)
                            })
                        } else if (rendered !== null) {
                            setMenuItemModalComponent(rendered);
                        }
                    }
                }
            >
                {menuLabel}
            </button>
        )

        return <div>
            {[...menuButtons]}
        </div>
    }

    return <>
        <button
            className={"AddFilesButton"}
            onClick={
                (event) => {
                    setMenuItemModalComponent(<AddFilesMenu {...subMenus} />);
                    annotationsModal.onClick(event);
                }
            }
            disabled={disabled}
        >
            +
        </button>

        <LocalModal
            className={"AddFilesModal"}
            position={annotationsModal.position}
            onCancel={onCancel}
        >
            {menuItemModalComponent}
        </LocalModal>
    </>
}

/**
 * TODO
 *
 * @param method
 * @param getData
 * @param getAnnotation
 */
export function addFilesRenderer<D extends Data, A>(
    method: SelectFilesMethod,
    getData: (file: File) => PossiblePromise<D>,
    getAnnotation: (file: File) => PossiblePromise<OptionalAnnotations<A>>
): FileAnnotationModalRenderer<D, A> {
    return (
        onSubmit
    ) => {
        doAsync(
            async () => {
                // Let the user select some files to add, aborting if none selected
                // Make file iteration uniform by wrapping single files in a length-1 array
                let files = await selectFiles(method)
                if (files === null) return
                if (!isArray(files)) files = [files]
                if (files.length === 0) return
                console.log(`Selected files for submission: ${files.map(file => file.name)}`)

                // Convert the files and submit them
                const submissionMap: Map<string, [D, OptionalAnnotations<A>]> = new Map()
                for (const file of files) {
                    submissionMap.set(file.name, [await getData(file), await getAnnotation(file)])
                }
                onSubmit(submissionMap)
            }
        );

        return null;
    }
}