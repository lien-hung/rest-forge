import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  indentType?: 'Tab' | 'Space';
  indentCount?: number;
  includeBoilerplate: boolean;
  followRedirect: boolean;
  trimRequestBody: boolean;
  requestTimeout?: number;
}