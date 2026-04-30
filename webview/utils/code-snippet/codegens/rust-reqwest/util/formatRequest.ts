import { Request } from "postman-collection";

export function addDefaultContentType(request: Request) {
  if (!request.body || request.headers.has('Content-Type')) {
    return;
  }

  if (request.body.mode === 'file') {
    request.addHeader({
      key: 'Content-Type',
      value: 'text/plain'
    });
  }
  else if (request.body.mode === 'graphql') {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
}