import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {scaleThreshold} from 'd3-scale';
import {ground} from "./layers";
import {lights} from "./lights";

import './index.css'
import query from "./query";
import WeatherPanel from "./weather";

const QUERY = query<'floors' | 'geometry' | 'name'>('mazemap',
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
    "PREFIX mazemap: <http://ld.sven.mol.it/mazemap#>" +
    "SELECT ?name ?floors ?geometry WHERE {" +
    "?bldg rdf:type mazemap:Building;" +
    "      mazemap:floors ?floors;" +
    "      mazemap:geometry ?geometry;" +
    "      mazemap:name ?name." +
    "} LIMIT 25"
).then(data => ({
    type: "FeatureCollection",
    features: data.map(building => ({
        type: "Feature",
        geometry: JSON.parse(building.geometry),
        properties: {
            floors: building.name === "Horst Complex" ? 2 : parseInt(building.floors),
            name: building.name
        }
    }))
}))

export const COLOR_SCALE = scaleThreshold()
    .domain([-0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2])
    .range([
        [65, 182, 196],
        [127, 205, 187],
        [199, 233, 180],
        [237, 248, 177],
        // zero
        [255, 255, 204],
        [255, 237, 160],
        [254, 217, 118],
        [254, 178, 76],
        [253, 141, 60],
        [252, 78, 42],
        [227, 26, 28],
        [189, 0, 38],
        [128, 0, 38]
    ]);

const INITIAL_VIEW_STATE = {
    latitude: 52.238757,
    longitude: 6.856152,
    zoom: 15,
    maxZoom: 18,
    pitch: 40,
    bearing: 25
};
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

function getTooltip({object}) {
    return (
        object && {
            html: `\
  <div><b>${object.properties.name}</b></div>
  <div>${JSON.stringify(object.properties)}</div>
  `
        }
    );
}

export default function App({data = QUERY, mapStyle = MAP_STYLE}) {
    const layers = [
        // only needed when using shadows - a plane for shadows to drop on
        ground,
        new GeoJsonLayer({
            id: 'geojson',
            data,
            opacity: 0.9,
            stroked: false,
            filled: true,
            extruded: true,
            wireframe: false,
            pickable: true,
            getElevation: f => f.properties.floors * 10,
            getFillColor: f => [
                Math.random() * 255,
                Math.random() * 255,
                Math.random() * 255
            ],//COLOR_SCALE(f.properties.growth),
        })
    ];

    return <div className="w-full h-full flex flex-row">
        <div className="relative flex-grow">
            <DeckGL
                layers={layers}
                effects={lights}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                getTooltip={getTooltip}
                onClick={console.log}
            >
                <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true}/>
            </DeckGL>
        </div>
        <div className="w-96 bg-gray-700 text-white">
            [DATE]
            [TIME]
            <hr className="my-2"/>
            <WeatherPanel date="2023-03-22" time="12"/>
            <hr className="my-2"/>
            <div className="text-center italic">Select a building for more information</div>
        </div>
    </div>;
}

export function renderToDOM(container: HTMLElement) {
    createRoot(container).render(<App/>);
}
