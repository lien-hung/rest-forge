import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  requestTimeout: number;
  trimRequestBody: boolean;
  followRedirect: boolean;
}