# Sprint 1 Recap

## User stories addressed this sprint:
- As a front-end developer, I want a UI mockup of the main site page, so that I can have a reference for implementing the interface.
- As a front-end developer, I want mock data that emulates the backend, so that I can test the site without relying on the backend.
- As a front-end developer, I want a rest API to integrate with the back-end, so that I can send and receive data efficiently.
- As a front-end developer, I want to give the site personality, so that it stands out among other similar websites.
- As a backend developer, I want a dedicated database, so that I can store up-to-date data on steam games.
- As a back-end developer, I want to integrate my site with steam's public API, so that I can acquire game data and user play data.

## The issues we successfully addressed:
- **UI Mockup:** Create a mockup of the main page UI, either in figma or cleanly on physical paper, that can serve as a basis for the site's visual design.
- **Dedicated database for Steam game data:** Create a dedicated database using GORM and SQLite that can store game data.
- **Create mock backend data:** Create a comprehensive dataset accessible directly within the front-end that can be used to emulate the site's functionality.
- **Rest API for end-to-end communication:** Use the Gorilla/mux Go library to setup API communication from the front end to the back end.
- **Access Steam API:** Access Steam's public API to fetch user data and game data from within the backend.
- **Create API Communication Protocol:** Create specific API calls to be used for communication between front and backend.
- **Create persistent front-end layout based on mockups:** Block out the persistent page elements and layout for the desktop site version. This does not include the main page content, just the pages themselves and surrounding layout.

There were 2 issues that we planned on completing this sprint that did not get fully completed. They went as follows:
- **Create barebones form of recommendation algorithm:** Implement a game recommendation algorithm that only considers tags and playtime.
- **Fill database with game data:** Populate the dedicated SQLite database with up-to-date game data using Steam's public API. This entails avoiding rate limits and acquiring an access key.

The reason we failed to complete these tasks ultimately came down to slight mismanagement and timing errors. Last week, one team member was assigned the task of setting up the api calls to access game data from steam while the other
was tasked with using those api calls to populate the database. Of course, since the latter was fully dependent on the former being finished to make progress, that member was unable to make any progress in the meantime. Midway through
the week, when we realized this, we had that second team member start the task of creating the algorithm. Since it was already halfway through the week, they didn't have time to finish the task. This upcoming week, these two tasks 
are going to be the first to be addressed.
