import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ActiveUserList as ActiveUserListComponent } from './ActiveUserList'
import { fakeSessionUser } from '@regolithco/common/dist/mock'

export default {
  title: 'UserList',
  component: ActiveUserListComponent,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
} as ComponentMeta<typeof ActiveUserListComponent>

const Template: ComponentStory<typeof ActiveUserListComponent> = (args) => <ActiveUserListComponent {...args} />

const fakeSessionUsers = Array.from({ length: 20 }, (_, i) => fakeSessionUser())

export const UserList = Template.bind({})
UserList.args = {
  friends: fakeSessionUsers.slice(0, 4).map((u) => u.owner?.scName as string),
  // sessionUsers: fakeUsers.map((u) => ({
  //   fakeSessionUser,
  // })),
  sessionUsers: fakeSessionUsers,
}
