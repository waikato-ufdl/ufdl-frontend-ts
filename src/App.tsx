import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import {QueryClient, QueryClientProvider} from "react-query"
import {AppSettingsProvider, useAppSettings} from "./useAppSettings";
import useStateSafe from "./util/react/hooks/useStateSafe";
import {UFDLServerContextProvider} from "./server/UFDLServerContextProvider";

const queryClient = new QueryClient()

export default function App() {
    const [context] = useStateSafe(() => UFDLServerContext.for_current_host("", "", localStorage))

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
