import React, { useEffect, useMemo, useState } from 'react'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  from,
  NormalizedCacheObject,
  split,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import config from '../config'
import { makeVar } from '@apollo/client'
import log from 'loglevel'
import {
  CrewShare,
  PendingUser,
  mergeSessionSettingsInplace,
  SessionSettings,
  SessionUser,
  UserProfile,
  UserStateEnum,
} from '@regolithco/common'
import { useGetUserProfileQuery } from '../schema'
import { errorLinkThunk, makeLogLink, retryLink } from '../lib/apolloLinks'
import { LoginContext, useOAuth2 } from './useOAuth2'
import { LoginChoice } from '../components/modals/LoginChoice'
import useLocalStorage from './useLocalStorage'
import { LoginRefresh } from '../components/modals/LoginRefresh'
import { devQueries, DEV_HEADERS } from '../lib/devFunctions'
import { usePageVisibility } from './usePageVisibility'
import { getMainDefinition } from '@apollo/client/utilities'
import { AppVersion } from '../components/fields/AppVersion'

// Create HttpLinks for each endpoint
const privateLink = new HttpLink({
  uri: config.apiUrl, // change this to your private API url
})

const publicLink = new HttpLink({
  uri: config.apiUrlPub, // change this to your public API url
})

const getVersion = (): string => {
  let version = 'UNKNOWN'
  try {
    version = document.querySelector<HTMLMetaElement>('meta[name=version]')?.content || 'UNKNOWN'
  } catch (err) {
    log.error('Failed to get version from meta tag', err)
  }
  return version
}

// Use the split function to direct requests to different endpoints
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return Boolean(
      definition.kind === 'OperationDefinition' &&
        definition.operation === 'query' &&
        definition.name?.value.startsWith('getPublic') // change this condition based on your needs
    )
  },
  publicLink,
  privateLink
)

/**
 * The second component in the stack is the APIProvider. It sets up the Apollo client and passes it down to the next component
 * @param param0
 * @returns
 */
export const APIProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token, loginInProgress, authType } = useOAuth2()
  // const [_googleToken, _setGoogleToken] = useLocalStorage<string>('ROCP_GooToken', '')
  const [APIWorking, setAPIWorking] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState<string>()

  const client = useMemo(() => {
    const authLink = setContext(async (_, { headers }) => {
      const finalHeaders: Record<string, string> = {
        ...headers,
        authType: authType,
        authorization: token ? `Bearer ${token}` : '',
        ...DEV_HEADERS,
      }
      devQueries(finalHeaders)
      return { headers: finalHeaders }
    })

    return new ApolloClient({
      link: from([
        errorLinkThunk({ setAPIWorking, setMaintenanceMode }),
        retryLink,
        makeLogLink(log.debug),
        authLink,
        splitLink,
      ]),
      connectToDevTools: process.env.NODE_ENV === 'development',
      cache: new InMemoryCache({
        possibleTypes: {
          WorkOrderInterface: ['VehicleMiningOrder', 'OtherOrder', 'SalvageOrder', 'ShipMiningOrder'],
          ScoutingFindInterface: ['ShipClusterFind', 'VehicleClusterFind', 'SalvageFind'],
          UserInterface: ['User', 'UserProfile'],
        },
        typePolicies: {
          Query: {
            fields: {
              lookups: {
                read(existingData) {
                  // log.debug('Reading LookupData from cache')
                  const storedData = localStorage.getItem('LookupData:Data')
                  const storedTimestamp = localStorage.getItem('LookupData:lastUpdate')
                  const storedVersion = localStorage.getItem('LookupData:version')
                  const version = getVersion()
                  if (
                    storedData &&
                    storedTimestamp &&
                    version === storedVersion &&
                    Date.now() - Number(storedTimestamp) < 60 * 60 * 1000
                  ) {
                    // log.debug('LookupData is fresh, returning from cache')
                    return JSON.parse(storedData)
                  }
                  // log.debug('LookupData is stale, returning from server')
                  return existingData
                },
                merge(existingData, incomingData) {
                  // log.debug('Merging LookupData from cache')
                  localStorage.setItem('LookupData:Data', JSON.stringify(incomingData))
                  localStorage.setItem('LookupData:lastUpdate', String(Date.now()))
                  localStorage.setItem('LookupData:version', getVersion())
                  return incomingData
                },
              },
            },
          },
          UserInterface: {
            keyFields: ['userId'],
          },
          UserProfile: {
            fields: {
              sessionSettings: {
                merge(existing: Partial<SessionSettings> = {}, incoming: Partial<SessionSettings> = {}) {
                  const merged = mergeSessionSettingsInplace(existing, incoming)
                  return merged
                },
              },
            },
          },
          ShipClusterFind: {
            fields: {
              shipRocks: {
                merge(existing: CrewShare[] = [], incoming: CrewShare[]) {
                  const merged = incoming || existing
                  return merged
                },
              },
            },
          },
          WorkOrderInterface: {
            keyFields: ['orderId'],
            fields: {
              crewShares: {
                merge(existing: CrewShare[] = [], incoming: CrewShare[]) {
                  const merged = incoming || existing
                  return merged
                },
              },
            },
          },
          ScoutingFindInterface: {
            keyFields: ['sessionId', 'scoutingFindId'],
            fields: {
              attendance: {
                merge(existing: CrewShare[] = [], incoming: CrewShare[]) {
                  const merged = incoming || existing
                  return merged
                },
              },
            },
          },
          PaginatedSessionUsers: {
            fields: {
              items: {
                merge(existing: SessionUser[] = [], incoming: SessionUser[]) {
                  const merged = incoming || existing
                  return merged
                },
              },
            },
          },
          MiningLoadout: {
            keyFields: ['loadoutId'],
          },
          CrewShare: {
            keyFields: ['sessionId', 'scName', 'orderId'],
          },
          SessionUser: {
            keyFields: ['sessionId', 'ownerId'],
          },
          Session: {
            keyFields: ['sessionId'],
            fields: {
              mentionedUsers: {
                merge(existing: PendingUser[] = [], incoming: PendingUser[]) {
                  const merged = incoming || existing
                  return merged
                },
              },
              settings: {
                merge(existing: Partial<SessionSettings> = {}, incoming: Partial<SessionSettings> = {}) {
                  const merged = mergeSessionSettingsInplace(existing, incoming)
                  return merged
                },
              },
            },
          },
          // Some fields we don't normalize
          SessionSettings: {
            keyFields: false,
          },
          CrewShareTemplate: {
            keyFields: false,
          },
          WorkOrderDefaults: {
            keyFields: false,
          },
        },
      }),
    })
  }, [token, loginInProgress, authType])

  return (
    <ApolloProvider client={client}>
      <UserProfileProvider apolloClient={client} APIWorking={APIWorking} maintenanceMode={maintenanceMode}>
        {children}
      </UserProfileProvider>
    </ApolloProvider>
  )
}

