import containersAndBasics from './01-04.js';
import controllersAndConfiguration from './05-08.js';
import healthStorageAndJobs from './09-12.js';
import operationsAndPlatform from './13-16.js';

// Stable numeric IDs match curriculum/progress IDs. No command-based generated fallback:
// every lesson must have its own narrative; tests enforce complete, unique coverage.
export const guideGroups = [
  containersAndBasics,
  controllersAndConfiguration,
  healthStorageAndJobs,
  operationsAndPlatform,
];
export const guides = Object.freeze(Object.assign({}, ...guideGroups));
