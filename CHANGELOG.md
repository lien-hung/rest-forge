# Changelog

All notable changes to the "api-tester" extension will be documented in this file.

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
- This version uses JSON files for local storage at `%userprofile%\.api-tester` instead of extension global state. Older versions are therefore not recommended.
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