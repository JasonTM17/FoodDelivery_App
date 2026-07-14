import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/widgets/vietnam_boundary_overlay.dart';

@immutable
class AddressLocationSelection {
  const AddressLocationSelection._(this.latitude, this.longitude);

  final double latitude;
  final double longitude;

  static AddressLocationSelection? fromMapPoint(
    double latitude,
    double longitude,
  ) {
    if (!isValidDeliveryLatLng(latitude, longitude)) {
      return null;
    }
    return AddressLocationSelection._(latitude, longitude);
  }
}

class AddressLocationPicker extends StatefulWidget {
  const AddressLocationPicker({
    required this.selectedLocation,
    required this.onLocationSelected,
    required this.onInvalidLocation,
    super.key,
  });

  final AddressLocationSelection? selectedLocation;
  final ValueChanged<AddressLocationSelection> onLocationSelected;
  final VoidCallback onInvalidLocation;

  @override
  State<AddressLocationPicker> createState() => _AddressLocationPickerState();
}

class _AddressLocationPickerState extends State<AddressLocationPicker> {
  static const _initialCamera = CameraPosition(
    target: LatLng(16, 106),
    zoom: 4.5,
  );

  Set<Polygon> _boundaryPolygons = const {};

  @override
  void initState() {
    super.initState();
    _loadBoundary();
  }

  Future<void> _loadBoundary() async {
    final polygons = await VietnamBoundaryOverlay.polygons;
    if (mounted) {
      setState(() => _boundaryPolygons = polygons);
    }
  }

  void _selectLocation(LatLng point) {
    final selection = AddressLocationSelection.fromMapPoint(
      point.latitude,
      point.longitude,
    );
    if (selection == null) {
      widget.onInvalidLocation();
      return;
    }
    widget.onLocationSelected(selection);
  }

  @override
  Widget build(BuildContext context) {
    final selection = widget.selectedLocation;
    final markers = selection == null
        ? const <Marker>{}
        : {
            Marker(
              markerId: const MarkerId('delivery-address'),
              position: LatLng(selection.latitude, selection.longitude),
            ),
          };

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 220,
        child: GoogleMap(
          initialCameraPosition: _initialCamera,
          polygons: _boundaryPolygons,
          markers: markers,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
          onTap: _selectLocation,
        ),
      ),
    );
  }
}
