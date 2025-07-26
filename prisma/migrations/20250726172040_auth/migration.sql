-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEBIT', 'CREDIT', 'REFUND', 'COUPON');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('PAYSTACK', 'WALLET');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'RIDER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE', 'DEVELOPER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'APPROVED', 'PENDING', 'SUSPENDED', 'ARCHIVED', 'FRAUD', 'REJECTED', 'FULFILLED', 'ACCEPTED', 'KYC_1', 'KYC_2', 'KYC_3');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "dob" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'USER',
    "referralCode" TEXT,
    "telephoneNumber" TEXT,
    "profilePictureUrl" TEXT,
    "profilePicturePublicId" TEXT,
    "otp" TEXT,
    "token" TEXT,
    "accountStatus" "Status" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "otpExpiry" TIMESTAMP(3),
    "resetOtp" TEXT,
    "resetOtpExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Referral" (
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("referralId")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "wallet_id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "dva_id" INTEGER,
    "accountName" TEXT,
    "bankId" INTEGER,
    "currency" TEXT,
    "cust_code" TEXT,
    "cust_id" INTEGER,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "WalletBalance" (
    "balanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletBalance_pkey" PRIMARY KEY ("balanceId")
);

-- CreateTable
CREATE TABLE "TransactionHistory" (
    "transactionHistoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "prevBalance" DOUBLE PRECISION NOT NULL,
    "newBalance" DOUBLE PRECISION NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "extRef" TEXT,
    "currency" TEXT,
    "channel" TEXT,
    "charge" DOUBLE PRECISION,
    "chargeNarration" TEXT,
    "senderBank" TEXT,
    "senderAccount" TEXT,
    "recieverBank" TEXT,
    "recieverAccount" TEXT,
    "paymentDescription" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userUserId" TEXT,

    CONSTRAINT "TransactionHistory_pkey" PRIMARY KEY ("transactionHistoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_telephoneNumber_key" ON "User"("telephoneNumber");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_telephoneNumber_idx" ON "User"("telephoneNumber");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_userId_key" ON "Referral"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referralId_idx" ON "Referral"("referralId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_userId_idx" ON "Referral"("userId");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE INDEX "Referral_updatedAt_idx" ON "Referral"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_accountNumber_key" ON "Wallet"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_cust_code_key" ON "Wallet"("cust_code");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_wallet_id_idx" ON "Wallet"("wallet_id");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_accountNumber_idx" ON "Wallet"("accountNumber");

-- CreateIndex
CREATE INDEX "Wallet_bankName_idx" ON "Wallet"("bankName");

-- CreateIndex
CREATE INDEX "Wallet_accountName_idx" ON "Wallet"("accountName");

-- CreateIndex
CREATE INDEX "Wallet_created_at_idx" ON "Wallet"("created_at");

-- CreateIndex
CREATE INDEX "Wallet_updated_at_idx" ON "Wallet"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "WalletBalance_userId_key" ON "WalletBalance"("userId");

-- CreateIndex
CREATE INDEX "WalletBalance_balanceId_idx" ON "WalletBalance"("balanceId");

-- CreateIndex
CREATE INDEX "WalletBalance_userId_idx" ON "WalletBalance"("userId");

-- CreateIndex
CREATE INDEX "WalletBalance_balance_idx" ON "WalletBalance"("balance");

-- CreateIndex
CREATE INDEX "WalletBalance_created_at_idx" ON "WalletBalance"("created_at");

-- CreateIndex
CREATE INDEX "WalletBalance_updated_at_idx" ON "WalletBalance"("updated_at");

-- CreateIndex
CREATE INDEX "TransactionHistory_transactionHistoryId_idx" ON "TransactionHistory"("transactionHistoryId");

-- CreateIndex
CREATE INDEX "TransactionHistory_amount_idx" ON "TransactionHistory"("amount");

-- CreateIndex
CREATE INDEX "TransactionHistory_paymentType_idx" ON "TransactionHistory"("paymentType");

-- CreateIndex
CREATE INDEX "TransactionHistory_paymentReference_idx" ON "TransactionHistory"("paymentReference");

-- CreateIndex
CREATE INDEX "TransactionHistory_extRef_idx" ON "TransactionHistory"("extRef");

-- CreateIndex
CREATE INDEX "TransactionHistory_currency_idx" ON "TransactionHistory"("currency");

-- CreateIndex
CREATE INDEX "TransactionHistory_channel_idx" ON "TransactionHistory"("channel");

-- CreateIndex
CREATE INDEX "TransactionHistory_charge_idx" ON "TransactionHistory"("charge");

-- CreateIndex
CREATE INDEX "TransactionHistory_chargeNarration_idx" ON "TransactionHistory"("chargeNarration");

-- CreateIndex
CREATE INDEX "TransactionHistory_senderBank_idx" ON "TransactionHistory"("senderBank");

-- CreateIndex
CREATE INDEX "TransactionHistory_senderAccount_idx" ON "TransactionHistory"("senderAccount");

-- CreateIndex
CREATE INDEX "TransactionHistory_recieverBank_idx" ON "TransactionHistory"("recieverBank");

-- CreateIndex
CREATE INDEX "TransactionHistory_recieverAccount_idx" ON "TransactionHistory"("recieverAccount");

-- CreateIndex
CREATE INDEX "TransactionHistory_paymentDescription_idx" ON "TransactionHistory"("paymentDescription");

-- CreateIndex
CREATE INDEX "TransactionHistory_userUserId_idx" ON "TransactionHistory"("userUserId");

-- CreateIndex
CREATE INDEX "TransactionHistory_createdAt_idx" ON "TransactionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionHistory_updatedAt_idx" ON "TransactionHistory"("updatedAt");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletBalance" ADD CONSTRAINT "WalletBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_userUserId_fkey" FOREIGN KEY ("userUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
