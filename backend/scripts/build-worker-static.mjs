import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('.vercel-static', { recursive: true });
writeFileSync('.vercel-static/index.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>FoodFlow Worker</title><p>FoodFlow background worker deployment. This page does not report worker health.</p></html>');
