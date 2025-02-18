import { OmnipoolPool } from "sections/pools/PoolsPage.utils"
import { useApiIds, useTVLCap } from "api/consts"
import { useOmnipoolAssets } from "api/omnipool"
import { useTokensBalances } from "api/balances"
import { OMNIPOOL_ACCOUNT_ADDRESS } from "utils/api"
import { useMemo } from "react"
import { BN_NAN } from "utils/constants"
import BN from "bignumber.js"
import {
  calculate_cap_difference,
  calculate_tvl_cap_difference,
} from "@galacticcouncil/math-omnipool"
import { getFloatingPointAmount } from "utils/balance"
import { useRpcProvider } from "providers/rpcProvider"

export const usePoolCapacity = (id: string) => {
  const { assets } = useRpcProvider()
  const apiIds = useApiIds()
  const tvlCap = useTVLCap()
  const omnipoolAssets = useOmnipoolAssets()
  const balances = useTokensBalances(
    [apiIds.data?.hubId ?? "", apiIds?.data?.stableCoinId ?? "", id],
    OMNIPOOL_ACCOUNT_ADDRESS,
  )
  const meta = assets.getAsset(id.toString())

  const queries = [apiIds, tvlCap, omnipoolAssets, ...balances]
  const isLoading = queries.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (
      !apiIds.data ||
      !tvlCap.data ||
      !omnipoolAssets.data ||
      balances.some((q) => !q.data)
    )
      return undefined

    const asset = omnipoolAssets.data.find(
      (a) => a.id.toString() === id.toString(),
    )
    const assetUsd = omnipoolAssets.data.find(
      (a) => a.id.toString() === apiIds.data.stableCoinId.toString(),
    )
    const assetBalance = balances.find(
      (b) => b.data?.assetId.toString() === id.toString(),
    )
    const hubBalance = balances.find(
      (b) => b.data?.assetId.toString() === apiIds.data.hubId.toString(),
    )
    const usdBalance = balances.find(
      (b) => b.data?.assetId.toString() === apiIds.data.stableCoinId.toString(),
    )
    const symbol = meta.symbol

    if (
      !asset?.data ||
      !assetBalance?.data ||
      !hubBalance?.data ||
      !usdBalance?.data ||
      !assetUsd?.data
    )
      return {
        capacity: BN_NAN,
        filled: BN_NAN,
        filledPercent: BN_NAN,
        symbol,
      }

    const assetReserve = assetBalance.data.balance.toString()
    const assetHubReserve = asset.data.hubReserve.toString()
    const assetCap = asset.data.cap.toString()
    const totalHubReserve = hubBalance.data.total.toString()

    const stableAssetReserve = usdBalance.data.balance.toString()
    const stableAssetHubReserve = assetUsd.data.hubReserve.toString()
    const TVLCap = tvlCap.data.toString()

    const isCap100Percent = getFloatingPointAmount(asset.data.cap, 18).eq(1)

    let capDifference = calculate_cap_difference(
      assetReserve,
      assetHubReserve,
      assetCap,
      totalHubReserve,
    )

    if (isCap100Percent) {
      const tvlCapDifference = calculate_tvl_cap_difference(
        assetReserve,
        assetHubReserve,
        stableAssetReserve,
        stableAssetHubReserve,
        TVLCap,
        totalHubReserve,
      )

      if (new BN(tvlCapDifference).lt(new BN(capDifference)))
        capDifference = tvlCapDifference
    }

    if (capDifference === "-1")
      return {
        capacity: BN_NAN,
        filled: BN_NAN,
        filledPercent: BN_NAN,
        symbol,
      }

    const capacity = getFloatingPointAmount(
      assetBalance.data.balance.plus(new BN(capDifference)),
      meta.decimals,
    )
    const filled = getFloatingPointAmount(
      assetBalance.data.balance,
      meta.decimals,
    )
    const filledPercent = filled.div(capacity).times(100)

    return { capacity, filled, filledPercent, symbol }
  }, [apiIds.data, omnipoolAssets.data, balances, meta, id, tvlCap.data])

  return { data, isLoading }
}
