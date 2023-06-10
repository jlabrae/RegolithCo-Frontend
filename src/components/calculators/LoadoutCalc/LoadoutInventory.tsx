import React, { useState } from 'react'
import {
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { MiningGadgetEnum, MiningLaserEnum, MiningLoadout, MiningModuleEnum, lookups } from '@regolithco/common'
import { LoadoutLaserChip, LoadoutModuleChip } from './LoadoutLaserChip'
import { noop } from 'lodash'

const LASERS = lookups.loadout.lasers
const GADGETS = lookups.loadout.gadgets
const MODULES = lookups.loadout.modules

const getSortOrder = (key: string): string => {
  let sortOrder = 'Z'
  if (GADGETS[key as MiningGadgetEnum]) sortOrder = '1'
  else if (LASERS[key as MiningLaserEnum]) sortOrder = '4'
  else if (MODULES[key as MiningModuleEnum] && MODULES[key as MiningModuleEnum].active) sortOrder = '2'
  else if (MODULES[key as MiningModuleEnum] && !MODULES[key as MiningModuleEnum].active) sortOrder = '3'
  return `${sortOrder}${key}`
}

const autoCompleteItems = [
  ...Object.values(MiningLaserEnum),
  ...Object.values(MiningGadgetEnum),
  ...Object.values(MiningModuleEnum),
]
autoCompleteItems.sort((a, b) => {
  const sortKeyA = getSortOrder(a)
  const sortKeyB = getSortOrder(b)

  // finally do an alphabetical sort
  if (sortKeyA < sortKeyB) return -1
  if (sortKeyA > sortKeyB) return 1
  return 0
})

export interface LoadoutInventoryProps {
  loadout: MiningLoadout
  onChange: (miningLoadout: MiningLoadout) => void
}

export const LoadoutInventory: React.FC<LoadoutInventoryProps> = ({ loadout, onChange }) => {
  const theme = useTheme()
  const [value, setValue] = useState('')

  return (
    <Card
      sx={{
        //
        borderRadius: 4,
        height: '100%',
        width: '100%',
      }}
    >
      <CardHeader
        title={'Inventory'}
        titleTypographyProps={{ variant: 'overline' }}
        sx={{
          fontWeight: 'bold',
          px: 2,
          py: 0.5,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      />
      <CardContent>
        <Typography variant="caption">Gadgets and backup modules</Typography>
        <Stack spacing={2}>
          {loadout?.inventoryGadgets.map((gadget, index) => (
            <LoadoutModuleChip
              key={index}
              moduleCode={gadget}
              onDelete={() => {
                const inventoryGadgets = [...(loadout?.inventoryGadgets || [])]
                inventoryGadgets.splice(index, 1)
                onChange({
                  ...loadout,
                  inventoryGadgets,
                  activeGadgetIndex: null,
                })
              }}
              canBeOn
              isOn={loadout.activeGadgetIndex === index}
              onToggle={(isOn) => {
                if (isOn) onChange({ ...loadout, activeGadgetIndex: index })
                else onChange({ ...loadout, activeGadgetIndex: null })
              }}
            />
          ))}
          {loadout?.inventoryModules.map((module, index) => (
            <LoadoutModuleChip
              key={index}
              moduleCode={module}
              onDelete={() => {
                const inventoryModules = [...(loadout?.inventoryModules || [])]
                inventoryModules.splice(index, 1)
                onChange({ ...loadout, inventoryModules })
              }}
            />
          ))}
          {loadout?.inventorylasers.map((module, index) => (
            <LoadoutLaserChip
              key={index}
              laserCode={module}
              onDelete={() => {
                const inventorylasers = [...(loadout?.inventorylasers || [])]
                inventorylasers.splice(index, 1)
                onChange({ ...loadout, inventorylasers })
              }}
            />
          ))}

          <Autocomplete
            disablePortal
            options={autoCompleteItems}
            value={value}
            onChange={(event: React.SyntheticEvent<Element, Event>, value: string | null) => {
              if (!value || value.length === 0) return
              setValue('')
              if (LASERS[value as MiningLaserEnum])
                onChange({
                  ...loadout,
                  inventorylasers: [...(loadout?.inventorylasers || []), value as MiningLaserEnum],
                })
              else if (GADGETS[value as MiningGadgetEnum])
                onChange({
                  ...loadout,
                  inventoryGadgets: [...(loadout.inventoryGadgets || []), value as MiningGadgetEnum],
                })
              else if (MODULES[value as MiningModuleEnum])
                onChange({
                  ...loadout,
                  inventoryModules: [...(loadout.inventoryModules || []), value as MiningModuleEnum],
                })
            }}
            renderOption={(props, option) => {
              const itemType = LASERS[option as MiningLaserEnum]
                ? 'Laser'
                : GADGETS[option as MiningGadgetEnum]
                ? 'Gadget'
                : MODULES[option as MiningModuleEnum]
                ? 'Module'
                : ''
              const qualifier = MODULES[option as MiningModuleEnum]
                ? MODULES[option as MiningModuleEnum].active
                  ? 'Active '
                  : 'Passive '
                : ''

              return (
                <MenuItem {...props} sx={{ display: 'flex' }}>
                  <Typography>{option}</Typography>
                  <div style={{ flexGrow: 1 }} />
                  <Typography variant="caption">
                    {qualifier}
                    {itemType}
                  </Typography>
                </MenuItem>
              )
            }}
            fullWidth
            size="small"
            renderInput={(params) => <TextField variant="standard" {...params} label="Add laser/gadget/module" />}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
