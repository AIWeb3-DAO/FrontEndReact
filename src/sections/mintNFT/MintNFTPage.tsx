import { WalletHeader } from "./header/WalletHeader"
import { WalletTabs } from "./header/WalletTabs"
import { useMatchRoute } from "@tanstack/react-location"
import { LINKS } from "utils/navigation"
import { WalletVesting } from "./vesting/WalletVesting"
import { WalletAssets } from "./assets/WalletAssets"
import { Page } from "components/Layout/Page/Page"

export const MintNFTPage = () => {
  const matchRoute = useMatchRoute()

  return (
    <Page>
      <WalletHeader />
      <WalletTabs />
      {/* {matchRoute({ to: LINKS.walletVesting }) && <WalletVesting />} */}
      {matchRoute({ to: LINKS.walletAssets }) && <WalletAssets />}
    </Page>
  )
}


export default MintNFTPage;
