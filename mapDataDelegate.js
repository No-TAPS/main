import fs from "fs";
const path = './mapData.json'; // Path to your JSON file

function writeMapData(parkingLotId) {
  readFile(path, (err, data) => {
    let mapData = {};

    // If the file exists and can be read
    if (!err && data) {
      try {
        mapData = JSON.parse(data.toString());
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        return;
      }
    }

    // Increment the click count for the parking lot ID, or set it to 1 if it does not exist
    if (mapData[parkingLotId]) {
      mapData[parkingLotId] += 1;
    } else {
      mapData[parkingLotId] = 1;
    }

    // Write the updated data back to the file
    writeFile(path, JSON.stringify(mapData, null, 2), (writeError) => {
      if (writeError) {
        console.error('Error writing JSON:', writeError);
        return;
      }

      console.log('Map data updated successfully.');
    });
  });
}

// Example usage
writeMapData(1); // Adds a click for parking lot ID 1

document.getElementById("lot1").addEventListener("click", lot1OnClick())
document.getElementById("lot2").addEventListener("click", lot2OnClick)

function lot1OnClick()
{
    writeMapData(1);
}

function lot2OnClick()
{
    writeMapData(2);
}