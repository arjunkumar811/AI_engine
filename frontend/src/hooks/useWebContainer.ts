import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";


export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();


    async function main() {
        const webvontainerInstance = await WebContainer.boot();
        setWebcontainer(webvontainerInstance)
    }

    useEffect(() => {
        main();
    }, [])

    return webcontainer;

}