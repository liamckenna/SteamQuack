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

signin-steamid.cy:

- Check if entering a numeric SteamID into the sign-in textbox signs the user in correctly
- Check if the profile parse request resolves to the expected SteamID
- Check if the signed-in welcome state appears after successful sign-in
- Check if the Steam ID is displayed correctly on the page

signin-vanity.cy:

- Check if entering a vanity username into the sign-in textbox signs the user in correctly
- Check if the vanity username is resolved through the profile parse request
- Check if the signed-in welcome state appears after successful sign-in
- Check if the resolved Steam ID is displayed correctly on the page

signin-profile-url.cy:

- Check if entering a full Steam profile URL into the sign-in textbox signs the user in correctly
- Check if the profile URL is resolved through the profile parse request
- Check if the signed-in welcome state appears after successful sign-in
- Check if the resolved Steam ID is displayed correctly on the page

signin-callback-state.cy:

- Check if loading the page with ?steamid=<id> in the URL restores the signed-in state correctly
- Check if the frontend requests the Steam auth user data for the given SteamID
- Check if the signed-in welcome view is rendered correctly from callback state
- Check if the Steam ID is displayed correctly after callback-based sign-in

signout.cy:

- Check if a signed-in user can navigate to the second sign-in page using the page navigation arrow
- Check if the sign-out page renders correctly after page navigation
- Check if the sign-out button exists and can be clicked
- Check if signing out removes the steamid from the URL
- Check if the UI returns to the default unsigned-in sign-in view after sign-out

preferences-dialogue.cy:

- Check if clicking on the Preferences tab updates the blue dialogue box text correctly
- Check if the Preferences tab can be selected successfully after sign-in
- Check if the tab-specific dialogue content appears as expected

prescription-dialogue.cy:

- Check if clicking on the Prescription tab updates the blue dialogue box text correctly
- Check if the Prescription tab can be selected successfully after sign-in
- Check if the tab-specific dialogue content appears as expected
