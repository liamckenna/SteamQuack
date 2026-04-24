describe("Preferences Panel", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("button", "Preferences").click();
  });

  it("loads the recommendation settings correctly", () => {
    cy.contains("Price Range ($)").should("be.visible");
    cy.contains("Review Score (%)").should("be.visible");
    cy.contains("Release Year").should("be.visible");
    cy.contains("Total Reviews").should("be.visible");
    cy.contains("Randomization Factor").should("be.visible");
  });

  it("opens the tag search dropdown when focused", () => {
    cy.get('input[placeholder="Search tags..."]').first().focus().type("Action");
    // checks if the dropdown container pops up
    cy.get(".preferences-panel__dropdown").should("be.visible");
  });

  it("checks if it can interact with normal slider", () => {
    cy.contains(".preferences-panel__row", "Randomization Factor")
      .next(".preferences-panel__slider-row")
      .find(".rc-slider-handle")
      .focus()
      .type("{rightarrow}{rightarrow}");

    cy.contains("10%").scrollIntoView().should("be.visible");
  });

  it("checks if it can interact with dual sliders", () => {
    cy.contains(".preferences-panel__row", "Price Range ($)")
      .next(".preferences-panel__slider-row")
      .find(".rc-slider-handle")
      .last()
      .focus()
      .type("{leftarrow}{leftarrow}{leftarrow}");

    cy.contains("$0 - $97").scrollIntoView().should("exist"); 
  });

  it("checks a game from the prioritize games search and verify it appears in the list", () => {
    cy.intercept("GET", "**/api/preferences/options", {
      statusCode: 200,
      body: { tags: ["Grand Strategy", "Historical"], games: [{ id: 236850, name: "Europa Universalis IV" }] }
    }).as("getOptions");
    cy.visit("/");
    cy.contains("button", "Preferences").click();
    cy.wait("@getOptions");
    cy.get('input[placeholder="Search game names or IDs..."]').first().focus().type("Europa Universalis IV");
    
    // checks if the dropdown container pops up and finding the game
    cy.get(".preferences-panel__dropdown").should("be.visible");
    cy.contains(".preferences-panel__tag-checkbox", "Europa Universalis IV").click(); 
    cy.contains(".preferences-panel__tag-checkbox", "Europa Universalis IV").find('input[type="checkbox"]').should("be.checked");
  });

  it("tests default excluded tags", () => {
    cy.visit("/");
    cy.contains("button", "Preferences").click();

    // check specific excluded tags from handleReset defaults
    cy.get('input[placeholder="Search tags..."]').last().focus();
    cy.get(".preferences-panel__dropdown").should("be.visible");

    // verify default tags are checked
    cy.contains("label", "NSFW").find('input[type="checkbox"]').should("be.checked");
    cy.contains("label", "Nudity").find('input[type="checkbox"]').should("be.checked");
    cy.contains("label", "Sexual Content").find('input[type="checkbox"]').should("be.checked");
  });

  it("shows the recently played games checkbox next to prioritize games on sale", () => {
    cy.visit("/");
    cy.contains("button", "Preferences").click();
    cy.contains("Prioritize recently played games").should("be.visible");
    cy.contains("Prioritize Games on Sale").should("be.visible");
  });

  it("can interact with the reset button", () => {
    cy.contains("button", "Reset Settings").should("exist").click();
  });
});
