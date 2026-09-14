const fs = require('fs');
const path = require('path');

const permPath = path.join(__dirname, 'src', 'components', 'layout', 'PermissionMiddleware.tsx');
let permContent = fs.readFileSync(permPath, 'utf8');

permContent = permContent.replace(/switch \(currentRole\) \{[\s\S]*?\}/, `switch (currentRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/workspace" replace />;
    }`);

fs.writeFileSync(permPath, permContent);
