/// Modelos compartidos por la capa de servicios.
/// Port 1:1 de los tipos TypeScript de `src/services/*`.

class GeoPlace {
  final int id;
  final String name;
  final double latitude;
  final double longitude;
  final String? country;
  final String? admin1;

  const GeoPlace({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.country,
    this.admin1,
  });

  factory GeoPlace.fromJson(Map<String, dynamic> j) => GeoPlace(
        id: (j['id'] as num?)?.toInt() ?? 0,
        name: (j['name'] as String?) ?? '',
        latitude: (j['latitude'] as num?)?.toDouble() ?? 0,
        longitude: (j['longitude'] as num?)?.toDouble() ?? 0,
        country: j['country'] as String?,
        admin1: j['admin1'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'latitude': latitude,
        'longitude': longitude,
        'country': country,
        'admin1': admin1,
      };

  factory GeoPlace.fromJsonMap(Map<String, dynamic> j) => GeoPlace.fromJson(j);
}

class CurrentWeather {
  final String time;
  final double temp;
  final double feelsLike;
  final int humidity;
  final double wind;
  final bool isDay;
  final int code;
  final String description;
  final String icon;
  final String emoji;

  const CurrentWeather({
    required this.time,
    required this.temp,
    required this.feelsLike,
    required this.humidity,
    required this.wind,
    required this.isDay,
    required this.code,
    required this.description,
    required this.icon,
    required this.emoji,
  });
}

class DailyForecast {
  final String date;
  final int code;
  final double max;
  final double min;
  final int rainProb;

  const DailyForecast({
    required this.date,
    required this.code,
    required this.max,
    required this.min,
    required this.rainProb,
  });
}

class WeatherBundle {
  final GeoPlace place;
  final String timezone;
  final String sunrise;
  final String sunset;
  final CurrentWeather current;
  final List<DailyForecast> daily;

  const WeatherBundle({
    required this.place,
    required this.timezone,
    required this.sunrise,
    required this.sunset,
    required this.current,
    required this.daily,
  });
}

class PokemonStat {
  final String name;
  final int base;
  const PokemonStat({required this.name, required this.base});
}

class PokemonAbility {
  final String name;
  final bool hidden;
  const PokemonAbility({required this.name, required this.hidden});
}

class PokemonData {
  final int id;
  final String name;
  final int height; // decímetros
  final int weight; // hectogramos
  final int baseExp;
  final List<String> types;
  final List<PokemonAbility> abilities;
  final List<PokemonStat> stats;
  final String sprite;
  final String artwork;
  final String? cry;
  final bool isSynthetic;
  final String? sourceNote;
  final String? flavor;
  final String? genus;

  const PokemonData({
    required this.id,
    required this.name,
    required this.height,
    required this.weight,
    required this.baseExp,
    required this.types,
    required this.abilities,
    required this.stats,
    required this.sprite,
    required this.artwork,
    this.cry,
    this.isSynthetic = false,
    this.sourceNote,
    this.flavor,
    this.genus,
  });
}

class PokemonMove {
  final String name;
  final int? accuracy;
  final int? power;
  final int? pp;
  final String type;
  final String damageClass;

  const PokemonMove({
    required this.name,
    required this.accuracy,
    required this.power,
    required this.pp,
    required this.type,
    required this.damageClass,
  });
}

class IvSet {
  final int hp, atk, def, spa, spd, spe;
  const IvSet({
    required this.hp,
    required this.atk,
    required this.def,
    required this.spa,
    required this.spd,
    required this.spe,
  });

  List<(String, int)> get pairs => [
        ('PS', hp),
        ('Ata', atk),
        ('Def', def),
        ('AtE', spa),
        ('DfE', spd),
        ('Vel', spe),
      ];
}

class ConstructedPokemon extends PokemonData {
  final String? nickname;
  final int level;
  final bool shiny;
  final IvSet ivs;
  final List<PokemonMove> moves;

  const ConstructedPokemon({
    required super.id,
    required super.name,
    required super.height,
    required super.weight,
    required super.baseExp,
    required super.types,
    required super.abilities,
    required super.stats,
    required super.sprite,
    required super.artwork,
    super.cry,
    super.isSynthetic,
    super.sourceNote,
    super.flavor,
    super.genus,
    required this.nickname,
    required this.level,
    required this.shiny,
    required this.ivs,
    required this.moves,
  });

  String get displayName => nickname ?? _pretty(name);

  static String _pretty(String s) {
    if (s.isEmpty) return s;
    final cleaned = s.replaceAll('-', ' ');
    return cleaned[0].toUpperCase() + cleaned.substring(1);
  }
}
