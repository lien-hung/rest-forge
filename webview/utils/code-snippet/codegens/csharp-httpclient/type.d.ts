import { BaseSnippetOptions } from "../../common/type";

export interface SnippetOptions extends BaseSnippetOptions {
  includeBoilerplate?: boolean;
  indentCount?: number;
  indentType?: 'Tab' | 'Space';
  requestTimeout?: number;
  followRedirect?: boolean;
}