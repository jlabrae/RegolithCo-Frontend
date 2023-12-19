import * as React from 'react'

import {
  Session,
  SessionSettings,
  getLocationName,
  getPlanetName,
  defaultSessionName,
  getActivityName,
  smartDate,
  SessionStateEnum,
} from '@regolithco/common'
import { Box, Button, IconButton, Theme, Tooltip, Typography, useTheme } from '@mui/material'
import { SxProps } from '@mui/system'
import { fontFamilies } from '../../../theme'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import { SessionState } from '../../SessionState'
import { DialogEnum, SessionContext } from '../../../context/session.context'
import { AppContext } from '../../../context/app.context'
import { CollaborateLinkIcon, DownloadJSONIcon, ExportImageIcon } from '../../../icons/badges'
import { ExpandMore } from '@mui/icons-material'

export interface SesionHeaderProps {
  propA?: string
}

const TwelveHoursMs = 12 * 60 * 60 * 1000

export const sessionSubtitleArr = (session: Session, protect: boolean): string[] => {
  const subtitleArr = []
  const sessionSettings: Partial<SessionSettings> = session.sessionSettings || {}
  // Some contextual subtitle stuff
  if (sessionSettings.activity) subtitleArr.push(getActivityName(sessionSettings.activity))
  if (sessionSettings.gravityWell)
    subtitleArr.push(protect ? 'UNDISCLOSED' : getPlanetName(sessionSettings.gravityWell))
  if (sessionSettings.location) subtitleArr.push(protect ? 'UNDISCLOSED' : getLocationName(sessionSettings.location))
  return subtitleArr
}

const stylesThunk = (theme: Theme): Record<string, SxProps<Theme>> => ({
  container: {
    background: '#121115aa',
    display: 'flex',
    flexDirection: 'row',
    // Now align items at the top verticall
    alignItems: 'flex-start',
    p: 1,
    '*': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    // Animate height
    transition: 'height 0.5s ease-in-out',
  },
  gridContainer: {
    [theme.breakpoints.up('md')]: {},
    // border: '1px solid red',
  },
  gridInside: {
    [theme.breakpoints.up('md')]: {},
    // border: '1px solid blue',
  },
  gridInsideTitle: {
    [theme.breakpoints.up('md')]: {},
    // border: '1px solid green',
  },
  gridInsideDates: {
    textAlign: 'right',
    [theme.breakpoints.up('md')]: {},
    // border: '1px solid green',
    '& *': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
    '& strong': {
      color: 'white',
    },
  },
  sessionContext: {
    '& *': {
      fontFamily: fontFamilies.robotoMono,
      fontWeight: 'bold',
    },
  },
})

export const SessionHeader: React.FC<SesionHeaderProps> = () => {
  const theme = useTheme()
  const styles = stylesThunk(theme)
  const { hideNames } = React.useContext(AppContext)
  const { session, setActiveModal } = React.useContext(SessionContext)
  const [collapsed, setCollapsed] = React.useState(false)

  // If there isn't a session don't even try to render anything
  if (!session) return null
  const subtitleArr = sessionSubtitleArr(session, hideNames)

  return (
    <Box sx={{ cursor: 'pointer', ...styles.container }} onClick={() => setCollapsed(!collapsed)}>
      <IconButton color="inherit">
        <ExpandMore
          sx={{
            // Animat this so it's upside down when expanded
            transform: !collapsed ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.3s ease-in-out',
          }}
        />
      </IconButton>
      <Grid xs={12} container sx={styles.gridInside}>
        <Grid xs={12} sm={12} md={8}>
          {/* Title and button */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              flex: '1 1',
              mt: { xs: 0, md: 1 },
              mb: { xs: 0, md: 2 },
              textShadow: '1px 1px 4px #000',
              fontSize: {
                xs: '1rem',
                md: session.name && session.name.length > 100 ? '1rem' : '1.4rem',
              },
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {session.name && session.name.trim().length ? session.name : defaultSessionName()}
          </Typography>
          {/* Context, note and ores header box */}
          <Box>
            {subtitleArr.length > 0 && (
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: theme.palette.grey[500],
                  fontFamily: fontFamilies.robotoMono,
                  fontWeight: 'bold',
                  fontSize: {
                    xs: '0.65rem',
                    md: '0.8rem',
                  },
                }}
              >
                {subtitleArr.join(' // ')}
              </Typography>
            )}
            {!collapsed && session.note && session.note.trim().length && (
              <Typography
                component="div"
                sx={{
                  fontSize: {
                    xs: '0.6rem',
                    md: '0.8rem',
                  },
                }}
                gutterBottom
              >
                {session.note}
              </Typography>
            )}
          </Box>
        </Grid>
        {/* Start and end date box */}
        <Grid xs={12} sm={12} md={4} sx={styles.gridInsideDates}>
          <Box sx={{ display: 'flex' }}>
            {/* SHARE BUTTON */}
            <div style={{ flex: '1 1' }} />
            <SessionState sessionState={session.state} size="large" />
            <Tooltip title="Download Session" placement="top">
              <IconButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveModal(DialogEnum.DOWNLOAD_SESSION)
                }}
                color="secondary"
              >
                <DownloadJSONIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export an image for social media or discord." placement="top">
              <IconButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveModal(DialogEnum.SHARE_SESSION)
                }}
                color="secondary"
              >
                <ExportImageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Invite others to join." placement="top">
              <IconButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveModal(DialogEnum.COLLABORATE)
                }}
                color="secondary"
              >
                <CollaborateLinkIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {!collapsed ? (
            <>
              <Typography
                sx={{ fontFamily: 'inherit', m: 0, p: 0, lineHeight: 1.4, fontSize: '0.6rem' }}
                component="div"
                gutterBottom
                variant="overline"
              >
                Started: <strong>{smartDate(session.createdAt)}</strong>
              </Typography>

              {session.state === SessionStateEnum.Active && (
                <Typography
                  sx={{ fontFamily: 'inherit', m: 0, p: 0, lineHeight: 1.4, fontSize: '0.6rem' }}
                  component="div"
                  gutterBottom
                  variant="overline"
                >
                  EXPIRES: <strong>{smartDate(session.updatedAt + TwelveHoursMs)}</strong>
                </Typography>
              )}
              {session.state === SessionStateEnum.Closed && session.finishedAt && (
                <Typography
                  sx={{ fontFamily: 'inherit', m: 0, p: 0, lineHeight: 1.4, fontSize: '0.6rem' }}
                  component="div"
                  gutterBottom
                  variant="overline"
                >
                  Ended: <strong>{smartDate(session.finishedAt)}</strong>
                </Typography>
              )}

              <Typography
                sx={{ fontFamily: 'inherit', m: 0, p: 0, lineHeight: 1.4, fontSize: '0.6rem' }}
                component="div"
                gutterBottom
                color="text.secondary"
                variant="overline"
              >
                Require Verification: <strong>{!session.sessionSettings.allowUnverifiedUsers ? 'Yes' : 'No'}</strong>
              </Typography>

              <Typography
                sx={{ fontFamily: 'inherit', m: 0, p: 0, lineHeight: 1.4, fontSize: '0.6rem' }}
                component="div"
                gutterBottom
                color="text.secondary"
                variant="overline"
              >
                Require Mention: <strong>{session.sessionSettings.specifyUsers ? 'Yes' : 'No'}</strong>
              </Typography>
            </>
          ) : (
            <>
              <Box flexGrow={1} />
              <Button color="inherit">(Expand...)</Button>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
