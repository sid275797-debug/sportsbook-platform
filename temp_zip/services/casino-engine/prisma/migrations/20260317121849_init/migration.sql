-- CreateTable
CREATE TABLE "crash_rounds" (
    "id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "crash_multiplier" DECIMAL(10,4) NOT NULL,
    "server_seed" TEXT NOT NULL,
    "client_seed" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crash_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crash_bets" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stake" DECIMAL(18,2) NOT NULL,
    "cashout_multiplier" DECIMAL(10,4),
    "payout" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashed_out_at" TIMESTAMP(3),

    CONSTRAINT "crash_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dice_rounds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bet_amount" DECIMAL(18,2) NOT NULL,
    "target" DECIMAL(10,2) NOT NULL,
    "roll_over" BOOLEAN NOT NULL,
    "result" DECIMAL(10,2) NOT NULL,
    "payout" DECIMAL(18,2) NOT NULL,
    "won" BOOLEAN NOT NULL,
    "server_seed" TEXT NOT NULL,
    "client_seed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dice_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roulette_rounds" (
    "id" TEXT NOT NULL,
    "result" INTEGER NOT NULL,
    "total_payout" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roulette_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roulette_bets" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bet_type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "numbers" JSONB NOT NULL,
    "payout" DECIMAL(18,2) NOT NULL,
    "won" BOOLEAN NOT NULL,

    CONSTRAINT "roulette_bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crash_rounds_round_number_key" ON "crash_rounds"("round_number");

-- CreateIndex
CREATE INDEX "crash_bets_user_id_idx" ON "crash_bets"("user_id");

-- AddForeignKey
ALTER TABLE "crash_bets" ADD CONSTRAINT "crash_bets_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "crash_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roulette_bets" ADD CONSTRAINT "roulette_bets_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "roulette_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
