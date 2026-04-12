# Change Log

All notable changes to the **NAKA Client** VS Code extension.

## [0.0.1] — 2026-04-12

### Added
- Initial release of NAKA Client
- NPU-themed webview UI (Navy `#0d2750` + Gold `#c8a415`) matching naka-env.org design system
- Quick Endpoints panel: All Stations, Station Current, History 24h/7d, Monthly, My API Key
- API Key management — saved to VS Code global state, auto-injected as `Authorization: Bearer`
- JSON response viewer with syntax highlighting (light theme)
- Station Cards with PM2.5 AQI color-coding (Thai AQI standard)
- "Use" button on station cards to quickly set Station ID in URL
- Copy response button
- Toast notifications
- Real-time status badge (HTTP status code + response time)