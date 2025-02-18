import { u32 } from "@polkadot/types"
import { useBestNumber } from "api/chain"
import { DepositNftType } from "api/deposits"
import { Farm, useFarms } from "api/farms"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { useModalPagination } from "components/Modal/Modal.utils"
import { ModalContents } from "components/Modal/contents/ModalContents"
import { Text } from "components/Typography/Text/Text"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { ClaimRewardsCard } from "sections/pools/farms/components/claimableCard/ClaimRewardsCard"
import { FarmDetailsCard } from "sections/pools/farms/components/detailsCard/FarmDetailsCard"
import { FarmDetailsModal } from "sections/pools/farms/modals/details/FarmDetailsModal"
import { ToastMessage, useAccountStore } from "state/store"
import { TOAST_MESSAGES } from "state/toasts"
import { useFarmExitAllMutation } from "utils/farms/exit"
import { useFarmRedepositMutation } from "utils/farms/redeposit"
import { useRpcProvider } from "providers/rpcProvider"

function isFarmJoined(depositNft: DepositNftType, farm: Farm) {
  return depositNft.deposit.yieldFarmEntries.find(
    (entry) =>
      entry.globalFarmId.eq(farm.globalFarm.id) &&
      entry.yieldFarmId.eq(farm.yieldFarm.id),
  )
}

function JoinedFarmsDetailsRedeposit(props: {
  poolId: u32
  depositNft: DepositNftType
  onSelect: (value: { globalFarm: u32; yieldFarm: u32 }) => void
  onTxClose: () => void
}) {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const { account } = useAccountStore()
  const farms = useFarms([props.poolId])
  const meta = assets.getAsset(props.poolId.toString())

  const availableFarms = farms.data?.filter(
    (farm) => !isFarmJoined(props.depositNft, farm),
  )

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans
        t={t}
        i18nKey={`farms.modal.join.toast.${msType}`}
        tOptions={{
          amount: props.depositNft.deposit.shares.toBigNumber(),
          fixedPointScale: meta.decimals,
        }}
      >
        <span />
        <span className="highlight" />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const redeposit = useFarmRedepositMutation(
    availableFarms,
    [props.depositNft],
    toast,
    props.onTxClose,
  )

  if (!availableFarms?.length) return null
  return (
    <>
      <Text color="neutralGray100" sx={{ mb: 18 }}>
        {t("farms.modal.joinedFarms.available.label")}
      </Text>
      <div sx={{ flex: "column", gap: 12 }}>
        {availableFarms?.map((farm, i) => (
          <FarmDetailsCard
            key={i}
            poolId={props.poolId}
            farm={farm}
            onSelect={() =>
              props.onSelect({
                globalFarm: farm.globalFarm.id,
                yieldFarm: farm.yieldFarm.id,
              })
            }
          />
        ))}
        <Button
          fullWidth
          variant="primary"
          sx={{ mt: 16 }}
          onClick={() => redeposit.mutate()}
          disabled={account?.isExternalWalletConnected}
          isLoading={redeposit.isLoading}
        >
          {t("farms.modal.joinedFarms.button.joinAll.label")}
        </Button>
      </div>
    </>
  )
}

