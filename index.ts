import express from "express";
import nock from "nock";
import proxy from "express-http-proxy";

import { exampleHandler } from "./handlers/example";

const MOCK_HOST = "http://mock-server";

const app = express();
app.use(express.json());

app.use(
  "*",
  proxy(MOCK_HOST, {
    proxyReqPathResolver: (req) => {
      return req.originalUrl
    },
  })
);

const scope = nock(MOCK_HOST);

scope.get("/").reply(200, { message: "Hello from nock server" });

exampleHandler(scope, "/example");

scope.persist();

app.listen(3000, () => {
  console.log("NockServer is running on port 3000");
});
