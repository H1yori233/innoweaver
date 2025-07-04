pnpm pm2 delete 0
pnpm pm2 save --force
pnpm pm2 start npm --name "chi2025" -- start
pnpm pm2 save --force