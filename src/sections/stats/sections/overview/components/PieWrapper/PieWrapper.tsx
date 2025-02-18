import { PieChart } from "sections/stats/components/PieChart/PieChart"
import { PieTotalValue } from "sections/stats/sections/overview/components/PieTotalValue/PieTotalValue"
import { PieSkeleton } from "sections/stats/components/PieChart/components/Skeleton/Skeleton"
import { ChartSwitchMobile } from "sections/stats/components/ChartSwitchMobile/ChartSwitchMobile"
import { useMedia } from "react-use"
import { theme } from "theme"
import { useMemo, useState } from "react"
import { SContainerVertical } from "sections/stats/StatsPage.styled"
import { TOmnipoolOverviewData } from "sections/stats/sections/overview/data/OmnipoolOverview.utils"
import { BN_0 } from "utils/constants"
import { useTranslation } from "react-i18next"
import { ChartWrapper } from "sections/stats/components/ChartsWrapper/ChartsWrapper"

type PieWrapperProps = {
  data: TOmnipoolOverviewData
  isLoading: boolean
}

export const PieWrapper = ({ data, isLoading }: PieWrapperProps) => {
  const { t } = useTranslation()
  const isDesktop = useMedia(theme.viewport.gte.sm)
  const [activeSection, setActiveSection] = useState<"overview" | "chart">(
    "overview",
  )

  const { totalTvl, totalPol, totalVolume } = useMemo(() => {
    return data.reduce(
      (acc, omnipoolAsset) => {
        acc = {
          totalTvl: acc.totalTvl.plus(omnipoolAsset.tvl),
          totalPol: acc.totalPol.plus(omnipoolAsset.pol),
          totalVolume: acc.totalVolume.plus(omnipoolAsset.volume),
        }
        return acc
      },
      { totalTvl: BN_0, totalPol: BN_0, totalVolume: BN_0 },
    )
  }, [data])

  const pieChartValues = (
    <div sx={{ flex: "column", gap: 20 }}>
      <PieTotalValue
        title={t("stats.overview.pie.values.tvl")}
        data={totalTvl}
        isLoading={isLoading}
      />
      <div
        sx={{
          flex: ["row", "column"],
          justify: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <PieTotalValue
          title={t("stats.overview.pie.values.pol")}
          data={totalPol}
          isLoading={isLoading}
        />
        <PieTotalValue
          title={t("stats.overview.pie.values.volume")}
          data={totalVolume.div(2)}
          isLoading={isLoading}
        />
      </div>
    </div>
  )

  return (
    <SContainerVertical
      sx={{
        width: ["100%", "fit-content"],
        height: [500, "100%"],
        p: [20, 40],
      }}
    >
      {!isDesktop && (
        <ChartSwitchMobile onClick={setActiveSection} active={activeSection} />
      )}

      {activeSection === "overview" ? (
        <>
          {!isLoading ? (
            <PieChart data={data} property="tvl" />
          ) : (
            <PieSkeleton />
          )}
          {pieChartValues}
        </>
      ) : (
        <ChartWrapper />
      )}
    </SContainerVertical>
  )
}
