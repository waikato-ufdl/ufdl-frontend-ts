import useControlledUpdateReducer from "./useControlledUpdateReducer";
import useDerivedState from "./useDerivedState";
import isPromise from "../../typescript/async/isPromise";

type TaskWatcherAction = {
    add: boolean
    task: Promise<unknown>
}

type TaskWatcherState = Set<Promise<unknown>>

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

function taskWatcherInitialiser(
    // No parameters
): TaskWatcherState {
    return new Set();
}

export type TaskDispatch = <T>(
    task: (() => Promise<T>) | Promise<T>,
    renderOnComplete?: boolean,
    renderOnError?: boolean
) => Promise<T>

export default function useTaskWatcher(
    // No parameters
): [boolean, TaskDispatch] {

    const [state, dispatch] = useControlledUpdateReducer(
        taskWatcherReducer,
        taskWatcherInitialiser
    );

    const taskDispatch: TaskDispatch = useDerivedState(
        () => (
            task,
            renderOnComplete,
            renderOnError
        ) => {
            let runningTask: Promise<any>;

            async function taskActual() {
                let render: boolean = renderOnComplete !== false;

                try {
                    return await (isPromise(task) ? task : task());
                } catch (e) {
                    render = renderOnError !== false;
                    throw e;
                } finally {
                    dispatch({add: false, task: runningTask}, render);
                }
            }

            runningTask = taskActual();

            dispatch({add: true, task: runningTask}, false);

            return runningTask;
        },
        [dispatch]
    );

    return [state.size === 0, taskDispatch];
}
