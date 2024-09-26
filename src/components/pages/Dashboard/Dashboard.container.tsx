import {
  calculateWorkOrder,
  CrewShare,
  MarkCrewSharePaidMutation,
  ObjectValues,
  Session,
  UpdateWorkOrderMutation,
  UserProfile,
  WorkOrder,
  WorkOrderStateEnum,
  WorkOrderSummary,
} from '@regolithco/common'
import * as React from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { useUserProfile } from '../../../hooks/useUserProfile'
import { useSessionList } from '../../../hooks/useSessionList'
import { LookupsContext } from '../../../context/lookupsContext'

import log from 'loglevel'
import { DatePresetsEnum } from './TabStats/StatsDatePicker'
import { useMarkCrewSharePaidMutation, useUpdateWorkOrderMutation } from '../../../schema'
import dayjs, { Dayjs } from 'dayjs'

export const tabUrl = (
  tab: SessionDashTabsEnum,
  preset?: DatePresetsEnum,
  from?: Dayjs | null,
  to?: Dayjs | null
): string => {
  if (tab !== SessionDashTabsEnum.stats) return `/dashboard/${tab}`
  else {
    if (preset !== DatePresetsEnum.CUSTOM) return `/dashboard/${tab}/${preset}`
    else
      return `/dashboard/${tab}/${preset}?from=${(from || dayjs()).format('YYYY-MM-DD')}&to=${(to || dayjs()).format('YYYY-MM-DD')}`
  }
}
export const SessionDashTabsEnum = {
  sessions: 'sessions',
  workOrders: 'work_orders',
  crewShares: 'crew_shares',
  stats: 'stats',
} as const
export type SessionDashTabsEnum = ObjectValues<typeof SessionDashTabsEnum>

export type WorkOrderSummaryLookup = Record<string, Record<string, WorkOrderSummary>>

