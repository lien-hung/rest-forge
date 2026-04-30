export type PostgenOption = {
  name: string;
  id: string;
  type: string;
  default: string | number | boolean;
  availableOptions?: string[];
  description: string;
}

export interface BaseSnippetOptions extends Record<string, string | boolean | number> {}

export type DefaultOptions = Record<string, Partial<PostgenOption>>;

export interface FormField {
  key: string;
  type: string;
  value?: string;
  src?: string;
  disabled: boolean;
  contentType: string;
}