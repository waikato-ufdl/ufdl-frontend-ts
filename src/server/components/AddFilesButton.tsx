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

export type AddedFiles<A> = ReadonlyMap<string, [Blob, A]>

/**
 * The type of the function provided to sub-menu components to allow them
 * to submit new files to the dataset.
 */
export type OnSubmitFunction<A> = (newFiles: AddedFiles<A>) => void

export type FileAnnotationModalRenderer<A> = (
    onSubmit: OnSubmitFunction<A>,
    onCancel: () => void
) => PossiblePromise<FunctionComponentReturnType>

export type SubMenus<A> = {
    files: FileAnnotationModalRenderer<A>
    folders: FileAnnotationModalRenderer<A>
    [key: string]: FileAnnotationModalRenderer<A>
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
export type AddFilesButtonProps<A> = {
    disabled?: boolean
    onSelected: (files: ReadonlyMap<string, [Blob, A]>) => void
    subMenus: SubMenus<A>
}

export default function AddFilesButton<A>(
    props: AddFilesButtonProps<A>
): FunctionComponentReturnType {

    const {
        disabled,
        onSelected,
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
        props: SubMenus<A>
    ): FunctionComponentReturnType {

        const menuButtons = iteratorMap(
            ownPropertyIterator(props),
            ([menuLabel, renderer]) => <button
                className={"AddFilesMenuButton"}
                onClick={
                    () => {
                        const rendered = renderer(onSelected, onCancel);
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



export function addFilesRenderer<A>(
    method: SelectFilesMethod,
    getAnnotation: (file: File) => A
): FileAnnotationModalRenderer<A> {
    return (
        onSubmit
    ) => {
        doAsync(
            async () => {
                let files = await selectFiles(method);

                if (files === null) return;

                if (!isArray(files)) files = [files];

                if (files.length === 0) return;

                onSubmit(
                    mapFromArray(
                        files,
                        (file) => [file.name, [file, getAnnotation(file)]]
                    )
                );
            }
        );

        return null;
    }
}