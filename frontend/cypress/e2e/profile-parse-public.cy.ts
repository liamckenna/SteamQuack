describe("Profile Parse - Public", () => {
  it("displays public profile information", () => {
    cy.visit("/");
    cy.get('input[placeholder*="private"]').clear().type("76561198998662393");
    cy.contains("button", "Send").click();

    cy.contains("Status: [public]", { timeout: 1000 }).should("be.visible");
    cy.contains("Name: liam").should("be.visible");
    cy.contains("Picture:").should("be.visible");
    cy.contains("Summary:").should("be.visible");
  });
});
