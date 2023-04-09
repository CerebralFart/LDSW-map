import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import Building from "./panels/building";
import useFillColor from "./hooks/useFillColor";

const QUERY = `\
PREFIX dco: <https://w3id.org/dco#>
PREFIX om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX ed: <http://ld.sven.mol.it/energydata#>
PREFIX mazemap: <http://ld.sven.mol.it/mazemap#>

SELECT ?name ?cold ?electricity ?gas ?heat ?water ?floors ?geometry
WHERE {
  ?bldg dco:Building ?name
  SERVICE <http://ld.sven.mol.it/mazemap/sparql> {
    ?mmBldg rdf:type mazemap:Building;
            mazemap:name ?name;
            mazemap:floors ?floors;
            mazemap:geometry ?geometry;
  }
  SERVICE <http://ld.sven.mol.it/energydata/sparql> {
    ?measurement rdf:type ed:Measurement;
               time:hasBeginning/time:inXSDDateTimeStamp "$DATE";
               ed:building ?bldg.
    OPTIONAL {
      ?measurement ed:cold ?cNode. ?cNode ed:value ?cValue; ed:unit ?cUnit
      SERVICE <http://ld.sven.mol.it/om2/sparql> { ?cUnit om2:symbol ?cSymbol }.
      BIND(CONCAT(STR(?cValue), ' ', ?cSymbol) AS ?cold).
    }
    OPTIONAL {
      ?measurement ed:electricity ?eNode. ?eNode ed:value ?eValue; ed:unit ?eUnit
      SERVICE <http://ld.sven.mol.it/om2/sparql> { ?eUnit om2:symbol ?eSymbol }.
      BIND(CONCAT(STR(?eValue), ' ', ?eSymbol) AS ?electricity).
    }
    OPTIONAL {
      ?measurement ed:gas ?gNode. ?gNode ed:value ?gValue; ed:unit ?gUnit
      SERVICE <http://ld.sven.mol.it/om2/sparql> { ?gUnit om2:symbol ?gSymbol }.
      BIND(CONCAT(STR(?gValue), ' ', ?gSymbol) AS ?gas).
    }
    OPTIONAL {
      ?measurement ed:heat ?hNode. ?hNode ed:value ?hValue; ed:unit ?hUnit
      SERVICE <http://ld.sven.mol.it/om2/sparql> { ?hUnit om2:symbol ?hSymbol }.
      BIND(CONCAT(STR(?hValue), ' ', ?hSymbol) AS ?heat).
    }
    OPTIONAL {
      ?measurement ed:water ?wNode. ?wNode ed:value ?wValue; ed:unit ?wUnit
      SERVICE <http://ld.sven.mol.it/om2/sparql> { ?wUnit om2:symbol ?wSymbol }.
      BIND(CONCAT(STR(?wValue), ' ', ?wSymbol) AS ?water).
    }
  }
}`

const INITIAL_VIEW_STATE = {
    latitude: 52.238757,
    longitude: 6.856152,
    zoom: 15,
    maxZoom: 18,
    pitch: 40,
    bearing: 25
};
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

function getTooltip({object}: { object: TBuilding }) {
    return object && {
        html: `<b>${object.properties.name}</b>`
    };
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

export default function App({mapStyle = MAP_STYLE}) {
    const [cnt, setCnt] = useState(0);
    const [buildings, setBuildings] = useState<TBuilding[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<null | number>(null)
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(1);
    const [year, setYear] = useState(2023);
    const [time, setTime] = useState(12);

    const date = useMemo(() => new Date(`${year}-${leftPad(month.toString(), '0', 2)}-${leftPad(day.toString(), '0', 2)}T${leftPad(time.toString(), '0', 2)}:00:00Z`), [year, month, day, time]);

    useEffect(() => {
        setBuildings([]);
        query<'name' | 'cold' | 'electricity' | 'gas' | 'heat' | 'water' | 'floors' | 'geometry'>('buildings', QUERY.replace('$DATE', date.toISOString()))
            .then(data => data.map(({
                                        cold,
                                        electricity,
                                        floors,
                                        gas,
                                        geometry,
                                        heat,
                                        name,
                                        water,
                                    }) => ({
                type: "Feature",
                geometry: JSON.parse(geometry),
                properties: {
                    floors: name === "Horst Complex" ? 2 : parseInt(floors),
                    name,
                    cold, electricity, gas, heat, water
                }
            })))
            .then(buildings => setBuildings(buildings))
    }, [date])


    useEffect(() => {
        dirLight.timestamp = date
        setCnt(cnt + 1);
    }, [date]);

    const getFillColor=useFillColor();

    const layers = useMemo(() => [
        // only needed when using shadows - a plane for shadows to drop on
        ground,
        new GeoJsonLayer({
            id: 'geojson',
            data: {
                type: "FeatureCollection",
                features: buildings
            },
            opacity: 0.9,
            stroked: false,
            filled: true,
            extruded: true,
            wireframe: false,
            pickable: true,
            getElevation: (f: TBuilding) => f.properties.floors * 10,
            getFillColor,
        })
    ], [buildings]);

    const onBuildingClick = useCallback((evt: { index: number }) => {
        setSelectedBuilding(evt.index === -1 ? null : evt.index);
    }, [buildings]);

    return <div className="w-full h-full flex flex-row">
        <div className="relative flex-grow flex items-center justify-center italic">
            {buildings.length === 0 ? 'Loading building information' : ''}
            <DeckGL
                layers={layers}
                effects={[effect]}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                getTooltip={getTooltip}
                onClick={onBuildingClick}
            >
                <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle}/>
            </DeckGL>
        </div>
        <div className="space-y-2 overflow-y-scroll bg-gray-700 text-white">
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
            {selectedBuilding === null
                ? (<div className="pb-2 text-center italic">
                        Select a building for more information
                    </div>
                )
                : <Building building={buildings[selectedBuilding]}/>
            }

        </div>
    </div>;
}

export function renderToDOM(container: HTMLElement) {
    createRoot(container).render(<App/>);
}
