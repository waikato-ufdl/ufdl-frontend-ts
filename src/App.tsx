import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {AppSettingsProvider, useAppSettings} from "./useAppSettings";
import useStateSafe from "./util/react/hooks/useStateSafe";
import {UFDLServerContextProvider} from "./server/UFDLServerContextProvider";
import {EXPERIMENT_LOGIN_PASSWORD, EXPERIMENT_LOGIN_USERNAME} from "./EXPERIMENT";

const queryClient = new QueryClient()

export default function App() {
    const [context] = useStateSafe(() => UFDLServerContext.for_current_host(EXPERIMENT_LOGIN_USERNAME, EXPERIMENT_LOGIN_PASSWORD, localStorage))

    const [settings, settingsDispatch] = useAppSettings()

    return <div className="App fullScreen">
        <QueryClientProvider client={queryClient}>
            <AppSettingsProvider settings={settings} dispatch={settingsDispatch}>
                <UFDLServerContextProvider context={context}>
                    <Window>
                        <MainMenuPage />
                    </Window>
                </UFDLServerContextProvider>
            </AppSettingsProvider>
        </QueryClientProvider>
    </div>
}