interface UserProfileProviderProps {
  children: React.ReactNode
  apolloClient: ApolloClient<NormalizedCacheObject>
  APIWorking?: boolean
  maintenanceMode?: string
}
/**
 * Finallly, the third component in the stack goes and gets the user profile (if there is one)
 * @param param0
 * @returns
 */
const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  children,
  apolloClient,
  APIWorking,
  maintenanceMode,
}) => {
  const { logOut, login, token, error, loginInProgress, authType, setAuthType, refreshPopupOpen, setRefreshPopupOpen } =
    useOAuth2()
  const [openPopup, setOpenPopup] = useState(false)
  const isPageVisible = usePageVisibility()

  const [postLoginRedirect, setPostLoginRedirect] = useLocalStorage<string | null>('ROCP_PostLoginRedirect', null)
  const isAuthenticated = Boolean(token && token.length > 0)
  const userProfileQry = useGetUserProfileQuery({
    skip: !isAuthenticated,
  })

  // If the profile fails to fetch then try again in 5 seconds
  React.useEffect(() => {
    if (!isPageVisible || userProfileQry.loading || userProfileQry.data?.profile || !userProfileQry.error) {
      userProfileQry.stopPolling()
    }
    if (!userProfileQry.data?.profile && userProfileQry.error) {
      userProfileQry.startPolling(5000)
    }
    // Also stop polling when this component is unmounted
    return () => {
      userProfileQry.stopPolling()
    }
  }, [userProfileQry.data, userProfileQry.loading, userProfileQry.error])

  useEffect(() => {
    if (postLoginRedirect && isAuthenticated && Boolean(userProfileQry.data?.profile)) {
      const newUrl = new URL(process.env.PUBLIC_URL + postLoginRedirect, window.location.origin)
      setPostLoginRedirect(null)
      window.location.href = newUrl.toString()
    }
  }, [postLoginRedirect, setPostLoginRedirect, userProfileQry])
  useEffect(() => {
    if (!token || (token.length === 0 && apolloClient)) {
      log.debug('User is not authenticated, clearing cache')
      apolloClient.clearStore()
    }
  }, [token, apolloClient])
  return (
    <LoginContext.Provider
      value={{
        isAuthenticated,
        APIWorking,
        error: userProfileQry.error,
        maintenanceMode,
        isInitialized: Boolean(userProfileQry.data?.profile),
        isVerified: Boolean(
          userProfileQry.data?.profile?.userId && userProfileQry.data?.profile?.state === UserStateEnum.Verified
        ),
        userProfile: userProfileQry.data?.profile as UserProfile,
        login,
        refreshPopupOpen,
        logOut: () => {
          logOut()
          log.debug('Signed out')
          apolloClient.resetStore()
        },
        openPopup: (newLoginRedirect?: string) => {
          // Set up a redirect for later look in <TopbarContainer /> for the code that actions this
          // When the user returns
          const baseUrl = process.env.PUBLIC_URL
          // I want the path relative to the base url using window.location.pathname
          const relpath = window.location.pathname.replace(baseUrl, '')
          setPostLoginRedirect(newLoginRedirect || relpath)

          setOpenPopup(true)
        },
        refreshPopup: (
          <LoginRefresh
            open={refreshPopupOpen}
            onClose={() => setRefreshPopupOpen(false)}
            login={login}
            logOut={logOut}
            authType={authType}
          />
        ),
        setRefreshPopupOpen: (isOpen: boolean) => setRefreshPopupOpen(isOpen),
        popup: (
          <LoginChoice
            open={openPopup}
            authType={authType}
            setAuthType={setAuthType}
            login={login}
            onClose={() => setOpenPopup(false)}
          />
        ),
        loading: loginInProgress || userProfileQry.loading,
      }}
    >
      {children}
    </LoginContext.Provider>
  )
}
