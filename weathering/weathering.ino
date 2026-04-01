#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const char* ssid        = "ransy";
const char* password    = "rans091023";
const char* supabaseUrl = "https://tzspnjmksbfloelujzjc.supabase.co/rest/v1/sensor_data";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc";

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Sensor read failed!");
    delay(2000);
    return;
  }

  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: ");    Serial.print(humidity);    Serial.println(" %");
  Serial.println("----------------");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabaseUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", String("Bearer ") + supabaseKey);
    http.setTimeout(10000);

    String payload = "{\"temperature\":" + String(temperature) +
                     ",\"humidity\":"    + String(humidity)    + "}";

    int responseCode = http.POST(payload);
    Serial.println("Supabase Response: " + String(responseCode));
    http.end();

  } else {
    Serial.println("WiFi lost! Reconnecting...");
    WiFi.reconnect();
    delay(3000);
  }

  delay(3000); // Send every 3 seconds
}
