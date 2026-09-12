# Pokéclima para Flutter 🌤️🐾

App móvil nativa (Flutter → APK Android) con las **dos APIs** del proyecto web:
**Open-Meteo** (clima) y **PokéAPI** (Pokédex), incluyendo el
**`PokemonConstructor`**: un builder fluido que consulta varias APIs de Pokémon
o genera especies nuevas por fusión.

Sin claves de API: ambas APIs son gratuitas y públicas.

---

## Cómo obtener el APK

### Opción A — GitHub Actions (recomendado, sin instalar nada)
1. Sube la carpeta `flutter_app/` a un repositorio de GitHub (con `.github/` incluido).
2. El workflow **Build APK** compila automáticamente en cada push a `main`
   (o ejecútalo a mano en *Actions → Build APK → Run workflow*).
3. Descarga el artefacto `pokeclima-apk` → `app-release.apk`.

> El workflow ejecuta `flutter create .` para generar el scaffolding Android
> que no se incluye en el repo, respeta tu `AndroidManifest.xml` (permiso
> INTERNET) y compila en modo release.

### Opción B — Compilar en tu máquina
```bash
# Requiere Flutter stable reciente (≥ 3.32, Dart ≥ 3.6)
# https://docs.flutter.dev/get-started/install
cd flutter_app
flutter create . --platforms android --project-name pokeclima   # genera android/ e ios/
flutter pub get
flutter build apk --release
# → build/app/outputs/flutter-apk/app-release.apk
```

Para probar en caliente mientras desarrollas:
```bash
flutter run
```

#### ⚠️ ¿La app muestra "Flutter Demo Home Page"?
Ese título pertenece a la app plantilla de Flutter, **no** a Pokéclima: se
compiló otro proyecto. Verifica siempre **antes** de compilar:

```bash
cd flutter_app                       # la carpeta copiada de este proyecto
grep PokeclimaApp lib/main.dart      # DEBE imprimir coincidencias
```

- Si el `grep` **no imprime nada**, tu copia perdió `lib/main.dart`: vuelve a
  copiar la carpeta completa `flutter_app/` (sobrescribiendo todo) y repite.
- **No** ejecutes `flutter create pokeclima`: eso crea un proyecto NUEVO con la
  app demo. Solo `flutter create .` (con punto), *dentro* de `flutter_app/`.
- Desinstala del teléfono la app demo antes de instalar la buena.
- Comprueba que el APK que instalas es el recién generado en
  `build/app/outputs/flutter-apk/app-release.apk` (fecha/hora actual).

### Opción C — Sin instalar nada, desde la nube
Abre el repositorio en **Gitpod / GitHub Codespaces** con la imagen de Flutter
(devcontainer `ghcr.io/cirruslabs/flutter`) y ejecuta la Opción B.

---

## Instalar el APK en tu teléfono
1. Copia `app-release.apk` al móvil.
2. Ábrelo; Android pedirá permiso para "instalar apps de fuentes desconocidas".
3. Listo: Pokéclima instalada.

---

## Estructura

```
lib/
├── main.dart               # Tema "Modern" + shell de 3 pestañas
├── models.dart             # Modelos (GeoPlace, WeatherBundle, PokemonData, ConstructedPokemon…)
├── http_client.dart        # getJson + ApiError (equivale a src/services/http.ts)
├── weather_service.dart    # Open-Meteo: geocodificación + predicción (WMO en español)
├── pokemon_service.dart    # PokemonApi + PokemonConstructor (7 orígenes + fusiones)
├── poke_widgets.dart       # TypeChip, PokeCard (stats, IVs, movimientos)
└── screens/
    ├── clima_screen.dart   # Búsqueda de ciudades, actual, 7 días
    ├── explorar_screen.dart# Consulta por nombre/número, aleatorio por tipo
    └── lab_screen.dart     # Constructor completo (nivel, shiny, apodo, movimientos, fusión)
```

## El Constructor en Dart

```dart
final api = PokemonApi();

// Consulta clásica
final pikachu = await PokemonConstructor(api)
    .name('pikachu').level(72).shiny()
    .withMoves(['thunderbolt'])
    .build();

// Fusión de dos especies (criatura sintética)
final fusion = await PokemonConstructor(api)
    .hybrid('gengar', 'alakazam')
    .level(80)
    .build();

// Aleatorio con filtro de stats
final tank = await PokemonConstructor(api)
    .random().minStat('defense', 100)
    .build();
```

Orígenes disponibles: `name`, `id`, `byType`, `ability`, `generation`,
`random`, `hybrid` — con modificadores `level`, `shiny`, `nickname`,
`withMoves` y `minStat`.

## Notas
- El builder del lab conserva tu configuración mientras navegas por las pestañas.
- Los sprites y artwork vienen del CDN de PokéAPI; se ven con `Image.network`.
- El proyecto web hermano (React + Convex) vive en `src/` en la raíz del repo.
