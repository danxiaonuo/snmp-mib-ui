module.exports = {
  apps: [
    {
      name: "network-monitoring-platform",
      script: "npm",
      args: "start",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max_old_space_size=4096",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],

  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "https://github.com/your-repo/network-monitoring-platform.git",
      path: "/var/www/network-monitoring-platform",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
}
