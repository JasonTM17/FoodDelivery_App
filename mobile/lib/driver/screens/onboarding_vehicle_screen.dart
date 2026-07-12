import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';
import '../models/driver_onboarding_draft.dart';

class OnboardingVehicleScreen extends ConsumerStatefulWidget {
  const OnboardingVehicleScreen({super.key});

  @override
  ConsumerState<OnboardingVehicleScreen> createState() =>
      _OnboardingVehicleScreenState();
}

class _OnboardingVehicleScreenState
    extends ConsumerState<OnboardingVehicleScreen> {
  String _vehicleType = 'motorbike';
  final _plateController = TextEditingController();
  final _licenseController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  static const _types = ['bicycle', 'motorbike', 'car'];
  static const _icons = [
    Icons.pedal_bike_outlined,
    Icons.two_wheeler_outlined,
    Icons.directions_car_outlined,
  ];

  @override
  void dispose() {
    _plateController.dispose();
    _licenseController.dispose();
    super.dispose();
  }

  void _continue() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final draft = DriverOnboardingDraft.normalized(
      licenseNumber: _licenseController.text,
      vehicleType: _vehicleType,
      vehiclePlate: _plateController.text,
    );
    context.go('/onboarding-documents', extra: draft);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final typeLabels = [
      l10n.driver_onboarding_vehicle_type_bike,
      l10n.driver_onboarding_vehicle_type_motorbike,
      l10n.driver_onboarding_vehicle_type_car,
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_onboarding_vehicle_title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.driver_onboarding_vehicle_subtitle,
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
              ),
              const SizedBox(height: 24),
              Text(
                l10n.driver_onboarding_vehicle_type_label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 12),
              for (int i = 0; i < _types.length; i++) ...[
                _VehicleTypeCard(
                  icon: _icons[i],
                  label: typeLabels[i],
                  selected: _vehicleType == _types[i],
                  onTap: () => setState(() => _vehicleType = _types[i]),
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 20),
              Text(
                l10n.driver_onboarding_license_label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _licenseController,
                style: const TextStyle(color: Colors.white),
                textCapitalization: TextCapitalization.characters,
                autocorrect: false,
                decoration: InputDecoration(
                  hintText: l10n.driver_onboarding_license_hint,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return l10n.driver_onboarding_license_required;
                  }
                  if (!isValidDriverIdentifier(value, min: 5, max: 50)) {
                    return l10n.driver_onboarding_license_invalid;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              Text(
                l10n.driver_onboarding_plate_label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _plateController,
                style: const TextStyle(color: Colors.white),
                textCapitalization: TextCapitalization.characters,
                autocorrect: false,
                decoration: InputDecoration(
                  hintText: l10n.driver_onboarding_plate_hint,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return l10n.driver_onboarding_plate_required;
                  }
                  if (!isValidDriverIdentifier(value, min: 5, max: 20)) {
                    return l10n.driver_onboarding_plate_invalid;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _continue,
                  child: Text(l10n.driver_onboarding_next),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VehicleTypeCard extends StatelessWidget {
  const _VehicleTypeCard({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primary.withValues(alpha: 0.15)
                : const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : const Color(0xFF374151),
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: selected ? AppColors.primary : const Color(0xFF9CA3AF),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : const Color(0xFF9CA3AF),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
              const Spacer(),
              if (selected)
                const Icon(
                  Icons.check_circle,
                  color: AppColors.primary,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
