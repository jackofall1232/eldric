# Android path

Android reuses `@eldric/engine` and `@eldric/game`. A wrapper supplies the platform object:
gamepad/touch action sources, scheduler, Canvas/WebView or native render backend, audio backend,
filesystem/account storage adapter, and optional HTTPS story transport. Gameplay never reads DOM
events, key codes, `localStorage`, WordPress functions or provider credentials directly.

The local story provider and authored Millhaven content remain the offline baseline. Remote story
requests are optional, bounded, asynchronous and narrative-only. Assets are copied from the same
manifest into the application package; capability profiles reduce particles/lights on slower
devices. Cloud saves can replace the storage adapter without changing the save schema or game
systems.
