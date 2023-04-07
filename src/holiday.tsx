import React, {useEffect, useMemo, useState} from "react";
import query from "./query";

const Holiday: React.FC<{
    date: string
}> = ({date}) => {
    const [holiday, setHoliday] = useState<string | null>(null);

    const weekend = useMemo(() => {
        const d = new Date(date);
        return d.getDay() === 0 || d.getDay() === 6;
    }, [date])

    useEffect(() => {
        query("holidays",
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX holiday: <http://ld.sven.mol.it/holidays#>" +
            "PREFIX time: <http://www.w3.org/2006/time#>" +
            "SELECT *" +
            "WHERE {" +
            "  ?holiday rdf:type holiday:Holiday;" +
            "           holiday:forRegion holiday:North;" +
            "           holiday:isCompulsory ?compulsory;" +
            "           time:hasBeginning/time:inXSDDateTimeStamp ?start;" +
            "           time:hasEnd/time:inXSDDateTimeStamp ?end." +
            `  FILTER(?start < '${date}' && ?end > '${date}').` +
            "}"
        ).then(data => {
            if (data.length === 0) {
                setHoliday(null);
            } else {
                const [{holiday, compulsory, start, end}] = data;

                const startDate = new Date(start);
                const endDate = new Date(end);
                const type = holiday.split('#')[1].split('-')[0]

                setHoliday(`${type} (${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1})`)
            }
        })
    }, [date])

    return (
        <div className="text-center">
            {holiday ? holiday : (
                weekend ? 'Weekend' : 'Working day'
            )}
        </div>
    )
}

export default Holiday;