import { isEmpty, forEach } from '../../../common/lodash';
import { sep } from 'path';
import { sanitize } from './sanitize';
import { FormParam, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { BodySnippet, HeaderSnippet } from '../type';

/**
 * Parses header of request object and returns code snippet to add headers
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentation - indentation required in code snippet
 *
 * @property {String} headerSnippet - code snippet to define headers
 * @property {String} requestHeaderSnippet - code snippet to add headers to request
 *
 * @returns {HeaderSnippet}
 */
export function parseHeader(request: Request, indentation: string): HeaderSnippet {
  const enabledHeaders = request.getHeaders({ enabled: true });
  let headerSnippet = '',
    requestHeaderSnippet = '';

  if (isEmpty(enabledHeaders)) {
    return { headerSnippet, requestHeaderSnippet };
  }

  headerSnippet += `${indentation}let mut headers = reqwest::header::HeaderMap::new();\n`;

  forEach(enabledHeaders, (value, key) => {
    if (Array.isArray(value)) {
      value = value.join(', ');
    }

    headerSnippet += `${indentation}headers.insert("${sanitize(String(key))}", `;
    headerSnippet += `"${sanitize(value)}".parse()?);\n`;
  });

  headerSnippet += '\n';
  requestHeaderSnippet += `${indentation.repeat(2)}.headers(headers)\n`;

  return { headerSnippet, requestHeaderSnippet };
}

/**
 * Parses URLEncoded body to Rust reqwest syntax
 *
 * @param {Object} body URLEncoded Body
 * @param {boolean} trim trim body option
 * @param {string} indentation The indentation string
 *
 * @returns {BodySnippet}
 */
function parseURLEncodedBody(body: PropertyList<QueryParam> | undefined, trim: boolean, indentation: string): BodySnippet {
  let bodySnippet = `${indentation}let mut params = std::collections::HashMap::new();\n`,
    requestBodySnippet = `${indentation.repeat(2)}.form(&params)\n`;

  forEach(body?.all() ?? [], function (data) {
    if (!data.disabled) {
      bodySnippet += `${indentation}params.insert("${sanitize(data.key, trim)}", `;
      bodySnippet += `"${sanitize(data.value, trim)}");\n`;
    }
  });

  bodySnippet += '\n';

  return { bodySnippet, requestBodySnippet };
}

/**
 * Parses raw body to Rust reqwest syntax
 *
 * @param {Object} body Raw body
 * @param {Boolean} trim trim body option
 * @param {String} indentation The indentation string
 * @param {String} contentType Content type of the body being sent
 *
 * @returns {BodySnippet}
 */
function parseRawBody(body: string, trim: boolean, indentation: string, contentType: string): BodySnippet {
  let bodySnippet = '',
    requestBodySnippet = '';

  if (contentType && contentType.startsWith('application/json')) {
    try {
      const jsonBody = JSON.parse(body),
        jsonValue = JSON.stringify(jsonBody, null, indentation);
      bodySnippet += `${indentation}let data = r#"${jsonValue}"#;\n\n`;
      bodySnippet += `${indentation}let json: serde_json::Value = serde_json::from_str(&data)?;\n\n`;
      requestBodySnippet += `${indentation.repeat(2)}.json(&json)\n`;
    }
    catch (e) {
      bodySnippet = `${indentation}let data = "${sanitize(body, trim)}";\n\n`;
      requestBodySnippet += `${indentation.repeat(2)}.body(data)\n`;
    }
  }
  else {
    bodySnippet = `${indentation}let data = "${sanitize(body, trim)}";\n\n`;
    requestBodySnippet += `${indentation.repeat(2)}.body(data)\n`;
  }

  return { bodySnippet, requestBodySnippet };
}

/**
 * Parses Formdata to Rust reqwest syntax
 *
 * @param {Object} body FormData body
 * @param {Boolean} trim trim body option
 * @param {String} indentation The indentation string
 */
function parseFormData(body: PropertyList<FormParam> | undefined, trim: boolean, indentation: string) {
  let beforeSnippet = '',
    index = 1, // this is used to generate headers for each part
    bodySnippet = `${indentation}let form = reqwest::multipart::Form::new()\n`,
    requestBodySnippet = `${indentation.repeat(2)}.multipart(form)\n`;

  forEach(body?.all() ?? [], function (data) {
    if (!data.disabled) {
      if (data.type === 'file') {
        const filename = data.src.split(sep).pop();
        bodySnippet += `${indentation.repeat(2)}.part("${sanitize(data.key, trim)}", `;
        bodySnippet += `reqwest::multipart::Part::bytes(std::fs::read("${sanitize(data.src, trim)}")?)`;
        bodySnippet += `.file_name("${filename}")`;

        if (data.contentType) {
          beforeSnippet += `${indentation}let mut form_param${index}_headers = `;
          beforeSnippet += 'reqwest::header::HeaderMap::new();\n';
          beforeSnippet += `${indentation}form_param${index}_headers.insert("Content-Type", `;
          beforeSnippet += `"${sanitize(data.contentType, trim)}".parse()?);\n\n`;

          bodySnippet += `.headers(form_param${index}_headers)`;
        }

        bodySnippet += ')\n';

        index++;
      }
      else if (data.contentType) {
        beforeSnippet += `${indentation}let mut form_param${index}_headers = `;
        beforeSnippet += 'reqwest::header::HeaderMap::new();\n';
        beforeSnippet += `${indentation}form_param${index}_headers.insert("Content-Type", `;
        beforeSnippet += `"${sanitize(data.contentType, trim)}".parse()?);\n\n`;

        bodySnippet += `${indentation.repeat(2)}.part("${sanitize(data.key, trim)}", `;
        bodySnippet += `reqwest::multipart::Part::text("${sanitize(data.value, trim)}")`;
        bodySnippet += `.headers(form_param${index}_headers))\n`;

        index++;
      }
      else {
        bodySnippet += `${indentation.repeat(2)}.text("${sanitize(data.key, trim)}", `;
        bodySnippet += `"${sanitize(data.value, trim)}")\n`;
      }
    }
  });

  bodySnippet = beforeSnippet + bodySnippet.slice(0, -1) + ';\n\n';

  return { bodySnippet, requestBodySnippet };
}

/**
 * Parses File body to Rust reqwest syntax
 *
 * @param {Object} body File body
 * @param {String} indentation The indentation string
 *
 * @returns {BodySnippet}
 */
function parseFileData(body: { src: string }, indentation: string): BodySnippet {
  const bodySnippet = `${indentation}let bytes = std::fs::read("${sanitize('src' in body ? String(body.src) : '')}")?;\n\n`,
    requestBodySnippet = `${indentation.repeat(2)}.body(bytes)\n`;

  return { bodySnippet, requestBodySnippet };
}

/**
 * Parses Body from the Request and returns code snippet to add body
 *
 * @param {Object} body body object from request
 * @param {Boolean} trim trim body option
 * @param {String} indentation indentation to be added to the snippet
 * @param {String} contentType Content type of the body being sent
 *
 * @property {String} bodySnippet - code snippet to define body
 * @property {String} requestBodySnippet - code snippet to add body to request
 *
 * @returns {BodySnippet}
 */
export function parseBody(body: RequestBody, trim: boolean, indentation: string, contentType: string): BodySnippet {
  if (!body || isEmpty(body)) {
    return { bodySnippet: '', requestBodySnippet: '' };
  }

  switch (body.mode) {
    case 'urlencoded':
      return parseURLEncodedBody(body.urlencoded, trim, indentation);
    case 'raw':
      return parseRawBody(String(body.raw), trim, indentation, contentType);
    case 'formdata':
      return parseFormData(body.formdata, trim, indentation);
    case 'file':
      return parseFileData(body.file ?? { src: '' }, indentation);
    default:
      return parseRawBody(String(body.raw), trim, indentation, contentType);
  }
}
