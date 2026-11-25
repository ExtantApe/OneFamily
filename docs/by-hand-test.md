# By-hand test before the first release (K410)

For the owner. Nothing in this list has been run. It covers what the automated tests can't reach: the native parts of the Mac app and the extension inside Chrome. Use the made-up demo family and a throwaway library folder. Don't point it at a real kit file.

Before you start: build the app from the release commit, and keep notes of anything that looks wrong, with a screenshot. Write what you saw, not what you expected.

## A. Install and open

1. Download the `.dmg` from the draft GitHub Release (not the repo) and open it.
2. Drag OneFamily to Applications.
3. Open it once. macOS will refuse. This is expected, because the app isn't notarized.
4. Open System Settings > Privacy & Security, scroll down, click **Open Anyway**, and click **Open** when the warning comes back.
5. Quit the app. Run `xattr -dr com.apple.quarantine "/Applications/OneFamily.app"` in Terminal, then open it again. It should open with no warning.
6. Check the window title, the menu-bar name and the toolbar mark all say OneFamily, and that the mark is readable in light and dark appearance (Settings > Appearance).

## B. First launch

1. Choose a new empty folder in a throwaway place as the library. Step 1 of 3 should end.
2. On step 2, check there are four kinds of use and none for law enforcement. Choose one and record it.
3. On step 3, add two backup destinations, each a different folder. Check the "same disk" warnings appear when they should.
4. Quit and reopen mid-way (after step 1, then after step 2). Each time it should resume at the right step.

## C. Backups and the Keychain

1. Add a folder inside iCloud Drive or Dropbox as a destination. The app should say copies there are encrypted with a key in the Keychain.
2. Click **Back up everywhere**. Each destination should report files copied and checked.
3. Open Keychain Access, search "OneFamily backup key". There should be one item. Check which apps it lists under Access Control. Write down what you see.
4. On the Backups screen, find **Backup key** and click **Show a recovery copy**. A key in groups of four with a six-character check should appear. Click **Hide it** and check it disappears.
5. Check the copy isn't in the library folder, the decisions log or the clipboard (paste somewhere harmless).
6. When done, delete the "OneFamily backup key" item in Keychain Access and the throwaway folders.

## D. The demo family

1. Open the demo family. Check the badge says made-up.
2. Visit Matches, Kits, Chromosomes, Theory and GEDmatch. Each should load without an error box.
3. Turn Privacy on (toolbar, then Cmd+Shift+P). Names in every view should change, and change back.
4. On Kits, find the genetic map card. Click it only if you're happy to download about 24 MB. It should name the source and ask first. Say no once, and check nothing downloads.

## E. Notifications and menus

1. When work is due in the demo, a macOS notification with counts only should show, at most once a day. macOS will ask for permission first.
2. Check the View > Privacy menu item toggles privacy.
3. Check the folder picker opens from every "Choose…" button.

## F. Chrome extension (mock site only)

1. Build the extension and the mock site (README, Commands). Start the mock site.
2. Load the extension unpacked in Chrome, and trust its developer ID on the app's Extension screen.
3. Start a collection from the extension. The app should ask. Try Deny, then Allow once.
4. Check the page visits are slow, one at a time, and stop at the mock site's challenge page.
5. Check the extension stores nothing (no local storage entries) and that the grant shows in the app with **End now**.

## G. Close down

1. Quit the app. Check no OneFamily process is left running (`pgrep -fl OneFamily`).
2. Remove the throwaway library, backup folders and the Keychain item.

Anything that fails goes back as a task, with the step number.
