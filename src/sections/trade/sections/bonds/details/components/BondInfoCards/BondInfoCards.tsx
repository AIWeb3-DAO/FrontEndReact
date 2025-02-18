import { Icon } from "components/Icon/Icon"
import { DetailCard } from "sections/trade/sections/bonds/details/components/DetailCard/DetailCard"
import ClockIcon from "assets/icons/ClockIcon.svg?react"
import DollarIcon from "assets/icons/Dollar2Icon.svg?react"
import PercentageIcon from "assets/icons/Percentage.svg?react"
import GraphIcon from "assets/icons/Graph.svg?react"
import AccumulatedAsset from "assets/icons/AccumulatedAsset.svg?react"
import AvgPrice from "assets/icons/PriceChart.svg?react"
import { DisplayValue } from "components/DisplayValue/DisplayValue"
import { useDisplayPrice } from "utils/displayAsset"
import { BN_0, BN_1 } from "utils/constants"
import { useTranslation } from "react-i18next"
import { TBond } from "api/assetDetails"
import { formatDate } from "utils/formatting"
import { useHistoricalPoolBalance } from "api/bonds"
import { useRpcProvider } from "providers/rpcProvider"
import { useBondEvents } from "api/bonds"
import BN from "bignumber.js"

export const BondInfoCards = ({
  bond,
  poolId,
  removeBlock,
}: {
  bond: TBond
  poolId?: string
  removeBlock?: number
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const spotPrice = useDisplayPrice(bond.assetId)
  const spotPriceBond = useDisplayPrice(bond.id)

  const balance = useHistoricalPoolBalance(
    poolId,
    removeBlock ? removeBlock - 1 : undefined,
  )
  const isPast = bond.isPast

  const bondEvents = useBondEvents(isPast ? bond.id : undefined)

  const priceTotal = bondEvents.data?.events.reduce((acc, event) => {
    const assetInId = event.args.assetIn
    const assetOutId = event.args.assetOut

    const metaIn = assets.getAsset(assetInId.toString())
    const metaOut = assets.getAsset(assetOutId.toString())

    const isBuy = event.name === "LBP.BuyExecuted"

    const amountIn = BN(event.args.amount).shiftedBy(-metaIn.decimals)

    const amountOut = BN(
      event.args[isBuy ? "buyPrice" : "salePrice"],
    ).shiftedBy(-metaOut.decimals)

    const price =
      event.args.assetOut !== Number(bond.id)
        ? amountOut.div(amountIn)
        : amountIn.div(amountOut)

    return acc.plus(price)
  }, BN_0)

  const averagePrice = priceTotal?.div(bondEvents.data?.events.length ?? 1)

  const currentSpotPrice = spotPrice.data?.spotPrice ?? BN_1
  const currentBondPrice = spotPriceBond.data?.spotPrice ?? BN_1

  const accumulatedAssetId = isPast
    ? balance.data?.pools[0].assetAId
    : undefined
  const accumulatedAsset = accumulatedAssetId
    ? assets.getAsset(accumulatedAssetId.toString())
    : undefined
  const accumulatedAssetBalance = isPast
    ? balance.data?.pools[0].historicalBalances[0].assetABalance
    : undefined

  const isDiscount = currentSpotPrice.gt(currentBondPrice)

  const discount = isDiscount
    ? currentSpotPrice
        .minus(currentBondPrice)
        .div(currentSpotPrice)
        .multipliedBy(100)
    : currentBondPrice
        .minus(currentSpotPrice)
        .div(currentBondPrice)
        .multipliedBy(100)

  const cards = [
    isPast
      ? {
          label: "Avg purchase price",
          value: <DisplayValue value={averagePrice} type="token" />,
          icon: (
            <Icon
              size={[16, 22]}
              sx={{ color: "basic600" }}
              icon={<AvgPrice />}
            />
          ),
        }
      : {
          label: t("bonds.details.card.bondPrice"),
          value: <DisplayValue value={currentBondPrice} type="token" />,
          icon: (
            <Icon
              size={[16, 22]}
              sx={{ color: "basic600" }}
              icon={<GraphIcon />}
            />
          ),
        },
    isPast
      ? {
          label: "Accumulated asset",
          value: t("value.tokenWithSymbol", {
            value: accumulatedAssetBalance,
            symbol: accumulatedAsset?.symbol,
            fixedPointScale: accumulatedAsset?.decimals,
          }),
          icon: (
            <Icon
              size={[16, 22]}
              sx={{ color: "basic600" }}
              icon={<AccumulatedAsset />}
            />
          ),
        }
      : {
          label: t("bonds.details.card.spotPrice"),
          value: <DisplayValue value={currentSpotPrice} type="token" />,
          icon: (
            <Icon
              size={[16, 22]}
              sx={{ color: "basic600" }}
              icon={<DollarIcon />}
            />
          ),
        },
    {
      label: isDiscount ? t("bond.discount") : t("bond.premium"),
      value: t("value.percentage", { value: discount.toString() }),
      icon: (
        <Icon
          size={[16, 22]}
          sx={{ color: "basic600" }}
          icon={<PercentageIcon />}
        />
      ),
    },
    {
      label: t("bonds.details.card.maturity"),
      value: formatDate(new Date(bond.maturity), "dd.MM.yyyy"),
      icon: (
        <Icon size={[16, 22]} sx={{ color: "basic600" }} icon={<ClockIcon />} />
      ),
    },
  ]

  return (
    <div sx={{ flex: ["column", "row"], gap: 14, flexWrap: "wrap" }}>
      {cards.map((card, i) => (
        <DetailCard
          key={i}
          label={card.label}
          value={card.value}
          icon={card.icon}
        />
      ))}
    </div>
  )
}
