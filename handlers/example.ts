import { Handler } from "../types";

export const exampleHandler: Handler = (scope, basePath: string) => {
  scope.get(`${basePath}`).reply(200, { message: "Hello from exampleHanlder" });
};
