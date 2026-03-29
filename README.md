<div align="center">
    <img width="128" height="128" alt="apitester-icon" src="https://github.com/user-attachments/assets/896b4c32-52d1-404b-a5e4-074ac9939899" />
    <h3>API Tester</h3>
    <h5>A lightweight HTTP client for sending requests and testing APIs in VSCode</h5>
</div>

---

## Installation
The VSIX file can be downloaded from the [Releases](https://github.com/lien-hung/api-tester/releases) page.

## Features
API Tester acts as a UI-based HTTP client to send requests to your desired endpoint and is most helpful for testing and verifying that your API is working properly. The extension uses local storage at `%userprofile%/.api-tester` directory and does not collect or share any personal information and request data somewhere else.

<img
    src="https://github.com/user-attachments/assets/62d70a84-30cf-40de-9c7e-734b5151af84"  
    alt="API Tester Demo"
/>

- Supports seven main HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`) and other custom methods (e.g. `PROPFIND`, configurable in settings)
- Request options:
  - URL search parameters
  - Authorization: `API Key`, `Bearer Token`, `Basic Auth`, `OAuth 2.0`
  - Request body:
    - Form Data
    - Form Encoded (`x-www-form-urlencoded`)
    - Raw: Text, JavaScript, JSON, HTML, XML
    - GraphQL
- Code snippets for your current request
- Preview response data and save to computer
- Organize requests into collections and export to JSON (good for Git collab)
- Search from collections (`Ctrl+Alt+F` on tree view)

## Tech Stacks
Based on the [REST API Client](https://marketplace.visualstudio.com/items?itemName=unjinjang.rest-api-client) by Unjin Jang, with modifications on the user interface.

- **Extension**: [VS Code Extension API](https://code.visualstudio.com/api)
- **UI**: [React.js](https://react.dev), [styled-components](https://styled-components.com/)
- **HTTP/S Requests**: [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- **React State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Editor**: [Monaco Editor](https://github.com/microsoft/monaco-editor)
- **Code Snippets**: [postman-collection](https://www.npmjs.com/package/postman-collection), [postman-code-generators](https://www.npmjs.com/package/postman-code-generators)
- **Bundler**: [Webpack](https://webpack.js.org/)
- **Compiler**: [Babel](https://babeljs.io/)

## License
See [license](https://github.com/lien-hung/api-tester/blob/master/LICENSE) for details.
