/// Pestaña Lab — el Constructor completo: origen + modificadores → Pokémon.
import 'package:flutter/material.dart';

import '../models.dart';
import '../poke_widgets.dart';
import '../pokemon_service.dart';

class LabScreen extends StatefulWidget {
  const LabScreen({super.key});

  @override
  State<LabScreen> createState() => _LabScreenState();
}

enum _Source { name, id, type, ability, generation, random, hybrid }

const _sourceLabels = <_Source, String>{
  _Source.name: 'Por nombre',
  _Source.id: 'Por número',
  _Source.type: 'Aleatorio de tipo',
  _Source.ability: 'Aleatorio por habilidad',
  _Source.generation: 'Aleatorio por generación',
  _Source.random: 'Totalmente aleatorio',
  _Source.hybrid: 'Fusión de dos especies',
};

const _abilities = [
  'intimidate', 'levitate', 'speed-boost', 'drizzle', 'drought', 'multiscale',
  'prankster', 'regenerator', 'huge-power', 'magic-bounce', 'gale-wings',
];

class _LabScreenState extends State<LabScreen> {
  final _api = PokemonApi();

  _Source _source = _Source.name;
  final _nameCtrl = TextEditingController();
  final _idCtrl = TextEditingController(text: '25');
  String _type = 'fire';
  String _ability = 'intimidate';
  int _gen = 1;
  final _hybridACtrl = TextEditingController(text: 'gengar');
  final _hybridBCtrl = TextEditingController(text: 'alakazam');

  double _level = 50;
  bool _shiny = false;
  final _nicknameCtrl = TextEditingController();
  final _movesCtrl = TextEditingController();

  ConstructedPokemon? _result;
  bool _building = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _idCtrl.dispose();
    _hybridACtrl.dispose();
    _hybridBCtrl.dispose();
    _nicknameCtrl.dispose();
    _movesCtrl.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    String? error;
    if (_source == _Source.name && _nameCtrl.text.trim().isEmpty) {
      error = 'Escribe un nombre (p. ej. pikachu).';
    } else if (_source == _Source.id &&
        !RegExp(r'^\d+$').hasMatch(_idCtrl.text.trim())) {
      error = 'Escribe un número de Pokédex válido.';
    } else if (_source == _Source.hybrid &&
        (_hybridACtrl.text.trim().isEmpty || _hybridBCtrl.text.trim().isEmpty)) {
      error = 'Escribe las dos especies a fusionar.';
    }
    if (error != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error)));
      return;
    }

    setState(() {
      _building = true;
      _result = null;
    });
    try {
      PokemonConstructor ctor = PokemonConstructor(_api).level(_level.round());
      if (_shiny) ctor = ctor.shiny();
      if (_nicknameCtrl.text.trim().isNotEmpty) {
        ctor = ctor.nickname(_nicknameCtrl.text);
      }
      final moves = _movesCtrl.text
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .where((s) => s.isNotEmpty)
          .toList();
      if (moves.isNotEmpty) ctor = ctor.withMoves(moves);

      switch (_source) {
        case _Source.name:
          ctor = ctor.name(_nameCtrl.text.trim().toLowerCase());
          break;
        case _Source.id:
          ctor = ctor.id(int.parse(_idCtrl.text.trim()));
          break;
        case _Source.type:
          ctor = ctor.byType(_type);
          break;
        case _Source.ability:
          ctor = ctor.ability(_ability);
          break;
        case _Source.generation:
          ctor = ctor.generation(_gen);
          break;
        case _Source.random:
          ctor = ctor.random();
          break;
        case _Source.hybrid:
          ctor = ctor.hybrid(
            _hybridACtrl.text.trim().toLowerCase(),
            _hybridBCtrl.text.trim().toLowerCase(),
          );
          break;
      }

      final data = await ctor.build();
      if (mounted) setState(() => _result = data);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo construir: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _building = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hint = Theme.of(context).hintColor;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Text('ORIGEN DE CONSULTA',
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: hint)),
        const SizedBox(height: 6),
        DropdownButtonFormField<_Source>(
          value: _source,
          items: _sourceLabels.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (v) => setState(() => _source = v ?? _Source.name),
        ),
        const SizedBox(height: 12),
        ...switch (_source) {
          _Source.name => [
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                    labelText: 'Nombre de la especie',
                    hintText: 'pikachu, charizard, mewtwo…'),
              )
            ],
          _Source.id => [
              TextField(
                controller: _idCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                    labelText: 'Número de Pokédex', hintText: '25'),
              )
            ],
          _Source.type => [
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: typeNamesEs.entries
                    .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                    .toList(),
                onChanged: (v) => setState(() => _type = v ?? 'fire'),
              )
            ],
          _Source.ability => [
              DropdownButtonFormField<String>(
                value: _ability,
                decoration: const InputDecoration(labelText: 'Habilidad'),
                items: _abilities
                    .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                    .toList(),
                onChanged: (v) => setState(() => _ability = v ?? 'intimidate'),
              )
            ],
          _Source.generation => [
              DropdownButtonFormField<int>(
                value: _gen,
                decoration: const InputDecoration(labelText: 'Generación'),
                items: List.generate(9, (i) => i + 1)
                    .map((g) =>
                        DropdownMenuItem(value: g, child: Text('Generación $g')))
                    .toList(),
                onChanged: (v) => setState(() => _gen = v ?? 1),
              )
            ],
          _Source.random => [const SizedBox.shrink()],
          _Source.hybrid => [
              TextField(
                controller: _hybridACtrl,
                decoration: const InputDecoration(
                    labelText: 'Especie A', hintText: 'gengar'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _hybridBCtrl,
                decoration: const InputDecoration(
                    labelText: 'Especie B', hintText: 'alakazam'),
              ),
            ],
        },
        const SizedBox(height: 18),
        Row(
          children: [
            Text('Nivel ${_level.round()}',
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700)),
            Expanded(
              child: Slider(
                value: _level,
                min: 1,
                max: 100,
                divisions: 99,
                onChanged: (v) => setState(() => _level = v),
              ),
            ),
          ],
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Row(children: [
            Icon(Icons.auto_awesome, size: 16, color: Color(0xFFF59E0B)),
            SizedBox(width: 6),
            Text('Variocolor (shiny)', style: TextStyle(fontSize: 13)),
          ]),
          value: _shiny,
          onChanged: (v) => setState(() => _shiny = v),
        ),
        TextField(
          controller: _nicknameCtrl,
          decoration: const InputDecoration(
              labelText: 'Apodo (opcional)', hintText: 'Chispita…'),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _movesCtrl,
          decoration: const InputDecoration(
              labelText: 'Movimientos (opcional)',
              hintText: 'flamethrower, earthquake…'),
        ),
        const SizedBox(height: 18),
        FilledButton.icon(
          onPressed: _building ? null : _generate,
          icon: _building
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.science_outlined),
          label: Text(_building ? 'Construyendo…' : 'Construir Pokémon'),
        ),
        const SizedBox(height: 16),
        if (_building)
          const Card(
            child: SizedBox(
              height: 160,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Consultando varias APIs de Pokémon…'),
                  ],
                ),
              ),
            ),
          ),
        if (_result != null) PokeCard(data: _result!),
      ],
    );
  }
}
