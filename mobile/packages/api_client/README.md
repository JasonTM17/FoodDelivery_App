# @foodflow/api_client (Dart)

Generated Dart client from the FoodFlow OpenAPI contract at `../../../docs/openapi.yaml`.

## Purpose

Provides typed Dart models for the FoodFlow API. Used by the Flutter mobile apps (customer + driver) as a shared dependency.

## API surface

- All request/response models in `lib/src/models*.dart`
- Export barrel at `lib/api_client.dart`

## Usage

```dart
import 'package:api_client/api_client.dart';

final result = AuthResult.fromJson(json);
```

## Run locally

```bash
cd mobile
dart pub get
dart analyze packages/api_client
```

## Regenerate

Regeneration is manual for now — update models when the OpenAPI contract changes.
