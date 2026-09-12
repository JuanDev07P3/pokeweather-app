/// Pestaña Clima — búsqueda de ciudades + condiciones actuales + 7 días.
import 'dart:async';

import 'package:flutter/material.dart';

import '../models.dart';
import '../poke_widgets.dart';
import '../weather_service.dart';

class ClimaScreen extends StatefulWidget {
  const ClimaScreen({super.key});

  @override
  State<ClimaScreen> createState() => _ClimaScreenState();
}

class _ClimaScreenState extends State<ClimaScreen> {
  final _service = WeatherService();
  final _controller = TextEditingController();

  WeatherBundle? _weather;
  List<GeoPlace> _results = [];
  bool _loading = true;
  bool _searching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load(quickCities.first);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load(GeoPlace place) async {
    setState(() {
      _loading = true;
      _weather = null;
    });
    try {
      final data = await _service.fetchWeather(place);
      if (mounted) setState(() => _weather = data);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo cargar el clima: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onQueryChanged(String q) {
    _debounce?.cancel();
    final term = q.trim();
    if (term.length < 2) {
      setState(() {
        _results = [];
        _searching = false;
      });
      return;
    }
    setState(() => _searching = true);
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      try {
        final r = await _service.searchPlaces(term, count: 6);
        if (mounted) setState(() => _results = r);
      } catch (_) {
        if (mounted) setState(() => _results = []);
      } finally {
        if (mounted) setState(() => _searching = false);
      }
    });
  }

  Future<void> _pick(GeoPlace place) async {
    FocusScope.of(context).unfocus();
    _controller.clear();
    setState(() => _results = []);
    await _load(place);
  }

  static const _weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  String _dayLabel(String iso, int index) {
    if (index == 0) return 'Hoy';
    final d = DateTime.tryParse('${iso}T12:00:00');
    if (d == null) return iso.substring(5);
    return _weekdays[d.weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final w = _weather;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        TextField(
          controller: _controller,
          onChanged: _onQueryChanged,
          decoration: InputDecoration(
            hintText: 'Busca una ciudad… (ej. Lima, Valencia)',
            prefixIcon: const Icon(Icons.search, size: 20),
            suffixIcon: _searching
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
          ),
        ),
        if (_results.isNotEmpty)
          Card(
            margin: const EdgeInsets.only(top: 8),
            child: Column(
              children: _results
                  .map(
                    (p) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.location_on_outlined, size: 18),
                      title: Text(p.name,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(formatPlace(p),
                          style: const TextStyle(fontSize: 12)),
                      onTap: () => _pick(p),
                    ),
                  )
                  .toList(),
            ),
          ),
        const SizedBox(height: 12),
        if (_loading)
          const Card(
            child: SizedBox(
              height: 220,
              child: Center(child: CircularProgressIndicator()),
            ),
          )
        else if (w != null) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${w.place.name}${formatPlace(w.place).isNotEmpty ? ' · ${formatPlace(w.place)}' : ''}',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${w.current.temp.round()}°',
                          style: Theme.of(context)
                              .textTheme
                              .displayMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: -3,
                              )),
                      const SizedBox(width: 12),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          '${w.current.emoji} ${w.current.description}\nSensación ${w.current.feelsLike.round()}° · ${w.timezone}',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _metric(Icons.air, 'Viento',
                          '${w.current.wind.round()} km/h'),
                      _metric(Icons.water_drop_outlined, 'Humedad',
                          '${w.current.humidity}%'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('PRÓXIMOS 7 DÍAS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                          color: Theme.of(context).hintColor,
                        )),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 118,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: w.daily.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final d = w.daily[i];
                        final meta = describeCode(d.code);
                        return Container(
                          width: 86,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context)
                                  .dividerColor
                                  .withValues(alpha: 0.6),
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(_dayLabel(d.date, i),
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700)),
                              const SizedBox(height: 6),
                              Text(meta[2], style: const TextStyle(fontSize: 22)),
                              const SizedBox(height: 4),
                              Text('💧 ${d.rainProb}%',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context).hintColor)),
                              const SizedBox(height: 2),
                              Text(
                                '${d.max.round()}° ${d.min.round()}°',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _metric(IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.secondaryContainer.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11, color: Theme.of(context).hintColor)),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
