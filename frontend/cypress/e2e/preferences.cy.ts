describe("Preferences Panel", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("button", "Preferences").click();
  });

  it("loads the recommendation settings correctly", () => {
    cy.contains("h3", "Recommendation Settings").should("be.visible");
    cy.contains("h3", "Tags & Games").should("be.visible");
    cy.contains("Randomization Factor").should("be.visible");
    cy.contains("Price Range ($)").should("be.visible");
  });

  it("opens the tag search dropdown when focused", () => {
    cy.get('input[placeholder="Search tags..."]').first().focus().type("Action");
    // checks if the dropdown container pops up
    cy.get(".preferences-panel__dropdown").should("be.visible");
  });

  it("can interact with the reset button", () => {
    cy.contains("button", "Reset Settings").should("exist").click();
  });
});
