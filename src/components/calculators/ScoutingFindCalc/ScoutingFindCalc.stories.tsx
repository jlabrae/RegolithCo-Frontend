import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ScoutingFindCalc, ScoutingFindCalcProps } from './ScoutingFindCalc'
import {
  fakeSalvageFind,
  fakeSessionUser,
  fakeShipClusterFind,
  fakeVehicleClusterFind,
} from '@regolithco/common/dist/mock'
import { ScoutingFindTypeEnum } from '@regolithco/common'

export default {
  title: 'Calculators/ScoutingFind',
  component: ScoutingFindCalc,
  parameters: {
    findType: {
      control: {
        type: 'select',
        options: Object.values(ScoutingFindTypeEnum),
      },
    },
  },
} as ComponentMeta<typeof ScoutingFindCalc>

const Template: ComponentStory<typeof ScoutingFindCalc> = (args: ScoutingFindCalcProps) => {
  const { findType, ...props } = args as any
  switch (findType) {
    case ScoutingFindTypeEnum.Ship:
      props.scoutingFind = fakeShipClusterFind()
      break
    case ScoutingFindTypeEnum.Vehicle:
      props.scoutingFind = fakeVehicleClusterFind()
      break
    case ScoutingFindTypeEnum.Salvage:
      props.scoutingFind = fakeSalvageFind()
      break
  }

  return <ScoutingFindCalc {...props} />
}

export const New = Template.bind({})
New.args = {
  scoutingFind: fakeShipClusterFind(),
  me: fakeSessionUser(),
}

export const Scout = Template.bind({})
Scout.args = {
  scoutingFind: fakeShipClusterFind(),
  me: fakeSessionUser(),
}

export const Observer = Template.bind({})
Observer.args = {
  scoutingFind: fakeShipClusterFind(),
  me: fakeSessionUser(),
}
