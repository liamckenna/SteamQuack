# Sprint 4 Recap

## The issues we successfully addressed:

private steam profile guidance - Vishwa
Lock other tabs from being clicked while recommendations are being generated - Vishwa
Lock all other tabs until successful sign in - Vishwa
Move back sign out button on the sign in tab - Vishwa

Use page system for displaying more recommendations - Daniel
Double clicking opens steam store page for recommendations - Daniel
Recently played games API - Daniel
Diagnostics page front-end - Daniel

Preferences page only showing games owned by user - Dylan
Diagnostics back end - Dylan

create site graphics - Liam
write dialogue - Liam
Recently played games algorithm integration - Liam

## Left to-do:

We plan on publishing the website properly to steamquack.com within the coming days. Apologies if it isn't up when you get to grade this!

## Backend API documentation:
No additional backend functionality was developed this sprint.
## Backend Test Cases:
All backend functionality was demonstrated through front-end unit tests (effectively making them end-to-end).
## Front End Test Cases:

- **ducktor-dialogue-form.cy.ts**: changes Ducktor form/expression as dialogue is clicked through
- **lock-tabs-during-recommendations.cy.ts**: lock other tabs while recommendations are being generated
- **lock-tabs-until-signin.cy.ts**: lock tabs until successful sign in
- **private-profile-guidance.cy.ts**:
  - shows guidance when the signed-in Steam profile is private
  - does not show private-profile guidance when the profile is public
- **preferences-settings.cy.ts**:
  - loads the recommendation settings correctly
  - opens the tag search dropdown when focused
  - checks if it can interact with normal slider
  - checks if it can interact with dual sliders
  - checks a game from the prioritize games search and verify it appears in the list
  - tests default excluded tags
  - shows the recently played games checkbox next to prioritize games on sale
