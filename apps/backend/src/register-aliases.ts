import moduleAlias from 'module-alias';
import path from 'path';

// __dirname === /app/dist/apps/backend/apps/backend/src  (en prod)
moduleAlias.addAliases({
  '@': path.join(__dirname),
  '@suba-go/shared-validation': path.join(
    __dirname,
    '../../../libs/shared-validation' // <-- sin /src
  ),
});
