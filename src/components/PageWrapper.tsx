import * as React from 'react'
import { Breakpoint, Container, Paper, SxProps, Typography } from '@mui/material'
import { PageLoader } from './pages/PageLoader'
import { Theme } from '@mui/system'

export interface PageWrapperProps {
  title?: string
  children: React.ReactNode
  maxWidth?: false | Breakpoint | undefined
  loading?: boolean
  sx?: SxProps<Theme>
}

const styles = {
  container: {
    py: {
      md: 2,
      lg: 4,
    },
    px: {
      md: 2,
      lg: 4,
    },
    my: {
      md: 4,
    },
    border: {
      md: '1px solid #444444',
    },
    backgroundColor: '#09090bec',
  },
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ title, children, maxWidth, loading, sx }) => {
  return (
    <>
      <Container maxWidth={maxWidth || 'sm'} sx={sx}>
        <Paper elevation={4} sx={styles.container}>
          {title && (
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
          )}
          {children}
        </Paper>
      </Container>
      <PageLoader title="Loading..." loading={loading} />
    </>
  )
}
