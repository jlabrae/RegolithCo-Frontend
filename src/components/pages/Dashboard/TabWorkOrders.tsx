import * as React from 'react'

import {
  ActivityEnum,
  getRefineryName,
  getShipOreName,
  makeHumanIds,
  RefineryEnum,
  ShipMiningOrder,
  WorkOrder,
  WorkOrderStateEnum,
} from '@regolithco/common'
import { Alert, AlertTitle, Button, Chip, Divider, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { fontFamilies } from '../../../theme'
import { WorkOrderTable } from '../SessionPage/WorkOrderTable'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { DoneAll, OpenInNew, Refresh } from '@mui/icons-material'
import { DashboardProps } from './Dashboard'
import log from 'loglevel'
import { AppContext } from '../../../context/app.context'
import { useShipOreColors } from '../../../hooks/useShipOreColors'
import Grid2 from '@mui/material/Unstable_Grid2/Grid2'
import { RefineryIcon } from '../../fields/RefineryIcon'
import dayjs from 'dayjs'
import { WorkOrderTableColsEnum } from '../SessionPage/WorkOrderTableRow'
import { PageLoader } from '../PageLoader'
import { FetchMoreSessionLoader, FetchMoreWithDate } from './FetchMoreSessionLoader'

export const TabWorkOrders: React.FC<DashboardProps> = ({
  userProfile,
  mySessions,
  joinedSessions,
  allLoaded,
  loading,
  paginationDate,
  fetchMoreSessions,
  deliverWorkOrders,
  navigate,
}) => {
  const theme = useTheme()
  const { getSafeName } = React.useContext(AppContext)
  const sortedShipRowColors = useShipOreColors()
  const { workOrders, workOrdersByDate } = React.useMemo(() => {
    const workOrders = [
      ...joinedSessions.reduce(
        (acc, session) =>
          acc.concat(
            session.workOrders?.items.map((wo) => {
              const { workOrders, ...rest } = session
              return { ...wo, session: rest }
            }) || []
          ),
        [] as WorkOrder[]
      ),
      ...mySessions.reduce(
        (acc, session) =>
          acc.concat(
            session.workOrders?.items.map((wo) => {
              const { workOrders, ...rest } = session
              return { ...wo, session: rest }
            }) || []
          ),
        [] as WorkOrder[]
      ),
    ].filter((wo) => (wo.sellerscName && wo.sellerscName === userProfile.scName) || wo.ownerId === userProfile.userId)
    // sort by date descending
    workOrders.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

    const today = dayjs()
    const woByDate: WorkOrder[][] = []
    let currYear = today.year()
    let currMonth = today.month()
    let yearMonthArr: WorkOrder[] = []

    workOrders.forEach((workOrder) => {
      const woDate = dayjs(workOrder.createdAt)
      const woYear = woDate.year()
      const woMonth = woDate.month()
      const woDay = woDate.date()
      if (woYear === currYear && woMonth === currMonth) {
        yearMonthArr.push(workOrder)
      } else {
        woByDate.push(yearMonthArr)
        yearMonthArr = []
        currYear = woYear
        currMonth = woMonth
      }
    })

    return { workOrders, workOrdersByDate: woByDate }
  }, [joinedSessions, mySessions])
  const undeliveredWorkOrders: Record<RefineryEnum, ShipMiningOrder[]> = React.useMemo(() => {
    const orders = workOrders
      .filter(
        (wo) =>
          wo.orderType === ActivityEnum.ShipMining &&
          (wo as ShipMiningOrder).refinery &&
          wo.state !== WorkOrderStateEnum.Failed &&
          wo.state !== WorkOrderStateEnum.RefiningStarted &&
          !wo.isSold
      )
      .map((wo) => wo as ShipMiningOrder)
    const grouped = orders.reduce(
      (acc, wo) => {
        const refinery = wo.refinery as RefineryEnum
        if (!acc[refinery]) acc[refinery] = []
        acc[refinery].push(wo)
        return acc
      },
      {} as Record<RefineryEnum, ShipMiningOrder[]>
    )
    return grouped
  }, [workOrders])

  log.debug('workOrders', workOrders, undeliveredWorkOrders)
  return (
    <>
      <Stack
        spacing={2}
        sx={{ my: 2, mb: 4, borderBottom: `4px solid ${theme.palette.secondary.dark}` }}
        direction={{ xs: 'column', sm: 'row' }}
      >
        <Typography
          variant="h3"
          component="h3"
          gutterBottom
          sx={{
            color: 'secondary.dark',
            fontFamily: fontFamilies.robotoMono,
            fontWeight: 'bold',
          }}
        >
          My Work Orders
        </Typography>
      </Stack>

      <Box
        sx={{
          p: 3,
          pb: 2,
          my: 5,
          borderRadius: 7,
          // backgroundColor: '#282828',
          display: 'flex',
          flexDirection: 'column',
          border: `8px solid ${theme.palette.primary.main}`,
        }}
      >
        <Typography
          variant="h5"
          component="h3"
          gutterBottom
          sx={{
            fontFamily: fontFamilies.robotoMono,
            fontWeight: 'bold',
            color: theme.palette.secondary.dark,
          }}
        >
          Unsold Work Orders
        </Typography>
        <Typography variant="body1" color="text.secondary" component="div" gutterBottom>
          These work orders have had their refinery timers run out and are ready to be delivered to market.
        </Typography>
        <Typography variant="body1" color="text.secondary" component="div" gutterBottom fontStyle={'italic'}>
          Note: You must use the refinery timer in order to see orders in this list
        </Typography>
        <Divider />
        <Box sx={{ minHeight: 100, minWidth: 250 }}>
          {Object.keys(undeliveredWorkOrders).length === 0 ? (
            <Typography variant="body1" component="div" gutterBottom>
              No undelivered work orders
            </Typography>
          ) : (
            <SimpleTreeView sx={{ my: 2 }} selectedItems={''}>
              {Object.entries(undeliveredWorkOrders).map(([refinery, orders]) => {
                const uniqueSessions = Array.from(new Set(orders.map((wo) => wo.sessionId))).length
                const totalSCU: number = orders.reduce(
                  (acc, wo) =>
                    acc +
                    wo.shipOres.reduce((acc, { amt }) => {
                      const amount = Math.ceil(amt / 100)
                      return acc + amount
                    }, 0),
                  0
                )
                return (
                  <TreeItem
                    key={refinery}
                    itemId={refinery}
                    label={
                      <Stack alignItems="center" direction={'row'} spacing={2}>
                        <Box sx={{ flex: '0 0' }}>
                          <RefineryIcon shortName={refinery} />
                        </Box>
                        <Typography
                          sx={{
                            flex: '1 1 30%',
                            fontFamily: fontFamilies.robotoMono,
                            fontWeight: 'bold',
                          }}
                        >
                          {getRefineryName(refinery as RefineryEnum)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            flex: '1 1 30%',
                            fontFamily: fontFamilies.robotoMono,
                            fontWeight: 'bold',
                          }}
                        >
                          {totalSCU} SCU from {orders.length} order(s) in {uniqueSessions} session(s)
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          disabled={loading}
                          startIcon={<DoneAll />}
                          onClick={() => {
                            deliverWorkOrders(orders)
                          }}
                        >
                          Mark All Delivered
                        </Button>
                      </Stack>
                    }
                  >
                    {orders.map((order) => {
                      return (
                        <TreeItem
                          key={order.orderId}
                          itemId={order.orderId}
                          label={
                            <Stack direction={'row'} spacing={1} alignItems={'center'}>
                              <Tooltip title="Open this work order in a new tab" placement="top">
                                <IconButton
                                  color="primary"
                                  href={`/session/${order.sessionId}/dash/w/${order.orderId}`}
                                  target="_blank"
                                >
                                  <OpenInNew />
                                </IconButton>
                              </Tooltip>
                              <Typography variant="subtitle1">
                                {makeHumanIds(getSafeName(order.sellerscName || order.owner?.scName), order.orderId)}
                              </Typography>
                              <Grid2 sx={{ flex: '0 1 60%' }} container spacing={1}>
                                {totalSCU === 0 && (
                                  <Typography variant="caption" color="error">
                                    No Ore Listed
                                  </Typography>
                                )}
                                {sortedShipRowColors.map((color) => {
                                  const ore = order.shipOres.find((ore) => ore.ore === color.ore)
                                  if (!ore || ore.amt <= 0) return null
                                  return (
                                    <Grid2 key={ore.ore} xs={3}>
                                      <Chip
                                        label={`${getShipOreName(ore.ore).slice(0, 4)}: ${Math.ceil(ore.amt / 100)} SCU`}
                                        size="small"
                                        sx={{
                                          color: color.fg,
                                          width: '100%',
                                          fontSize: '0.75rem',
                                          backgroundColor: color.bg,
                                          textTransform: 'uppercase',
                                          fontFamily: fontFamilies.robotoMono,
                                          fontWeight: 'bold',
                                        }}
                                      />
                                    </Grid2>
                                  )
                                })}
                              </Grid2>
                              <Box sx={{ flexGrow: 1 }} />
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                disabled={loading}
                                startIcon={<DoneAll />}
                                onClick={() => deliverWorkOrders([order])}
                              >
                                Mark Delivered
                              </Button>
                            </Stack>
                          }
                        />
                      )
                    })}
                  </TreeItem>
                )
              })}
            </SimpleTreeView>
          )}
        </Box>
        <FetchMoreWithDate
          sx={{ textAlign: 'right', mt: 4 }}
          loading={loading}
          allLoaded={allLoaded}
          fetchMoreSessions={fetchMoreSessions}
          paginationDate={paginationDate}
        />
      </Box>
      <Box>
        <Typography
          variant="h5"
          component="h5"
          gutterBottom
          sx={{
            color: 'secondary.dark',
            fontFamily: fontFamilies.robotoMono,
            borderBottom: `4px solid ${theme.palette.secondary.dark}`,
            fontWeight: 'bold',
          }}
        >
          Work Order timeline
        </Typography>
        <Alert elevation={1} variant="standard" severity="info" sx={{ my: 2, flex: 1 }}>
          <AlertTitle>Work orders from all your sessions</AlertTitle>
          <Typography>
            All work orders inside all your joined sessions that you either own or have been marked as the seller.
          </Typography>
        </Alert>

        {workOrdersByDate.map((yearMonthArr, idx) => {
          return <WorkOrderListMonth key={`yearMonth-${idx}`} yearMonthArr={yearMonthArr} activeOnly={false} />
        })}
        <PageLoader title="Loading..." loading={loading} small />
        <FetchMoreSessionLoader loading={loading} allLoaded={allLoaded} fetchMoreSessions={fetchMoreSessions} />
      </Box>
    </>
  )
}

