import { useState } from 'react'
import type { SteamApps } from '../../mock-data/SteamApps.ts'
import steamAppsJson from '../../mock-data/steam-apps.json'

const steamApps: SteamApps = steamAppsJson as SteamApps

function RandomGameDisplay() {
  const [appID, setAppID] = useState(-1)

  const displayRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * steamApps.app_count)
    const keys = Object.keys(steamApps.apps)
    const randomAppID = parseInt(keys[randomIndex])
    setAppID(randomAppID)
  }

  return (
    <>
      {appID != -1 &&
        <>
            <img src={"https://steamcdn-a.akamaihd.net/steam/apps/" + appID + "/header.jpg"} />
            <p>appid: {appID}</p>
            <p>initial_price: {steamApps.apps[appID].initial_price}</p>
            <p>current_price: {steamApps.apps[appID].current_price}</p>
            <p>name: {steamApps.apps[appID].name}</p>
            <p>desc: {steamApps.apps[appID].desc}</p>
            <p>release_date: {steamApps.apps[appID].release_date}</p>
            <p>release_date_unix: {steamApps.apps[appID].release_date_unix}</p>
            <p>review_count: {steamApps.apps[appID].review_count}</p>
            <p>review_desc: {steamApps.apps[appID].review_desc}</p>
            <p>review_percentage: {steamApps.apps[appID].review_percentage}</p>
            <p>review_sample: {steamApps.apps[appID].review_sample}</p>
        </>
      }
      <button onClick={displayRandomGame}>Random Game (front-end mock data)</button>
    </>
  )
}

export default RandomGameDisplay