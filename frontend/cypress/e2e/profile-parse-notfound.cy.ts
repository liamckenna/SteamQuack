describe("Profile Parse - Not Found", () => {
  it("shows an error for a profile that does not exist", () => {
    cy.visit("/");
    cy.get('input[placeholder*="private"]').clear().type("foiueasificva");
    cy.contains("button", "Send").click();

    cy.contains("Error: parseProfile failed: 500", { timeout: 10000 }).should(
      "be.visible",
    );
  });
});
