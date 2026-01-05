// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OnchainGiftCards is ReentrancyGuard, Ownable {
    IERC20 public stablecoin;
    
    struct GiftCard {
        address giver;
        address recipient;
        uint256 totalAmount;
        uint256 remainingBalance;
        uint256 unlockDate;
        uint256 refundDate;
        bool isActive;
        mapping(address => bool) allowedMerchants;
        mapping(address => uint256) merchantPercentages;
    }
    
    struct Merchant {
        bool isRegistered;
        string name;
    }
    
    mapping(uint256 => GiftCard) public giftCards;
    mapping(address => Merchant) public merchants;
    
    uint256 public nextGiftCardId;
    
    event GiftCardCreated(
        uint256 indexed cardId,
        address indexed giver,
        address indexed recipient,
        uint256 amount,
        uint256 unlockDate,
        uint256 refundDate
    );
    
    event GiftCardRedeemed(
        uint256 indexed cardId,
        address indexed merchant,
        uint256 amount,
        uint256 remainingBalance
    );
    
    event GiftCardRefunded(
        uint256 indexed cardId,
        address indexed giver,
        uint256 amount
    );
    
    event MerchantRegistered(address indexed merchant, string name);
    event MerchantAddedToCard(uint256 indexed cardId, address indexed merchant, uint256 percentage);
    
    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IERC20(_stablecoin);
    }
    
    // Register a merchant
    function registerMerchant(string memory _name) external {
        require(!merchants[msg.sender].isRegistered, "Already registered");
        merchants[msg.sender] = Merchant({
            isRegistered: true,
            name: _name
        });
        emit MerchantRegistered(msg.sender, _name);
    }
    
    // Create a gift card
    function createGiftCard(
        address _recipient,
        uint256 _amount,
        uint256 _unlockDate,
        uint256 _refundDate,
        address[] memory _merchants,
        uint256[] memory _percentages
    ) external nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(_unlockDate > block.timestamp, "Unlock date must be future");
        require(_refundDate > _unlockDate, "Refund date must be after unlock");
        require(_merchants.length == _percentages.length, "Length mismatch");
        
        // Validate percentages sum to 100
        uint256 totalPercentage;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");
        
        // Transfer stablecoins to contract
        require(
            stablecoin.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        uint256 cardId = nextGiftCardId++;
        GiftCard storage card = giftCards[cardId];
        
        card.giver = msg.sender;
        card.recipient = _recipient;
        card.totalAmount = _amount;
        card.remainingBalance = _amount;
        card.unlockDate = _unlockDate;
        card.refundDate = _refundDate;
        card.isActive = true;
        
        // Set merchant rules
        for (uint256 i = 0; i < _merchants.length; i++) {
            require(merchants[_merchants[i]].isRegistered, "Merchant not registered");
            card.allowedMerchants[_merchants[i]] = true;
            card.merchantPercentages[_merchants[i]] = _percentages[i];
            emit MerchantAddedToCard(cardId, _merchants[i], _percentages[i]);
        }
        
        emit GiftCardCreated(
            cardId,
            msg.sender,
            _recipient,
            _amount,
            _unlockDate,
            _refundDate
        );
        
        return cardId;
    }
    
    // Redeem gift card (called by merchant)
    function redeemGiftCard(
        uint256 _cardId,
        uint256 _amount
    ) external nonReentrant {
        GiftCard storage card = giftCards[_cardId];
        
        require(card.isActive, "Card not active");
        require(block.timestamp >= card.unlockDate, "Card not unlocked yet");
        require(block.timestamp < card.refundDate, "Card expired");
        require(card.allowedMerchants[msg.sender], "Merchant not allowed");
        require(_amount > 0, "Amount must be > 0");
        
        // Calculate max amount merchant can redeem based on percentage
        uint256 maxAmount = (card.totalAmount * card.merchantPercentages[msg.sender]) / 100;
        require(_amount <= maxAmount, "Exceeds merchant limit");
        require(_amount <= card.remainingBalance, "Insufficient balance");
        
        card.remainingBalance -= _amount;
        
        require(
            stablecoin.transfer(msg.sender, _amount),
            "Transfer failed"
        );
        
        emit GiftCardRedeemed(_cardId, msg.sender, _amount, card.remainingBalance);
    }
    
    // Refund unused balance to giver after refund date
    function refundGiftCard(uint256 _cardId) external nonReentrant {
        GiftCard storage card = giftCards[_cardId];
        
        require(card.isActive, "Card not active");
        require(msg.sender == card.giver, "Only giver can refund");
        require(block.timestamp >= card.refundDate, "Refund date not reached");
        require(card.remainingBalance > 0, "No balance to refund");
        
        uint256 refundAmount = card.remainingBalance;
        card.remainingBalance = 0;
        card.isActive = false;
        
        require(
            stablecoin.transfer(card.giver, refundAmount),
            "Transfer failed"
        );
        
        emit GiftCardRefunded(_cardId, card.giver, refundAmount);
    }
    
    // View functions
    function getGiftCardDetails(uint256 _cardId) external view returns (
        address giver,
        address recipient,
        uint256 totalAmount,
        uint256 remainingBalance,
        uint256 unlockDate,
        uint256 refundDate,
        bool isActive
    ) {
        GiftCard storage card = giftCards[_cardId];
        return (
            card.giver,
            card.recipient,
            card.totalAmount,
            card.remainingBalance,
            card.unlockDate,
            card.refundDate,
            card.isActive
        );
    }
    
    function isMerchantAllowed(uint256 _cardId, address _merchant) external view returns (bool) {
        return giftCards[_cardId].allowedMerchants[_merchant];
    }
    
    function getMerchantPercentage(uint256 _cardId, address _merchant) external view returns (uint256) {
        return giftCards[_cardId].merchantPercentages[_merchant];
    }
}