export interface WorkOrderListMonthProps {
  yearMonthArr: WorkOrder[]
  activeOnly?: boolean
}

export const WorkOrderListMonth: React.FC<WorkOrderListMonthProps> = ({ yearMonthArr, activeOnly }) => {
  const theme = useTheme()

  if (yearMonthArr.length === 0) return
  const currHeading = dayjs(yearMonthArr[0].createdAt).format('YYYY - MMMM')

  return (
    <Box sx={{ mb: 5, border: '1px solid transparent', borderRadius: 3, overflow: 'hidden' }}>
      <Typography
        variant="h5"
        sx={{
          textAlign: 'left',
          // background: alpha(theme.palette.background.paper, 0.5),
          p: 2,
          fontWeight: 'bold',
          backgroundColor: theme.palette.secondary.dark,
          fontFamily: fontFamilies.robotoMono,
          color: theme.palette.secondary.contrastText,
        }}
      >
        {currHeading}
      </Typography>
      <WorkOrderTable
        disableContextMenu
        sessionActive
        workOrders={yearMonthArr}
        // onRowClick={(sessionId, orderId) => {
        //   const url = `/session/${sessionId}/dash/w/${orderId}`
        //   window.open(url, '_blank')
        // }}
        columns={[
          WorkOrderTableColsEnum.Session,
          WorkOrderTableColsEnum.Activity,
          WorkOrderTableColsEnum.Refinery,
          WorkOrderTableColsEnum.OrderId,
          // WorkOrderTableColsEnum.Shares,
          WorkOrderTableColsEnum.Ores,
          WorkOrderTableColsEnum.Volume,
          WorkOrderTableColsEnum.Gross,
          // WorkOrderTableColsEnum.Net,
          WorkOrderTableColsEnum.FinishedTime,
          // WorkOrderTableColsEnum.Sold,
          // WorkOrderTableColsEnum.Paid,
        ]}
      />
    </Box>
  )
}
