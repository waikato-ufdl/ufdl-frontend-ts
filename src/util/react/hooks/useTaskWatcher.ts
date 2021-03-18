import {useNonUpdatingReducer} from "./useNonUpdatingReducer";
import useUpdateTrigger from "./useUpdateTrigger";
import useDerivedState from "./useDerivedState";
import {discard} from "../../typescript/discard";

type TaskWatcherAction = {
    add: boolean
    task: Promise<void>
}

type TaskWatcherState = Set<Promise<void>>

function taskWatcherReducer(
    currentState: TaskWatcherState,
    action: TaskWatcherAction
): TaskWatcherState {
    const newState = new Set(currentState);

    if (action.add)
        newState.add(action.task);
    else
        newState.delete(action.task);

    return newState;
}

function taskWatcherInitialiser(): TaskWatcherState {
    return new Set();
}

export type TaskDispatch = (
    task: () => Promise<unknown>,
    renderOnComplete?: boolean,
    renderOnError?: boolean
) => void

export default function useTaskWatcher(
    // No parameters
): [boolean, TaskDispatch] {

    const [state, dispatch] = useNonUpdatingReducer(
        taskWatcherReducer,
        taskWatcherInitialiser
    );

    const updateTrigger = useUpdateTrigger();

    const taskDispatch = useDerivedState<TaskDispatch, [typeof dispatch, typeof updateTrigger]>(
        ([dispatch, updateTrigger]) => (
            task,
            renderOnComplete,
            renderOnError
        ) => {
            let runningTask: Promise<void>;

            async function taskActual() {
                let render: boolean;

                try {
                    await task();
                    render = renderOnComplete !== false;
                } catch (e) {
                    discard(e);
                    render = renderOnError !== false;
                }

                dispatch({add: false, task: runningTask});

                if (render) updateTrigger();

            }

            runningTask = taskActual();

            dispatch({add: true, task: runningTask});

        },
        [dispatch, updateTrigger]
    );

    return [state.size === 0, taskDispatch];
}
