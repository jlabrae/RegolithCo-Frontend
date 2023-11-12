import * as React from 'react'

import {
  ActivityEnum,
  makeHumanIds,
  SessionStateEnum,
  ShipMiningOrder,
  WorkOrder,
  WorkOrderStateEnum,
} from '@regolithco/common'
import dayjs from 'dayjs'
import { getActivityName, calculateWorkOrder, WorkOrderSummary } from '@regolithco/common'
import {
  Badge,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Theme,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { MValue, MValueFormat, MValueFormatter } from '../../fields/MValue'
import { CountdownTimer } from '../../calculators/WorkOrderCalc/CountdownTimer'
import { ClawIcon, GemIcon, RockIcon } from '../../../icons'
import {
  AccessTime,
  CheckCircle,
  Dangerous,
  Diversity3,
  Factory,
  PriceCheck,
  QuestionMark,
  SvgIconComponent,
} from '@mui/icons-material'
import { fontFamilies } from '../../../theme'
import { SessionContext } from '../../../context/session.context'
import { grey } from '@mui/material/colors'

export interface WorkOrderTableProps {
  isDashboard?: boolean
  workOrders: WorkOrder[]
  isShare?: boolean
  openWorkOrderModal?: (orderId: string) => void
}

const stylesThunk = (theme: Theme, isActive: boolean): Record<string, SxProps<Theme>> => ({
  table: {
    '& .MuiTableCell-root': {
      whiteSpace: 'nowrap',
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root': {
      backgroundColor: '#00000055',
    },
  },
  tableHead: {
    '& .MuiTableCell-root': {
      backgroundColor: isActive ? theme.palette.primary.light : grey[400],
      color: theme.palette.primary.contrastText,
      borderBottom: '2px solid',
    },
  },
  footer: {
    '& .MuiTableCell-root': {
      fontSize: '0.8rem',
      color: isActive ? theme.palette.secondary.main : grey[400],
      backgroundColor: '#160800d8',
      borderTop: '2px solid',
      whiteSpace: 'nowrap',
      borderBottom: 'none',
    },
  },
})

export const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  workOrders,
  openWorkOrderModal,
  isShare,
  isDashboard,
}) => {
  const theme = useTheme()
  const { session } = React.useContext(SessionContext)
  const isActive = session?.state === SessionStateEnum.Active
  const styles = stylesThunk(theme, Boolean(isActive || isShare))

  // NOTE: Order is REALLY important here
  const { summaries, volSCU, shareAmount, sortedWorkOrders } = React.useMemo(() => {
    const sortedWorkOrders = [...workOrders].sort((a, b) => {
      return a.createdAt - b.createdAt
    })
    const summaries = workOrders.reduce(
      (acc, workOrder: WorkOrder) => ({ ...acc, [workOrder.orderId]: calculateWorkOrder(workOrder) }),
      {} as Record<string, WorkOrderSummary>
    )
    return {
      summaries,
      volSCU: Object.values(summaries).reduce(
        (acc, summary) =>
          acc +
          (summary.oreSummary ? Object.values(summary.oreSummary).reduce((acc, ore) => acc + ore.collected, 0) : 0) /
            100,
        0
      ),
      shareAmount: Object.values(summaries).reduce((acc, summary) => acc + summary.shareAmount, 0),
      sortedWorkOrders,
    }
  }, [workOrders])

  return (
    <TableContainer
      sx={{
        ...styles.table,
        maxHeight: isDashboard ? 400 : undefined,
        minHeight: isDashboard ? 300 : undefined,
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={styles.tableHead}>
            <TableCell align="center">Type</TableCell>
            <TableCell>Order Id</TableCell>
            {!isShare && <TableCell align="center">State</TableCell>}
            <TableCell>Ores</TableCell>
            <TableCell align="center">
              <Tooltip title="Crew Shares">
                <Diversity3 />
              </Tooltip>
            </TableCell>
            <TableCell align="right">Collected</TableCell>
            <TableCell align="right">Gross Profit</TableCell>
            <TableCell align="right">
              <Tooltip title="Finished At / Time left">
                <AccessTime />
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedWorkOrders.map((workOrder: WorkOrder, idx) => (
            <WorkOrderTableRow
              key={`wo-${workOrder.orderId}`}
              workOrder={workOrder}
              isShare={isShare}
              openWorkOrderModal={openWorkOrderModal}
              summary={summaries[workOrder.orderId]}
            />
          ))}
        </TableBody>
        <TableFooter sx={styles.footer}>
          <TableRow>
            <TableCell colSpan={isShare ? 4 : 5}>Totals</TableCell>
            <TableCell align="right">
              <MValue value={volSCU} format={MValueFormat.volSCU} decimals={volSCU > 10 ? 0 : 1} />
            </TableCell>
            <Tooltip title={<>Gross Profit: {MValueFormatter(shareAmount, MValueFormat.currency)}</>}>
              <TableCell align="right">
                <MValue value={shareAmount} format={MValueFormat.currency_sm} />
              </TableCell>
            </Tooltip>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}

export interface WorkOrderTableRowProps {
  workOrder: WorkOrder
  isShare?: boolean
  openWorkOrderModal?: (orderId: string) => void
  summary: WorkOrderSummary
}

export const WorkOrderTableRow: React.FC<WorkOrderTableRowProps> = ({
  workOrder,
  openWorkOrderModal,
  isShare,
  summary,
}) => {
  const theme = useTheme()
  const { owner, createdAt, state, orderType, crewShares } = workOrder
  const shipOrder = workOrder as ShipMiningOrder

  let stateIcon: React.ReactNode
  const volumeVal = Object.entries(summary.oreSummary).reduce(
    (acc, [oreKey, { collected }]) => acc + collected / 100,
    0
  )

  let OrderIcon: SvgIconComponent
  switch (orderType) {
    case ActivityEnum.ShipMining:
      OrderIcon = RockIcon
      break
    case ActivityEnum.Salvage:
      OrderIcon = ClawIcon
      break
    case ActivityEnum.VehicleMining:
      OrderIcon = GemIcon
      break
    case ActivityEnum.Other:
      OrderIcon = QuestionMark
      break
    default:
      OrderIcon = ClawIcon
      break
  }
  const finalOres = Object.keys(summary.oreSummary)
  const oreNames =
    workOrder.orderType === ActivityEnum.Other
      ? 'N/A'
      : finalOres.length > 1
      ? finalOres.map((o) => o.slice(0, 3)).join(', ')
      : finalOres[0]
      ? finalOres[0]
      : '???'

  switch (state) {
    // case WorkOrderStateEnum.RefiningComplete:
    //   stateIcon = <AddBusiness color="success" />
    //   break
    case WorkOrderStateEnum.Failed:
      stateIcon = <Dangerous color="error" />
      break
    case WorkOrderStateEnum.Done:
      stateIcon = <PriceCheck color="success" />
      break
    case WorkOrderStateEnum.RefiningComplete:
      stateIcon = (
        <Badge badgeContent={<CheckCircle />}>
          <Factory />
        </Badge>
      )
      break
    case WorkOrderStateEnum.RefiningStarted:
      stateIcon = <Factory color="secondary" />
      break
    case WorkOrderStateEnum.Unknown:
      stateIcon = <QuestionMark />
      break
    default:
      stateIcon = <ClawIcon />
      break
  }

  return (
    <TableRow
      key={workOrder.orderId}
      onClick={() => openWorkOrderModal && openWorkOrderModal(workOrder.orderId)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell align="center">
        <Tooltip title={getActivityName(workOrder.orderType)}>
          <OrderIcon />
        </Tooltip>
      </TableCell>
      <TableCell>
        <MValue
          value={makeHumanIds(workOrder.sellerscName || workOrder.owner?.scName, workOrder.orderId)}
          format={MValueFormat.string}
        />
      </TableCell>
      {/* State */}
      {!isShare && (
        <TableCell align="center">
          <Tooltip title={workOrder.state}>{stateIcon}</Tooltip>
        </TableCell>
      )}
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 150,
        }}
      >
        {oreNames}
      </TableCell>
      {/* crew shares */}
      <TableCell align="center">{workOrder.crewShares?.length || 0}</TableCell>
      <TableCell align="right">
        {workOrder.orderType === ActivityEnum.Other ? (
          'N/A'
        ) : (
          <MValue value={volumeVal} format={MValueFormat.volSCU} decimals={volumeVal > 10 ? 0 : 1} />
        )}
      </TableCell>
      <Tooltip
        title={
          <>
            Work Order Profit:
            {MValueFormatter(workOrder.shareAmount || summary.shareAmount || 0, MValueFormat.currency)}
          </>
        }
      >
        <TableCell align="right">
          <MValue value={workOrder.shareAmount || summary.shareAmount || 0} format={MValueFormat.currency_sm} />
        </TableCell>
      </Tooltip>
      {isShare ? (
        <TableCell align="right">
          {summary.completionTime && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.light,
                fontFamily: fontFamilies.robotoMono,
                fontWeight: 'bold',
              }}
            >
              {dayjs(
                shipOrder.processStartTime
                  ? shipOrder.processStartTime + (shipOrder.processDurationS || 0) * 1000
                  : undefined
              ).format('MMM D, h:mm a')}{' '}
              ({new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2]})
            </Typography>
          )}
        </TableCell>
      ) : (
        <TableCell align="right">
          {summary.completionTime && summary.completionTime > Date.now() ? (
            <CountdownTimer
              startTime={shipOrder.processStartTime as number}
              totalTime={(shipOrder.processDurationS || 0) * 1000}
              useMValue
              typoProps={{
                sx: {
                  color: theme.palette.primary.light,
                },
              }}
            />
          ) : (
            <MValue value={workOrder.createdAt} format={MValueFormat.dateTime} />
          )}
        </TableCell>
      )}
    </TableRow>
  )
}
