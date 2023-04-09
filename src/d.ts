declare module '*.png'{
    const value: string;
    export default value;
}
declare module 'use-click-away' {
    import React from "react";

    export function useClickAway(ref: React.Ref<HTMLElement>, callback: () => void): void;
}

type ColorTriple = [number, number, number];

type TBuilding = {
    type: string,
    geometry: { [key: string]: any },
    properties: {
        name: string
        cold: string
        electricity: string
        gas: string
        heat: string
        water: string
        floors: number
    }
}