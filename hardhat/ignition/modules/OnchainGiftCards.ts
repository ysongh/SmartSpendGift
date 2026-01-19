import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OnchainGiftCardsModule", (m) => {
  const onchainGiftCards = m.contract("OnchainGiftCards");

  return { onchainGiftCards };
});
