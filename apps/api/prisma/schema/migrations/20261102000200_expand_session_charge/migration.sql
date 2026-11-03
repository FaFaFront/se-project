-- Four hours at the maximum supported hourly rate must fit, like both wallets and ledger amounts.
ALTER TABLE "meet_sessions" ALTER COLUMN "amountCharged" TYPE DECIMAL(12, 2);
