# RegolithCo

I should probably Write a readme now that this is public


## Bootstrapping

### Stats files

Run `./scrips/syncStats.sh` to download the production stats. This should get you going 

### `.env` file

You will need a `.env` file with the following values:

```conf
BROWSER=none
REGION=us-west-2

STAGE=staging
NODE_ENV=development
# NOTE: THIS IS JUST TO BAKE INTO THE INDEX HMTL
CDK_STAGE=staging

# Choose the API you want to run against (Production will block localhost requests so staging is your only option)
VITE_API_URL=https://api.regolith.rocks/staging
VITE_API_URL_PUB=https://api.regolith.rocks/staging/public
VITE_SHARE_URL=https://api.regolith.rocks/sharing
VITE_STAGE=staging

# Ask me for these. They're not really secret but I don't want to expose them
VITE_GOOGLE_CLIENT_ID=XXXXXXXXXXXXXXXXXX.apps.googleusercontent.com
VITE_DISCORD_CLIENT_ID=XXXXXXXXXXXXXXXXXX
```