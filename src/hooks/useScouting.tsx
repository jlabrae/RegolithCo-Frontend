import {
  useDeleteScoutingFindMutation,
  useGetScoutingFindQuery,
  useJoinScoutingFindMutation,
  useLeaveScoutingFindMutation,
  useUpdateScoutingFindMutation,
} from '../schema'

import { useGQLErrors } from './useGQLErrors'
import { useNavigate } from 'react-router-dom'
import { ScoutingFind, scoutingFindDestructured, SessionUser, User } from '@regolithco/common'
import { useSnackbar } from 'notistack'

type useSessionsReturn = {
  scoutingFind?: ScoutingFind
  loading: boolean
  querying: boolean
  mutating: boolean
  updateScoutingFind: (newFind: ScoutingFind) => void
  deleteScoutingFind: (findId: string) => void
  joinScoutingFind: (findId: string, enRoute: boolean) => void
  leaveScoutingFind: (findId: string) => void
}

export const useScoutingFind = (
  sessionId: string,
  scoutingFindId: string,
  sessionUser?: SessionUser
): useSessionsReturn => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const scoutingFindQry = useGetScoutingFindQuery({
    variables: {
      sessionId,
      scoutingFindId,
    },
    skip: !sessionId || !scoutingFindId,
  })

  const updateScoutingFindMutation = useUpdateScoutingFindMutation()
  const deleteScoutingFindMutation = useDeleteScoutingFindMutation({
    update: (cache, { data }) => {
      cache.evict({ id: cache.identify(scoutingFindQry.data?.scoutingFind as ScoutingFind) })
    },
    onCompleted: () => {
      enqueueSnackbar('You have deleted the scouting find', { variant: 'warning' })
      navigate(`/session/${sessionId}`)
    },
  })
  const joinScoutingFindMutation = useJoinScoutingFindMutation({
    // update: (cache, { data }) => {
    //   if (!sessionUser) return
    //   cache.modify({
    //     id: cache.identify(scoutingFindQry.data?.scoutingFind as ScoutingFind),
    //     fields: {
    //       attendance(existingAttendance: SessionUser[] = []) {
    //         return [...existingAttendance, sessionUser]
    //       },
    //     },
    //   })
    // },
  })
  const leaveScoutingFindMutation = useLeaveScoutingFindMutation({
    onCompleted: () => {
      enqueueSnackbar('You have left the scouting find', { variant: 'warning' })
      // navigate(`/session/${sessionId}`)
    },
  })
  const queries = [scoutingFindQry]
  const mutations = [
    updateScoutingFindMutation,
    deleteScoutingFindMutation,
    joinScoutingFindMutation,
    leaveScoutingFindMutation,
  ]
  const querying = queries.some((q) => q.loading)
  const mutating = mutations.some((m) => m[1].loading)

  useGQLErrors([], mutations)

  return {
    scoutingFind: scoutingFindQry.data?.scoutingFind as ScoutingFind,
    mutating,
    querying,
    loading: querying || mutating,
    updateScoutingFind: (newFind: ScoutingFind) => {
      const { scoutingFind, shipRocks, vehicleRocks, wrecks } = scoutingFindDestructured(newFind)
      updateScoutingFindMutation[0]({
        variables: {
          sessionId,
          scoutingFindId: newFind.scoutingFindId,
          scoutingFind: scoutingFind,
          shipRocks: shipRocks,
          vehicleRocks: vehicleRocks,
          wrecks: wrecks,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          updateScoutingFind: {
            ...scoutingFindQry.data?.scoutingFind,
            ...newFind,
          },
        },
      })
    },
    deleteScoutingFind: (findId: string) => {
      deleteScoutingFindMutation[0]({
        variables: {
          scoutingFindId: findId,
          sessionId,
        },
      })
    },
    joinScoutingFind: (findId: string, enRoute: boolean) => {
      joinScoutingFindMutation[0]({
        variables: {
          scoutingFindId: findId,
          sessionId,
          enRoute,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          joinScoutingFind: {
            ...(scoutingFindQry.data?.scoutingFind as ScoutingFind),
            attendanceIds: [
              ...(scoutingFindQry.data?.scoutingFind?.attendanceIds || []),
              sessionUser?.owner?.userId as string,
            ],
            attendance: [...(scoutingFindQry.data?.scoutingFind?.attendance || []), sessionUser as SessionUser],
          },
        },
      })
    },
    leaveScoutingFind: (findId: string) => {
      leaveScoutingFindMutation[0]({
        variables: {
          scoutingFindId: findId,
          sessionId,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          leaveScoutingFind: {
            ...(scoutingFindQry.data?.scoutingFind as ScoutingFind),
            attendanceIds: (scoutingFindQry.data?.scoutingFind?.attendanceIds || []).filter(
              (userId) => userId !== sessionUser?.owner?.userId
            ),
            attendance: (scoutingFindQry.data?.scoutingFind?.attendance || []).filter(
              (user) => user.owner?.userId !== sessionUser?.owner?.userId
            ),
          },
        },
      })
    },
  }
}
