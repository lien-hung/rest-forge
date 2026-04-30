import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  indentCount: number;
  indentType: 'Tab' | 'Space';
  trimRequestBody: boolean;
  requestTimeout: number;
  followRedirect: boolean;
}
