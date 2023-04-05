import {PolygonLayer} from "@deck.gl/layers";

export const ground = new PolygonLayer({
    id: 'layers',
    data: [[
        [6.847, 52.240], // Spiegel
        [6.860, 52.235], // Teletubbieland
        [6.865, 52.239], // BMC
        [6.860, 52.245], // Hogekamp
        [6.849, 52.246], // Sportcentrum
    ]],
    stroked: false,
    getPolygon: f => f,
    getFillColor: [0, 0, 0, 0]
});
