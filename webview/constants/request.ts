const REQUEST = {
  GET: "GET",
  METHOD: "Method",
  REQUEST: "Request",
  URL_REQUEST: "Url Request",

  // Add to...
  ADD_TO_QUERY_PARAMS: "Query Params",
  ADD_TO_HEADERS: "Headers",
  SEND_BASIC_AUTH: "Send as Basic Auth header",
  
  // Menu options
  PARAMS: "Params",
  AUTH: "Authorization",
  AUTH_SHORT: "Auth",
  ADD_TO_OPTION: "Add To Option",
  GRANT_TYPE: "Grant Type",
  CLIENT_AUTH_OPTION: "Client Auth Option",
  TOKEN_TYPE: "Token Type",
  CHALLENGE_TYPE: "Challenge Type",
  
  // Body options
  NONE: "None",
  FORM_DATA: "Form Data",
  FORM_URLENCODED: "Form Encoded",
  RAW: "Raw",

  // Default headers
  CONTENT_TYPE: "Content-Type",
  CACHE_CONTROL: "Cache-Control",
  ACCEPT: "Accept",
  ACCEPT_ENCODING: "Accept-Encoding",
  CONNECTION: "Connection",
  
  // Header values
  GZIP: "gzip",
  DEFLATE: "deflate",
  NO_CACHE: "no-cache",
  ANY_MIME_TYPE: "*/*",
  KEEP_ALIVE: "keep-alive",
  
  // Auth properties
  USERNAME: "username",
  PASSWORD: "password",
  TOKEN: "token",
  TOKEN_PREFIX: "tokenPrefix",
  
  // Authorization types
  NO_AUTH: "No Auth",
  API_KEY: "API Key",
  BEARER_TOKEN: "Bearer Token",
  BASIC_AUTH: "Basic Auth",
  OAUTH2: "OAuth 2.0",

  // OAuth 2.0 grant types
  AUTH_CODE: "Authorization Code",
  AUTH_CODE_PKCE: "Authorization Code (with PKCE)",
  CLIENT_CREDS: "Client Credentials",

  // OAuth 2.0 token types
  ACCESS_TOKEN: "Access token",
  ID_TOKEN: "ID token",
};

export default REQUEST;
