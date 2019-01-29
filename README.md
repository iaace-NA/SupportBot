# SupportBot v1.7.0b
League of Legends Statistics for Discord
(c) 2018; source available, all rights reserved

<a href="https://discord.gg/MTqDXvB" target="_blank" rel="noopener"><img src="https://discordapp.com/api/guilds/384552678161645568/embed.png" alt="current users" /></a>
## General Features
- Per server preferences
  - custom prefixes
  - enable/disable release notifications
  - enable/disable forced prefixes
  - enable/disable automatic op.gg responses
- 2500-5000 server (guild) capacity with minimal initial configuration involved
- Processes
  - 3 shards implemented as separate processes (blocking)
    - (Future, not implemented) +1 process per shard for realtime music playback/streaming (non-blocking)
  - 1 parent process to startup all 3 shards (blocking)
  - 1 internal (stateful) API process to cache external API requests and to handle database operations (blocking)
    - HTTPS for database operations
    - wss for bidirectional discord shard related communications
    - api key authentication
  - (Future, not implemented) 1 child process of the internal API to handle polling and tracking (blocking)
  - (Future, not implemented) 1 website process, accessing the internal API via HTTPS requests
- Configurable API caching timeouts per endpoint, per command
- Feedback commands
- Configurable user and server rate limiting
  - Owners bypass rate limits
  - Large servers have higher rate limits
- Rate limit abuse watch
- Global disciplinary commands for users and servers
  - Permaban
  - Temporary ban
  - Warn
  - Make internal note
- Ability to set multiple owners
- Ability to audit owner disciplinary actions
- Ability to globally brodcast messages
- Tiered permissions system
  - Bot owners
  - Server owners
  - Server administrators
  - Server moderators
  - Server bot commanders
  - Normal members
## Format of Repository
### Branches:
- major: unstable, next major revision v+.0.0 : we removed a feature
- minor: unstable, next minor revision vX.+.0 : we added a feature
- patch: unstable, next patch revision vX.X.+ : we fixed a problem
- master: stable, most current release
### Folders:
- api: internal api files
- data: TLS certs and other local data
- discord: discord bot files
- example-api-docs: example responses from the riot API
- install: bash installation files for 1 time use only, Ubuntu OS
- releasenotes: release notes for supportbot
- start: startup configs for pm2
- tests: manual test cases
- utils: utility classes and functions


## Dependencies
- mongodb 3.x
- gnuplot
## npm Dependencies
- pm2 (global)
- getopts 2.2.3
- discord.js 11.4.2
- mongoose 5.3.11
- request 2.88.0
- mathjs 5.2.3
- console.table 0.10.0
- json5 2.1.0
- iaace-NA/riot-lol-api 4.2.16
- express 4.16.4
- express-ws 4.0.0
- uws 9.148.0
- ws 6.1.0
- xregexp 4.2.0
## Minimum System Requirements
- RAM: 1 GB
- HDD: 1 GB
- CPU: 2 Thread, Base clock 1GHz+
- LAN: 10 Mbps Down/2 Mbps Up
## Commands
see https://supportbot.tk/
## Installation
see https://github.com/iaace-NA/SupportBot/wiki
