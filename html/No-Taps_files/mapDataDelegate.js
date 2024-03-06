
document.getElementById("lot1").addEventListener("click", lot1OnClick())
document.getElementById("lot2").addEventListener("click", lot2OnClick)

function lot1OnClick()
{
    incrementParkingLotClicks(1);
}

function lot2OnClick()
{
    incrementParkingLotClicks;
}

function incrementParkingLotClicks(parkingLotId) {
    fetch('/updateClicks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parkingLotId }),
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch((error) => console.error('Error:', error));
}


