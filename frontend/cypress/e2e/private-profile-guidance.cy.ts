describe("private steam profile guidance", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";
  const helpUrl =
    "https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276";

  it("shows guidance when the signed-in Steam profile is private", () => {
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
            public: false,
          },
        },
      },
    ).as("getSteamAuthUser");

    cy.visit(`/?steamid=${steamID}`);
    cy.wait("@getSteamAuthUser");

    cy.contains(`Welcome, ${personaName}`).should("be.visible");
    cy.contains("Steam ID:").should("be.visible");

    cy.contains(
      'Recommendations can only be generated if your game details are public and the "Always keep my total playtime private" option is unchecked.',
    ).should("be.visible");

    cy.contains("a", "Make your Steam profile public")
      .should("have.attr", "href", helpUrl)
      .and("have.attr", "target", "_blank");
  });

  it("does not show private-profile guidance when the profile is public", () => {
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
            public: true,
          },
        },
      },
    ).as("getSteamAuthUser");

    cy.visit(`/?steamid=${steamID}`);
    cy.wait("@getSteamAuthUser");

    cy.contains(
      "Recommendations can only be generated if your Steam profile is public.",
    ).should("not.exist");

    cy.contains("a", "Make your Steam profile public").should("not.exist");
  });
});
