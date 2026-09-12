/// Pestaña Explorar — consultas rápidas a PokéAPI a través del Constructor.
import 'package:flutter/material.dart';

import '../models.dart';
import '../poke_widgets.dart';
import '../pokemon_service.dart';

class ExplorarScreen extends StatefulWidget {
  const ExplorarScreen({super.key});

  @override
  State<ExplorarScreen> createState() => _ExplorarScreenState();
}

class _ExplorarScreenState extends State<ExplorarScreen> {
  final _api = PokemonApi();
  final _controller = TextEditingController();

  ConstructedPokemon? _result;
  bool _loading = false;
  String? _typeFilter;

  Future<void> _build(Future<ConstructedPokemon> Function() fn) async {
    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final data = await fn();
      if (mounted) setState(() => _result = data);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PokéAPI no respondió: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _search(String raw) {
    final q = raw.trim().toLowerCase();
    if (q.isEmpty) return;
    final ctor = PokemonConstructor(_api).level(50);
    if (RegExp(r'^\d+$').hasMatch(q)) {
      _build(() => ctor.id(int.parse(q)).build());
    } else {
      _build(() => ctor.name(q).build());
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                onSubmitted: _search,
                decoration: const InputDecoration(
                  hintText: 'Nombre o número (pikachu, 25, gengar…)',
                  prefixIcon: Icon(Icons.search, size: 20),
                ),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: _loading ? null : () => _search(_controller.text),
              child: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Consultar'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _typeFilter,
          decoration: const InputDecoration(labelText: 'Aleatorio por tipo'),
          items: typeNamesEs.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (t) {
            if (t == null) return;
            setState(() => _typeFilter = t);
            _build(() => PokemonConstructor(_api).byType(t).level(50).build());
          },
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : () => _build(
                  () => PokemonConstructor(_api).random().level(50).build()),
          icon: const Icon(Icons.casino_outlined),
          label: const Text('Sorpréndeme — Pokémon aleatorio'),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const Card(
            child: SizedBox(
              height: 180,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Consultando PokéAPI…'),
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
