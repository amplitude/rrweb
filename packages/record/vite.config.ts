import path from 'path';
import config from '../../vite.config.default';

// TODO: Bundle size optimization needed
// Current bundle: ~374KB (imports entire rrweb package)
// Target bundle: ~104KB (record functionality only)
//
// Recommended solutions:
// 1. Use '@amplitude/rrweb/record' import path (requires Option 2 completion)
// 2. Extract record to standalone package with minimal dependencies
// 3. Configure build to externalize replay components

export default config(path.resolve(__dirname, 'src/index.ts'), 'rrweb');
