import {useMemo} from "react";
import {scaleLinear} from "d3-scale";
import {useAsyncMemo} from "./useAsyncMemo";
import query from "../query";

type Fns = { [key: string]: { [key: string]: (value: number) => number } };
type Type = 'c' | 'e' | 'g' | 'h' | 'w';
type Stat = 'Avg' | 'Dev';
type TypedStats = `${Type}${Stat}`;

export default function useFillColor(): (b: TBuilding) => ColorTriple {
    const scaleR = useMemo(() => scaleLinear().range([34, 154, 255, 220]).domain([0, 1, 2, 3]), []);
    const scaleG = useMemo(() => scaleLinear().range([139, 205, 215, 20]).domain([0, 1, 2, 3]), []);
    const scaleB = useMemo(() => scaleLinear().range([34, 50, 0, 60]).domain([0, 1, 2, 3]), []);

    const buildings = useAsyncMemo<Fns>(async () => {
        const data = await query<'building' | TypedStats>("energydata", `\
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX ed: <http://ld.sven.mol.it/energydata#>

            SELECT ?building ?cAvg ?cDev ?eAvg ?eDev ?gAvg ?gDev ?hAvg ?hDev ?wAvg ?wDev
            WHERE {
                ?statistic rdf:type ed:Statistics; ed:building ?building;
                OPTIONAL { ?statistic ed:cold/ed:average ?cAvg; ed:cold/ed:stdDev ?cDev; }
                OPTIONAL { ?statistic ed:electricity/ed:average ?eAvg; ed:electricity/ed:stdDev ?eDev; }
                OPTIONAL { ?statistic ed:gas/ed:average ?gAvg; ed:gas/ed:stdDev ?gDev; }
                OPTIONAL { ?statistic ed:heat/ed:average ?hAvg; ed:heat/ed:stdDev ?hDev; }
                OPTIONAL { ?statistic ed:water/ed:average ?wAvg; ed:water/ed:stdDev ?wDev; }
            }
        `)

        const ret: Fns = {};
        data.forEach(({building, ...entry}) => {
            const name = building.split('#')[1].replace('_', ' ');

            const mvmts = {
                cAvg: parseFloat(entry.cAvg), cDev: parseFloat(entry.cDev),
                eAvg: parseFloat(entry.eAvg), eDev: parseFloat(entry.eDev),
                gAvg: parseFloat(entry.gAvg), gDev: parseFloat(entry.gDev),
                hAvg: parseFloat(entry.hAvg), hDev: parseFloat(entry.hDev),
                wAvg: parseFloat(entry.wAvg), wDev: parseFloat(entry.wDev),
            };

            ret[name] = {
                cold: v => (v - mvmts.cAvg) / mvmts.cDev,
                electricity: v => (v - mvmts.eAvg) / mvmts.eDev,
                gas: v => (v - mvmts.gAvg) / mvmts.gDev,
                heat: v => (v - mvmts.hAvg) / mvmts.hDev,
                water: v => (v - mvmts.wAvg) / mvmts.wDev,
            }
        });

        return ret;
    }, [], {});

    return (building) => {
        const {name} = building.properties;
        if (name in buildings) {
            const fns = buildings[name];
            const max = Math.max(
                fns.cold(parseFloat(building.properties.cold)) || 0,
                fns.electricity(parseFloat(building.properties.electricity)) || 0,
                fns.gas(parseFloat(building.properties.gas)) || 0,
                fns.heat(parseFloat(building.properties.heat)) || 0,
                fns.water(parseFloat(building.properties.water)) || 0,
            );
            return [scaleR(max), scaleG(max), scaleB(max)]
        } else return [127, 127, 127]
    };
}