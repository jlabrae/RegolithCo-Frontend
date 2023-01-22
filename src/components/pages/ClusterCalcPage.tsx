import * as React from 'react'
import { Alert, Box, Typography } from '@mui/material'
import { PageWrapper } from '../PageWrapper'

import { UserProfile, ScoutingFindTypeEnum, ScoutingFind, SessionUser } from '@regolithco/common'
import { dummySession, dummySessionUser, dummyUserProfile, newEmptyScoutingFind } from '../../lib/newObjectFactories'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'
import { ScoutingFindCalc } from '../calculators/ScoutingFindCalc'

export interface ClusterCalcPageProps {
  userProfile?: UserProfile
}

export const ClusterCalcPage: React.FC<ClusterCalcPageProps> = ({ userProfile }) => {
  // eslint-disable-next-line no-unused-vars
  const [cluster, setCluster] = React.useState<ScoutingFind>()
  const owner = userProfile || dummyUserProfile()
  const session = dummySession(owner)
  const sessionUser: SessionUser = dummySessionUser(owner)
  // const [activeActivity, setActiveActivity] = React.useState<ActivityEnum>(ActivityEnum.ShipMining)

  React.useEffect(() => {
    const newCluster = newEmptyScoutingFind(session, sessionUser, ScoutingFindTypeEnum.Ship)
    setCluster(newCluster)
  }, [userProfile])

  return (
    <PageWrapper title="Cluster Calculator" maxWidth="sm" sx={{}}>
      <Typography variant="h4" component="h1" gutterBottom></Typography>
      <Typography variant="body1" paragraph>
        This is a standalone calculator for determining the value of a rock cluster.
      </Typography>
      <Alert severity="info" sx={{ m: 2 }}>
        NOTE: This is a standalone calculator. If you want to work on more than one cluster, store consecutive clusters
        or share your clusters with friends then consider logging in and creating/joining a <strong>session</strong>.
      </Alert>
      <Box
        sx={{
          display: 'flex',
          minHeight: 700,
          margin: '0 auto',
          overflowX: 'hidden',
          overflowY: 'scroll',
        }}
      >
        {cluster && (
          <ScoutingFindCalc
            me={sessionUser}
            scoutingFind={cluster}
            allowEdit
            allowWork
            standalone
            onChange={(cluster) => {
              setCluster(cluster)
            }}
          />
        )}
      </Box>
    </PageWrapper>
  )
}

export const ClusterCalcPageContainer: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile } = useLogin()

  return <ClusterCalcPage userProfile={userProfile} />
}
