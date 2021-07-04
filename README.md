<!--
ProcessScreenshots - Processes screenshots for https://dshepsis.github.io/OkamiMap
Copyright (C) 2021  ZY Sim

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
# ProcessScreenshots

This project was for processing screenshots of Okami loot that I took, along with Auride's and Ky's screenshots, both for display in the [Okami Map](https://dshepsis.github.io/OkamiMap) and long-term storage (in my Drive folder). This can basically be used for any more screenshots I take in the future, if that ever happens. (EDIT as of 23/06/2021: It _has_ happened)

## Folder Structure
- In: For my own screenshots to be processed
- Auride's/Ky's: Self-explanatory. Could delete Auride's tbh
- Out: List of processed screenshots. Like, all of em.
- CopyOver: Renamed lossy processed screenshots for site display
- OkamiLootScreenshots: Renamed lossless processed screenshots for the Drive folder

## How-to (Summarised)
1. `npm start` (`node main.js`)
1. `npm run verify` (`node verify.js`; could skip)
1. `npm run move` (`node move.js`)

## How-to (Expanded)
### 1. `npm start`
Put my shit in `In/`. From there, run `npm start`. This script:
1. Processes screenshots, depending on which function I call (read the script);
1. Writes them to `Out/`
`main.js`, which is what `npm start` calls, makes three versions of each screenshot:
1. Lossless WEBP at full HD, denoted `<filename>-FULL.webp`;
1. Lossy WEBP at 50% quality at 720p, denoted `<filename>-50.webp`;
1. Lossy JPEG at 50% quality at 720p, denoted `<filename>-50.jpeg`;

### 2. `npm run verify`
From there, run `npm run verify`. This script does a string check, comparing filenames of `In/` and `Out/` to see if `main.js` managed to process all screenshots. The string comparison isn't a direct one-to-one, as it may be obvious. It gets rid of any irrelevant prefixes and suffixes in each screenshot's full file path (relative to this folder). It'll `console.log` out shit, so read that.

### 3. `npm run move`
Not so much a `mv`, but a `cp` actually. It gets rid of the `-{50,FULL}` suffix in the processed screenshots, and moves:
- the lossless screenshots into `OkamiLootScreenshots/`;
- the lossy screenshots into `CopyOver/`;
Not the best names but wtv it's no matter.

And there you have it.
