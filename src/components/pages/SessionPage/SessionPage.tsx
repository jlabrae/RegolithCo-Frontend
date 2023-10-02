import * as React from 'react'

import { SessionStateEnum } from '@regolithco/common'
import { Box, Button, Drawer, Stack, Tab, Tabs, Theme, Tooltip, useMediaQuery, useTheme } from '@mui/material'
import { SxProps } from '@mui/system'
import { ArrowBack, Dashboard, Group, Logout, Settings, Summarize, TableView, TravelExplore } from '@mui/icons-material'
import { SessionHeader } from './SessionHeader'
import { fontFamilies } from '../../../theme'
import { TabDashboard } from './TabDashboard'
// import { TabWorkOrders } from './TabWorkOrders'
// import { TabScouting } from './TabScouting'
import { SessionSettingsTab } from './TabSettings'
import { TabUsers } from './TabUsers'
import { TabSummary } from './TabSummary'
import { DialogEnum, SessionContext, SessionTabs } from '../../../context/session.context'
import { grey } from '@mui/material/colors'

export interface SessionPageProps {
  noProps?: string
}

const stylesThunk = (theme: Theme, isActive: boolean): Record<string, SxProps<Theme>> => ({
  container: {
    [theme.breakpoints.up('md')]: {
      height: '100%',
      overflow: 'hidden',
      p: 2,
    },
  },
  sessionTabs: {
    background: '#121115aa',
  },
  drawerAccordionSummary: {
    // borderBottom: '1px solid',
    fontFamily: fontFamilies.robotoMono,
    fontWeight: 'bold',
  },
})

const DRAWER_WIDTH = 300

export const SessionPage: React.FC<SessionPageProps> = () => {
  const {
    navigate,
    activeTab,
    setActiveTab,
    setActiveModal,
    onUpdateSession,
    session,
    myUserProfile,
    resetDefaultSystemSettings,
    resetDefaultUserSettings,
    userSuggest,
  } = React.useContext(SessionContext)
  const theme = useTheme()
  const mediumUp = useMediaQuery(theme.breakpoints.up('md'))
  const isActive = session?.state === SessionStateEnum.Active
  const styles = stylesThunk(theme, isActive)

  const isSessionOwner = session?.ownerId === myUserProfile.userId

  // USER Tab is not allowed on desktop
  React.useEffect(() => {
    if (mediumUp && activeTab === SessionTabs.USERS) {
      setActiveTab(SessionTabs.DASHBOARD)
    }
  }, [mediumUp, activeTab, setActiveTab])

  return (
    <Box sx={{ display: 'flex', height: '100%', backdropFilter: 'blur(7px)', backgroundColor: '#0e0c1b77' }}>
      {/* NAV Drawer   */}
      {mediumUp && (
        <Drawer
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              background: '#12121255',
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          {/* <Toolbar /> */}
          <TabUsers />
          <Stack direction="row" spacing={2} sx={{ p: 2 }}>
            <Tooltip title="Back to sessions">
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/session')}
                color={'secondary'}
                variant="text"
                fullWidth
              >
                Back to sessions
              </Button>
            </Tooltip>
            {!isSessionOwner && (
              <Tooltip title="Leave Session">
                <Button
                  startIcon={<Logout />}
                  onClick={() => setActiveModal(DialogEnum.LEAVE_SESSION)}
                  color="error"
                  variant="outlined"
                  fullWidth
                >
                  Leave Session
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Drawer>
      )}
      {/* This is the main content */}
      <Box
        sx={{
          overflow: 'hidden',
          mx: mediumUp ? 3 : 0,
          display: 'flex',
          flex: '1 1',
          maxWidth: 1100,
          flexDirection: 'column',
          height: '100%',
          // border: '1px solid yellow',
        }}
      >
        <SessionHeader />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {mediumUp && (
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => {
                setActiveTab(newValue)
              }}
              sx={styles.sessionTabs}
              aria-label="basic tabs example"
            >
              <Tab label="Dashboard" icon={<Dashboard />} value={SessionTabs.DASHBOARD} />
              {/* <Tab label="Work Orders" value={SessionTabs.WORK_ORDERS} /> */}
              {/* <Tab label="Scouting" value={SessionTabs.SCOUTING} /> */}
              <Tab label="Summary" icon={<Summarize />} value={SessionTabs.SUMMARY} />
              {isSessionOwner && <Tab icon={<Settings />} label="Settings" value={SessionTabs.SETTINGS} />}
            </Tabs>
          )}
        </Box>
        <Box
          sx={{
            flex: '1 1',
            overflow: 'auto',
          }}
        >
          {activeTab === SessionTabs.USERS && <TabUsers />}
          {activeTab === SessionTabs.DASHBOARD && <TabDashboard />}
          {/* {activeTab === SessionTabs.WORK_ORDERS && <TabWorkOrders />} */}
          {/* {activeTab === SessionTabs.SCOUTING && <TabScouting />} */}
          {activeTab === SessionTabs.SUMMARY && <TabSummary />}
          {activeTab === SessionTabs.SETTINGS && (
            <SessionSettingsTab
              session={session}
              userSuggest={userSuggest}
              scroll
              resetDefaultSystemSettings={resetDefaultSystemSettings}
              resetDefaultUserSettings={resetDefaultUserSettings}
              endSession={() => setActiveModal(DialogEnum.CLOSE_SESSION)}
              deleteSession={() => setActiveModal(DialogEnum.DELETE_SESSION)}
              setActiveModal={setActiveModal}
              onChangeSession={(newSession, newSettings) => {
                onUpdateSession(newSession, newSettings)
                setActiveModal(null)
              }}
            />
          )}
        </Box>
        {/* Mobile-only menu */}
        {!mediumUp && (
          <Tabs
            variant="scrollable"
            sx={{
              borderTop: '2px solid',
              backgroundColor: isActive ? theme.palette.primary.main : grey[500],
              color: theme.palette.primary.contrastText,
              '& .MuiTab-root': {
                color: theme.palette.primary.contrastText,
              },
              '& .Mui-selected': {
                backgroundColor: isActive ? theme.palette.secondary.main : grey[200],
                // color: theme.palette.primary.light,
                // textShadow: '0 0 2px #FFF',
              },
            }}
            allowScrollButtonsMobile
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue)
            }}
            aria-label="basic tabs example"
          >
            <Tab label="Users" value={SessionTabs.USERS} icon={<Group />} />
            <Tab label="Dash" value={SessionTabs.DASHBOARD} icon={<Dashboard />} />
            {/* <Tab label="Orders" value={SessionTabs.WORK_ORDERS} icon={<TableView />} />
            <Tab label="Scout" value={SessionTabs.SCOUTING} icon={<TravelExplore />} /> */}
            <Tab label="Summary" value={SessionTabs.SUMMARY} icon={<Summarize />} />
            {isSessionOwner && <Tab label="Settings" value={SessionTabs.SETTINGS} icon={<Settings />} />}
          </Tabs>
        )}
      </Box>
    </Box>
  )
}
