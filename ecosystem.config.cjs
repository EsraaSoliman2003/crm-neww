// pm2 config for the VPS. CI copies this next to the standalone server.js,
// and the deploy job runs `pm2 startOrReload ecosystem.config.cjs` from there.
module.exports = {
  apps: [
    {
      name: "crm-front",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        // Must match the port nginx proxies to on the server.
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
