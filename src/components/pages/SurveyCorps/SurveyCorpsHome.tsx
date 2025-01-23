import * as React from 'react'

import { Box, Container, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { ShipOreDistribution } from './ShipOreDistribution'
import { GemIcon, RockIcon, SurveyCorpsIcon } from '../../../icons'
import { getEpochFromVersion, ObjectValues, scVersion, ScVersionEpochEnum, SurveyData } from '@regolithco/common'
import { useNavigate, useParams } from 'react-router-dom'
import { SurveyCorpsAbout } from './SurveyCorpsAbout'
import { useGetPublicSurveyDataLazyQuery } from '../../../schema'
import { EmojiEvents } from '@mui/icons-material'
import { SurveyCorpsLeaderBoard } from './SurveyCorpsLeaderBoard'
import { ShipOreLocationStats } from './ShipOreLocationStats'
import { VehicleOreDistribution } from './VehicleOreDistribution'
import { TablePageWrapper } from '../../TablePageWrapper'
import { ShipOreClassDistribution } from './ShipOreClassDistribution'

export const SurveyTabsEnum = {
  SHIP_ORE: 'rocks',
  SHIP_ORE_CLASS: 'rock_class',
  SHIP_ORE_STATS: 'rock_stats',
  VEHICLE_ORE: 'gems',
  ABOUT_SURVEY_CORPS: 'about',
  LEADERBOARD: 'leaderboard',
} as const
export type SurveyTabsEnum = ObjectValues<typeof SurveyTabsEnum>

export type SurveyDataTables = {
  vehicleProbs: SurveyData | null
  shipOreByGravProb: SurveyData | null
  shipOreByRockClassProb: SurveyData | null
  bonusMap: SurveyData | null
  leaderBoard: SurveyData | null
}

export const SurveyCorpsHomeContainer: React.FC = () => {
  const navigate = useNavigate()
  const { tab } = useParams()
  const [epoch, setEpoch] = React.useState(getEpochFromVersion(scVersion))
  const epochRef = React.useRef<ScVersionEpochEnum>()
  const [surveyData, setSurveyData] = React.useState<SurveyDataTables>({
    vehicleProbs: null,
    shipOreByGravProb: null,
    shipOreByRockClassProb: null,
    bonusMap: null,
    leaderBoard: null,
  })

  const [fetchSurveyData, { data, loading, error }] = useGetPublicSurveyDataLazyQuery()

  const fetchData = (dataName: string) => {
    fetchSurveyData({
      variables: {
        dataName,
        epoch,
      },
      fetchPolicy: 'cache-first',
      // Refetch every hour
      pollInterval: 3600 * 1000,
    }).then((result) => {
      if (result.data) {
        setSurveyData((prevData) => ({
          ...prevData,
          [dataName]: result.data?.surveyData,
        }))
      }
    })
  }

  React.useEffect(() => {
    // If the epoch has changed then we need to refetch all the data
    if (epoch !== epochRef.current) {
      Object.keys(surveyData).forEach((key) => {
        fetchData(key)
      })
    }
    epochRef.current = epoch
  }, [epoch])

  return <SurveyCorpsHome navigate={navigate} tab={tab as SurveyTabsEnum} surveyData={surveyData} />
}

export interface SurveyCorpsHomeProps {
  loading?: boolean
  tab?: SurveyTabsEnum
  navigate?: (path: string) => void
  surveyData?: SurveyDataTables
}

export const SurveyCorpsHome: React.FC<SurveyCorpsHomeProps> = ({ loading, tab, navigate, surveyData }) => {
  const theme = useTheme()

  return (
    <TablePageWrapper
      title={
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent={'center'}
          sx={{
            width: '100%',
          }}
        >
          <SurveyCorpsIcon
            sx={{
              width: 48,
              height: 48,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            Regolith Survey Corps
          </Typography>
        </Stack>
      }
      loading={loading}
      sx={
        {
          //
        }
      }
    >
      <Container maxWidth={'lg'} sx={{ borderBottom: 1, borderColor: 'divider', flex: '0 0' }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => {
            navigate && navigate(`/survey/${newValue}`)
            // setActiveTab(newValue)
          }}
        >
          <Tab label="Rock Location" value={SurveyTabsEnum.SHIP_ORE} icon={<RockIcon />} />
          <Tab label="Rock Type" value={SurveyTabsEnum.SHIP_ORE_CLASS} icon={<RockIcon />} />
          <Tab label="Rock Stats" value={SurveyTabsEnum.SHIP_ORE_STATS} icon={<RockIcon />} />
          <Tab label="ROC / Hand" value={SurveyTabsEnum.VEHICLE_ORE} icon={<GemIcon />} />
          <Tab label="Leaderboard" value={SurveyTabsEnum.LEADERBOARD} icon={<EmojiEvents />} />
          <Tab label="About Survey Corps" value={SurveyTabsEnum.ABOUT_SURVEY_CORPS} icon={<SurveyCorpsIcon />} />
        </Tabs>
      </Container>
      <Box
        sx={
          {
            //
          }
        }
      >
        {/* Fitler box */}
        {tab === SurveyTabsEnum.SHIP_ORE && <ShipOreDistribution data={surveyData?.shipOreByGravProb} />}
        {tab === SurveyTabsEnum.SHIP_ORE_CLASS && (
          <ShipOreClassDistribution data={surveyData?.shipOreByRockClassProb} />
        )}
        {tab === SurveyTabsEnum.SHIP_ORE_STATS && (
          <ShipOreLocationStats data={surveyData?.shipOreByGravProb} bonuses={surveyData?.bonusMap} />
        )}
        {tab === SurveyTabsEnum.VEHICLE_ORE && <VehicleOreDistribution data={surveyData?.vehicleProbs} />}
        {tab === SurveyTabsEnum.ABOUT_SURVEY_CORPS && <SurveyCorpsAbout />}
        {tab === SurveyTabsEnum.LEADERBOARD && <SurveyCorpsLeaderBoard data={surveyData?.leaderBoard} />}
      </Box>
    </TablePageWrapper>
  )
}
