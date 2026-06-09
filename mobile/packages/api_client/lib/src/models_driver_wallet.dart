// ── Drivers ──

class DriverEarningsResponse {
  final String period;
  final int totalEarnings;
  final int deliveryCount;
  final int tips;
  final List<EarningsBreakdown>? breakdown;

  const DriverEarningsResponse({
    required this.period,
    required this.totalEarnings,
    required this.deliveryCount,
    required this.tips,
    this.breakdown,
  });

  factory DriverEarningsResponse.fromJson(Map<String, dynamic> json) =>
      DriverEarningsResponse(
        period: json['period'] as String,
        totalEarnings: json['totalEarnings'] as int,
        deliveryCount: json['deliveryCount'] as int,
        tips: json['tips'] as int,
        breakdown: (json['breakdown'] as List<dynamic>?)
            ?.map((e) => EarningsBreakdown.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class EarningsBreakdown {
  final String date;
  final int earnings;
  final int deliveries;

  const EarningsBreakdown({
    required this.date,
    required this.earnings,
    required this.deliveries,
  });

  factory EarningsBreakdown.fromJson(Map<String, dynamic> json) =>
      EarningsBreakdown(
        date: json['date'] as String,
        earnings: json['earnings'] as int,
        deliveries: json['deliveries'] as int,
      );
}

class DriverIncentive {
  final String id;
  final String name;
  final String description;
  final int targetDeliveries;
  final int bonusAmount;
  final int progress;
  final String expiresAt;

  const DriverIncentive({
    required this.id,
    required this.name,
    required this.description,
    required this.targetDeliveries,
    required this.bonusAmount,
    required this.progress,
    required this.expiresAt,
  });

  factory DriverIncentive.fromJson(Map<String, dynamic> json) => DriverIncentive(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String,
    targetDeliveries: json['targetDeliveries'] as int,
    bonusAmount: json['bonusAmount'] as int,
    progress: json['progress'] as int,
    expiresAt: json['expiresAt'] as String,
  );
}

class DriverIncentivesResponse {
  final List<DriverIncentive> activeIncentives;

  const DriverIncentivesResponse({required this.activeIncentives});

  factory DriverIncentivesResponse.fromJson(Map<String, dynamic> json) =>
      DriverIncentivesResponse(
        activeIncentives: (json['activeIncentives'] as List<dynamic>)
            .map((e) => DriverIncentive.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// ── Wallet ──

class WalletTransaction {
  final String id;
  final int amountDelta;
  final String type;
  final String reason;
  final String? refId;
  final String createdAt;

  const WalletTransaction({
    required this.id,
    required this.amountDelta,
    required this.type,
    required this.reason,
    this.refId,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      WalletTransaction(
        id: json['id'] as String,
        amountDelta: json['amountDelta'] as int,
        type: json['type'] as String,
        reason: json['reason'] as String,
        refId: json['refId'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

class WalletSnapshot {
  final int balance;
  final int pendingTopups;
  final List<WalletTransaction> recentTransactions;

  const WalletSnapshot({
    required this.balance,
    required this.pendingTopups,
    required this.recentTransactions,
  });

  factory WalletSnapshot.fromJson(Map<String, dynamic> json) => WalletSnapshot(
    balance: json['balance'] as int,
    pendingTopups: json['pendingTopups'] as int,
    recentTransactions: (json['recentTransactions'] as List<dynamic>)
        .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

// ── Loyalty ──

class LoyaltyTransaction {
  final String id;
  final int points;
  final String type;
  final String description;
  final String createdAt;

  const LoyaltyTransaction({
    required this.id,
    required this.points,
    required this.type,
    required this.description,
    required this.createdAt,
  });

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) =>
      LoyaltyTransaction(
        id: json['id'] as String,
        points: json['points'] as int,
        type: json['type'] as String,
        description: json['description'] as String,
        createdAt: json['createdAt'] as String,
      );
}

class LoyaltySnapshot {
  final int points;
  final String tier;
  final int? nextTierPoints;
  final List<LoyaltyTransaction> recentTransactions;

  const LoyaltySnapshot({
    required this.points,
    required this.tier,
    this.nextTierPoints,
    required this.recentTransactions,
  });

  factory LoyaltySnapshot.fromJson(Map<String, dynamic> json) =>
      LoyaltySnapshot(
        points: json['points'] as int,
        tier: json['tier'] as String,
        nextTierPoints: json['nextTierPoints'] as int?,
        recentTransactions: (json['recentTransactions'] as List<dynamic>)
            .map((e) => LoyaltyTransaction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// ── Referral ──

class ReferralRedemption {
  final String id;
  final int rewardAmount;
  final String redeemedAt;

  const ReferralRedemption({
    required this.id,
    required this.rewardAmount,
    required this.redeemedAt,
  });

  factory ReferralRedemption.fromJson(Map<String, dynamic> json) =>
      ReferralRedemption(
        id: json['id'] as String,
        rewardAmount: json['rewardAmount'] as int,
        redeemedAt: json['redeemedAt'] as String,
      );
}

class ReferralSnapshot {
  final String code;
  final int totalRewards;
  final int successfulReferrals;
  final List<ReferralRedemption> recentRedemptions;

  const ReferralSnapshot({
    required this.code,
    required this.totalRewards,
    required this.successfulReferrals,
    required this.recentRedemptions,
  });

  factory ReferralSnapshot.fromJson(Map<String, dynamic> json) =>
      ReferralSnapshot(
        code: json['code'] as String,
        totalRewards: json['totalRewards'] as int,
        successfulReferrals: json['successfulReferrals'] as int,
        recentRedemptions: (json['recentRedemptions'] as List<dynamic>)
            .map((e) => ReferralRedemption.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
