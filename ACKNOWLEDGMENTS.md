# Acknowledgments

OneRhythm is built on other people's open work. These are the projects it
depends on most, and what each one makes possible here. Each keeps its own
license; see `package.json`, `package-lock.json` and `NOTICE`.

## For the people who use it

- **Atkinson Hyperlegible**, by the Braille Institute of America. A typeface
  designed so that letters which look alike are easy to tell apart. It is
  the only typeface here, because many of the people this is for read with
  low vision.
- **axe-core**, by Deque Systems. Checks the rendered screens for
  accessibility problems in the test suite.
- **eslint-plugin-jsx-a11y.** Catches accessibility mistakes in the code
  before it runs.

## The app

- **Expo** and **Expo Router.** One codebase for iPhone, Android and the web,
  with routes that follow the files.
- **React** and **React Native.** The way every screen is built.
- **React Native Web.** Lets the same screens run in a browser, which is
  where the landing page lives today.
- **react-native-svg.** Draws the 1R mark and the wordmark.
- **react-native-safe-area-context** and **AsyncStorage.** Keep content clear
  of a phone's notch and edges, and remember a member's sign-in on their own
  device.
- **NativeWind** and **Tailwind CSS.** Part of the build's styling setup
  (ADR 0002). Most screens today use plain style sheets built from the colour
  tokens.
- **TypeScript.** Types that catch mistakes before they reach anyone.

## The data

- **Supabase.** Sign-in, the database API and row-level security, in one
  open-source stack that also runs on a laptop.
- **PostgreSQL.** The database. Most of the rules that matter most here are
  enforced inside it, not just in the app.
- **pgTAP.** Tests those database rules directly: no downvote can exist, one
  equal vote per member, consent before health data, and deletion that
  reaches everything.

## Testing and checks

- **Jest.** Runs the test suites.
- **Testing Library** (DOM, jest-dom and React Native). Tests screens the way a
  person uses them: by what they can read and press.
- **ESLint.** Keeps the code consistent.
- **Gitleaks.** Scans the code and its history for secrets before a release.

## Serving the landing page

- **Caddy.** The small web server in the landing page's container. It sends
  the security headers and serves the files.
- **Node.js** and **Docker.** Build the site the same way on a laptop, in CI
  and on the host.

---

Thank you to everyone who maintains these. If we have left out a project we
depend on, please open an issue and we will add it.
