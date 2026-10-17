# hsmmoj.github.io

Personal academic website of Hesam Mojtahedi. It's plain HTML, CSS and JS with no build step.

- `index.html`: all of the page content.
- `assets/css/style.css`: styles. The colors are set as tokens at the top of the file.
- `assets/js/robot.js`: the dual-arm robot animation at the top of the page. Add `?robot_t=4.2` to the URL to freeze a pose.
- `assets/img/`: profile photo, robot photos and publication thumbnails.
- CV: the links currently show a "coming soon" message. To publish it, add `assets/papers/cv.pdf` and point the `.cv-soon` links at it.

Preview it locally with `python3 -m http.server`, then open http://localhost:8000.
