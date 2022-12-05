import "./AddFilesButton.css";
import useLocalModal from "../../util/react/hooks/useLocalModal";
import {FunctionComponent} from "../../util/react/types/FunctionComponent";
import {FunctionComponentReturnType} from "../../util/react/types/FunctionComponentReturnType";
import selectFiles, {SelectFilesMethod} from "../../util/files/selectFiles";
import doAsync from "../../util/typescript/async/doAsync";
import {isArray} from "../../util/typescript/arrays/isArray";
import useDerivedState from "../../util/react/hooks/useDerivedState";
import LocalModal from "../../util/react/component/LocalModal";
import {mapOwnProperties} from "../../util/typescript/object";
import {PossiblePromise} from "../../util/typescript/types/promise";
import {Data} from "../types/data";
import {OptionalAnnotations} from "../types/annotations/OptionalAnnotations";
import useDerivedReducer, {UNINITIALISED} from "../../util/react/hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../../util/react/hooks/SimpleStateReducer";
import usePromise, {Resolution} from "../../util/react/hooks/usePromise";
import {useEffect} from "react";
import {getTaskCompletionPromise, Task} from "../../util/typescript/task/Task";
import useTask from "../../util/react/hooks/useTask";
import TaskProgressModal from "../../util/react/component/TaskProgressModal";
import pass from "../../util/typescript/functions/pass";

/**
 * The type of structure which carries the files to be added to a dataset.
 */
export type AddedFiles<D extends Data, A> = ReadonlyMap<string, [D, OptionalAnnotations<A>]>

/**
 * The type of the function provided to sub-menu components to allow them
 * to submit new files to the dataset.
 */
export type OnSubmitFunction<D extends Data, A> = (newFiles: AddedFiles<D, A>) => void

/**
 * A render-function which creates a component to select files to
 * add to the dataset. Can also immediately use the provided callbacks
 * and return null (or promise thereof) if no component render is required.
 *
 * @param onSubmit
 *          Callback to add new files to the dataset.
 * @param onCancel
 *          Callback to abort adding files to the dataset.
 * @return
 *          A component allowing the user to select files or null if none required
 *          (or promises thereof).
 */
export type FileAnnotationModalRenderer<D extends Data, A> = (
    onSubmit: OnSubmitFunction<D, A>,
    onCancel: () => void
) => PossiblePromise<FunctionComponent | null>

/**
 * Mapping from a button-label to a {@link FileAnnotationModalRenderer} for the component which
 * adds files to a dataset.
 *
 * @property files
 *          Renderer for adding individual files to the dataset.
 * @property folders
 *          Renderer for adding entire folders to the dataset.
 * @property _
 *          Any other sub-menus to show, keyed by button-label to renderer.
 */
export type SubMenus<D extends Data, A> = {
    files: FileAnnotationModalRenderer<D, A>
    folders: FileAnnotationModalRenderer<D, A>
    [other: string]: FileAnnotationModalRenderer<D, A>
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
    subMenus: SubMenus<D, A>,
    addingFilesTask?: Task<void>
}

/**
 * Component which allows the user to add files to a dataset.
 *
 * @param props
 *          The component's props.
 */
