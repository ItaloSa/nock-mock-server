/**
 * nock-mock-server
 * Javascript example - simple package usage
 */

const { NockMockServer } = require("nock-mock-server");

const PORT = 3000;
const nockServer = new NockMockServer();

nockServer.addMock((nockInstance) => {
  nockInstance.get("/").reply(200, { message: "Hello World" });
});

nockServer.start(PORT, () => {
  console.log("Nock server started");
});
