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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Remove import { MOCK_... }
  content = content.replace(/import\s+\{\s*MOCK_[^}]+\}\s+from\s+['"]\.\.\/(\.\.\/)?data\/mockData['"];?\n?/g, '');

  // Specific replacements to prevent compiler errors
  content = content.replace(/MOCK_TRAINER\.name/g, "''");
  content = content.replace(/MOCK_TRAINER\.avatar/g, "''");
  content = content.replace(/MOCK_TRAINER\.role/g, "''");
  content = content.replace(/MOCK_TRAINER\.bio/g, "''");
  content = content.replace(/MOCK_TRAINER\.specialties/g, "[]");
  content = content.replace(/MOCK_TRAINER\.certifications/g, "[]");
  content = content.replace(/MOCK_TRAINER\.availableSlots/g, "[]");
  content = content.replace(/MOCK_TRAINER\.username/g, "''");
  content = content.replace(/MOCK_TRAINER/g, "{}");

  content = content.replace(/MOCK_CLIENT\.name/g, "''");
  content = content.replace(/MOCK_CLIENT\.avatar/g, "''");
  content = content.replace(/MOCK_CLIENT\.stats\.streak/g, "0");
  content = content.replace(/MOCK_CLIENT\.stats\.workoutsCompleted/g, "0");
  content = content.replace(/MOCK_CLIENT\.trainer\.name/g, "''");
  content = content.replace(/MOCK_CLIENT\.trainer\.username/g, "''");
  content = content.replace(/MOCK_CLIENT\.trainer/g, "{}");
  content = content.replace(/MOCK_CLIENT\.upcomingClasses/g, "[]");
  content = content.replace(/MOCK_CLIENT\.workouts/g, "[]");
  content = content.replace(/MOCK_CLIENT\.objective/g, "''");
  content = content.replace(/MOCK_CLIENT/g, "{}");

  content = content.replace(/MOCK_APPOINTMENTS\.map/g, "[].map");
  content = content.replace(/MOCK_APPOINTMENTS\.find/g, "[].find");
  content = content.replace(/MOCK_APPOINTMENTS\.splice/g, "[].splice");
  content = content.replace(/MOCK_APPOINTMENTS\.push/g, "[].push");
  content = content.replace(/MOCK_APPOINTMENTS/g, "[]");

  content = content.replace(/MOCK_STUDENTS/g, "[]");

  // Remove offline mock block in ClientBookingPage
  if (file.includes('ClientBookingPage.tsx')) {
    const offlineBlock = `} else if (selectedSlotData) {
      // Offline/Mock mode
      const newAptId = \`mock-a-\${Date.now()}\`;
      
      // Remove old pending/scheduled appointments from mock lists
      const oldAptsIdxs = [].map((a, i) => 
        (a.clientName === '' && (a.status === 'pending' || a.status === 'scheduled' || a.status === 'PENDENTE')) ? i : -1
      ).filter(i => i !== -1);
      
      for (let i = oldAptsIdxs.length - 1; i >= 0; i--) {
        [].splice(oldAptsIdxs[i], 1);
      }

      [].upcomingClasses = [].filter(c => 
        c.status !== 'pending' && c.status !== 'scheduled' && c.status !== 'PENDENTE'
      );

      [].push({
        id: newAptId,
        clientName: '',
        date: selectedSlotData.date,
        time: selectedSlotData.time,
        status: 'pending',
        objective: objective,
      });

      [].unshift({
        id: newAptId,
        date: selectedSlotData.date,
        time: selectedSlotData.time,
        status: 'pending',
        trainerName: trainer.name,
      });
    }`;
    content = content.replace(offlineBlock, '}');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Removed mocks from ${file}`);
  }
});
