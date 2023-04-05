import React, {useEffect, useState} from "react";
import query from "./query";

const Weather: React.FC<{
    date: string,
    time: string
}> = ({date, time}) => {
    const [data, setData] = useState<({ relation: string, rendered: string })[]>(null);
    useEffect(() => {
        query('knmi',
            "PREFIX knmi: <http://ld.sven.mol.it/knmi#>" +
            "PREFIX om2: <http://www.ontology-of-units-of-measure.org/resource/om-2/>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "SELECT ?relation ?rendered " +
            "WHERE {" +
            `  knmi:${date}-${time.length === 1 ? ('0' + time) : time} ?relation ?node.` +
            "  OPTIONAL {" +
            "    ?node knmi:value ?value;" +
            "          knmi:unit ?unit." +
            "    SERVICE <http://ld.sven.mol.it/om2/sparql> { ?unit om2:symbol ?symbol }." +
            "    BIND(CONCAT(STR(?value), ' ', ?symbol) AS ?nodeValue)." +
            "  }." +
            "  BIND(COALESCE(?nodeValue, ?node) AS ?rendered)." +
            "}"
        ).then(data => setData(data
            .filter(node => node.rendered && node.relation.startsWith('http://ld.sven.mol.it/'))
            .map(({relation, rendered}) => ({
                relation: relation.split("#")[1],
                rendered: rendered.indexOf('#') === -1 ? rendered : rendered.split('#')[1],
            }))
        ));
    }, [date, time]);

    if (data === null) return <p className="text-center italic">Loading</p>
    else return <table>
        <tbody>
        {data.map(({relation, rendered}) => (
            <tr key={relation}>
                <td>{relation.replace(/([A-Z])/, ' $1').toLowerCase()}</td>
                <td className="pl-8">{rendered}</td>
            </tr>
        ))}
        </tbody>
    </table>;
};

export default Weather;