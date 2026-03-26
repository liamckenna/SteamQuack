describe("Recommendations Flow", () => {
  it("parses a valid profile and shows recommendations", () => {
    cy.intercept("**/api/profile/parse", {
      statusCode: 200,
      body: {
        status: "public",
        name: "dylanzhao99",
        picture: "https://avatars.steamstatic.com/test.jpg",
        summary: {
          games: [
            {
              app_id: 42960,
              name: "Victoria II",
              playtime_forever: 81,
            },
          ],
        },
      },
    }).as("parseProfile");

    cy.intercept("**/api/recommendations", {
      statusCode: 200,
      body: {
        recommendations: [
          {
            name: "Europa Universalis III Complete",
            score: 310231.9224966682,
          },
          {
            name: "RollerCoaster Tycoon® 3: Platinum",
            score: 287425.5857351728,
          },
          {
            name: "For The Glory: A Europa Universalis Game",
            score: 280459.5152538877,
          },
          {
            name: "Hearts of Iron III",
            score: 265579.3831241757,
          },
          {
            name: "Supreme Ruler 2020 Gold",
            score: 249440.05750406705,
          },
        ],
      },
    }).as("getRecommendations");

    cy.visit("/");

    cy.get('input[placeholder*="private"]').clear().type("76561198799376349");

    cy.contains("button", "Send").click();
    cy.wait("@parseProfile");

    cy.contains("Name: dylanzhao99").should("be.visible");

    cy.contains("button", "Get Recommendations").click();
    cy.wait("@getRecommendations");

    cy.contains("Europa Universalis III Complete").should("be.visible");
  });
});
