class JsonProcessor {
    constructor(jsonData) {
        this.data = jsonData;
    }

    // Load and parse the JSON data
    static fromJsonString(jsonString) {
        try {
            const jsonData = JSON.parse(jsonString);
            return new JsonProcessor(jsonData);
        } catch (e) {
            console.error("Error parsing JSON", e);
            return null;
        }
    }

    // Search entries based on single criteria
    searchByCriteria(key, value) {
        return Object.keys(this.data).filter(id => {
            const entry = this.data[id];
            if (Array.isArray(entry[key])) {
                return entry[key].includes(value);
            }
            return entry[key] === value;
        }).map(id => this.data[id]);
    }

    // Advanced search: multiple criteria
    searchByMultipleCriteria(criteria) {
        return Object.keys(this.data).filter(id => {
            const entry = this.data[id];
            return Object.keys(criteria).every(key => {
                if (typeof entry[key] === "string") {
                    return entry[key].toLowerCase().includes(criteria[key].toLowerCase());
                }
                if (Array.isArray(entry[key])) {
                    return criteria[key].every(val => entry[key].includes(val));
                }
                return entry[key] === criteria[key];
            });
        }).map(id => [id, this.data[id]]);
    }

    // Filter entries by a custom filter function
    filterByFunction(filterFunction) {
        return Object.keys(this.data).filter(id => filterFunction(this.data[id])).map(id => this.data[id]);
    }
}