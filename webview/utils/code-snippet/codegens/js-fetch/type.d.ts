import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  indentType: 'Tab' | 'Space';
  indentCount: number;
  followRedirect: boolean;
  trimRequestBody: boolean;
  requestTimeout: number;
  asyncAwaitEnabled: boolean;
}