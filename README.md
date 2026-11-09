# Twitter Politics Filter

A Chrome extension that marks a tweet as blocked when a Gemini model says it breaks a written policy. Built in November 2024, last changed in January 2025, retired since. Kept as a record and not maintained.

Despite the name, the policy that shipped is mostly about engagement bait, viral trends and clickbait. Politics was where it started.

## How it works

- `content.js` watches x.com and twitter.com for tweets as they are added to the page and sends each tweet's text to the grader.
- `political_analysis.js` sends that text to the Gemini API together with the policy in `grading_instructions.txt`. The model answers `blocked` or `not_blocked`.
- A blocked tweet gets a translucent red overlay reading "🚫 Content blocked". Nothing is removed from the page, and if the request fails the tweet is left alone.
- `debug_utils.js` logs each decision to the console.

Every tweet that appears costs one API call, nothing is cached, and the key sits in the extension's own files. That was acceptable for one person's browser and nothing more.

## Running it

1. Copy `config.example.json` to `config.json` and put a Gemini API key in it. `config.json` is ignored by Git.
2. Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked** and pick this folder.
3. Open x.com.

The model named in `political_analysis.js` was an experimental one at the time. Change it to a current model first.

## History

The folder was never under Git. The commits before this README were made in November 2026, one per day on which files were last modified, with that day as the author date.

The January 2025 commit is the only change after the first version: a newer model and a longer policy.

The same filtering idea was later ported into a small Mac client, [twitter-mac](https://github.com/keshavatearth/twitter-mac).
