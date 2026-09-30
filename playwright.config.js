import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 timeout:180000,
 expect:{timeout:10000},
 fullyParallel:false,
 workers:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{args:['--no-sandbox']}},
 projects:[
  {name:'desktop',use:{viewport:{width:1440,height:1000}}},
  {name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}
 ],
 // Exercise the same compiled assets used on GitHub Pages, not the dev server.
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});
