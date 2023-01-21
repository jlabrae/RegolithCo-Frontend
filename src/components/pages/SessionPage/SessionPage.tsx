import * as React from 'react'

import {
  ActivityEnum,
  ScoutingFindStateEnum,
  Session,
  SessionStateEnum,
  UserProfile,
  WorkOrderDefaults,
  VerifiedUserLookup,
  SessionUser,
  UserSuggest,
  WorkOrder,
  SessionInput,
  DestructuredSettings,
  createUserSuggest,
} from '@regolithco/common'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import { ActiveUserList } from '../../fields/ActiveUserList'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Theme,
  Typography,
  useTheme,
} from '@mui/material'
import { Container, SxProps } from '@mui/system'
import { ScoutingAddFAB } from '../../fields/ScoutingAddFAB'
import { WorkOrderAddFAB } from '../../fields/WorkOrderAddFAB'
import { InnactiveUserList } from '../../fields/MentionedUserList'
import { ExpandMore } from '@mui/icons-material'
import { WorkOrderTable } from './WorkOrderTable'
import { ClusterCard } from '../../cards/ClusterCard'
import { SessionSettingsModal } from './SessionSettingsModal'
import { WorkOrderModal } from '../../modals/WorkOrderModal'
import { newWorkOrderMaker } from '../../../lib/newObjectFactories'
import { ShareModal } from '../../modals/ShareModal'
import { SessionHeader } from './SessionHeader'

export interface SessionPageProps {
  session: Session
  userProfile: UserProfile
  orderId?: string
  scoutingFindId?: string
  verifiedInnactiveUsers: VerifiedUserLookup
  addFriend: (username: string) => void
  navigate: (path: string) => void
  // Session
  onCloseSession: () => void
  addSessionMentions: (scNames: string[]) => void
  removeSessionMentions: (scNames: string[]) => void
  removeSessionCrew: (scName: string) => void
  onUpdateSession: (session: SessionInput, settings: DestructuredSettings) => void
  resetDefaultSystemSettings: () => void
  resetDefaultUserSettings: () => void
  // CrewShares
  onSetCrewSharePaid?: (scName: string, paid: boolean) => void
  // Work orders
  createWorkOrder: (workOrder: WorkOrder) => void
  openWorkOrderModal: (workOrderId?: string) => void
  deleteWorkOrder: (workOrderId: string) => void
  // scouting
  openScoutingModal: (scoutinfFindId?: string) => void
  updateWorkOrder: (newWorkOrder: WorkOrder, setFail?: boolean) => void
  leaveSession: () => void
  deleteSession: () => void
}

/* eslint-disable no-unused-vars */
export enum DialogEnum {
  SHARE_SESSION = 'SHARE_SESSION',
  ADD_WORKORDER = 'ADD_WORKORDER',
  ADD_SCOUTING = 'ADD_SCOUTING',
  SESSION_PREFERENCES = 'SESSION_PREFERENCES',
  ADD_FRIEND = 'ADD_FRIEND',
}
/* eslint-enable no-unused-vars */
const stylesThunk = (theme: Theme, isActive: boolean): Record<string, SxProps<Theme>> => ({
  container: {
    [theme.breakpoints.up('md')]: {
      height: '100%',
      overflow: 'hidden',
      p: 2,
    },
  },
  gridContainer: {
    [theme.breakpoints.up('md')]: {
      flex: '1 1',
      overflow: 'hidden',
      //
    },
    // border: '2px solid yellow',
  },
  gridColumn: {
    [theme.breakpoints.up('md')]: {
      height: '100%',
      overflowX: 'hidden',
      overflowY: 'scroll',
      //
    },
    // border: '2px solid blue',
  },
  accordionSummary: {
    px: 1,
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: theme.palette.primary.contrastText,
    },
    '& .MuiSwitch-root': {
      marginTop: -1,
      marginBottom: -1,
    },
    '& .MuiSwitch-thumb, & .MuiSwitch-track': {
      backgroundColor: '#666666',
      border: `1px solid #444444`,
    },
    '& .Mui-checked .MuiSwitch-thumb, & .Mui-checked+.MuiSwitch-track': {
      backgroundColor: isActive ? theme.palette.secondary.main : '#999999',
      border: `1px solid ${isActive ? theme.palette.secondary.dark : '#3b3b3b'}`,
    },
    backgroundColor: isActive ? theme.palette.secondary.main : '#999999',
    color: theme.palette.primary.contrastText,
    // borderBottom: `1px dashed ${theme.palette.secondary.dark}`,
    textTransform: 'uppercase',
    fontWeight: 500,
    fontSize: '1.1rem',
    [theme.breakpoints.up('md')]: {},
  },
  accordionDetails: {
    borderBottom: '2px solid transparent',
    '&.Mui-expanded': {
      // borderBottom: '2px solid ${}`,
    },
  },
  workOrderAccordionDetails: { p: 0, minHeight: 300 },
  paper: {
    [theme.breakpoints.up('md')]: {
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
    },
    border: '1px solid #222222',
    backgroundColor: '#000000aa',
  },
})

