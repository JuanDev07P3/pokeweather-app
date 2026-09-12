/// Servicio del clima — Open-Meteo (https://open-meteo.com)
/// Port 1:1 de `src/services/weather.ts`.
import 'http_client.dart';
import 'models.dart';

const _geoUrl = 'https://geocoding-api.open-meteo.com/v1/search';
const _forecastUrl = 'https://api.open-meteo.com/v1/forecast';

const wmoDescriptions = <int, List<String>>{
  0: ['Cielo despejado', 'sun', '☀️'],
  1: ['Mayormente despejado', 'sun', '🌤️'],
  2: ['Parcialmente nublado', 'cloud-sun', '⛅'],
  3: ['Nublado', 'cloud', '☁️'],
  45: ['Niebla', 'cloud-fog', '🌫️'],
  48: ['Niebla con escarcha', 'cloud-fog', '🌫️'],
  51: ['Llovizna ligera', 'cloud-drizzle', '🌦️'],
  53: ['Llovizna moderada', 'cloud-drizzle', '🌦️'],
  55: ['Llovizna intensa', 'cloud-drizzle', '🌧️'],
  56: ['Llovizna helada', 'cloud-drizzle', '🌧️'],
  57: ['Llovizna helada intensa', 'cloud-drizzle', '🌧️'],
  61: ['Lluvia ligera', 'cloud-rain', '🌦️'],
  63: ['Lluvia moderada', 'cloud-rain', '🌧️'],
  65: ['Lluvia fuerte', 'cloud-rain', '🌧️'],
  66: ['Lluvia helada', 'cloud-rain', '🌧️'],
  67: ['Lluvia helada fuerte', 'cloud-rain', '🌧️'],
  71: ['Nieve ligera', 'cloud-snow', '🌨️'],
  73: ['Nieve moderada', 'cloud-snow', '❄️'],
  75: ['Nieve intensa', 'cloud-snow', '❄️'],
  77: ['Granos de nieve', 'cloud-snow', '🌨️'],
  80: ['Chubascos ligeros', 'cloud-rain', '🌦️'],
  81: ['Chubascos moderados', 'cloud-rain', '🌧️'],
  82: ['Chubascos violentos', 'cloud-rain', '⛈️'],
  85: ['Chubascos de nieve', 'cloud-snow', '🌨️'],
  86: ['Chubascos de nieve fuertes', 'cloud-snow', '❄️'],
  95: ['Tormenta', 'cloud-lightning', '⛈️'],
  96: ['Tormenta con granizo', 'cloud-lightning', '⛈️'],
  99: ['Tormenta con granizo fuerte', 'cloud-lightning', '⛈️'],
};

/// Devuelve [label, icon, emoji] para un código WMO.
List<String> describeCode(int code) {
  return wmoDescriptions[code] ?? ['Código $code', 'cloud', '☁️'];
}

class WeatherService {
  /// Busca ciudades por nombre (geocodificación Open-Meteo).
  Future<List<GeoPlace>> searchPlaces(String name, {int count = 6}) async {
    final q = name.trim();
    if (q.isEmpty) return [];
    final url =
        '$_geoUrl?name=${Uri.encodeComponent(q)}&count=$count&language=es&format=json';
    final data = (await getJson(url)) as Map<String, dynamic>;
    final results = data['results'] as List<dynamic>?;
    return (results ?? [])
        .map((e) => GeoPlace.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Geocodificación + predicción en una sola llamada.
  Future<WeatherBundle> fetchWeather(GeoPlace place) async {
    final qp = {
      'latitude': '${place.latitude}',
      'longitude': '${place.longitude}',
      'current':
          'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
      'daily':
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
      'timezone': 'auto',
      'forecast_days': '7',
    };
    final query = qp.entries
        .map((e) =>
            '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
    final data = (await getJson('$_forecastUrl?$query')) as Map<String, dynamic>;

    final c = data['current'] as Map<String, dynamic>;
    final d = data['daily'] as Map<String, dynamic>;
    final meta = describeCode((c['weather_code'] as num?)?.toInt() ?? 0);

    final times = (d['time'] as List<dynamic>).cast<String>();
    final codes = ((d['weather_code'] as List<dynamic>?) ?? const []).cast<num>();
    final tMax = ((d['temperature_2m_max'] as List<dynamic>?) ?? const []).cast<num>();
    final tMin = ((d['temperature_2m_min'] as List<dynamic>?) ?? const []).cast<num>();
    final rain =
        ((d['precipitation_probability_max'] as List<dynamic>?) ?? const []).cast<num>();
    final sunrises = ((d['sunrise'] as List<dynamic>?) ?? const []).cast<String>();
    final sunsets = ((d['sunset'] as List<dynamic>?) ?? const []).cast<String>();

    return WeatherBundle(
      place: place,
      timezone: (data['timezone'] as String?) ?? 'auto',
      sunrise: sunrises.isNotEmpty ? sunrises.first : '',
      sunset: sunsets.isNotEmpty ? sunsets.first : '',
      current: CurrentWeather(
        time: (c['time'] as String?) ?? '',
        temp: (c['temperature_2m'] as num?)?.toDouble() ?? 0,
        feelsLike: (c['apparent_temperature'] as num?)?.toDouble() ?? 0,
        humidity: (c['relative_humidity_2m'] as num?)?.toInt() ?? 0,
        wind: (c['wind_speed_10m'] as num?)?.toDouble() ?? 0,
        isDay: ((c['is_day'] as num?)?.toInt() ?? 1) == 1,
        code: (c['weather_code'] as num?)?.toInt() ?? 0,
        description: meta[0],
        icon: meta[1],
        emoji: meta[2],
      ),
      daily: List.generate(times.length, (i) {
        return DailyForecast(
          date: times[i],
          code: i < codes.length ? codes[i].toInt() : 0,
          max: i < tMax.length ? tMax[i].toDouble() : 0,
          min: i < tMin.length ? tMin[i].toDouble() : 0,
          rainProb: i < rain.length ? rain[i].toInt() : 0,
        );
      }),
    );
  }
}

const quickCities = <GeoPlace>[
  GeoPlace(id: 3117735, name: 'Madrid', latitude: 40.4165, longitude: -3.70256, country: 'España'),
  GeoPlace(id: 2643743, name: 'London', latitude: 51.5085, longitude: -0.1257, country: 'Reino Unido'),
  GeoPlace(id: 5128581, name: 'New York', latitude: 40.7143, longitude: -74.006, country: 'Estados Unidos'),
  GeoPlace(id: 1850147, name: 'Tokyo', latitude: 35.6895, longitude: 139.6917, country: 'Japón'),
  GeoPlace(id: 117661, name: 'Ciudad de México', latitude: 19.4326, longitude: -99.1332, country: 'México'),
  GeoPlace(id: 3451190, name: 'Buenos Aires', latitude: -34.6132, longitude: -58.3772, country: 'Argentina'),
  GeoPlace(id: 3688689, name: 'Bogotá', latitude: 4.6097, longitude: -74.0817, country: 'Colombia'),
  GeoPlace(id: 3871336, name: 'Santiago', latitude: -33.4569, longitude: -70.6483, country: 'Chile'),
];

String formatPlace(GeoPlace p) {
  final parts = <String>[
    if (p.admin1 != null && p.admin1!.isNotEmpty) p.admin1!,
    if (p.country != null && p.country!.isNotEmpty) p.country!,
  ];
  return parts.join(', ');
}
