import * as React from 'react'
import { getVehicleOreName, VehicleOreEnum, findPrice } from '@regolithco/common'
import { Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, useTheme } from '@mui/material'
import Gradient from 'javascript-color-gradient'
// import log from 'loglevel'
import { MValue, MValueFormat } from '../fields/MValue'

export const VehicleOreTable: React.FC = () => {
  const theme = useTheme()
  const vehicleRowKeys = Object.values(VehicleOreEnum)
  const bgColors = new Gradient()
    .setColorGradient('#b93327', '#a46800', '#246f9a', '#229f63')
    .setMidpoint(4) // 100 is the number of colors to generate. Should be enough stops for our ores
    .getColors()
  const fgColors = bgColors.map((color) => theme.palette.getContrastText(color))
  // Sort descendng value
  vehicleRowKeys.sort((a, b) => {
    const aPrice = findPrice(a as VehicleOreEnum)
    const bPrice = findPrice(b as VehicleOreEnum)
    return bPrice - aPrice
  })

  const rowStats: { max: number; min: number }[] = []

  const finalTable: [number, number, number][] = vehicleRowKeys.map((shipOreKey, rowIdx) => {
    const orePrice = findPrice(shipOreKey as VehicleOreEnum) / 1000
    const retVals = [orePrice, orePrice * 800, orePrice * 3500]
    if (rowIdx === 0) {
      retVals.forEach((value) => rowStats.push({ max: value, min: value }))
    } else {
      retVals.forEach((value, colIdx) => {
        if (value > rowStats[colIdx].max) rowStats[colIdx].max = value
        if (value < rowStats[colIdx].min) rowStats[colIdx].min = value
      })
    }
    return retVals as [number, number, number]
  })
  // Now map the values to a color index
  // const colorizedRows: [number, number, number][] = vehicleRowKeys.map((_, rowIdx) => {
  // const normalizedValues = finalTable[rowIdx].map((value, colIdx) => {
  //   return (value - rowStats[colIdx].min) / (rowStats[colIdx].max - rowStats[colIdx].min)
  // })
  // const colorIdxs = normalizedValues.map((value) => Math.round(value * 49))
  // return colorIdxs as [number, number, number]
  // })

  return (
    <TableContainer>
      <Table sx={{ minWidth: 400, maxWidth: 460, mx: 'auto' }} size="small" aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: '#00000033' }} />
            <TableCell align="left" valign="top" sx={{ backgroundColor: '#00000055' }}>
              <Typography variant="h5" component="div">
                1 mSCU
              </Typography>
              <Typography variant="caption" component="div">
                Single Gem
              </Typography>
            </TableCell>
            <TableCell align="left" valign="top" sx={{ backgroundColor: '#00000033' }}>
              <Typography variant="h5" component="div">
                0.8 SCU
              </Typography>
              <Typography variant="caption" component="div">
                Full ROC
              </Typography>
            </TableCell>
            <TableCell align="left" valign="top" sx={{ backgroundColor: '#00000055' }}>
              <Typography variant="h5" component="div">
                3.5 SCU
              </Typography>
              <Typography variant="caption" component="div">
                Full ROC DS
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicleRowKeys.map((shipRowKey, rowIdx) => {
            return (
              <TableRow key={`row-${rowIdx}`}>
                <TableCell component="th" scope="row">
                  <MValue value={getVehicleOreName(shipRowKey)} format={MValueFormat.string} />
                </TableCell>
                {finalTable[rowIdx].map((colVal, colIdx) => {
                  return (
                    <TableCell
                      align="right"
                      key={`col-${colIdx}`}
                      sx={{
                        background: bgColors[bgColors.length - rowIdx - 1] + (colIdx % 2 === 1 ? '33' : '55'),
                        color: fgColors[fgColors.length - rowIdx - 1],
                      }}
                    >
                      <MValue value={colVal} format={MValueFormat.currency_sm} />
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
