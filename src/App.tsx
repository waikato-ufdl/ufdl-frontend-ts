import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import dataCacheContext from "./server/dataCacheContext";

export const [IMAGE_CACHE_CONTEXT, IMAGE_CACHE_PROVIDER] = dataCacheContext(URL.createObjectURL);

export default function App() {
    const context = UFDLServerContext.for_current_host("", "");

    return <div className="App fullScreen">
        <IMAGE_CACHE_PROVIDER>
            <Window context={context}>
                <MainMenuPage />
            </Window>
        </IMAGE_CACHE_PROVIDER>
    </div>
}
