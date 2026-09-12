/// Widgets compartidos para las pantallas de Pokémon + helpers de formato.
import 'package:flutter/material.dart';

import 'models.dart';
import 'pokemon_service.dart';

Color typeColor(String t) =>
    Color(typeColorValues[t] ?? typeColorValues['unknown']!);

String typeLabel(String t) => typeNamesEs[t] ?? t;

String statLabel(String s) => statNamesEs[s] ?? s;

String capitalize(String s) {
  if (s.isEmpty) return s;
  final cleaned = s.replaceAll('-', ' ');
  return cleaned[0].toUpperCase() + cleaned.substring(1);
}

String heightM(int dm) => '${(dm / 10).toStringAsFixed(1)} m';
String weightKg(int hg) => '${(hg / 10).toStringAsFixed(1)} kg';

class TypeChip extends StatelessWidget {
  final String type;
  const TypeChip(this.type, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: typeColor(type),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        typeLabel(type),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _StatBar extends StatelessWidget {
  final String label;
  final int base;
  final Color color;
  const _StatBar({required this.label, required this.base, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 76,
          child: Text(label,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).hintColor,
              )),
        ),
        SizedBox(
          width: 34,
          child: Text('$base',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (base / 200).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor:
                  Theme.of(context).colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ),
      ],
    );
  }
}

/// Ficha completa del Pokémon construido (equivale a PokemonCard.tsx).
class PokeCard extends StatelessWidget {
  final ConstructedPokemon data;
  const PokeCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final accent = typeColor(data.types.isNotEmpty ? data.types.first : 'unknown');
    final idText = data.id > 9999
        ? '★${data.id ~/ 10000}·${data.id % 10000}'
        : '#${data.id}';

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [accent.withValues(alpha: 0.15), Colors.transparent],
              ),
            ),
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Image.network(
                  data.artwork,
                  height: 150,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.catching_pokemon, size: 64),
                  loadingBuilder: (_, child, progress) =>
                      progress == null ? child : const SizedBox(height: 150),
                ),
                Positioned(
                  top: 4,
                  right: 12,
                  child: Text(idText,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).hintColor,
                      )),
                ),
                if (data.shiny)
                  Positioned(
                    top: 4,
                    left: 12,
                    child: Row(
                      children: const [
                        Icon(Icons.auto_awesome,
                            size: 14, color: Color(0xFFF59E0B)),
                        SizedBox(width: 4),
                        Text('Variocolor',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFF59E0B),
                            )),
                      ],
                    ),
                  ),
                if (data.isSynthetic)
                  Positioned(
                    bottom: 4,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text('Fusión creada',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: accent,
                          )),
                    ),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(data.displayName,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.5,
                            )),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .secondaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Nv. ${data.level}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          )),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children:
                      data.types.map((t) => TypeChip(t)).toList(),
                ),
                if (data.genus != null) ...[
                  const SizedBox(height: 6),
                  Text(capitalize(data.genus!),
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).hintColor,
                      )),
                ],
                if (data.flavor != null) ...[
                  const SizedBox(height: 12),
                  Text('“${data.flavor}”',
                      style: TextStyle(
                        fontSize: 13.5,
                        height: 1.5,
                        fontStyle: FontStyle.italic,
                        color: Theme.of(context).hintColor,
                      )),
                ],
                const SizedBox(height: 14),
                Wrap(
                  spacing: 16,
                  runSpacing: 4,
                  children: [
                    Text.rich(TextSpan(children: [
                      TextSpan(
                          text: heightM(data.height),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700)),
                      const TextSpan(text: ' altura'),
                    ]), style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                    Text.rich(TextSpan(children: [
                      TextSpan(
                          text: weightKg(data.weight),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700)),
                      const TextSpan(text: ' peso'),
                    ]), style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                    if (data.abilities.isNotEmpty)
                      Text.rich(TextSpan(children: [
                        const TextSpan(text: 'Habilidad: '),
                        TextSpan(
                            text: capitalize(data.abilities.first.name),
                            style: const TextStyle(
                                fontWeight: FontWeight.w700)),
                      ]), style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                  ],
                ),
                const SizedBox(height: 16),
                ...data.stats.map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _StatBar(
                      label: statLabel(s.name),
                      base: s.base,
                      color: accent,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text('IVs aleatorios',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                      color: Theme.of(context).hintColor,
                    )),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: data.ivs.pairs
                      .map(
                        (pair) => Expanded(
                          child: Container(
                            margin: EdgeInsets.only(
                              right: pair != data.ivs.pairs.last ? 6 : 0,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .secondaryContainer
                                  .withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                Text('${pair.$2}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    )),
                                Text(pair.$1,
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Theme.of(context).hintColor,
                                    )),
                              ],
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
                if (data.moves.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text('Movimientos',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: Theme.of(context).hintColor,
                      )),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: data.moves
                        .map((m) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: Theme.of(context)
                                      .dividerColor
                                      .withValues(alpha: 0.5),
                                ),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: typeColor(m.type),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(capitalize(m.name),
                                      style: const TextStyle(fontSize: 12)),
                                  if (m.power != null)
                                    Text(' · ${m.power}P',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Theme.of(context).hintColor,
                                        )),
                                ],
                              ),
                            ))
                        .toList(),
                  ),
                ],
                if (data.sourceNote != null) ...[
                  const SizedBox(height: 14),
                  Text('${data.sourceNote} · datos de PokéAPI',
                      style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(context).hintColor,
                      )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
