import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OnchainGiftCardsModule", (m) => {
  const mockUSDC = m.contract("MockUSDC", []);
  const onchainGiftCards = m.contract("OnchainGiftCards", [mockUSDC]);

  return { onchainGiftCards };
});
