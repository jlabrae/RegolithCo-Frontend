import * as React from 'react'

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  List,
  SxProps,
  Theme,
  Typography,
  useTheme,
} from '@mui/material'
import { OreSummary, findAllStoreChoices } from '@regolithco/common'
import { Stack } from '@mui/system'
import Gradient from 'javascript-color-gradient'
import { Cancel, ResetTv } from '@mui/icons-material'
import { StoreChooserListItem } from '../fields/StoreChooserListItem'

export interface StoreChooserModalProps {
  open?: boolean
  ores: OreSummary
  initStore?: string
  isRefined?: boolean
  onClose: () => void
  onSubmit?: (storeCode: string | null) => void
}

const styleThunk = (theme: Theme): Record<string, SxProps<Theme>> => ({
  paper: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.up('md')]: {
        minHeight: 550,
        maxHeight: 900,
        overflow: 'visible',
      },
      backgroundColor: '#282828ee',
      backgroundImage: 'none',
      borderRadius: 4,
      position: 'relative',
      outline: `10px solid ${theme.palette.primary.contrastText}`,
      border: `10px solid ${theme.palette.primary.main}`,
      maxHeight: 300,
    },
  },
  dialogContent: {
    py: 1,
    px: 2,
    borderRadius: 3,
    outline: `10px solid ${theme.palette.primary.main}`,
    flexDirection: 'column',
    display: 'flex',
  },
  headTitles: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
  },
  headerBar: {
    color: theme.palette.primary.contrastText,
    background: theme.palette.primary.main,
    display: 'flex',
    justifyContent: 'space-between',
    px: 2,
    py: 1,
  },
})

export const StoreChooserModal: React.FC<StoreChooserModalProps> = ({
  open,
  ores,
  initStore,
  isRefined,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme()
  const styles = styleThunk(theme)

  const storeChoices = findAllStoreChoices(ores, isRefined)
  const quaColors = [theme.palette.success.light, theme.palette.warning.light, theme.palette.error.light]
  const bgColors = new Gradient()
    .setColorGradient(...quaColors)
    .setMidpoint(storeChoices.length) // 100 is the number of colors to generate. Should be enough stops for our ores
    .getColors()
  // Sort the storeChoices array in descending order of price
  const sortedStoreChoices = [...storeChoices].sort((a, b) => b.price - a.price)

  return (
    <>
      <Dialog open={Boolean(open)} onClose={onClose} sx={styles.paper} maxWidth="sm" fullWidth>
        <Box sx={styles.headerBar}>
          <Typography variant="h6" sx={styles.cardTitle} component="div">
            Store Chooser
          </Typography>
          <Typography variant="caption" sx={styles.cardTitle} component="div">
            Price for all sellable ores
          </Typography>
        </Box>
        <DialogContent sx={styles.dialogContent}>
          {storeChoices.length === 0 && (
            <Typography variant="body2" sx={{ color: theme.palette.secondary.light }}>
              No stores found
            </Typography>
          )}
          <List sx={{ overflowY: 'scroll', flexGrow: 1, px: 2 }}>
            {sortedStoreChoices.map((choice, index) => (
              <StoreChooserListItem
                key={index}
                ores={ores}
                isSelected={choice.code === initStore}
                storeChoice={choice}
                priceColor={bgColors[index]}
                isMax={index === 0}
                onClick={() => {
                  onSubmit && onSubmit(choice.code)
                  onClose()
                }}
              />
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.primary.main }}>
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button color="error" onClick={onClose} variant="contained" startIcon={<Cancel />}>
              Cancel
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              color="secondary"
              startIcon={<ResetTv />}
              size="small"
              variant={'contained'}
              onClick={() => {
                onSubmit && onSubmit(null)
                onClose()
              }}
            >
              Auto Choose Max
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  )
}
