import { Box, useMediaQuery, useTheme } from '@mui/material'
import { SxProps, Theme } from '@mui/system'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Copyright } from './Copyright'
import { AppVersion } from './fields/AppVersion'
import { SCVersion } from './fields/SCVersion'
// import { Box, SxProps, Theme } from '@mui/material'

type ObjectValues<T> = T[keyof T]
export const BGImagesEnum = {
  DEFAULT: 'bg1.png',
  OPTION1: 'bg2.png',
  OPTION2: 'bg3.png',
  SALVAGE1: 'salvage1.png',
  SALVAGE2: 'salvage2.png',
  ASTEROIDS1: 'asteroids1.png',
  ASTEROIDS2: 'asteroids2.jpg',
  CONCOURSE: 'concourse.jpg',
  CITY1: 'city1.jpg',
  PROFILE: 'profile.jpg',
  REFINERY1: 'refinery1.png',
} as const
export type BGImagesEnum = ObjectValues<typeof BGImagesEnum>

const styles: Record<string, SxProps<Theme>> = {
  container: {
    flex: '1 1',
    margin: 0,
    overflow: 'hidden',
    backgroundImage: {
      md: `url('${process.env.PUBLIC_URL}/images/bg/${BGImagesEnum.OPTION1}')`,
    },
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
  },
  overlay: {
    height: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    // margin: 0,
    // display: 'flex',
    // flexDirection: 'column',
    // backgroundColor: 'rgba(39, 41, 53, 0.4)',
  },
}

export const AppWrapperContainer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation()

  const pathnameRegex = pathname.match(/^(\/[^/]*)/)
  const allMatches = pathnameRegex && pathnameRegex.length > 0 ? pathnameRegex : ['/']

  let bgImage
  switch (allMatches[0]) {
    case '/':
      bgImage = BGImagesEnum.OPTION2
      break
    case '/profile':
      bgImage = BGImagesEnum.PROFILE
      break
    case '/tables':
      bgImage = BGImagesEnum.CITY1
      break
    case '/about':
      bgImage = BGImagesEnum.OPTION1
      break
    case '/workorder':
      bgImage = BGImagesEnum.REFINERY1
      break
    case '/session':
      bgImage = BGImagesEnum.OPTION2
      break
    case '/cluster':
      bgImage = BGImagesEnum.ASTEROIDS2
      break
    default:
      bgImage = BGImagesEnum.DEFAULT
  }

  return <AppWrapper bgImage={bgImage} children={children} />
}

export const AppWrapper = ({
  children,
  bgImage,
}: {
  children: React.ReactNode
  bgImage?: BGImagesEnum
}): JSX.Element => {
  const theme = useTheme()
  const mediumUp = useMediaQuery(theme.breakpoints.up('md'))
  const bgImageFinal = bgImage ? bgImage : BGImagesEnum.DEFAULT
  return (
    <Box
      sx={{
        ...styles.container,
        backgroundImage: {
          md: `url('${process.env.PUBLIC_URL}/images/bg/${bgImageFinal}')`,
        },
      }}
    >
      <Box sx={styles.overlay}>{children}</Box>
      {mediumUp && (
        <>
          <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
            <Copyright />
          </Box>
        </>
      )}
    </Box>
  )
}
