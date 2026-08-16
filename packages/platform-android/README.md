# @eldric/platform-android (placeholder)

Where the Android platform object will live. Nothing here yet — the point of this folder is to
keep the seam visible while the web build is written.

An Android build should need to supply only:

- a native/GL render backend (replacing `canvas2d-backend.js`),
- an input source for touch and controllers,
- an audio backend,
- a save backend (filesystem or SharedPreferences),
- a network transport, and
- a platform object bundling the above.

No gameplay system should need to change. If one does, the seam has leaked — see
`docs/platform-seams.md`.
