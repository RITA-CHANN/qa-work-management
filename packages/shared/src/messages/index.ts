// Every text a user can see (errors, validation, status) lives in this folder, one file per feature.
// Do not write message strings anywhere else: `npm run docs:check` fails if one is copied into apps/.
export * from './define';
export * from './common';
export * from './auth';