export const DashboardContainer: React.FC = () => {
  const navigate = useNavigate()
  const userQueries = useUserProfile()
  const useSessionListQueries = useSessionList()
  const dataStore = React.useContext(LookupsContext)
  const [workOrderSummaries, setWorkOrderSummaries] = React.useState<WorkOrderSummaryLookup>({})
  const { tab: tabStr, preset: presetStr } = useParams()
  // Get query params from url
  const { search } = useLocation()

  // Parse query parameters
  const queryParams = new URLSearchParams(search)
  const parsedFrom = queryParams.get('from')
  const parsedTo = queryParams.get('to')
  const parsedFromValid = parsedFrom && dayjs(parsedFrom).isValid() && dayjs(parsedFrom).isBefore(dayjs())
  let parsedToValid = parsedTo && dayjs(parsedTo).isValid() && dayjs(parsedTo).isBefore(dayjs())
  if (parsedFromValid && parsedToValid && dayjs(parsedFrom).isAfter(dayjs(parsedTo))) parsedToValid = false

  const storedDates = localStorage.getItem('dashboard_stats_range')
  const storedPreset = localStorage.getItem('dashboard_stats_preset')
  const tabValid = Object.values(SessionDashTabsEnum).indexOf(tabStr as SessionDashTabsEnum) !== -1
  const presetStrValid = presetStr && Object.values(DatePresetsEnum).indexOf(presetStr as DatePresetsEnum) !== -1
  const storedPresetValid =
    storedPreset && Object.values(DatePresetsEnum).indexOf(storedPreset as DatePresetsEnum) !== -1

  const defaultFrom = storedDates?.split('::')[0] || null
  const defaultTo = storedDates?.split('::')[1] || null
  const defaultFromValid = defaultFrom && dayjs(defaultFrom).isValid() && dayjs(defaultFrom).isBefore(dayjs())
  let defaultToValid = defaultTo && dayjs(defaultTo).isValid() && dayjs(defaultTo).isBefore(dayjs())
  if (defaultFromValid && defaultToValid && dayjs(defaultFrom).isAfter(dayjs(defaultTo))) defaultToValid = false

  // This is a tricky redirect to make so we need to make sure we're not going to induce an infinite loop
  React.useEffect(() => {
    // If the tab is not valid, redirect to the sessions tab
    if (!tabValid) navigate(tabUrl(SessionDashTabsEnum.sessions))
    // If the preset is not valid then redirect to the stats tab with a valid preset
    else if (tabStr === SessionDashTabsEnum.stats) {
      // Default to a valid preset if none is provided
      if (!presetStrValid && !storedPresetValid) navigate(tabUrl(SessionDashTabsEnum.stats, DatePresetsEnum.THISMONTH))
      // If there's no preset and a valid stored preset, redirect to that
      if (!presetStrValid && storedPresetValid) {
        if (storedPreset !== DatePresetsEnum.CUSTOM) navigate(tabUrl(SessionDashTabsEnum.stats, storedPreset))
        else {
          const redirectFromDate = parsedFromValid
            ? parsedFrom
            : defaultFromValid
              ? defaultFrom
              : dayjs().format('YYYY-MM-DD')
          const redirectToDate = parsedToValid ? parsedTo : defaultToValid ? defaultTo : dayjs().format('YYYY-MM-DD')
          navigate(
            tabUrl(SessionDashTabsEnum.stats, DatePresetsEnum.CUSTOM, dayjs(redirectFromDate), dayjs(redirectToDate))
          )
        }
      }
      if (presetStrValid && presetStr === DatePresetsEnum.CUSTOM) {
        if (!parsedFromValid || !parsedToValid) {
          const redirectFromDate = parsedFromValid
            ? parsedFrom
            : defaultFromValid
              ? defaultFrom
              : dayjs().format('YYYY-MM-DD')
          const redirectToDate = parsedToValid ? parsedTo : defaultToValid ? defaultTo : dayjs().format('YYYY-MM-DD')
          navigate(
            tabUrl(SessionDashTabsEnum.stats, DatePresetsEnum.CUSTOM, dayjs(redirectFromDate), dayjs(redirectToDate))
          )
        }
      }
    }
    // If there's a stored preset, redirect to that
  }, [storedPreset, presetStr, tabStr, navigate])

  React.useEffect(() => {
    // Make sure not to set anything aggregious in local storage
    if (presetStrValid) {
      if (presetStr !== storedPreset) {
        console.log('finalPreset: Setting preset', { presetStr })
        localStorage.setItem('dashboard_stats_preset', presetStr)
      }
      if (presetStr === DatePresetsEnum.CUSTOM && parsedFrom && parsedTo) {
        try {
          const from = dayjs(parsedFrom)
          const to = dayjs(parsedTo)
          if (from.isValid() && to.isValid() && from.isBefore(to)) {
            const dateStr = `${parsedFrom || ''}::${parsedTo || ''}`
            localStorage.setItem('dashboard_stats_range', dateStr)
          }
        } catch (e) {
          log.error('Failed to parse date', e)
        }
      }
    }
  }, [presetStr, parsedFrom, parsedTo])
  // console.log('finalPreset Container', { presetStr })

  const updateWorkOrderMutation = useUpdateWorkOrderMutation()
  const deliverWorkOrders = (orders: WorkOrder[]) => {
    return Promise.all(
      orders.map(({ orderId, sessionId, ...rest }) => {
        return updateWorkOrderMutation[0]({
          variables: {
            orderId,
            sessionId,
            workOrder: {
              isSold: true,
            },
          },
          optimisticResponse: () => {
            // Get it from cache
            const optimisticresponse: UpdateWorkOrderMutation = {
              __typename: 'Mutation',
              updateWorkOrder: {
                ...rest,
                orderId,
                sessionId,
                state: WorkOrderStateEnum.Done,
              },
            }
            return optimisticresponse
          },
        })
          .then((res) => {
            // log.info('Delivered work order', res)
          })
          .catch((e) => {
            // log.error('Failed to deliver work order', e)
          })
      })
    ).then(() => {
      // log.debug('Delivered all work orders')
    })
  }

  const markCrewSharePaidMutation = useMarkCrewSharePaidMutation()
  const markCrewSharesPaid = (shares: CrewShare[]) => {
    return Promise.all(
      shares.map((share) => {
        const { orderId, sessionId, payeeScName } = share
        return markCrewSharePaidMutation[0]({
          variables: {
            isPaid: true,
            sessionId,
            orderId,
            payeeScName,
          },
          optimisticResponse: () => {
            return {
              __typename: 'Mutation',
              markCrewSharePaid: {
                ...share,
                isPaid: true,
              },
            } as MarkCrewSharePaidMutation
          },
        })
          .then((res) => {
            // log.info('Marked crew share paid', res)
          })
          .catch((e) => {
            // log.error('Failed to mark crew share paid', e)
          })
      })
    ).then(() => {
      // log.debug('Marked all crew shares paid')
    })
  }

  // Call calculateWorkOrder for each session and all of its work orders and store the results in state
  React.useEffect(() => {
    if (!userQueries.userProfile || !useSessionListQueries.joinedSessions || !useSessionListQueries.mySessions) return
    const sessions = [...useSessionListQueries.joinedSessions.items, ...useSessionListQueries.mySessions.items]
    const workOrders = sessions.reduce((acc, session) => {
      return acc.concat(session.workOrders?.items || [])
    }, [] as WorkOrder[])

    const calcWorkOrders = async () => {
      const summaries: Record<string, Record<string, WorkOrderSummary>> = {}
      for (const workOrder of workOrders) {
        summaries[workOrder.sessionId] = summaries[workOrder.sessionId] || {}
        summaries[workOrder.sessionId][workOrder.orderId] = await calculateWorkOrder(dataStore, workOrder)
      }
      setWorkOrderSummaries(summaries)
    }
    calcWorkOrders()
  }, [dataStore, userQueries.userProfile, useSessionListQueries.joinedSessions, useSessionListQueries.mySessions])

  return (
    <Dashboard
      activeTab={tabStr as SessionDashTabsEnum}
      statsFilters={{
        preset: presetStr as DatePresetsEnum,
        fromDateCustom: defaultFrom ? dayjs(defaultFrom) : null,
        toDateCustom: defaultTo ? dayjs(defaultTo) : null,
      }}
      workOrderSummaries={workOrderSummaries}
      deliverWorkOrders={deliverWorkOrders}
      markCrewSharesPaid={markCrewSharesPaid}
      paginationDate={useSessionListQueries.paginationDate}
      setPaginationDate={useSessionListQueries.setPaginationDate}
      userProfile={userQueries.userProfile as UserProfile}
      joinedSessions={(useSessionListQueries.joinedSessions?.items || []) as Session[]}
      mySessions={(useSessionListQueries.mySessions?.items || []) as Session[]}
      fetchMoreSessions={useSessionListQueries.fetchMoreSessions}
      loading={
        userQueries.loading ||
        useSessionListQueries.loading ||
        userQueries.mutating ||
        updateWorkOrderMutation[1].loading ||
        markCrewSharePaidMutation[1].loading
      }
      allLoaded={useSessionListQueries.allLoaded}
      navigate={navigate}
      onCreateNewSession={useSessionListQueries.createSession}
    />
  )
}
