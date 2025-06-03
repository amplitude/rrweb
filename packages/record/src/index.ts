// Currently imports from the full rrweb package, causing large bundle size (373KB)
// This should be optimized to only import record functionality
import { record } from '@amplitude/rrweb';

export { record };
