describe("prescription tab dialogue update", () => {
  const steamID = "76561199011377323";
  const personaName = "vishy";
  const avatar = "https://example.com/avatar.jpg";

  it("updates the blue dialogue box after clicking the Prescription tab", () => {
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

    cy.contains("button", "Prescription").click();

    cy.contains(
      "after looking at your charts, i hav come too the conclushun that you are in need of a new game!",
    ).should("be.visible");
  });
});
