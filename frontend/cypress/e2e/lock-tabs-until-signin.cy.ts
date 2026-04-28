describe("lock tabs until successful sign in", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("keeps non-sign-in tabs locked before sign-in", () => {
    cy.visit("/");

    cy.contains("button", "Sign in").should("not.be.disabled");
    cy.contains("button", "Diagnostics").should("be.disabled");
    cy.contains("button", "Preferences").should("be.disabled");
    cy.contains("button", "Prescription").should("be.disabled");
  });

  it("unlocks non-sign-in tabs after a valid sign-in", () => {
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

    cy.contains(`Welcome, ${personaName}`).should("be.visible");

    cy.contains("button", "Sign in").should("not.be.disabled");
    cy.contains("button", "Diagnostics").should("not.be.disabled");
    cy.contains("button", "Preferences").should("not.be.disabled");
    cy.contains("button", "Prescription").should("not.be.disabled");
  });
});
