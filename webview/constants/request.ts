const REQUEST = {
  GET: "GET",
  METHOD: "Method",
  REQUEST: "Request",
  URL_REQUEST: "Url Request",

  // Add to...
  ADD_TO_QUERY_PARAMS: "Query Params",
  ADD_TO_HEADERS: "Headers",
  
  // Menu options
  PARAMS: "Params",
  AUTH: "Authorization",
  ADD_TO_OPTION: "Add To Option",
  
  // Body options
  NONE: "None",
  FORM_DATA: "Form Data",
  FORM_URLENCODED: "x-www-form-urlencoded",
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
};

export default REQUEST;
