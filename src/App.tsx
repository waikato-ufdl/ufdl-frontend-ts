import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import {FileCache, UFDLImageCacheProvider} from "./server/FileCacheContext";
import useDerivedState from "./util/react/hooks/useDerivedState";

export default function App() {
    const context = UFDLServerContext.for_current_host("", "");

    // Create a new file cache on server change
    const fileCache = useDerivedState(
        () => new FileCache(),
        [context.host]
    );

    return <div className="App fullScreen">
        <UFDLImageCacheProvider context={fileCache}>
            <Window context={context}>
                <MainMenuPage />
            </Window>
        </UFDLImageCacheProvider>
    </div>
}
