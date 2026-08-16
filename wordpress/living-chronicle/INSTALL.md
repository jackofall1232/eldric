# Installing Eldric: The Living Chronicle

1. Run `npm install && npm run build:wp` at the repository root.
2. Copy `wordpress/living-chronicle/` into `wp-content/plugins/living-chronicle/`, or zip that
   directory and upload it from **Plugins → Add New → Upload Plugin**.
3. Activate **Eldric: The Living Chronicle**.
4. Add `[living_chronicle]` to a post or page.

Optional attributes: `[living_chronicle profile="family" height="720"]`. Multiple shortcodes on
one page are isolated instances. The current release uses the local authored storyteller and needs
no API key or network request.

Keyboard: WASD/arrow keys move, Shift runs, J attacks, K heavy-attacks, L blocks, Space dodges,
E interacts, I opens inventory, and Tab opens the Chronicle. Touch controls appear automatically
on coarse-pointer/mobile devices.
