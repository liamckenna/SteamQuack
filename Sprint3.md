# Sprint 3 Recap

## The issues we successfully addressed:
- Developed and transitioned to a fully functional front-end that serves as the basis for the final look of the site.
- Implemented a suite of adjustable user settings to influence the algorithm and henceforth the games recommended to the user.
- Developed a settings menu according to the front-end mockups and linked it to the backend for real-time settings adjustments.
- Created the final recommendations tab according to the mockups to display the recommended games.
- Created a universal multi-page tab system that allows for main tab pages to be multiple pages, and for those pages to be easily navigated.
- Significantly fleshed out all the possible ways for users to sign in to their steam profile for the website, both through direct sign-in and text input.
- Allowed users to sign out of their profile without reloading the page to use the service for multiple accounts.
- Successfully merged the database update scheduler, allowing for a self-sufficient database that stays up-to-date with currently released steam games.
- Made heavy optimizations to drastically speed up the recommendation algorithm, allowing it to evaluate almost 100k games in a couple of seconds.
- Implemented a dialogue system for the site to dynamically have the host character talk to the user through the main text box, which can be triggered anywhere in the site code.
-     

## Backend API documentation:


## Backend Test Cases:


## Front End Test Cases:

preferences-settings.cy:
- Check if the page loads the given recommendation setting sliders correctly (randomizer, price range, etc.)
- Check if when clicking on a search the dropdown appears
- Check if interacting with a normal slider(randomizer) works correctly
- Check if interacting with a dual slider works correctly
- Check if after searching for a game in the searcher and clicking the checkbox it appears in a list of checked games on the top of the dropdown
- Check if by default NSFW content is excluded
- Check if the reset button exists and can be clicked
