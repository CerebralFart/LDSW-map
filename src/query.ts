async function query<T extends string = string>(dataset: string, query: string): Promise<({ [key in T]: string })[]> {
    const rq = await fetch(`https://ld.sven.mol.it/${dataset}/sparql`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            contentType: 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({query})
    })

    const {results: {bindings}} = await rq.json();

    const results: ({ [key in T]: string })[] = [];
    bindings.forEach((result: { [key: string]: any }) => {
        const row: { [key: string]: any } = {};
        for (const key in result) {
            const node = result[key];
            if (node.type === 'literal' || node.type === 'uri') row[key] = node.value;
        }
        results.push(row as { [key in T]: string });
    })

    return results;
}

export default query;