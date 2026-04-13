describe("textbox sign-in with numeric SteamID", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("signs in with a numeric SteamID", () => {
    cy.intercept("POST", "http://localhost:8080/api/profile/parse", (req) => {
      expect(req.body.profile).to.equal(steamID);

      req.reply({
        statusCode: 200,
        body: {
          status: "[ok]",
          steam_id: steamID,
          name: personaName,
          picture: avatar,
          public: true,
        },
      });
    }).as("parseProfile");

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

    cy.visit("/");

    cy.get(".signin-panel__input").type(steamID);
    cy.get(".signin-panel__search-btn").click();

    cy.wait("@parseProfile");
    cy.wait("@getSteamAuthUser");

    cy.url().should("include", `?steamid=${steamID}`);
    cy.contains(`Welcome, ${personaName}`).should("be.visible");
    cy.contains(`Steam ID: ${steamID}`).should("be.visible");
  });
});