export default function AddFilesButton<D extends Data, A>(
    props: AddFilesButtonProps<D, A>
): FunctionComponentReturnType {

    const {
        disabled,
        onSubmit,
        subMenus,
        addingFilesTask
    } = props;

    // Create a modal for displaying menus
    const menuModal = useLocalModal();

    const addingFilesTaskResult = useTask(addingFilesTask)

    // Keep state of which sub-menu was selected by the user,
    // resetting if the available sub-menus changes. A state of
    // null represents the top-level sub-menu buttons menu.
    const [
        selectedMenu,
        setSelectedMenu
    ] = useDerivedReducer(
        createSimpleStateReducer<string | null>(),
        ([subMenus], current) => {
            if (
                current !==  UNINITIALISED
                && current !== null
                && subMenus.hasOwnProperty(current)
            )
                return current
            else
                return null
        },
        [subMenus] as const
    )

    // Create a cancellation callback which hides the sub-menu
    const onCancel = useDerivedState(
        () => () => {
            menuModal.hide();
            setSelectedMenu(null);
        },
        [menuModal, setSelectedMenu]
    )

    useEffect(
        () => {
            if (addingFilesTask === undefined) return

            let shouldCancel = true

            getTaskCompletionPromise(addingFilesTask).then(() => {
                if (shouldCancel) onCancel()
            })

            return () => { shouldCancel = false }
        },
        [addingFilesTask, onCancel]
    )


    // Get the component for the selected menu
    const menuComponent: Resolution<FunctionComponent | null> = usePromise(
        useDerivedState(
            ([selectedMenu, setSelectedMenu, subMenus, onSubmit, onCancel]) => {
                // Null represents the top-level sub-menu buttons menu.
                if (selectedMenu === null) {
                    return () =>
                        <AddFilesMenu
                            setSelectedSubMenu={setSelectedMenu}
                            subMenus={subMenus}
                        />
                }

                return subMenus[selectedMenu](onSubmit, onCancel)
            },
            [selectedMenu, setSelectedMenu, subMenus, onSubmit, onCancel] as const
        )
    )

    // Create an effect to clear the selected sub-menu if resolving the component promise errors,
    // or it was resolved to null (means that an immediate call of onSubmit/onCancel should have
    // occurred).
    useEffect(
        () => {
            if (menuComponent.status === "rejected") {
                console.error("Error resolving promise of sub-menu component", menuComponent.reason)
                setSelectedMenu(null)
            } else if (menuComponent.status === "resolved" && menuComponent.value === null) {
                setSelectedMenu(null)
            }
        },
        [menuComponent, setSelectedMenu]
    )

    // Once the menu component's promise is resolved, extract it for display
    const MenuComponentResolved = menuComponent.status === "resolved"
        ? menuComponent.value
        : undefined

    const modal = addingFilesTask !== undefined
        ? <TaskProgressModal
            status={addingFilesTask.status}
            handleProgressMetadata={"latest"}
            position={menuModal.position}
            onCancel={pass}
        />
        : <LocalModal
            className={"AddFilesModal"}
            position={menuModal.position}
            onCancel={onCancel}
        >
            {MenuComponentResolved && <MenuComponentResolved />}
        </LocalModal>

    return <>
        <button
            className={"AddFilesButton"}
            onClick={menuModal.onClick}
            disabled={disabled}
        >
            +
        </button>

        {modal}
    </>
}

function AddFilesMenu<D extends Data, A>(
    props: {
        subMenus: SubMenus<D, A>,
        setSelectedSubMenu: (label: string) => void
    }
): FunctionComponentReturnType {
    const menuButtons = mapOwnProperties(
        props.subMenus,
        (menuLabel) => <AddFilesMenuButton
            label={menuLabel as string}
            setSelectedSubMenu={props.setSelectedSubMenu}
        />
    )

    return <div>
        {menuButtons}
    </div>
}

function AddFilesMenuButton(
    props: {
        label: string,
        setSelectedSubMenu: (label: string) => void
    }
): FunctionComponentReturnType {
    return <button
        className={"AddFilesMenuButton"}
        onClick={
            () => props.setSelectedSubMenu(props.label)
        }
    >
        {props.label}
    </button>
}

/**
 * Utility renderer which uses the browser's file-selection dialogue to select files
 * to add to the dataset.
 *
 * @param method
 *          - "single" to select a single file
 *          - "multiple" to select multiple files by file
 *          - "folder" to select multiple files by folder
 * @param getData
 *          Function to convert a file into domain-specific file-data.
 * @param getAnnotation
 *          Function to extract annotations from the file.
 */
export function addFilesRenderer<D extends Data, A>(
    method: SelectFilesMethod,
    getData: (file: File) => PossiblePromise<D>,
    getAnnotation: (file: File) => PossiblePromise<OptionalAnnotations<A>>
): (onSubmit: OnSubmitFunction<D, A>) => null {
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

                // Convert the files and submit them
                const submissionMap: Map<string, [D, OptionalAnnotations<A>]> = new Map()
                for (const file of files) {
                    submissionMap.set(file.name, [await getData(file), await getAnnotation(file)])
                }
                onSubmit(submissionMap)
            }
        );

        // No menu component is needed as file-submission is immediate
        return null;
    }
}