import React, {useEffect, useState} from "react";
import query from "../query";

type TStatic = {
    abbreviation: string,
    address: string,
    zipCode: string
}

const Building: React.FC<{
    building: TBuilding
}> = ({building}) => {
    const [staticData, setStaticData] = useState<TStatic | null>(null)

    useEffect(() => {
        setStaticData(null);
        query<'abbreviation' | 'name' | 'address' | 'zipCode'>("buildings",
            "PREFIX buildings: <http://ld.sven.mol.it/buildings#>" +
            "PREFIX dco: <https://w3id.org/dco#>" +
            "PREFIX dbpedia: <http://dbpedia.org/ontology/>" +
            "SELECT * " +
            "WHERE {" +
            `buildings:${building.properties.name.replace(' ', '_')} dbpedia:abbreviation ?abbreviation;` +
            "  dco:hasAddress ?address;" +
            "  dco:hasZipCode ?zipCode." +
            "}"
        ).then(data => setStaticData(data.length === 0 ? null : data[0]))
    }, [building.properties.name])

    return <div className="px-2 pb-2">
        <h1 className="font-bold text-center">
            {building.properties.name}
            {staticData ? ` (${staticData.abbreviation})` : ''}
        </h1>
        {staticData ? <p className="text-center italic">{staticData.address}, {staticData.zipCode}        </p> : null}

        <table>
            <tbody>
            {building.properties.cold ? <tr>
                <td>Cold</td>
                <td className="pl-2">{building.properties.cold}</td>
            </tr> : ''}
            {building.properties.electricity ? <tr>
                <td>Electricity</td>
                <td className="pl-2">{building.properties.electricity}</td>
            </tr> : ''}
            {building.properties.gas ? <tr>
                <td>Gas</td>
                <td className="pl-2">{building.properties.gas}</td>
            </tr> : ''}
            {building.properties.heat ? <tr>
                <td>Heat</td>
                <td className="pl-2">{building.properties.heat}</td>
            </tr> : ''}
            {building.properties.water ? <tr>
                <td>Water</td>
                <td className="pl-2">{building.properties.water}</td>
            </tr> : ''}
            </tbody>
        </table>
    </div>
};

export default Building;