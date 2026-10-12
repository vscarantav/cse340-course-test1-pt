#!/usr/bin/env node
// find-pnpm-global-bin.mjs
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const getGlobalBinDir = () => {
    try {
        return execSync('pnpm bin -g', { encoding: 'utf8' }).trim();
    } catch {
        return null;
    }
};

const verifyDir = (dir) => {
    if (!dir || !existsSync(dir)) {
        return false;
    }
    try {
        const files = readdirSync(dir);
        return files.some((f) => {
            return ['pnpm', 'node', 'npx'].some((bin) => { return f.toLowerCase().startsWith(bin); }
            );
        }
        );
    } catch {
        return false;
    }

const main = () => {
    const dir = getGlobalBinDir();
    if (verifyDir(dir)) {
        console.log('✅ Found PNPM global bin directory:');
        console.log(dir);
        console.log('\n👉 Add this directory to your PATH environment variable.');
    } else {
        console.error('❌ Could not find a valid PNPM global bin directory.');
        console.error('Make sure pnpm is installed correctly.');
    }
};

main();
