describe("preferences tab dialogue update", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("updates the blue dialogue box after clicking the Preferences tab", () => {
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

    cy.contains("Welcome, vishy").should("be.visible");

    cy.contains("button", "Preferences").click();

    cy.contains("let me heer moar about wat your looking fore.").should(
      "be.visible",
    );
  });
});
