const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const controllersDir = path.join(__dirname, 'controllers');
const routesDir = path.join(__dirname, 'routes');
const middlewareDir = path.join(__dirname, 'middleware');

function migrateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace const { X } = require('Y')
    content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])(.*?)\2\);?/g, (match, vars, quote, mod) => {
        if (mod.startsWith('.') && !mod.endsWith('.js')) {
            mod += '.js';
        }
        return `import { ${vars.trim()} } from '${mod}';`;
    });

    // Replace const X = require('Y')
    content = content.replace(/const\s+([\w]+)\s*=\s*require\((['"])(.*?)\2\);?/g, (match, vars, quote, mod) => {
        if (mod.startsWith('.') && !mod.endsWith('.js')) {
            mod += '.js';
        }
        if (mod.includes('Controller')) {
            return `import * as ${vars} from '${mod}';`;
        }
        return `import ${vars} from '${mod}';`;
    });

    // Replace module.exports = X
    content = content.replace(/module\.exports\s*=\s*/g, 'export default ');

    // Replace exports.X = Y
    content = content.replace(/exports\.([\w]+)\s*=\s*/g, 'export const $1 = ');

    fs.writeFileSync(filePath, content, 'utf8');
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.js')) {
            migrateFile(path.join(dir, file));
        }
    }
}

processDir(modelsDir);
processDir(controllersDir);
processDir(routesDir);
processDir(middlewareDir);

console.log('Migration complete');
