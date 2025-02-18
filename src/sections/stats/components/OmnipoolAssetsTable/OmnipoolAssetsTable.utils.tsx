import {
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table"
import { useState } from "react"
import { useMedia } from "react-use"
import { theme } from "theme"
import { TUseOmnipoolAssetDetailsData } from "sections/stats/StatsPage.utils"
import BigNumber from "bignumber.js"

export type OmnipoolAssetsTableColumn = ColumnDef<
  TUseOmnipoolAssetDetailsData[number],
  string & BigNumber
>

export const useOmnipoolAssetsTable = (
  data: TUseOmnipoolAssetDetailsData,
  columns: OmnipoolAssetsTableColumn[],
) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "tvl", desc: true },
    { id: "pol", desc: true },
  ])
  const isDesktop = useMedia(theme.viewport.gte.sm)

  const columnVisibility: VisibilityState = {
    symbol: true,
    tvl: true,
    volume: isDesktop,
    fee: isDesktop,
    pol: isDesktop,
    actions: true,
  }

  return useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}
