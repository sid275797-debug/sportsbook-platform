-- CreateTable
CREATE TABLE "bet_slips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'single',
    "total_stake" DECIMAL(18,2) NOT NULL,
    "potential_payout" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "bet_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_selections" (
    "id" TEXT NOT NULL,
    "bet_slip_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "outcome_id" TEXT NOT NULL,
    "odds" DECIMAL(10,4) NOT NULL,
    "stake" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bet_slips_user_id_idx" ON "bet_slips"("user_id");

-- CreateIndex
CREATE INDEX "bet_slips_status_idx" ON "bet_slips"("status");

-- AddForeignKey
ALTER TABLE "bet_selections" ADD CONSTRAINT "bet_selections_bet_slip_id_fkey" FOREIGN KEY ("bet_slip_id") REFERENCES "bet_slips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
