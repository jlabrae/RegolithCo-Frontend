import * as React from 'react'

import {
  ActivityEnum,
  CrewShare,
  RefineryEnum,
  Session,
  SessionStateEnum,
  ShipMiningOrder,
  UserProfile,
  WorkOrder,
  WorkOrderStateEnum,
} from '@regolithco/common'
import { Badge, Box, Container, darken, Paper, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material'
import { Engineering, Insights, Savings, ViewTimeline } from '@mui/icons-material'
import { TabSessions } from './TabSessions'
import { TabWorkOrders } from './TabWorkOrders'
import { StatsFilters, TabStats } from './TabStats/TabStats'
import { TabCrewShares } from './TabCrewShares'
import { SessionDashTabsEnum, WorkOrderSummaryLookup } from './Dashboard.container'
import { JoinSessionButton } from './JoinSessionButton'
import { fontFamilies } from '../../../theme'

export type WorkOrderLookup = Record<string, Record<string, WorkOrder>>

export interface DashboardProps {
  userProfile: UserProfile
  workOrderSummaries: WorkOrderSummaryLookup
  activeTab: SessionDashTabsEnum
  statsFilters: StatsFilters
  mySessions: Session[]
  joinedSessions: Session[]
  deliverWorkOrders: (orders: WorkOrder[]) => Promise<void>
  markCrewSharesPaid: (shares: CrewShare[]) => Promise<void>
  fetchMoreSessions: () => void
  paginationDate: number
  setPaginationDate: (date: number) => void
  loading?: boolean
  creatingSession?: boolean
  allLoaded?: boolean
  navigate?: (path: string) => void
  onCreateNewSession?: () => void
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const theme = useTheme()
  const { activeTab, navigate, onCreateNewSession } = props
  const mediumUp = useMediaQuery(theme.breakpoints.up('md'))

  const styles = {
    container: {
      my: {
        md: 4,
      },
      border: {
        // sm: '10px solid red',
        // md: '1px solid #444444',
      },
    },
    paper: {
      // p: 2,
      // blur the background
      backdropFilter: 'blur(7px)',
      backgroundColor: '#000000ee',
    },
    innerContainer: {
      px: {
        md: 2,
        lg: 4,
      },
      py: {
        md: 3,
        lg: 2,
      },
    },
  }

  const { iOweShareNum } = React.useMemo(() => {
    const myCrewShares = [...props.joinedSessions, ...props.mySessions].reduce(
      (acc, session) => {
        // NOTE: We need to filter out crewshares that don't involve us
        return acc.concat(
          (session.workOrders?.items || []).reduce(
            (acc, wo) => {
              try {
                const csSumm = props.workOrderSummaries[wo.sessionId][wo.orderId].crewShareSummary || []
                const csReturns = (wo.crewShares || []).map<[CrewShare, number]>((cs, idcs) => {
                  const amts = csSumm[idcs] || [0, 0, 0]
                  const amt = wo.includeTransferFee ? amts[1] : amts[0]
                  return [cs, amt]
                })
                return acc.concat(csReturns)
              } catch (e) {
                return acc
              }
            },
            [] as [CrewShare, number][]
          )
        )
      },
      [] as [CrewShare, number][]
    )
    const relevantCrewShares = myCrewShares.filter((csArr) => {
      const cs = csArr[0]
      const amt = csArr[1]
      if (amt <= 0) return false
      // Any share where the payer is not also the payee
      const sellerScName = props.workOrderSummaries[cs.sessionId][cs.orderId].sellerScName
      // Any share where the payer IS the payee is considered paid
      if (!sellerScName || sellerScName === cs.payeeScName) return false
      if (sellerScName === props.userProfile.scName || cs.payeeScName === props.userProfile.scName) return true
      return false
    })
    // Filter to only unpaid shares
    const unpaidShares = relevantCrewShares.filter((cs) => !cs[0].state)
    const iOweShares: string[] = []

    unpaidShares.forEach((csArr) => {
      const cs = csArr[0]
      if (
        cs.payeeScName !== props.userProfile.scName &&
        props.workOrderSummaries[cs.sessionId][cs.orderId].sellerScName === props.userProfile.scName
      ) {
        if (!iOweShares.includes(cs.payeeScName)) iOweShares.push(cs.payeeScName)
      }
    })

    return {
      iOweShareNum: iOweShares.length,
    }
  }, [props.joinedSessions, props.mySessions, props.workOrderSummaries])

  const activeSessions = React.useMemo(
    () => props.mySessions.filter((session) => session.state === SessionStateEnum.Active),
    [props.mySessions]
  )

  const { refineriesWithUndelivered } = React.useMemo(() => {
    const refineriesWithUndeliveredObj = [
      ...props.joinedSessions.reduce(
        (acc, session) =>
          acc.concat(
            session.workOrders?.items.map((wo) => {
              const { workOrders, ...rest } = session
              return { ...wo, session: rest }
            }) || []
          ),
        [] as WorkOrder[]
      ),
      ...props.mySessions.reduce(
        (acc, session) =>
          acc.concat(
            session.workOrders?.items.map((wo) => {
              const { workOrders, ...rest } = session
              return { ...wo, session: rest }
            }) || []
          ),
        [] as WorkOrder[]
      ),
    ]
      .filter(
        (wo) =>
          (wo.sellerscName && wo.sellerscName === props.userProfile.scName) || wo.ownerId === props.userProfile.userId
      )
      .filter(
        (wo) =>
          wo.orderType === ActivityEnum.ShipMining &&
          (wo as ShipMiningOrder).refinery &&
          wo.state !== WorkOrderStateEnum.Failed &&
          !wo.isSold
      )
      .map((wo) => wo as ShipMiningOrder)
      .reduce(
        (acc, wo) => {
          const refinery = wo.refinery as RefineryEnum
          if (!acc[refinery]) acc[refinery] = []
          acc[refinery].push(wo)
          return acc
        },
        {} as Record<RefineryEnum, ShipMiningOrder[]>
      )

    return { refineriesWithUndelivered: Object.keys(refineriesWithUndeliveredObj).length }
  }, [props.joinedSessions, props.mySessions])

  return (
    <Container maxWidth="lg" sx={styles.container}>
      <Paper elevation={4} sx={styles.paper}>
        {mediumUp && (
          <Tabs
            value={activeTab}
            variant="fullWidth"
            onChange={(event: React.SyntheticEvent, newValue: SessionDashTabsEnum) => {
              navigate && navigate(`/dashboard/${newValue}`)
            }}
            sx={{
              borderBottom: `3px solid ${theme.palette.primary.main}`,
              // Make the active tab stand out
              mb: 4,
              '& .MuiTab-root': {
                fontSize: '1.25rem',
                fontWeight: 'bold',
                fontFamily: fontFamilies.robotoMono,
                textAlignment: 'Left',
                background: 'black',
                borderTop: `1px solid ${darken(theme.palette.primary.dark, 0.3)}`,
                borderLeft: `1px solid ${darken(theme.palette.primary.dark, 0.3)}`,
                borderRight: `1px solid ${darken(theme.palette.primary.dark, 0.3)}`,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                backgroundColor: darken(theme.palette.primary.dark, 0.7),
                mr: 2,
              },
              '& .MuiTab-root.Mui-selected': {
                color: theme.palette.primary.contrastText,
                backgroundColor: theme.palette.primary.main,
              },
              '& .MuiTabs-indicator': {
                // backgroundColor: 'black',
                // height: 5,
              },
            }}
          >
            <Tab
              label={
                <Badge badgeContent={activeSessions.length} color="error">
                  Sessions
                </Badge>
              }
              icon={<ViewTimeline />}
              iconPosition="start"
              value={SessionDashTabsEnum.sessions}
            />
            <Tab
              label={
                <Badge badgeContent={refineriesWithUndelivered} color="error">
                  Work Orders
                </Badge>
              }
              value={SessionDashTabsEnum.workOrders}
            />
            <Tab
              label={
                <Badge badgeContent={iOweShareNum} color="error">
                  Crew Shares
                </Badge>
              }
              value={SessionDashTabsEnum.crewShares}
            />
            <Tab label="Stats" icon={<Insights />} iconPosition="start" value={SessionDashTabsEnum.stats} />
          </Tabs>
        )}
        <Box sx={styles.innerContainer}>
          {activeTab === SessionDashTabsEnum.sessions && (
            <JoinSessionButton
              loading={props.creatingSession}
              sessions={activeSessions}
              onCreateNewSession={onCreateNewSession}
              navigate={navigate}
            />
          )}
          {activeTab === SessionDashTabsEnum.sessions && <TabSessions {...props} />}
          {activeTab === SessionDashTabsEnum.workOrders && <TabWorkOrders {...props} />}
          {activeTab === SessionDashTabsEnum.crewShares && <TabCrewShares {...props} />}
          {activeTab === SessionDashTabsEnum.stats && <TabStats {...props} />}
        </Box>
      </Paper>
      {/* Mobile-only menu */}
      {!mediumUp && (
        <Tabs
          variant="scrollable"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            borderTop: '2px solid',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '& .MuiTab-root': {
              color: theme.palette.primary.contrastText,
            },
            '& .Mui-selected': {
              backgroundColor: theme.palette.secondary.main,
              // color: theme.palette.primary.light,
              // textShadow: '0 0 2px #FFF',
            },
          }}
          scrollButtons="auto"
          allowScrollButtonsMobile
          value={activeTab}
          onChange={(event: React.SyntheticEvent, newValue: SessionDashTabsEnum) => {
            navigate && navigate(`/dashboard/${newValue}`)
          }}
          aria-label="basic tabs example"
        >
          <Tab
            label={'Sessions'}
            icon={
              <Badge badgeContent={activeSessions.length} color="error">
                <ViewTimeline />
              </Badge>
            }
            value={SessionDashTabsEnum.sessions}
          />
          <Tab
            label={'Work Orders'}
            icon={
              <Badge badgeContent={refineriesWithUndelivered} color="error">
                <Engineering />
              </Badge>
            }
            value={SessionDashTabsEnum.workOrders}
          />
          <Tab
            label={'Crew Shares'}
            icon={
              <Badge badgeContent={iOweShareNum} color="error">
                <Savings />
              </Badge>
            }
            value={SessionDashTabsEnum.crewShares}
          />
          <Tab label="Stats" icon={<Insights />} value={SessionDashTabsEnum.stats} />
        </Tabs>
      )}
    </Container>
  )
}
