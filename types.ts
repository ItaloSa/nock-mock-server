import nock from "nock";

export type Handler = (scope: nock.Scope, basePath: string) => void;