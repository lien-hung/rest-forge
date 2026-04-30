import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  indentCount: number;
  indentType: 'Tab' | 'Space';
  requestTimeout: number;
  trimRequestBody: boolean;
  includeBoilerplate: boolean;
  followRedirect: boolean;
}