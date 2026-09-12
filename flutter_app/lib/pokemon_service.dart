/// Servicio Pokémon — PokéAPI (https://pokeapi.co)
/// Port 1:1 de `src/services/pokemon.ts`:
///  1. [PokemonApi]         → cliente multi-endpoint
///  2. [PokemonConstructor] → builder fluido con 7 orígenes de consulta
import 'dart:math' as math;

import 'http_client.dart';
import 'models.dart';

const _base = 'https://pokeapi.co/api/v2';
const _sprites =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/// Colores por tipo (ARGB). typeColor() vive en poke_widgets.dart.
const typeColorValues = <String, int>{
  'normal': 0xFF9FA19F,
  'fire': 0xFFE62829,
  'water': 0xFF2980EF,
  'electric': 0xFFFAC000,
  'grass': 0xFF3FA129,
  'ice': 0xFF3DCEF3,
  'fighting': 0xFFFF8000,
  'poison': 0xFF9141CB,
  'ground': 0xFF915121,
  'flying': 0xFF81B9EF,
  'psychic': 0xFFEF4179,
  'bug': 0xFF91A119,
  'rock': 0xFFAFA981,
  'ghost': 0xFF704170,
  'dragon': 0xFF5060E1,
  'dark': 0xFF624D4E,
  'steel': 0xFF60A1B8,
  'fairy': 0xFFEF70EF,
  'stellar': 0xFF40B5A5,
  'unknown': 0xFF68A090,
};

const typeNamesEs = <String, String>{
  'normal': 'Normal',
  'fire': 'Fuego',
  'water': 'Agua',
  'electric': 'Eléctrico',
  'grass': 'Planta',
  'ice': 'Hielo',
  'fighting': 'Lucha',
  'poison': 'Veneno',
  'ground': 'Tierra',
  'flying': 'Volador',
  'psychic': 'Psíquico',
  'bug': 'Bicho',
  'rock': 'Roca',
  'ghost': 'Fantasma',
  'dragon': 'Dragón',
  'dark': 'Siniestro',
  'steel': 'Acero',
  'fairy': 'Hada',
  'stellar': 'Estelar',
  'unknown': 'Desconocido',
};

const statNamesEs = <String, String>{
  'hp': 'PS',
  'attack': 'Ataque',
  'defense': 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  'speed': 'Velocidad',
};

int baseStatOf(PokemonData p, String statName) {
  for (final s in p.stats) {
    if (s.name == statName) return s.base;
  }
  return 0;
}

class PokemonApi {
  final Map<String, dynamic> _cache = {};

  Future<Map<String, dynamic>> _fetchEndpoint(String path) async {
    final hit = _cache[path];
    if (hit != null) return hit;
    final data = (await getJson('$_base$path')) as Map<String, dynamic>;
    _cache[path] = data;
    return data;
  }

  /// GET /pokemon/{name|id}
  Future<PokemonData> getPokemon(dynamic query) async {
    final raw = await _fetchEndpoint(
      '/pokemon/${query.toString().toLowerCase().trim()}',
    );
    return _mapPokemon(raw);
  }

  /// GET /type/{name}
  Future<List<PokemonData>> getByType(String type) async {
    final raw = await _fetchEndpoint('/type/${type.toLowerCase().trim()}');
    final entries = (raw['pokemon'] as List<dynamic>? ?? const []);
    final names = entries
        .take(24)
        .map((e) =>
            (((e as Map<String, dynamic>)['pokemon'] as Map<String, dynamic>)['name'])
                as String)
        .toList();
    return _fetchByNames(names);
  }

  /// GET /ability/{name}
  Future<List<PokemonData>> getByAbility(String ability) async {
    final raw = await _fetchEndpoint('/ability/${ability.toLowerCase().trim()}');
    final entries = (raw['pokemon'] as List<dynamic>? ?? const []);
    final names = entries
        .take(24)
        .map((e) =>
            (((e as Map<String, dynamic>)['pokemon'] as Map<String, dynamic>)['name'])
                as String)
        .toList();
    return _fetchByNames(names);
  }

  /// GET /generation/{id}
  Future<List<PokemonData>> getByGeneration(int gen) async {
    final raw = await _fetchEndpoint('/generation/$gen');
    final entries = (raw['pokemon_species'] as List<dynamic>? ?? const []);
    final names = entries
        .take(24)
        .map((e) => (e as Map<String, dynamic>)['name'] as String)
        .toList();
    return _fetchByNames(names);
  }

  Future<List<PokemonData>> _fetchByNames(List<String> names) async {
    final futures = names.map((nm) async {
      try {
        return await getPokemon(nm);
      } catch (_) {
        return null;
      }
    });
    final all = await Future.wait(futures);
    return all.whereType<PokemonData>().toList();
  }

