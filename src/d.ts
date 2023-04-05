declare module 'use-click-away' {
    import React from "react";

    export function useClickAway(ref: React.Ref<HTMLElement>, callback: () => void): void;
}