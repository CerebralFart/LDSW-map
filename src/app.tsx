import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {scaleThreshold} from 'd3-scale';
import {ground} from "./layers";

import './index.css'
import query from "./query";
import WeatherPanel from "./weather";
import Select from "./select";
import {leftPad} from "./util";
import {LightingEffect, AmbientLight, _SunLight as SunLight} from "@deck.gl/core";
import Holiday from "./holiday";

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

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});
const dirLight = new SunLight({
    timestamp: new Date(),
    color: [255, 255, 255],
    intensity: 1.0,
    _shadow: true
});
const effect = new LightingEffect({ambientLight, dirLight});
effect.shadowColor = [0, 0, 0, 0.3];

export default function App({data = QUERY, mapStyle = MAP_STYLE}) {
    const [cnt, setCnt] = useState(0);
    const [day, setDay] = useState(22);
    const [month, setMonth] = useState(3);
    const [year, setYear] = useState(2023);
    const [time, setTime] = useState(12);

    useEffect(() => {
        dirLight.timestamp = new Date(`${year}-${leftPad(month.toString(), '0', 2)}-${leftPad(day.toString(), '0', 2)}T${leftPad(time.toString(), '0', 2)}:00:00Z`)
        setCnt(cnt + 1);
    }, [day, month, year, time]);

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
                effects={[effect]}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                getTooltip={getTooltip}
                onClick={console.log}
            >
                <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true}/>
            </DeckGL>
        </div>
        <div className="space-y-2 bg-gray-700 text-white">
            <div className="flex flex-row px-2 space-x-2">
                <Select
                    value={day - 1}
                    setValue={d => setDay(d + 1)}
                    options={[
                        "01", "02", "03", "04", "05",
                        "06", "07", "08", "09", "10",
                        "11", "12", "13", "14", "15",
                        "16", "17", "18", "19", "20",
                        "21", "22", "23", "24", "25",
                        "26", "27", "28", "29", "30",
                        "31"
                    ]}
                />
                <Select
                    value={month - 1}
                    setValue={m => setMonth(m + 1)}
                    options={[
                        "January", "February", "March",
                        "April", "May", "June",
                        "July", "August", "September",
                        "October", "November", "December"
                    ]}
                />
                <Select
                    value={year - 2021}
                    setValue={y => setYear(y + 2021)}
                    options={["2021", "2022", "2023"]}
                />
                <Select
                    value={time}
                    setValue={time => setTime(time)}
                    options={[
                        "00:00 - 01:00",
                        "01:00 - 02:00",
                        "02:00 - 03:00",
                        "03:00 - 04:00",
                        "04:00 - 05:00",
                        "05:00 - 06:00",
                        "06:00 - 07:00",
                        "07:00 - 08:00",
                        "08:00 - 09:00",
                        "09:00 - 10:00",
                        "10:00 - 11:00",
                        "11:00 - 12:00",
                        "12:00 - 13:00",
                        "13:00 - 14:00",
                        "14:00 - 15:00",
                        "15:00 - 16:00",
                        "16:00 - 17:00",
                        "17:00 - 18:00",
                        "18:00 - 19:00",
                        "19:00 - 20:00",
                        "20:00 - 21:00",
                        "21:00 - 22:00",
                        "22:00 - 23:00",
                        "23:00 - 00:00",
                    ]}
                />
            </div>
            <Holiday
                date={`${year}-${leftPad(month.toString(), '0', 2)}-${leftPad(day.toString(), '0', 2)}`}
            />
            <hr/>
            <WeatherPanel
                date={`${year}-${leftPad(month.toString(), '0', 2)}-${leftPad(day.toString(), '0', 2)}`}
                time={time}
            />
            <hr/>
            <div className="text-center italic">Select a building for more information</div>
        </div>
    </div>;
}

export function renderToDOM(container: HTMLElement) {
    createRoot(container).render(<App/>);
}
