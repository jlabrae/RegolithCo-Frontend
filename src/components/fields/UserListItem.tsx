import React from 'react'
import { Typography, Box, Chip } from '@mui/material'

export interface UserListItemProps {
  scName: string
  props?: any
  friend: boolean
  session: boolean
  named: boolean
}

export const UserListItem: React.FC<UserListItemProps> = ({ scName, props, friend, session, named }) => {
  return (
    <Box component="li" sx={{ display: 'flex' }} {...props}>
      <Typography component="div" sx={{ flex: '1 1' }}>
        {scName}
      </Typography>
      {friend && <Chip label="Friend" color="primary" size="small" />}
      {session && <Chip label="Session" color="secondary" size="small" />}
      {named && <Chip label="Mentioned" color="info" size="small" />}
      {!friend && !session && !named && <Chip label="Unknown" color="default" size="small" />}
    </Box>
  )
}
