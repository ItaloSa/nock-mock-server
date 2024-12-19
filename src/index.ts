import express from "express";
import nock from "nock";
import proxy from "express-http-proxy";
import cors from "cors";

const MOCK_HOST = "http://localhost";

export class NockMockServer {
  app: express.Application;
  nockInstance: nock.Scope;
  hasBypass: boolean = false;

  constructor() {
    this.app = express();
    this.nockInstance = nock(MOCK_HOST, { allowUnmocked: true });
    this.setupExpressApp();
  }

  private setupExpressApp() {
    this.app.use(express.json());
    this.app.use(cors());
    this.setupRequestLogger();
    this.setupDefaultProxy();
  }

  private setupRequestLogger() {
    this.app.use((req, res, next) => {
      if (this.hasMock(req)) {
        console.log(`[${req.method.toUpperCase()}] ${req.url}`);
      } else if (this.hasBypass) {
        console.log(`Bypass: [${req.method.toUpperCase()}] ${req.url}`);
      } else {
        console.log(`Not Handled: [${req.method.toUpperCase()}] ${req.url}`);
      }
      next();
    });
  }

  private hasMock(req: express.Request) {
    const activeMocks = this.nockInstance
      .activeMocks()
      .map((mock) => mock.slice(mock.indexOf(":80") + 3));

    const url = req.originalUrl.split("?")[0];

    return activeMocks.includes(url);
  }

  private setupDefaultProxy() {
    this.app.use(
      "*",
      proxy(MOCK_HOST, {
        proxyReqPathResolver: (req) => req.originalUrl,
        filter: (req) => this.hasMock(req),
      })
    );
  }

  /**
   * @description EXPERIMENTAL - use with caution!
   * This uses express-http-proxy to proxy the request
   * to the provided URL.
   * @param path - The path to be bypassed ("*" allows bypassing all paths to the provided URL).
   * @param bypassUrl - The URL to which the requests will be sent.
   * @param proxyOptions - Options for express-http-proxy.
   * 
   * @see {@link https://github.com/villadora/express-http-proxy}
   */
  public setBypass(
    path: string,
    bypassUrl: string,
    proxyOptions: proxy.ProxyOptions
  ) {
    this.hasBypass = true;
    this.app.use(
      path,
      proxy(bypassUrl, {
        https: bypassUrl.includes("https"),
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyReqBodyDecorator: (proxyReqOpts) => {
          (proxyReqOpts as any).rejectUnauthorized = false;
          return proxyReqOpts;
        },
        proxyErrorHandler: (err, res, next) => {
          console.error(err);
          next(err);
        },

        ...proxyOptions,
      })
    );
  }

  public start(port: number, callback: () => void) {
    this.nockInstance.persist();

    this.app.listen(port, () => {
      callback();
    });
  }

  public addMock(handler: (nockInstance: nock.Scope) => void) {
    handler(this.nockInstance);
  }
}
