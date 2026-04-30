import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  indentType: 'Tab' | 'Space';
  indentCount: number;
  trimRequestBody: boolean;
  requestTimeout: number;
}