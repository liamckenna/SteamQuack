describe("Profile Parse - Not Found", () => {
  it("shows an error for a profile that does not exist", () => {
    cy.visit("/");
    cy.get('input[placeholder*="private"]').clear().type("foiueasificva");
    cy.contains("button", "Send").click();

    cy.contains("Error: failed to fetch user profile", {
      timeout: 1000,
    }).should("be.visible");
  });
});
