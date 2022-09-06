import React from 'react';
import './App.css';
import Window from "./components/Window";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {MainMenuPage} from "./components/pages/MainMenuPage";
import {QueryClient, QueryClientProvider} from "react-query"
import {NQueue} from "./server/NQueue";

const queryClient = new QueryClient()

export default function App() {
    const context = UFDLServerContext.for_current_host("", "", localStorage, new NQueue(5));

    return <div className="App fullScreen">
        <QueryClientProvider client={queryClient}>
            <Window context={context}>
                <MainMenuPage />
            </Window>
        </QueryClientProvider>
    </div>
}
