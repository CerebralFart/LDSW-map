import React, {useEffect, useState} from "react";
import cold from '../img/cold.png';
import electricity from '../img/electricity.png';
import gas from '../img/gas.png';
import heat from '../img/heat.png';
import water from '../img/water.png';
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

        <div className="mt-4 flex flex-row space-x-4 justify-center">
            {building.properties.cold ? (
                <div className="flex flex-col items-center">
                    <img className="h-12" src={cold} alt="Cold circle usage"/>
                    <p className="mt-2">{building.properties.cold}</p>
                </div>
            ) : ''}
            {building.properties.electricity ? (
                <div className="flex flex-col items-center">
                    <img className="h-12" src={electricity} alt="Electricity usage"/>
                    <p className="mt-2">{building.properties.electricity}</p>
                </div>
            ) : ''}
            {building.properties.gas ? (
                <div className="flex flex-col items-center">
                    <img className="h-12" src={gas} alt="Gas usage"/>
                    <p className="mt-2">{building.properties.gas}</p>
                </div>
            ) : ''}
            {building.properties.heat ? (
                <div className="flex flex-col items-center">
                    <img className="h-12" src={heat} alt="Heating usage"/>
                    <p className="mt-2">{building.properties.heat}</p>
                </div>
            ) : ''}
            {building.properties.water ? (
                <div className="flex flex-col items-center">
                    <img className="h-12" src={water} alt="Water usage"/>
                    <p className="mt-2">{building.properties.water}</p>
                </div>
            ) : ''}
        </div>
    </div>
};

export default Building;