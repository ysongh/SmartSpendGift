# Smart Spend Gift

A blockchain-based gift card solution that eliminates waste from unused gift cards while providing flexibility for recipients to spend across multiple merchants.

## Problem

Over 20% of gift cards go unused, wasting billions of dollars annually. Traditional gift cards lock funds to a single merchant and expire without refunds.

## Solution

A flexible onchain gift card system where:
- Gift cards can be spent across multiple merchants
- Unused balances automatically refund to the giver after a set date
- Smart contracts enforce redemption rules and merchant allocations
- Funds are stored as stablecoins on the blockchain

## How It Works

### 1. Gift Giver Purchases Gift Card
- Purchases a gift card by depositing stablecoins into a smart contract
- Sets unlock date (when recipient can start using it)
- Sets refund date (when unused funds return to giver)
- Defines which merchants can accept the card and their spending limits

### 2. Recipient Receives Gift
- Receives a digital card representing their locked balance
- Can redeem across multiple merchants based on giver's rules
- Example: 75% at Uber, 25% at Target

### 3. Gift Card Usage
- When the recipient uses the gift (e.g., $10 Uber ride from a $100 card)
- Smart contract releases funds to the merchant and updates remaining balance ($90 left)

### 4. Automatic Refunds
- Any unused balance goes back to the gift giver after the refund date
- No more wasted gift card value

## Smart Contract Architecture

### Core Components

**GiftCard Structure**
- `giver`: Address of the person who purchased the gift card
- `recipient`: Address of the person receiving the gift card
- `totalAmount`: Original gift card value
- `remainingBalance`: Current unused balance
- `unlockDate`: Timestamp when recipient can start using the card
- `refundDate`: Timestamp when unused funds return to giver
- `allowedMerchants`: List of merchants authorized to redeem from this card
- `merchantPercentages`: Maximum percentage each merchant can redeem

**Merchant Structure**
- `isRegistered`: Whether the merchant is registered on the platform
- `name`: Merchant's display name

### Key Functions

#### For Merchants
```solidity
registerMerchant(string name)
```
Registers a merchant on the platform

```solidity
redeemGiftCard(uint256 cardId, uint256 amount)
```
Allows a merchant to redeem funds from a gift card (subject to unlock date and merchant limits)

#### For Gift Givers
```solidity
createGiftCard(
    address recipient,
    uint256 amount,
    uint256 unlockDate,
    uint256 refundDate,
    address[] merchants,
    uint256[] percentages
)
```
Creates a new gift card with specified parameters

```solidity
refundGiftCard(uint256 cardId)
```
Refunds unused balance after the refund date has passed

#### View Functions
```solidity
getGiftCardDetails(uint256 cardId)
isMerchantAllowed(uint256 cardId, address merchant)
getMerchantPercentage(uint256 cardId, address merchant)
```
