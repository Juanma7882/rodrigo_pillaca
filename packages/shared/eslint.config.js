import globals from 'globals';
import base from '@tamila/config/eslint/base';

export default [...base, { languageOptions: { globals: globals.node } }];
