#!/usr/bin/env bash
# Verifica que ESTA carpeta contiene la app Pokéclima y no la plantilla demo.
# Úsalo antes de compilar:  bash check_project.sh
set -u
cd "$(dirname "$0")"

fail() {
  echo "❌  $1"
  echo "    → Vuelve a copiar la carpeta completa flutter_app/ desde el proyecto"
  echo "      (sobrescribiendo todo) y vuelve a ejecutar este script."
  exit 1
}

[ -f "lib/main.dart" ]            || fail "Falta lib/main.dart."
grep -q "PokeclimaApp" lib/main.dart || fail "lib/main.dart no es Pokéclima (quedó la plantilla demo)."
grep -q "Flutter Demo Home Page" lib/main.dart && fail "lib/main.dart ES la plantilla demo de Flutter."
[ -f "lib/pokemon_service.dart" ] || fail "Falta lib/pokemon_service.dart (el Constructor)."
[ -f "lib/weather_service.dart" ] || fail "Falta lib/weather_service.dart."
[ -f "pubspec.yaml" ] && grep -q "pokeclima" pubspec.yaml || fail "Falta el pubspec.yaml de Pokéclima."

echo "✅  Carpeta correcta: Pokéclima presente (PokeclimaApp + servicios)."
echo "    Sigue con:"
echo "      flutter create . --platforms android --project-name pokeclima"
echo "      flutter pub get"
echo "      flutter build apk --release"