export const SessionPage: React.FC<SessionPageProps> = ({
  session,
  userProfile,
  orderId,
  navigate,
  scoutingFindId,
  leaveSession,
  addFriend,
  updateWorkOrder,
  onUpdateSession,
  onSetCrewSharePaid,
  removeSessionMentions,
  addSessionMentions,
  removeSessionCrew,
  verifiedInnactiveUsers,
  resetDefaultSystemSettings,
  resetDefaultUserSettings,
  createWorkOrder,
  openWorkOrderModal,
  deleteWorkOrder,
  onCloseSession,
  deleteSession,
}) => {
  const theme = useTheme()
  const isActive = session.state === SessionStateEnum.Active
  const styles = stylesThunk(theme, isActive)
  const [activeModal, setActiveModal] = React.useState<DialogEnum | null>(null)
  const [filterInnactiveScout, setFilterInnactiveScout] = React.useState(true)
  const [filterPaidWorkOrders, setFilterPaidWorkOrders] = React.useState(false)
  const [newWorkOrder, setNewWorkOrder] = React.useState<WorkOrder>()

  const isSessionOwner = session.ownerId === userProfile.userId
  const activeWorkOrder =
    session.workOrders?.items?.find(({ orderId: existingOrderId }) => existingOrderId === orderId) || undefined

  // Some contextual subtitle stuff

  const shareUrl = `${window.location.origin}${process.env.PUBLIC_URL}/session/${session.sessionId}`

  const badStates: ScoutingFindStateEnum[] = [ScoutingFindStateEnum.Abandonned, ScoutingFindStateEnum.Depleted]
  const allScouts = session.scouting?.items || []
  const filteredScounts = allScouts.filter(({ state }) => !filterInnactiveScout || badStates.indexOf(state) < 0)
  const allWorkOrders = session.workOrders?.items || []
  const filteredWorkOrders = filterPaidWorkOrders
    ? allWorkOrders.filter(({ crewShares }) => crewShares?.some(({ state }) => !state))
    : [...allWorkOrders]

  const scountingCounts = [filteredScounts.length, allScouts.length]
  const workOrderCounts = [filteredWorkOrders.length, allWorkOrders.length]
  const userSuggest: UserSuggest = React.useMemo(
    () => createUserSuggest(session.activeMembers?.items || [], session.mentionedUsers, userProfile.friends),
    [session, userProfile]
  )

  return (
    <>
      <Container
        maxWidth="xl"
        sx={{
          [theme.breakpoints.up('md')]: {
            height: '100%',
            overflow: 'hidden',
            p: 2,
          },
        }}
      >
        <Paper elevation={4} sx={styles.paper}>
          <SessionHeader
            userProfile={userProfile}
            leaveSession={leaveSession}
            setActiveModal={setActiveModal}
            session={session}
          />

          {/* The main page grid */}
          <Grid container sx={styles.gridContainer} spacing={2}>
            {/* The left grid column with the users */}
            <Grid xs={12} sm={4} md={3} sx={styles.gridColumn}>
              <Accordion defaultExpanded={true} disableGutters>
                <AccordionSummary expandIcon={<ExpandMore color="inherit" />} sx={styles.accordionSummary}>
                  Session Members: ({session.activeMembers?.items?.length})
                </AccordionSummary>
                <AccordionDetails sx={styles.accordionDetails}>
                  <ActiveUserList
                    friends={userProfile.friends}
                    sessionOwnerId={session.ownerId}
                    meId={userProfile.userId}
                    sessionUsers={session.activeMembers?.items as SessionUser[]}
                    addFriend={addFriend}
                  />
                </AccordionDetails>
              </Accordion>
              <Accordion defaultExpanded={false} disableGutters>
                <AccordionSummary
                  expandIcon={<ExpandMore color="inherit" />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                  sx={{ ...styles.accordionSummary, background: '#888888', color: '#000000' }}
                >
                  Mentioned: ({session.mentionedUsers?.length})
                </AccordionSummary>
                <AccordionDetails sx={styles.accordionDetails}>
                  <InnactiveUserList
                    mentionedUsers={session.mentionedUsers}
                    verifiedUsers={verifiedInnactiveUsers}
                    myFriends={userProfile.friends}
                    useAutocomplete
                    addFriend={addFriend}
                    addToList={isActive ? (scName: string) => addSessionMentions([scName]) : undefined}
                    removeFromList={isActive ? (scName: string) => removeSessionMentions([scName]) : undefined}
                  />
                </AccordionDetails>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    m: 3,
                    border: '1px solid',
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  "Mentioned" means this name has been added to a work order or added explicitly to this list by the
                  session owner. They are simply names, not users.
                </Typography>
              </Accordion>
            </Grid>
            <Grid xs={12} sm={8} md={9} sx={styles.gridColumn}>
              <Accordion defaultExpanded={true} disableGutters sx={styles.accordionDetails}>
                <AccordionSummary
                  expandIcon={<ExpandMore color="inherit" />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                  sx={styles.accordionSummary}
                >
                  Work Orders ({workOrderCounts[0]}/{workOrderCounts[1]})
                  <Box sx={{ flexGrow: 1 }} />
                  <FormGroup
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <FormControlLabel
                      sx={{ mr: 3 }}
                      labelPlacement="start"
                      color="secondary"
                      control={
                        <Switch
                          color="secondary"
                          checked={filterPaidWorkOrders}
                          onChange={(e) => setFilterPaidWorkOrders(e.target.checked)}
                        />
                      }
                      label="Hide paid"
                    />
                  </FormGroup>
                </AccordionSummary>
                <AccordionDetails sx={styles.workOrderAccordionDetails}>
                  <WorkOrderTable workOrders={filteredWorkOrders || []} openWorkOrderModal={openWorkOrderModal} />
                  <WorkOrderAddFAB
                    onClick={(activity: ActivityEnum) => {
                      setNewWorkOrder(newWorkOrderMaker(session, userProfile, activity))
                      setActiveModal(DialogEnum.ADD_WORKORDER)
                    }}
                    sessionSettings={session.sessionSettings}
                    fabProps={{
                      disabled: !isActive,
                    }}
                  />
                </AccordionDetails>
              </Accordion>
              <Accordion defaultExpanded={true} disableGutters>
                <AccordionSummary
                  expandIcon={<ExpandMore color="inherit" />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                  sx={styles.accordionSummary}
                >
                  Scouting ({scountingCounts[0]}/{scountingCounts[1]})
                  <Box sx={{ flexGrow: 1 }} />
                  <FormGroup
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <FormControlLabel
                      sx={{ mr: 3 }}
                      labelPlacement="start"
                      control={
                        <Switch
                          color="secondary"
                          checked={filterInnactiveScout}
                          onChange={(e) => setFilterInnactiveScout(e.target.checked)}
                        />
                      }
                      label="Hide Inactive"
                    />
                  </FormGroup>
                </AccordionSummary>
                <AccordionDetails sx={styles.workOrderAccordionDetails}>
                  <Grid container spacing={3} margin={0}>
                    <Typography
                      variant="h6"
                      sx={{ m: 3, fontStyle: 'italic', color: '#88888855', margin: 'auto auto' }}
                      component="div"
                    >
                      Scouting is coming soon!!!
                    </Typography>
                    {filteredScounts.map((scouting, idx) => {
                      return (
                        <Grid key={`scoutingfind-${idx}`}>
                          <ClusterCard key={idx} clusterFind={scouting} />
                        </Grid>
                      )
                    })}
                  </Grid>
                  <ScoutingAddFAB
                    onClick={() => {
                      //
                    }}
                    sessionSettings={session.sessionSettings}
                    fabProps={{
                      // disabled: !isActive,
                      disabled: true,
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <SessionSettingsModal
        session={session}
        open={activeModal === DialogEnum.SESSION_PREFERENCES}
        onModalClose={() => setActiveModal(null)}
        userSuggest={userSuggest}
        resetDefaultSystemSettings={resetDefaultSystemSettings}
        resetDefaultUserSettings={resetDefaultUserSettings}
        onChangeSession={(newSession, newSettings) => {
          setActiveModal(null)
          onUpdateSession(newSession, newSettings)
        }}
        onDeleteSession={() => {
          setActiveModal(null)
          deleteSession()
        }}
        onCloseSession={() => {
          setActiveModal(null)
          onCloseSession()
        }}
      />

      <ShareModal
        open={activeModal === DialogEnum.SHARE_SESSION}
        warn={!session.sessionSettings.specifyUsers}
        url={shareUrl}
        onClose={() => setActiveModal(null)}
      />

      {/* This is the ADD workordermodal */}
      {isActive && newWorkOrder && (
        // NEW WORK ORDER
        <WorkOrderModal
          open={activeModal === DialogEnum.ADD_WORKORDER}
          onClose={() => setActiveModal(null)}
          onUpdate={(newOrder) => {
            setActiveModal(null)
            createWorkOrder(newOrder)
            setNewWorkOrder(undefined)
          }}
          allowEdit={isActive}
          allowPay={true}
          forceTemplate
          userSuggest={userSuggest}
          isNew={true}
          templateJob={session.sessionSettings?.workOrderDefaults as WorkOrderDefaults}
          workOrder={newWorkOrder as WorkOrder}
        />
      )}

      {/* This is the EDIT Workorder modal */}
      {activeWorkOrder && (
        <WorkOrderModal
          onUpdate={(newOrder) => {
            setActiveModal(null)
            updateWorkOrder(newOrder)
          }}
          onSetCrewSharePaid={onSetCrewSharePaid}
          workOrder={activeWorkOrder as WorkOrder}
          templateJob={session.sessionSettings?.workOrderDefaults as WorkOrderDefaults}
          userSuggest={userSuggest}
          allowPay={isSessionOwner || activeWorkOrder.ownerId === userProfile?.userId}
          deleteWorkOrder={() => deleteWorkOrder(activeWorkOrder.orderId)}
          open={Boolean(activeWorkOrder)}
          onClose={() => {
            setActiveModal(null)
            openWorkOrderModal && openWorkOrderModal()
          }}
          allowEdit={isActive && (userProfile?.userId === activeWorkOrder?.ownerId || isSessionOwner)}
        />
      )}
    </>
  )
}
