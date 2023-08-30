import React from 'react'
import { StoryFn, Meta } from '@storybook/react'

import { ActivePopupMe as ActivePopupMeC } from './ActivePopupMe'
import { fakeSessionUser } from '@regolithco/common/dist/mock'

export default {
  title: 'Modals/ActivePopupMe',
  component: ActivePopupMeC,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
} as Meta<typeof ActivePopupMeC>

const Template: StoryFn<typeof ActivePopupMeC> = (args) => <ActivePopupMeC {...args} />

export const DeleteProfileModal = Template.bind({})
DeleteProfileModal.args = {
  open: true,
  sessionUser: fakeSessionUser(),
  onClose: () => {
    console.log('Closed')
  },
}
