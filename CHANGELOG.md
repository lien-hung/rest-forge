# Changelog

All notable changes to the "rest-forge" extension will be documented in this file.

## [v4.1.0]
- Environments feature:
  - Manage environments via tree view
  - Use variables from active environment in request URL and tables
- Preview and download all binary response types
- Optimization of Monaco editor load
- Fix behavior of posting request message from tree view

## [v4.0.1]
- Fix JSON variable object parsing error for GraphQL

## [v4.0.0]
- GraphQL support
- New collection storage format with subfolders
- New collection features: copy, duplicate and JSON export
- Enhancements and optimizations:
  - Typing request URL and pasting data into raw editor
  - Pretty JSON data structure and storage
  - Lighter tree view icons
  - Removal of unnecessary Node packages and included extension files
- Border boxes for raw data editors
- Other tweaks on UI styles

## [v3.1.0]
- Support for all media responses (image/video/audio)
- Added folder icon for collections in the collection tree view
- UI styles tweaks: code editor, resize bar; simpler looking tables.

## [v3.0.1]
- Patch for code snippets of file fields in Form Data requests

## [v3.0.0]
- New local data storage structure, using an object for table data instead of a single array.
- Features:
  - Upload files for form data requests
  - Import request data from cURL commands
  - Auto formatting for XML responses
  - Previews of image requests
  - Save response data to file
- Fixes:
  - Synchronization of tokens between the main panel and "Manage Tokens" panel
  - Safe URL to params table conversion, with simplified logic and proper handling of `&` and `?` characters
  - Prompt for request name before saving a request from history to collection
  - Drop the uppercase requirement for custom method settings
- Other UI tweaks

## [v2.2.0]
- Added support for OAuth 2.0 authorization
- Added option for customization of header prefixes other than `Bearer`
- Fixed input URL when changing to a different item in history or collection
- UI modifications

## [v2.1.0]
- Added support for renaming requests from history and save to collection
- Added theme-specific syntax highlighting for HTML/XML
- Modified list of executable commands from the Command Palette
- Minor fix on request URL synchronization

## [v2.0.1]
- Patch for limiting visibility of refresh buttons to the tester's tree views

## [v2.0.0]
- Support for request collections
- This version uses JSON files for local storage at `%userprofile%\.rest-forge` instead of extension global state. Older versions are therefore not recommended.
- UI modifications

## [v1.3.0]
- UI refreshes:
  - General new look with less margin usage
  - Distinct colorization of read-only table rows
  - Clearer contrast for input boxes
  - Better panel resize experience
- Support for API keys (auth) and custom HTTP methods
- Fixed elapsed time bug in tree view, request URL input and response size

## [v1.2.0]
- Supports XML request and response body
- Synchronization of URL query params as you type
- Improves input box alignment for Basic Auth
- Monaco editors now have the same font family as your current configuration settings
- Colorization of request method select box similar to Postman
- Other improvements and fixes

## [v1.1.0]
- Refinement of key-value table similar to Postman, and other UI enhancements
- Helper functions refactoring and code cleanup
- Code snippet correction for Node.js; add support for Kotlin and Rust from postman-code-generators

## [v1.0.0]
- Initial release