function JoinedFarmsDetailsPositions(props: {
  poolId: u32
  depositNft: DepositNftType
  onSelect: (value: {
    globalFarm: u32
    yieldFarm: u32
    depositNft: DepositNftType
  }) => void
  onTxClose: () => void
}) {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const { account } = useAccountStore()
  const farms = useFarms([props.poolId])
  const meta = assets.getAsset(props.poolId.toString())
  const joinedFarms = farms.data?.filter((farm) =>
    isFarmJoined(props.depositNft, farm),
  )

  const toast = TOAST_MESSAGES.reduce((memo, type) => {
    const msType = type === "onError" ? "onLoading" : type
    memo[type] = (
      <Trans
        t={t}
        i18nKey={`farms.modal.exit.toast.${msType}`}
        tOptions={{
          amount: props.depositNft.deposit.shares.toBigNumber(),
          fixedPointScale: meta.decimals,
        }}
      >
        <span />
        <span className="highlight" />
      </Trans>
    )
    return memo
  }, {} as ToastMessage)

  const exit = useFarmExitAllMutation(
    [props.depositNft],
    toast,
    props.onTxClose,
  )

  return (
    <>
      <Text color="neutralGray100" sx={{ mb: 18, mt: 20 }}>
        {t("farms.modal.joinedFarms.joined.label")}
      </Text>

      <ClaimRewardsCard
        poolId={props.poolId}
        depositNft={props.depositNft}
        onTxClose={props.onTxClose}
      />

      <div sx={{ flex: "column", gap: 12, mt: 12 }}>
        {joinedFarms?.map((farm, i) => (
          <FarmDetailsCard
            key={i}
            poolId={props.poolId}
            farm={farm}
            depositNft={props.depositNft}
            onSelect={() =>
              props.onSelect({
                globalFarm: farm.globalFarm.id,
                yieldFarm: farm.yieldFarm.id,
                depositNft: props.depositNft,
              })
            }
          />
        ))}
      </div>

      <Button
        sx={{ width: "fit-content", my: 24 }}
        css={{ alignSelf: "center" }}
        onClick={() => exit.mutate()}
        isLoading={exit.isLoading}
        disabled={account?.isExternalWalletConnected}
      >
        {t("farms.modal.joinedFarms.button.exit.label")}
      </Button>
    </>
  )
}

export const JoinedFarmsDetails = (props: {
  isOpen: boolean
  onClose: () => void
  poolId: u32
  depositNft: DepositNftType
}) => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const [selectedFarmIds, setSelectedFarmIds] = useState<{
    globalFarm: u32
    yieldFarm: u32
    depositNft?: DepositNftType
  } | null>(null)

  const bestNumber = useBestNumber()
  const meta = assets.getAsset(props.poolId.toString())

  const farms = useFarms([props.poolId])
  const selectedFarm =
    selectedFarmIds != null
      ? farms.data?.find(
          (farm) =>
            farm.globalFarm.id.eq(selectedFarmIds.globalFarm) &&
            farm.yieldFarm.id.eq(selectedFarmIds.yieldFarm),
        )
      : undefined

  const currentBlock = bestNumber.data?.relaychainBlockNumber
    .toBigNumber()
    .dividedToIntegerBy(
      selectedFarm?.globalFarm.blocksPerPeriod.toNumber() ?? 1,
    )

  const { page, direction, back, next } = useModalPagination()
  const onBack = () => {
    back()
    setSelectedFarmIds(null)
  }

  return (
    <Modal open={props.isOpen} onClose={props.onClose} disableCloseOutside>
      <ModalContents
        page={page}
        direction={direction}
        onClose={props.onClose}
        onBack={onBack}
        contents={[
          {
            title: t("farms.modal.join.title", {
              assetSymbol: meta.symbol,
            }),
            content: (
              <div sx={{ flex: "column" }}>
                <JoinedFarmsDetailsPositions
                  poolId={props.poolId}
                  depositNft={props.depositNft}
                  onSelect={(value) => {
                    setSelectedFarmIds(value)
                    next()
                  }}
                  onTxClose={props.onClose}
                />

                <JoinedFarmsDetailsRedeposit
                  poolId={props.poolId}
                  depositNft={props.depositNft}
                  onSelect={(value) => {
                    setSelectedFarmIds(value)
                    next()
                  }}
                  onTxClose={props.onClose}
                />
              </div>
            ),
          },
          {
            content: selectedFarm && (
              <FarmDetailsModal
                poolId={props.poolId}
                farm={selectedFarm}
                depositNft={selectedFarmIds?.depositNft}
                currentBlock={currentBlock?.toNumber()}
              />
            ),
          },
        ]}
      />
    </Modal>
  )
}
