import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const TRAINER_ID = 'b3cc2049-2586-46d4-a1d6-5e0371af3b51';
const STUDENT_ID = 'fd6d631f-82b8-4e6e-b007-3b63fdf5e09d';

async function testInsertTrainersStudents() {
  console.log('Inserting Carlos into trainers...');
  const { data: trainerData, error: trainerError } = await supabase
    .from('trainers')
    .insert({
      id: TRAINER_ID,
      bio: 'Especialista em hipertrofia',
      experience: '10 anos'
    })
    .select();

  if (trainerError) {
    console.error('Insert trainer failed:', trainerError.message, trainerError.details);
  } else {
    console.log('Insert trainer success! Columns:', Object.keys(trainerData[0]));
    console.log('Data:', trainerData);
  }

  console.log('Inserting Ana into students...');
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .insert({
      id: STUDENT_ID,
      objective: 'Emagrecimento',
      trainer_id: TRAINER_ID
    })
    .select();

  if (studentError) {
    console.error('Insert student failed:', studentError.message, studentError.details);
  } else {
    console.log('Insert student success! Columns:', Object.keys(studentData[0]));
    console.log('Data:', studentData);
  }
}

testInsertTrainersStudents();