  /// GET /pokemon-species/{id} → (flavor, genus), best-effort.
  Future<(String?, String?)> getSpecies(dynamic idOrName) async {
    final raw = await _fetchEndpoint('/pokemon-species/$idOrName');
    return _pickSpeciesText(raw);
  }

  (String?, String?) _pickSpeciesText(Map<String, dynamic> raw) {
    String? flavorEs;
    String? flavorEn;
    for (final e in (raw['flavor_text_entries'] as List<dynamic>? ?? const [])) {
      final m = e as Map<String, dynamic>;
      final lang = ((m['language'] as Map<String, dynamic>)['name']) as String;
      final text =
          (m['flavor_text'] as String).replaceAll(RegExp(r'\s+'), ' ').trim();
      if (lang == 'es' && flavorEs == null) flavorEs = text;
      if (lang == 'en' && flavorEn == null) flavorEn = text;
    }
    String? genusEs;
    String? genusEn;
    for (final e in (raw['genera'] as List<dynamic>? ?? const [])) {
      final m = e as Map<String, dynamic>;
      final lang = ((m['language'] as Map<String, dynamic>)['name']) as String;
      if (lang == 'es' && genusEs == null) genusEs = m['genus'] as String?;
      if (lang == 'en' && genusEn == null) genusEn = m['genus'] as String?;
    }
    return (flavorEs ?? flavorEn, genusEs ?? genusEn);
  }

  /// GET /move/{name}
  Future<PokemonMove> getMove(String name) async {
    final raw =
        await _fetchEndpoint('/move/${name.toLowerCase().trim()}');
    return PokemonMove(
      name: raw['name'] as String,
      accuracy: (raw['accuracy'] as num?)?.toInt(),
      power: (raw['power'] as num?)?.toInt(),
      pp: (raw['pp'] as num?)?.toInt(),
      type: ((raw['type'] as Map<String, dynamic>)['name']) as String,
      damageClass:
          ((raw['damage_class'] as Map<String, dynamic>)['name']) as String,
    );
  }

  /// GET /pokemon?limit=1025 — índice completo de la Pokédex.
  Future<List<String>> getAllNames({int limit = 1025}) async {
    final raw = await _fetchEndpoint('/pokemon?limit=$limit');
    return (raw['results'] as List<dynamic>? ?? const [])
        .map((e) => (e as Map<String, dynamic>)['name'] as String)
        .toList();
  }

