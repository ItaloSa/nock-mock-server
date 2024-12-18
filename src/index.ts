import express from "express";
import nock from "nock";
import proxy from "express-http-proxy";
import cors from "cors";

const MOCK_HOST = "http://localhost";
const MOCK_PORT = 3000;

export class NockServer {
  app: express.Application;
  nockInstance: nock.Scope;

  constructor() {
    this.app = express();
    this.nockInstance = nock(MOCK_HOST, { allowUnmocked: true });
    this.setupExpressApp();
  }

  private setupExpressApp() {
    this.app.use(express.json());
    this.app.use(cors());
    this.setupDefaultProxy();
  }

  private setupDefaultProxy() {
    this.app.use(
      "*",
      proxy(MOCK_HOST, {
        proxyReqPathResolver: (req) => {
          return req.originalUrl;
        },
        filter: (req) => {
          const activeMocks = this.nockInstance
            .activeMocks()
            .map((mock) => mock.slice(mock.indexOf(":80") + 3));
          
            const url = req.originalUrl.split("?")[0];

          return activeMocks.includes(url);
        },
      })
    );
  }

  public start(callback: (port: number) => void) {
    this.nockInstance.persist();

    this.app.listen(MOCK_PORT, () => {
      callback(MOCK_PORT);
    });
  }

  public addMock(handler: (nockInstance: nock.Scope) => void) {
    handler(this.nockInstance);
  }
}
