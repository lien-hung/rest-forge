import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  multiLine: boolean;
  longFormat: boolean;
  lineContinuationCharacter: '\\' | '^' | '`';
  quoteType: 'single' | 'double';
  requestTimeoutInSeconds: number;
  followRedirect: boolean;
  followOriginalHttpMethod: boolean;
  trimRequestBody: boolean;
  silent: boolean;
  indentCount?: number;
}