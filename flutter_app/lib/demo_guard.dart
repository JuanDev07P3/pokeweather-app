// ¿Qué app estoy corriendo?
// Si en la pantalla superior izquierda ves "Pokéclima v1.0" durante ~3
// segundos al abrir la app, compilaste el proyecto correcto.
//
// Si no lo ves y aparece "Flutter Demo Home Page", el APK es la plantilla:
// revisa README.md → "¿La app muestra Flutter Demo Home Page?".
//
// Para activar la marca, en lib/main.dart cambia:
//   home: const HomePage(),
// por:
//   home: const BuildMarker(child: HomePage()),
import 'dart:async';
import 'package:flutter/material.dart';

class BuildMarker extends StatefulWidget {
  const BuildMarker({super.key, required this.child});
  final Widget child;

  @override
  State<BuildMarker> createState() => _BuildMarkerState();
}

class _BuildMarkerState extends State<BuildMarker> {
  bool _visible = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _visible = false);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_visible)
          Positioned(
            top: 40,
            left: 12,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Pokéclima v1.0',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
