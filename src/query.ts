async function query(dataset: string, query: string): Promise<any> {
    const rq = await fetch(`https://ld.sven.mol.it/${dataset}/sparql`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            contentType: 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({query})
    })

    const {results: {bindings}} = await rq.json();

    const results: ({ [key: string]: any })[] = [];
    bindings.forEach((result: { [key: string]: any }) => {
        const row: { [key: string]: any } = {};
        for (const key in result) {
            const node = result[key];
            if (node.type === 'literal' || node.type === 'uri') row[key] = node.value;
        }
        results.push(row);
    })

    return results;
}

export default query;