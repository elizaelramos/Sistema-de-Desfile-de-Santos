// PM2: pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "desfile",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: 3100 },
      max_memory_restart: "400M",
    },
  ],
};
