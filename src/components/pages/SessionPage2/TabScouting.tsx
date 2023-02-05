import * as React from 'react'

import { ScoutingFindStateEnum, Session, SessionStateEnum, SessionUser, ScoutingFind } from '@regolithco/common'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import { Box, FormControlLabel, FormGroup, Stack, Switch, Typography, Zoom } from '@mui/material'
import { ScoutingAddFAB } from '../../fields/ScoutingAddFAB'
import { ClusterCard } from '../../cards/ClusterCard'
import { newEmptyScoutingFind } from '../../../lib/newObjectFactories'
import { DialogEnum } from './SessionPage.container'

export interface TabScoutingProps {
  session: Session
  sessionUser: SessionUser
  // For the two modals that take us deeper
  openScoutingModal: (scoutinfFindId?: string) => void
  //
  setNewScoutingFind: (scoutingFind: ScoutingFind) => void
  setActiveModal: (modal: DialogEnum) => void
}

export const TabScouting: React.FC<TabScoutingProps> = ({
  session,
  sessionUser,
  openScoutingModal,
  setNewScoutingFind,
  setActiveModal,
}) => {
  const isActive = session.state === SessionStateEnum.Active
  // Filtering for the accordions
  const [filterClosedScout, setFilterClosedScout] = React.useState(true)
  const badStates: ScoutingFindStateEnum[] = [ScoutingFindStateEnum.Abandonned, ScoutingFindStateEnum.Depleted]
  const allScouts = session.scouting?.items || []
  const filteredScouts = allScouts.filter(({ state }) => !filterClosedScout || badStates.indexOf(state) < 0)
  filteredScouts.sort((a, b) => b.createdAt - a.createdAt)
  const scountingCounts = [filteredScouts.length, allScouts.length]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid green', maxWidth: 1000 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography>
          Scouting ({scountingCounts[0]}/{scountingCounts[1]})
        </Typography>
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
                checked={filterClosedScout}
                onChange={(e) => setFilterClosedScout(e.target.checked)}
              />
            }
            label="Hide Depleted/Abandoned"
          />
        </FormGroup>
      </Stack>

      <Grid container spacing={3} margin={0}>
        {filteredScouts.map((scouting, idx) => {
          return (
            <Grid
              key={`scoutingfind-${idx}`}
              sx={{
                '& *': {
                  cursor: 'pointer',
                },
              }}
              onClick={() => {
                openScoutingModal(scouting.scoutingFindId)
              }}
            >
              <Zoom in style={{ transitionDelay: `${200 * idx}ms` }}>
                <Box>
                  <ClusterCard key={idx} scoutingFind={scouting} />
                </Box>
              </Zoom>
            </Grid>
          )
        })}
      </Grid>
      <ScoutingAddFAB
        onClick={(scoutingType) => {
          setNewScoutingFind(newEmptyScoutingFind(session, sessionUser, scoutingType))
          setActiveModal(DialogEnum.ADD_SCOUTING)
        }}
        sessionSettings={session.sessionSettings}
        fabProps={{
          disabled: !isActive,
        }}
      />
    </Box>
  )
}
