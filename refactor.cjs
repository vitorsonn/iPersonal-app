const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
files.push(path.join(__dirname, 'App.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix supabase imports
  content = content.replace(/'\.\.\/services\/supabase'/g, "'../config/supabase'");
  content = content.replace(/'\.\.\/\.\.\/services\/supabase'/g, "'../../config/supabase'");
  content = content.replace(/'\.\/src\/services\/supabase'/g, "'./src/config/supabase'");
  
  // Remove console logs
  content = content.replace(/.*console\.(log|warn|error)\(.*?\);?\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
