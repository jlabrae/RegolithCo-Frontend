import * as React from 'react'
import { SessionStateEnum } from '@regolithco/common'
import { Box, Stack, SxProps, Theme, Toolbar, Tooltip, Typography, useTheme } from '@mui/material'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { ExpandMore, HelpOutline } from '@mui/icons-material'
import { fontFamilies } from '../../../theme'
import { CrewUserList } from '../../SessionUserList/CrewUserList'
import { SessionUserList } from '../../SessionUserList/SessionUserList'
import { SessionContext } from '../../../context/session.context'

export interface TabUsersProps {
  propa?: string
}

const stylesThunk = (theme: Theme, isActive: boolean): Record<string, SxProps<Theme>> => ({
  container: {
    [theme.breakpoints.up('md')]: {
      height: '100%',
      overflow: 'hidden',
      p: 2,
    },
  },
  gridContainer: {},
  gridColumn: {},
  drawerAccordionSummaryCrews: {
    '& .MuiTypography-root': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.dark,
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: theme.palette.secondary.contrastText,
    },
  },
  drawerAccordionSummaryActive: {
    '& .MuiTypography-root': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.main,
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: theme.palette.secondary.contrastText,
    },
  },
  drawerAccordionSummarySecondary: {
    '& .MuiTypography-root': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.light,
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: theme.palette.secondary.contrastText,
    },
  },
  drawerAccordionDetails: {
    p: 0,
    pb: 2,
  },
  paper: {},
})

export const TabUsers: React.FC<TabUsersProps> = () => {
  const theme = useTheme()
  const { navigate, session, captains, singleActives, myUserProfile } = React.useContext(SessionContext)
  const isActive = session.state === SessionStateEnum.Active
  const styles = stylesThunk(theme, isActive)

  return (
    <>
      <Box sx={{ flex: '1 1', overflowX: 'hidden', overflowY: 'auto' }}>
        <Toolbar
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.secondary.contrastText,
            '&.MuiToolbar-root': {
              px: 2,
              fontSize: `1.2rem`,
              minHeight: 50,
              textTransform: 'uppercase',
              fontFamily: fontFamilies.robotoMono,
              fontWeight: 'bold',
            },
          }}
        >
          Session Members ({(session.activeMembers?.items?.length || 0) + session.mentionedUsers.length})
        </Toolbar>
        {captains.length > 0 && (
          <Accordion defaultExpanded={true} disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />} sx={styles.drawerAccordionSummaryCrews}>
              <Typography>Crews ({captains.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={styles.drawerAccordionDetails}>
              <CrewUserList listUsers={captains} />
            </AccordionDetails>
          </Accordion>
        )}
        <Accordion defaultExpanded={true} disableGutters>
          <AccordionSummary expandIcon={<ExpandMore />} sx={styles.drawerAccordionSummaryActive}>
            <Typography>
              {captains.length === 0 ? 'Active Users' : 'Solo Active'} ({singleActives.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={styles.drawerAccordionDetails}>
            <SessionUserList
              friends={myUserProfile.friends}
              sessionOwnerId={session.ownerId}
              navigate={navigate}
              meId={myUserProfile.userId}
              listUsers={singleActives}
            />
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded={true} disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            sx={styles.drawerAccordionSummarySecondary}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <Typography sx={{ flexGrow: 1 }}>
                {captains.length === 0 ? 'Innactive Users' : 'Solo Innactive'} ({session.mentionedUsers.length})
              </Typography>
              <Tooltip
                title={
                  <>
                    <Typography paragraph variant="caption">
                      "Mentioned" users haven't joined the session yet (Or they don't want to). But mentioning them
                      means you can still track what you owe them.
                    </Typography>
                    <Typography paragraph variant="caption">
                      When users with the same name log in they become "Session Members".
                    </Typography>
                    <Typography paragraph variant="caption">
                      If you have enabled the session setting <strong>"Require joining users to be "Mentioned"</strong>{' '}
                      then only users that are mentioned can join this session, even if they have the share link.
                    </Typography>
                  </>
                }
              >
                <HelpOutline />
              </Tooltip>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={styles.drawerAccordionDetails}>
            {/* <MentionedUserList
              mentionedUsers={singleInnactives}
              verifiedUsers={verifiedMentionedUsers}
              useAutocomplete
              addToList={isActive ? (scName: string) => addSessionMentions([scName]) : undefined}
              removeFromList={isActive ? (scName: string) => removeSessionMentions([scName]) : undefined}
            /> */}
          </AccordionDetails>
        </Accordion>
      </Box>
    </>
  )
}
