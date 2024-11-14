import * as React from 'react'
import { MenuItem, Select, Tooltip, Typography } from '@mui/material'
import { ObjectValues, SessionInput } from '@regolithco/common'
import { Handyman, Inventory, RocketLaunch, Security, Support } from '@mui/icons-material'
import { RoleChooserItem } from './SessionRoleChooser'

export interface ShipRoleChooserProps {
  value: SessionInput | ''
  onChange: (value: SessionInput) => void
}

export const ShipRoleEnum = {
  Pilot: 'PILOT',
  CoPilot: 'COPILOT',
  Engineer: 'ENGINEER',
  Turret: 'TURRET',
  Security: 'SECURITY',
  Medic: 'MEDIC',
  Stevedore: 'STEVEDORE',
} as const
export type ShipRoleEnum = ObjectValues<typeof ShipRoleEnum>

export const ShipRoleNames: Record<ShipRoleEnum, string> = {
  [ShipRoleEnum.Pilot]: 'Pilot',
  [ShipRoleEnum.CoPilot]: 'Co-Pilot',
  [ShipRoleEnum.Engineer]: 'Engineer',
  [ShipRoleEnum.Turret]: 'Turret',
  [ShipRoleEnum.Security]: 'Security',
  [ShipRoleEnum.Medic]: 'Medic',
  [ShipRoleEnum.Stevedore]: 'Stevedore',
}

export const ShipRoleIcons: Record<ShipRoleEnum, React.ReactNode> = {
  [ShipRoleEnum.Pilot]: <RocketLaunch />,
  [ShipRoleEnum.CoPilot]: <RocketLaunch />,
  [ShipRoleEnum.Engineer]: <Handyman />,
  [ShipRoleEnum.Turret]: <Security />,
  [ShipRoleEnum.Security]: <Security />,
  [ShipRoleEnum.Medic]: <Support />,
  [ShipRoleEnum.Stevedore]: <Inventory />,
}

export const ShipRoleColors: Record<ShipRoleEnum, string> = {
  [ShipRoleEnum.Pilot]: '#ff0',
  [ShipRoleEnum.CoPilot]: '#ff0',
  [ShipRoleEnum.Engineer]: '#b26eff',
  [ShipRoleEnum.Turret]: '#f00',
  [ShipRoleEnum.Security]: '#f00',
  [ShipRoleEnum.Medic]: '#0ff',
  [ShipRoleEnum.Stevedore]: '#ccc',
}
export const ShipRoleChooser: React.FC<ShipRoleChooserProps> = ({ value, onChange }) => {
  return (
    <Select
      // value="None"
      size="small"
      fullWidth
      variant="outlined"
      renderValue={(value) => {
        if (!value) return <Typography>Select a Role</Typography>
        return (
          <RoleChooserItem
            roleName={ShipRoleNames[value as ShipRoleEnum]}
            icon={ShipRoleIcons[value as ShipRoleEnum]}
            color={ShipRoleColors[value as ShipRoleEnum]}
          />
        )
      }}
      // onChange={(e) => onChange(e.target.value as SessionInput)}
    >
      <MenuItem value="None">
        <RoleChooserItem roleName="Select a Role" />
      </MenuItem>
      {Object.values(ShipRoleEnum).map((role, idx) => (
        <MenuItem
          value={role}
          key={idx}
          sx={{
            '& svg': {
              mr: 1,
            },
            color: ShipRoleColors[role as ShipRoleEnum],
          }}
        >
          <RoleChooserItem roleName={ShipRoleNames[role as ShipRoleEnum]} icon={ShipRoleIcons[role as ShipRoleEnum]} />
        </MenuItem>
      ))}
    </Select>
  )
}

export const SessionRoleIconBadge: React.FC<{ role: ShipRoleEnum }> = ({ role }) => {
  return (
    <Tooltip title={ShipRoleNames[role]}>
      <>{ShipRoleIcons[role]}</>
    </Tooltip>
  )
}
