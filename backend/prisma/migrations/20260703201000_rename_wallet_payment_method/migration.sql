-- Rename the legacy wallet enum label so stored payment data matches the public API contract.
ALTER TYPE "PaymentMethod" RENAME VALUE 'mock_wallet' TO 'wallet';
