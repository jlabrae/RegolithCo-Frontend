import * as React from 'react'
import { useSnackbar } from 'notistack'
import { MutationTuple, QueryResult } from '@apollo/client'
import log from 'loglevel'
import { ErrorCode } from '@regolithco/common'
/**
 * Just a handy hook to handle errors from queries and mutations
 *
 * By default it throws errors into the snackbar but we may have to suppress those if it gets too noisy
 * @param queries
 * @param mutations
 * @returns
 */
// Some errors we handle in other ways
const ExceptList: ErrorCode[] = [ErrorCode.SESSION_NOT_FOUND]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGQLErrors = (queries: QueryResult<any, any>[], mutations: MutationTuple<any, any>[]) => {
  const { enqueueSnackbar } = useSnackbar()
  React.useEffect(() => {
    queries.forEach(({ error }) => {
      if (error) {
        if (error.graphQLErrors) {
          error.graphQLErrors.forEach((gqlErr) => {
            if (ExceptList.includes(gqlErr.extensions.code as ErrorCode)) return
            console.error(`❌ [GraphQL error]: ${JSON.stringify(error, null, 2)}`)
            enqueueSnackbar('Query Error:' + error.name, { variant: 'error' })
          })
        }
        // if (error) console.error('upsert', error.graphQLErrors)
        log.debug(error)
      }
    })
    mutations.forEach(([_, { error }]) => {
      if (error) {
        enqueueSnackbar('Mutation Error:' + error.name, { variant: 'error' })
        // if (error) console.error('upsert', error.graphQLErrors)
      }
    })
  }, [...queries.map((q) => q.error), ...mutations.map((op) => op[1].error)])

  return
}
