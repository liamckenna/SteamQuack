describe("Profile Parse - Private", () => {
  it("shows an error for a private profile", () => {
    cy.visit("/");
    cy.get('input[placeholder*="private"]').clear().type("76561198151758695");
    cy.contains("button", "Send").click();

    cy.contains("Error: Private profile!", { timeout: 1000 }).should(
      "be.visible",
    );
  });
});
