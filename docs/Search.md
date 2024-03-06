
# JsonProcessor Usage Examples

The `JsonProcessor` class provides functionalities to search and filter JSON data based on various criteria. Below are some examples demonstrating how to use this class.

## Initializing the Processor

First, create an instance of `JsonProcessor` by passing a JSON string to the `fromJsonString` static method:

```javascript
const jsonString = `{
    "169": {
        "name": "The Village",
        "address": "Village Rd, Santa Cruz, CA 95060",
        "permits": ["MC", "HC", "Medical"],
        "r_c_after_5": false,
        "parkmobile_hourly": 2,
        "parkmobile_daily": false,
        "parkmobile_eve_wknd": false,
        "perimeter": [[36.98692021626784, -122.05541558112166], [36.986915151421734, -122.05533737812432], [36.986718466303785, -122.05531412858456], [36.98671593387406, -122.05538493400108]]
    }
}`;

const processor = JsonProcessor.fromJsonString(jsonString);
```

## Searching by a Single Criterion

To search entries by a single criterion, use the `searchByCriteria` method:

```javascript
console.log(processor.searchByCriteria("permits", "MC"));
```

This will return all entries where the `permits` array includes `"MC"`.

## Searching by Multiple Criteria

To search entries based on multiple criteria, use the `searchByMultipleCriteria` method:

```javascript
console.log(processor.searchByMultipleCriteria({ "r_c_after_5": false, "parkmobile_hourly": 2 }));
```

This will return entries that match all the specified criteria.

## Filtering by a Custom Function

For more complex filtering, you can pass a custom filter function to the `filterByFunction` method:

```javascript
console.log(processor.filterByFunction(entry => entry.parkmobile_hourly > 1 && !entry.parkmobile_daily));
```

This example filters entries to those with a `parkmobile_hourly` rate greater than 1 and where `parkmobile_daily` is false.
