import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  includeBoilerplate: boolean;
  protocol: 'http' | 'https';
  indentCount: number;
  indentType: 'Tab' | 'Space';
  followRedirect: boolean;
  trimRequestBody: boolean;
  useMimeType: boolean;
  requestTimeout: number;
}