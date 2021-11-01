// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */

const proxy = require("http2-proxy");

module.exports = {
  exclude: [
    "**/thinking/**",
    "**/.git/**",
    "**/package*",
    "**/node_modules/**",
  ],
  mount: {
    /* ... */
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
    hmr: true,
  },
  buildOptions: {
    out: "docs",
    /* ... */
  },
  routes: [
    {
      src: "/log",
      dest: (req, res) => {
        return proxy.web(req, res, {
          hostname: "localhost",
          port: 8055,
        });
      },
    },
  ],
};
