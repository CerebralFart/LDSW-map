import {_SunLight as SunLight, AmbientLight, LightingEffect} from "@deck.gl/core";
import {useMemo} from "react";

export const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const timestamp = new Date();
timestamp.setHours(12, 0, 0, 0);
export const dirLight = new SunLight({
    timestamp,
    color: [255, 255, 255],
    intensity: 1.0,
    _shadow: true
});

const lightingEffect = new LightingEffect({ambientLight, dirLight});
lightingEffect.shadowColor = [0, 0, 0, 0.3];
export const lights = [lightingEffect];
