import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/dist/'],
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};

export default config;
