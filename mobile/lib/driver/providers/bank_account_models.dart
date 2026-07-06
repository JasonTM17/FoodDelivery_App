class BankAccount {
  final String id;
  final String bankCode;
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final bool isDefault;

  const BankAccount({
    required this.id,
    required this.bankCode,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    this.isDefault = false,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: _requiredString(json, 'id'),
      bankCode: _requiredString(json, 'bankCode'),
      bankName: _requiredString(json, 'bankName'),
      accountNumber: _requiredString(json, 'accountNumber'),
      accountHolderName: _requiredString(json, 'accountHolderName'),
      isDefault: _requiredBool(json, 'isDefault'),
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'bankCode': bankCode,
      'bankName': bankName,
      'accountNumber': accountNumber,
      'accountHolderName': accountHolderName,
    };
  }

  BankAccount copyWith({
    String? id,
    String? bankCode,
    String? bankName,
    String? accountNumber,
    String? accountHolderName,
    bool? isDefault,
  }) {
    return BankAccount(
      id: id ?? this.id,
      bankCode: bankCode ?? this.bankCode,
      bankName: bankName ?? this.bankName,
      accountNumber: accountNumber ?? this.accountNumber,
      accountHolderName: accountHolderName ?? this.accountHolderName,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) return value;
  throw FormatException('Missing required bank account string field: $field');
}

bool _requiredBool(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is bool) return value;
  throw FormatException('Missing required bank account boolean field: $field');
}

class VnBank {
  final String code;
  final String name;
  final String shortName;
  final String logoUrl;

  const VnBank({
    required this.code,
    required this.name,
    required this.shortName,
    required this.logoUrl,
  });
}

const vnBanks = [
  VnBank(
    code: 'vcb',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    shortName: 'Vietcombank',
    logoUrl: '',
  ),
  VnBank(
    code: 'bidv',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
    logoUrl: '',
  ),
  VnBank(
    code: 'tcb',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    shortName: 'Techcombank',
    logoUrl: '',
  ),
  VnBank(
    code: 'mbb',
    name: 'Ngân hàng TMCP Quân đội',
    shortName: 'MB Bank',
    logoUrl: '',
  ),
  VnBank(
    code: 'acb',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    logoUrl: '',
  ),
  VnBank(
    code: 'vpb',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    logoUrl: '',
  ),
  VnBank(
    code: 'stb',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    logoUrl: '',
  ),
  VnBank(
    code: 'shb',
    name: 'Ngân hàng TMCP Sài Gòn – Hà Nội',
    shortName: 'SHB',
    logoUrl: '',
  ),
  VnBank(
    code: 'tpb',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    logoUrl: '',
  ),
  VnBank(
    code: 'ctg',
    name: 'Ngân hàng TMCP Công Thương Việt Nam',
    shortName: 'VietinBank',
    logoUrl: '',
  ),
];
