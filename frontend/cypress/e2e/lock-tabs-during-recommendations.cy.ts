describe("lock other tabs while recommendations are being generated", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("locks all other tabs while prescription recommendations are loading, then unlocks them", () => {
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

    // Delay the recommendations response so we can assert the locked state
    cy.intercept("POST", "**/api/recommendations", (req) => {
      req.reply((res) => {
        res.delay = 1500;
        res.send({
          recommendations: [
            {
              game_id: 570,
              name: "Dota 2",
              current_price: 0,
              initial_price: 0,
              release_date_unix: 1377993600,
              review_percentage: 82,
              review_count: 1000000,
              score: 0.99,
            },
          ],
        });
      });
    }).as("getRecommendations");

    cy.visit(`/?steamid=${steamID}`);
    cy.wait("@getSteamAuthUser");

    cy.contains("button", "Prescription").click();

    // While loading, other tabs should be locked
    cy.contains("Loading your recommendations...").should("be.visible");
    cy.contains("button", "Sign in").should("be.disabled");
    cy.contains("button", "Diagnostics").should("be.disabled");
    cy.contains("button", "Preferences").should("be.disabled");

    // Active prescription tab should remain selected/usable
    cy.contains("button", "Prescription").should("not.be.disabled");

    cy.wait("@getRecommendations");

    // After load finishes, tabs should unlock again
    cy.contains("button", "Sign in").should("not.be.disabled");
    cy.contains("button", "Diagnostics").should("not.be.disabled");
    cy.contains("button", "Preferences").should("not.be.disabled");
    cy.contains("button", "Prescription").should("not.be.disabled");
  });
});