  /// GET /pokemon/{id} — sección de movimientos (learnset).
  Future<List<Map<String, dynamic>>> getLearnset(dynamic idOrName) async {
    final raw = await _fetchEndpoint('/pokemon/$idOrName');
    return (raw['moves'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
  }

  PokemonData _mapPokemon(Map<String, dynamic> raw) {
    final id = (raw['id'] as num).toInt();
    final name = raw['name'] as String? ?? '';
    final types = ((raw['types'] as List<dynamic>? ?? const []) as List<dynamic>)
        .map((t) =>
            (((t as Map<String, dynamic>)['type'] as Map<String, dynamic>)['name'])
                as String)
        .toList();
    final abilities = (raw['abilities'] as List<dynamic>? ?? const [])
        .map((a) => PokemonAbility(
              name: (((a as Map<String, dynamic>)['ability']
                  as Map<String, dynamic>)['name']) as String,
              hidden: (a['is_hidden'] as bool?) ?? false,
            ))
        .toList();
    final stats = (raw['stats'] as List<dynamic>? ?? const [])
        .map((s) => PokemonStat(
              name: (((s as Map<String, dynamic>)['stat']
                  as Map<String, dynamic>)['name']) as String,
              base: (s['base_stat'] as num? ?? 0).toInt(),
            ))
        .toList();
    final sprites = raw['sprites'] as Map<String, dynamic>?;
    final cries = raw['cries'] as Map<String, dynamic>?;
    return PokemonData(
      id: id,
      name: name,
      height: (raw['height'] as num? ?? 0).toInt(),
      weight: (raw['weight'] as num? ?? 0).toInt(),
      baseExp: (raw['base_experience'] as num? ?? 0).toInt(),
      types: types,
      abilities: abilities,
      stats: stats,
      sprite: (sprites?['front_default'] as String?) ?? '',
      artwork: '$_sprites/other/official-artwork/$id.png',
      cry: cries?['latest'] as String?,
    );
  }
}

enum _Source { name, id, type, ability, generation, random, hybrid }

/// Builder fluido:
///
///   final poke = await PokemonConstructor(api)
///       .name('charizard').level(72).shiny()
///       .withMoves(['flamethrower', 'dragon-claw'])
///       .build();
///
///   final fusion = await PokemonConstructor(api)
///       .hybrid('gengar', 'alakazam')
///       .build();
class PokemonConstructor {
  final PokemonApi _api;
  _Source _source = _Source.name;
  dynamic _query;
  String _secondary = '';
  String _type = '';
  String _ability = '';
  int _generation = 0;
  String? _minStatName;
  int _minStatValue = 0;
  int _level = 50;
  bool _shiny = false;
  String? _nickname;
  List<String> _moveNames = [];

  PokemonConstructor(this._api);

  /* ---- origen de consulta (gana el último) ---- */
  PokemonConstructor name(String n) {
    _source = _Source.name;
    _query = n;
    return this;
  }

  PokemonConstructor id(int n) {
    _source = _Source.id;
    _query = n;
    return this;
  }

  PokemonConstructor byType(String t) {
    _source = _Source.type;
    _type = t;
    return this;
  }

  PokemonConstructor ability(String a) {
    _source = _Source.ability;
    _ability = a;
    return this;
  }

  PokemonConstructor generation(int g) {
    _source = _Source.generation;
    _generation = g;
    return this;
  }

  PokemonConstructor random() {
    _source = _Source.random;
    return this;
  }

  PokemonConstructor hybrid(String a, String b) {
    _source = _Source.hybrid;
    _query = a;
    _secondary = b;
    return this;
  }

  /* ---- modificadores ---- */
  PokemonConstructor level(int l) {
    _level = l.clamp(1, 100);
    return this;
  }

  PokemonConstructor shiny() {
    _shiny = true;
    return this;
  }

  PokemonConstructor nickname(String n) {
    _nickname = n.trim().isEmpty ? null : n.trim();
    return this;
  }

  PokemonConstructor withMoves(List<String> names) {
    _moveNames = names.map((m) => m.toLowerCase().trim()).toList();
    return this;
  }

  PokemonConstructor minStat(String stat, int value) {
    _minStatName = stat;
    _minStatValue = value;
    return this;
  }

  /* ---- ejecución ---- */

  Future<ConstructedPokemon> build() async {
    final base = await _resolveBase();
    final moves = await _resolveMoves(base);

    var flavor = base.flavor;
    var genus = base.genus;
    if (!base.isSynthetic) {
      try {
        final sp = await _api.getSpecies(base.id);
        flavor ??= sp.$1;
        genus ??= sp.$2;
      } catch (_) {}
    }

    final sprite = _shiny && !base.isSynthetic
        ? '$_sprites/shiny/${base.id}.png'
        : base.sprite;
    final artwork = _shiny && !base.isSynthetic
        ? '$_sprites/other/official-artwork/shiny/${base.id}.png'
        : base.artwork;

    return ConstructedPokemon(
      id: base.id,
      name: base.name,
      height: base.height,
      weight: base.weight,
      baseExp: base.baseExp,
      types: base.types,
      abilities: base.abilities,
      stats: base.stats,
      sprite: sprite,
      artwork: artwork,
      cry: base.cry,
      isSynthetic: base.isSynthetic,
      sourceNote: base.sourceNote ?? _describeSource(),
      flavor: flavor,
      genus: genus,
      nickname: _nickname,
      level: _level,
      shiny: _shiny,
      ivs: _rollIvs(),
      moves: moves,
    );
  }

  Future<PokemonData> _resolveBase() async {
    switch (_source) {
      case _Source.id:
        return _api.getPokemon(_query as int);
      case _Source.name:
        return _api.getPokemon(_query as String);
      case _Source.random:
        final list = await _api.getAllNames();
        final rng = math.Random();
        final pick = list[rng.nextInt(list.length)];
        return _applyStatFilter(() => _api.getPokemon(pick));
      case _Source.type:
        return _applyStatFilter(() async {
          final list = await _api.getByType(_type);
          if (list.isEmpty) {
            throw ApiError('Tipo «$_type» sin resultados', 404, _type);
          }
          return list[math.Random().nextInt(list.length)];
        });
      case _Source.ability:
        return _applyStatFilter(() async {
          final list = await _api.getByAbility(_ability);
          if (list.isEmpty) {
            throw ApiError('Habilidad «$_ability» sin resultados', 404, _ability);
          }
          return list[math.Random().nextInt(list.length)];
        });
      case _Source.generation:
        return _applyStatFilter(() async {
          final list = await _api.getByGeneration(_generation);
          if (list.isEmpty) {
            throw ApiError(
                'Generación $_generation sin resultados', 404, '$_generation');
          }
          return list[math.Random().nextInt(list.length)];
        });
      case _Source.hybrid:
        return _buildHybrid();
    }
  }

  /// Reintenta hasta satisfacer minStat (máx. 12 intentos).
  Future<PokemonData> _applyStatFilter(
    Future<PokemonData> Function() produce,
  ) async {
    if (_minStatName == null) return produce();
    for (var i = 0; i < 12; i++) {
      final p = await produce();
      if (baseStatOf(p, _minStatName!) >= _minStatValue) return p;
    }
    throw ApiError(
      'Ningún resultado alcanzó $_minStatName ≥ $_minStatValue en 12 intentos.',
      422,
      'minStat',
    );
  }

  /// Fusiona dos especies en una criatura sintética.
  Future<PokemonData> _buildHybrid() async {
    final a = await _api.getPokemon(_query as String);
    final b = await _api.getPokemon(_secondary);
    final rng = math.Random();
    T pick<T>(T x, T y) => rng.nextBool() ? x : y;

    const statNames = [
      'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed',
    ];
    final merged = statNames
        .map((n) {
          final sa = baseStatOf(a, n);
          final sb = baseStatOf(b, n);
          return PokemonStat(
            name: n,
            base: math.min(255, ((sa + sb) / 2).round() + (rng.nextInt(21) - 10)),
          );
        })
        .toList();

    final secondaryTypes =
        rng.nextBool() ? a.types.skip(1).toList() : b.types.skip(1).toList();
    final types = <String>{
      pick(a.types.first, b.types.first),
      ...secondaryTypes,
    }.take(2).toList();

    final abilities = <PokemonAbility>[
      if (a.abilities.isNotEmpty && b.abilities.isNotEmpty)
        pick(a.abilities.first, b.abilities.first),
    ];

    String? flavorA;
    String? genusA;
    String? genusB;
    try {
      final s = await _api.getSpecies(a.id);
      flavorA = s.$1;
      genusA = s.$2;
    } catch (_) {}
    try {
      final s = await _api.getSpecies(b.id);
      genusB = s.$2;
    } catch (_) {}

    final nameA = a.name;
    final nameB = b.name;
    final fused =
        '${nameA.substring(0, math.max(3, (nameA.length / 2).ceil()))}'
        '${nameB.substring(nameB.length ~/ 2)}';

    return PokemonData(
      id: a.id * 10000 + b.id, // namespace sintético
      name: fused,
      height: ((a.height + b.height) / 2).round(),
      weight: ((a.weight + b.weight) / 2).round(),
      baseExp: ((a.baseExp + b.baseExp) / 2).round(),
      types: types,
      abilities: abilities,
      stats: merged,
      sprite: b.sprite,
      artwork: b.artwork,
      cry: a.cry ?? b.cry,
      isSynthetic: true,
      sourceNote: 'Híbrido $nameA + $nameB',
      flavor: flavorA,
      genus: pick(genusA, genusB) ?? 'Pokémon',
    );
  }

  /// Resuelve los movimientos pedidos vía /move/{name};
  /// si no, usa el learnset real de la especie.
  Future<List<PokemonMove>> _resolveMoves(PokemonData base) async {
    if (_moveNames.isNotEmpty) {
      final moves = <PokemonMove>[];
      for (final m in _moveNames) {
        try {
          moves.add(await _api.getMove(m));
        } catch (_) {}
      }
      if (moves.isNotEmpty) return moves.take(4).toList();
    }
    return _fallbackMoves(base);
  }

  Future<List<PokemonMove>> _fallbackMoves(PokemonData base) async {
    try {
      final learnset = await _api.getLearnset(base.id);
      int maxLevel(Map<String, dynamic> m) {
        var mx = 0;
        for (final d
            in (m['version_group_details'] as List<dynamic>? ?? const [])) {
          mx = math.max(
            mx,
            (((d as Map<String, dynamic>)['level_learned_at'] as num?) ?? 0)
                .toInt(),
          );
        }
        return mx;
      }

      final ranked = [...learnset]
        ..sort((x, y) => maxLevel(y).compareTo(maxLevel(x)));
      final picks = ranked.where((m) {
        final n = ((m['move'] as Map<String, dynamic>)['name']) as String;
        return n != 'transform' && n != 'struggle';
      }).take(4).toList();

      final out = <PokemonMove>[];
      for (final p in picks) {
        try {
          out.add(await _api.getMove(
            ((p['move'] as Map<String, dynamic>)['name']) as String,
          ));
        } catch (_) {}
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  String _describeSource() {
    switch (_source) {
      case _Source.name:
        return 'Consultado por nombre: $_query';
      case _Source.id:
        return 'Consultado por ID #$_query';
      case _Source.type:
        return 'Aleatorio de tipo $_type';
      case _Source.ability:
        return 'Aleatorio con habilidad $_ability';
      case _Source.generation:
        return 'Aleatorio de generación $_generation';
      case _Source.random:
        return 'Aleatorio de la Pokédex completa';
      case _Source.hybrid:
        return 'Híbrido $_query + $_secondary';
    }
  }
}

IvSet _rollIvs() {
  int r() => 1 + math.Random().nextInt(31);
  return IvSet(hp: r(), atk: r(), def: r(), spa: r(), spd: r(), spe: r());
}
