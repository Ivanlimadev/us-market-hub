module.exports = {
  apps: [{
    name: 'us-market-hub',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/us-market-hub',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
