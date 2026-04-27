describe("Ducktor dialogue form changes", () => {
  const steamID = "76561199011377323";

  it("changes Ducktor form/expression as dialogue is clicked through", () => {
    cy.intercept(
      "GET",
      `http://localhost:8080/api/auth/steam-user/${steamID}`,
      {
        statusCode: 200,
        body: {
          user: {
            steam_id: steamID,
            persona_name: "vishy",
            avatar: "https://example.com/avatar.jpg",
            public: true,
          },
        },
      },
    ).as("getSteamAuthUser");

    cy.visit(`/?steamid=${steamID}`);
    cy.wait("@getSteamAuthUser");

    cy.get('[data-cy="ducktor"]')
      .invoke("attr", "data-face")
      .then((initialFace) => {
        cy.get('[data-cy="dialogue-box"]').click();

        cy.get('[data-cy="ducktor"]')
          .invoke("attr", "data-face")
          .should((nextFace) => {
            expect(nextFace).to.not.equal(initialFace);
          });
      });
  });
});
