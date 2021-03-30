import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";

export default function App() {
    const context = new UFDLServerContext(window.location.origin, "", "");

    return <div className="App fullScreen">
        <Window context={context}>
            <MainMenuPage />
        </Window>
    </div>
}
