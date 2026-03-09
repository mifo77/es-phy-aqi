const SERVICE_UUID = "6d1247e8-504d-4a14-8803-0d4b3e567aeb";
const CHAR_UUID = "44c29b94-ac48-4381-9506-78c93bd09c3b";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBxsqGPW8uakxLnHVaaFwgciRaHxr6vT2Ml9s8tuLPUqryhpD-JXsqlptbyPsivG0S/exec";

let bleDevice, bleChar;

if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.bluefy) {
    document.getElementById('iosHelp').style.display = 'block';
}

document.getElementById('connectBtn').onclick = async () => {
    try {
        document.getElementById('dataDisplay').innerText = "Statut : Recherche en cours...";
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'ESP32_Sensor' }],
            optionalServices: [SERVICE_UUID]
        });

        const server = await bleDevice.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        bleChar = await service.getCharacteristic(CHAR_UUID);

        document.getElementById('dataDisplay').innerText = "Statut : Connecté !";
        document.getElementById('syncBtn').disabled = false;
        document.getElementById('connectBtn').style.display = 'none';
    } catch (error) {
        console.error(error);
        document.getElementById('dataDisplay').innerText = "Statut : Échec de la connexion.";
    }
};

document.getElementById('syncBtn').onclick = () => {
    document.getElementById('dataDisplay').innerText = "Statut : Capture en cours...";
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const valueBuffer = await bleChar.readValue();
            const decoder = new TextDecoder('utf-8');
            const sensorString = decoder.decode(valueBuffer);

            const payload = {
                sensor: sensorString,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                time: new Date().toISOString()
            };
            
            // Send to Google Sheets
            document.getElementById('dataDisplay').innerText = "Statut : Envoi à la base de données...";
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: JSON.stringify(payload)
            });

            document.getElementById('dataDisplay').innerText = "Statut : Succès ! Données envoyées.";
        } catch (err) {
            document.getElementById('dataDisplay').innerText = "Statut : Erreur lors de la synchronisation";
            console.error(err);
        }
    }, (error) => {
        document.getElementById('dataDisplay').innerText = "Statut : Accès GPS refusé";
    });
};

// function doPost(e) {
//   try {
//     var data = JSON.parse(e.postData.contents);
//     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
//     var sensorValues = data.sensor.split(",");
    
//     var rowContent = [
//       data.time,
//       sensorValues[0],
//       sensorValues[1],
//       sensorValues[2],
//       data.lat,
//       data.lng,
//       new Date()
//     ];
    
//     sheet.appendRow(rowContent);
    
//     return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
//       .setMimeType(ContentService.MimeType.JSON);
      
//   } catch (f) {
//     return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": f.toString()}))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
// }