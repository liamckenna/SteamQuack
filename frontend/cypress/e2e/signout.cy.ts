describe("sign out", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("clears the signed-in state and returns to unsigned-in view", () => {
    cy.intercept(
      "GET",
      `http://localhost:8080/api/auth/steam-user/${steamID}`,
      {
        statusCode: 200,
        body: {
          user: {
            steam_id: steamID,
            persona_name: personaName,
            avatar,
          },
        },
      },
    ).as("getSteamAuthUser");

    cy.visit(`/?steamid=${steamID}`);

    cy.wait("@getSteamAuthUser");

    cy.get(".signin-panel__signout-btn").click();

    cy.url().should("not.include", "steamid=");
    cy.contains("Enter your Steam profile URL or unique username").should(
      "be.visible",
    );
    cy.get(".signin-panel__input").should("be.visible");
    cy.get(".signin-panel__steam-btn").should("be.visible");
    cy.get(".signin-panel__signout-btn").should("not.exist");
  });
});
