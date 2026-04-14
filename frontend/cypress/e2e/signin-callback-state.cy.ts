describe("signed-in state from Steam callback URL", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("renders signed-in UI when steamid is in the URL", () => {
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

    cy.url().should("include", `?steamid=${steamID}`);
    cy.contains(`Welcome, ${personaName}`).should("be.visible");
    cy.contains(`Steam ID: ${steamID}`).should("be.visible");
  });
});
