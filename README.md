<div align="center">
    <img src="https://github.com/lien-hung/api-tester/blob/master/icons/images/apitester-icon.png" width="128" />
    <h3>API Tester</h3>
    <h5>A lightweight HTTP client for sending requests and testing APIs in VSCode</h5>
</div>

---

- [Installation](#installation)
- [Features](#features)
- [Tech Stacks](#tech-stacks)
- [License](#license)

## Installation
The VSIX file can be downloaded from the [Releases](https://github.com/lien-hung/api-tester/releases) page.

## Features
This extension acts as a UI-based HTTP client to send requests to your desired endpoint. Most helpful for testing and verifying that your API is working properly.

- Supported HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
  - Custom methods can be configured in settings
- Request options:
  - Use parameters
  - Authorization: `API Key`, `Bearer Token`, `Basic Auth`, `OAuth 2.0` (**NEW**)
  - Request body:
    - Form Data
    - `x-www-form-urlencoded`
    - Raw: Text, JavaScript, JSON, HTML, XML
- Code snippets for your current request
- Multiple response preview options and basic metadata
- Tree view of your request history data

## Tech Stacks
Based on the [REST API Client](https://marketplace.visualstudio.com/items?itemName=unjinjang.rest-api-client) by Unjin Jang, with modifications on the user interface.

- **Extension**: [VS Code Extension API](https://code.visualstudio.com/api)
- **UI**: [React.js](https://react.dev), [styled-components](https://styled-components.com/)
- **HTTP/S Requests**: [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- **React State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Editor**: [Monaco Editor](https://github.com/microsoft/monaco-editor)
- **Local Storage**: [`ExtensionContext.globalState`](https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage)
- **Code Snippets**: [postman-collection](https://www.npmjs.com/package/postman-collection), [postman-code-generators](https://www.npmjs.com/package/postman-code-generators)
- **Bundler**: [Webpack](https://webpack.js.org/)
- **Compiler**: [Babel](https://babeljs.io/)

## License
See [license](https://github.com/lien-hung/api-tester/blob/master/LICENSE) for details.
