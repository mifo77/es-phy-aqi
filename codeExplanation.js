const codeBlocks = [
    {
        title: "Attente de l'envoi des données par le capteur",
        code: `while (pmsSerial.available() >= 32) 
  {
    if (pmsSerial.read() == 0x42) {
      if (pmsSerial.peek() == 0x4D) {
        pmsSerial.readBytes(buffer, 31);`,
        explanations: [
            "<b>while (>= 32)</b> : Vérifie qu'un paquet complet est en attente.",
            "<b>0x42</b> : Premier octet de synchronisation du capteur.",
            "<b>peek() == 0x4D</b> : Vérifie le second octet sans le consommer.",
            "<b>readBytes</b> : Lit le reste du paquet une fois l'alignement confirmé."
        ]
    },
    {
        title: "Calcul de l'Intégrité (Checksum)",
        code: `uint16_t calculatedSum = 0x42;
for (int i=0; i<29; ++i) {
  calculatedSum += buffer[i];
}
if (calculatedSum == actualChecksum) {
  // Données valides
}`,
        explanations: [
            "<b>calculatedSum</b> : Variable stockant la somme des octets.",
            "<b>for loop</b> : Additionne les octets de données reçus.",
            "<b>actualChecksum</b> : Somme de contrôle envoyée par le capteur.",
            "<b>if ==</b> : Compare les deux sommes pour rejeter les données corrompues."
        ]
    },
    {
        title: "Reconstitution des valeurs",
        code: `if (calculatedSum == actualChecksum) {
  data.pm1 = (buffer[9] << 8) | buffer[10];
  data.pm2_5 = (buffer[11] << 8) | buffer[12];
  data.pm10 = (buffer[13] << 8) | buffer[14];
}`,
        explanations: [
            "<b>(buffer[9] << 8) | buffer[10]</b> : Reconstitue la valeur numérique réelle renvoyée par le capteur."
        ]
    },
    {
        title: "Initialisation des connexions",
        code: `void setup() {
  Serial.begin(115200);
  pmsSerial.begin(9600, SERIAL_8N1, 16, 17);
  
  Serial.println("Starting BLE Server...");

  BLEDevice::init("ESP32_Sensor");

  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Reste du code
}
  
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Phone Connected!");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Phone Disconnected!");
      BLEDevice::startAdvertising();
    }
};`,
        explanations: [
            "<b>Serial.begin</b> : Établit la communication entre la puce et le moniteur série pour le débogage.",
            "<b>BLEDevice::init(\"ESP32_Sensor\")</b> : Initialise le module Bluetooth avec le nom d'identification choisi.",
            "<b>BLEDevice::createServer()</b> : Configure l'ESP32 comme un serveur Bluetooth prêt à communiquer.",
            "<b>void onConnect() / void onDisconnect()</b> : Définit le comportement de l'ESP32 lors d'une connexion ou déconnexion."
        ]
    },
    {
        title: "Logique / Boucle principale",
        code: `void loop() {
  PMSData newData = readPMS5003();
  PMSData failData = {-1, -1, -1};

  if (!equalData(newData, failData))
  {
    if (millis() - lastUpdateTime > 2000) {
      String dataString = String(newData.pm1) + "," +
      String(newData.pm2_5) + "," + String(newData.pm10);
      
      pCharacteristic->setValue(dataString.c_str());
      lastUpdateTime = millis();
    }
  }
}`,
        explanations: [
            "<b>readPMS5003()</b> : Lit les données en continu pour éviter d'encombrer la mémoire RAM.",
            "<b>if (!equalData(newData, failData))</b> : Filtre les données invalides ou vides générées par la boucle constante.",
            "<b>if (millis() - lastUpdateTime > 2000)</b> : Gère l'intervalle d'envoi pour ne pas saturer la communication.",
            "<b>pCharacteristic->setValue(...)</b> : Met à jour les données Bluetooth pour que le site web puisse les lire."
        ]
    }
];