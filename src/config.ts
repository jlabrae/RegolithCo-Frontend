/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config } from './types'
// import log from 'loglevel'

const config: Config = {
  apiUrl: (window as any).CLIENT_CONFIG.apiUrl || process.env.REACT_APP_API_URL,
  stage: (window as any).CLIENT_CONFIG.stage || process.env.REACT_APP_STAGE,
  apiUrlPub: (window as any).CLIENT_CONFIG.apiUrlPub || process.env.REACT_APP_API_URL_PUB,
  shareUrl: (window as any).CLIENT_CONFIG.shareUrl || process.env.REACT_APP_SHARE_URL,
  googleClientId: (window as any).CLIENT_CONFIG.googleClientId || process.env.REACT_APP_GOOGLE_CLIENT_ID,
  discordClientId: (window as any).CLIENT_CONFIG.discordClientId || process.env.REACT_APP_DISCORD_CLIENT_ID,
}

export default config
