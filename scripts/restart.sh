#!/bin/sh

set -eu

rm -rf .nuxt .data dist .output node_modules

npm install
npm run build 
npx serve .output/public