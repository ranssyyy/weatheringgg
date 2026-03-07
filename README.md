# 🌤️ Weather Dashboard

A live temperature and humidity monitoring dashboard built with **ESP32** and **DHT11 sensor**, storing data in **Supabase** and displayed on a beautiful sunset-themed web dashboard.

## 🌐 Live Demo
👉 **[weatheringgg.netlify.app](https://weatheringgg.netlify.app)**

## 📸 Preview
![Weather Dashboard](preview.png)

## 🛠️ Built With
- **ESP32** — microcontroller that reads sensor data and sends it to the cloud
- **DHT11** — temperature and humidity sensor
- **Supabase** — cloud database that stores all readings
- **Netlify** — hosts the live web dashboard
- **Chart.js** — renders the live temperature and humidity charts

## ⚙️ How It Works
1. ESP32 reads temperature and humidity from DHT11 every 1 minute
2. Data is sent to Supabase database via HTTP POST
3. The web dashboard fetches the latest data from Supabase every 1 minute
4. Charts and readings update automatically in real time

## 📡 Hardware
| Component | Pin |
|-----------|-----|
| DHT11 VCC | 3.3V |
| DHT11 GND | GND |
| DHT11 DATA | GPIO 4 |

## 🗄️ Database Schema
```sql
CREATE TABLE sensor_data (
  id SERIAL PRIMARY KEY,
  temperature FLOAT,
  humidity FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📁 Files
- `dashboard.html` — the web dashboard (single file, no dependencies)
- `rhics.ino` — Arduino code for ESP32

## 👤 Author
**ranssyyy** — [github.com/ranssyyy](https://github.com/ranssyyy)
