## [Unreleased] - enero 2026
### Documentation
- [docs] update documentation (3 files) by @Christian Benitez

# Changelog

All notable changes to Mint Startpage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-07

### Added

- **Modal system** replacing native prompts for better UX
- **Hamburger menu** (⋮) for link actions (Edit/Delete)
- **Search functionality** to filter links by title or URL in real-time
- **Gradient builder** with visual color pickers and angle slider
- **Reset settings** option with double confirmation
- **Footer** with GitHub link and version number
- Hover effects on links with smooth transitions
- Context menu for individual link management
- Modern SVG settings icon

### Changed

- **New mint green color** (#9bfab0) as primary color
- **Responsive grid layout** that adapts from 1 to 4 columns
- **Improved favicon loading** with smart fallback system:
  1. Google Favicon Service (primary)
  2. Direct favicon.ico (fallback)
  3. Link icon SVG (final fallback)
- **Drag & drop** now only works from group header
- Links now open in same tab (\_self) instead of new tab
- All CSS colors moved to CSS variables for easy customization
- Settings page now centered with max-width container
- Improved modal styling with better visual hierarchy

### Enhanced

- **Link reordering** within and between groups via drag & drop
- **z-index handling** for dropdown menus (fixed overlay issues)
- Better error handling for favicon loading
- XSS protection with HTML escaping in link titles
- Menu closes automatically on scroll or click outside
- Visual feedback during drag operations

### Fixed

- Menu positioning issues with fixed positioning
- z-index conflicts between hover and dropdown menu
- Favicon fallback chain reliability

## [1.0.0] - 2025-01-01

### Initial Release

- Basic group and link management
- Drag & drop for groups
- Background customization (solid, gradient, image)
- Export/Import configuration
- Local storage with Chrome Storage API
- Minimal design with mint color theme

---

## Version Guidelines

### Version Numbers: MAJOR.MINOR.PATCH

- **MAJOR** (x.0.0): Incompatible changes, major redesign
- **MINOR** (1.x.0): New features, backwards compatible
- **PATCH** (1.1.x): Bug fixes, small improvements

### Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for bug fixes
- `Security` for security fixes
