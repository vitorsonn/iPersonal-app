export const MOCK_TRAINER = {
  id: 't1',
  username: 'carlos-silva',
  name: 'Carlos Silva',
  role: 'Personal Trainer & Coach',
  avatar: 'https://images.unsplash.com/photo-1754475118668-64ac3f3b2559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwcGVyc29uYWwlMjB0cmFpbmVyJTIwcG9ydHJhaXQlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3ODEzNjM1ODR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  bio: 'Especialista em hipertrofia e emagrecimento com mais de 10 anos de experiência transformando vidas.',
  specialties: ['Hipertrofia', 'Emagrecimento', 'Treino Funcional'],
  certifications: ['CREF 012345-G/SP', 'CrossFit Level 1', 'Biomecânica Avançada'],
  experience: '10 anos',
  availableSlots: [
    { id: 's1', date: '2026-06-15', time: '08:00' },
    { id: 's2', date: '2026-06-15', time: '09:00' },
    { id: 's3', date: '2026-06-15', time: '18:00' },
    { id: 's4', date: '2026-06-16', time: '07:00' },
    { id: 's5', date: '2026-06-16', time: '10:00' },
  ]
};

export const MOCK_STUDENTS = [
  { id: 'st1', name: 'Ana Souza', email: 'ana@email.com', objective: 'Emagrecimento', status: 'active', since: 'Jan 2026', streak: 12, nextClass: 'Hoje, 08:00', initials: 'AS' },
  { id: 'st2', name: 'Bruno Costa', email: 'bruno@email.com', objective: 'Hipertrofia', status: 'active', since: 'Fev 2026', streak: 8, nextClass: 'Hoje, 09:00', initials: 'BC' },
  { id: 'st3', name: 'Camila Lima', email: 'camila@email.com', objective: 'Condicionamento', status: 'active', since: 'Mar 2026', streak: 5, nextClass: 'Amanhã, 18:00', initials: 'CL' },
  { id: 'st4', name: 'Diego Ferreira', email: 'diego@email.com', objective: 'Hipertrofia', status: 'active', since: 'Jan 2026', streak: 20, nextClass: 'Ter, 07:00', initials: 'DF' },
  { id: 'st5', name: 'Elena Martins', email: 'elena@email.com', objective: 'Emagrecimento', status: 'active', since: 'Abr 2026', streak: 3, nextClass: 'Qua, 10:00', initials: 'EM' },
  { id: 'st6', name: 'Felipe Rocha', email: 'felipe@email.com', objective: 'Funcional', status: 'active', since: 'Jan 2026', streak: 15, nextClass: 'Qui, 08:00', initials: 'FR' },
  { id: 'st7', name: 'Gabriela Nunes', email: 'gabi@email.com', objective: 'Condicionamento', status: 'active', since: 'Mai 2026', streak: 2, nextClass: 'Sex, 17:00', initials: 'GN' },
  { id: 'st8', name: 'Henrique Alves', email: 'henrique@email.com', objective: 'Hipertrofia', status: 'active', since: 'Fev 2026', streak: 9, nextClass: 'Seg, 06:00', initials: 'HA' },
  { id: 'st9', name: 'Isabela Ramos', email: 'isa@email.com', objective: 'Emagrecimento', status: 'active', since: 'Mar 2026', streak: 6, nextClass: 'Ter, 09:00', initials: 'IR' },
  { id: 'st10', name: 'João Pedro', email: 'joao@email.com', objective: 'Funcional', status: 'active', since: 'Jan 2026', streak: 18, nextClass: 'Qua, 08:00', initials: 'JP' },
  { id: 'st11', name: 'Karen Dias', email: 'karen@email.com', objective: 'Condicionamento', status: 'active', since: 'Abr 2026', streak: 4, nextClass: 'Qui, 07:30', initials: 'KD' },
  { id: 'st12', name: 'Lucas Mendes', email: 'lucas@email.com', objective: 'Hipertrofia', status: 'active', since: 'Jan 2026', streak: 22, nextClass: 'Sex, 06:30', initials: 'LM' },
  { id: 'st13', name: 'Mariana Vieira', email: 'mari@email.com', objective: 'Emagrecimento', status: 'active', since: 'Mai 2026', streak: 1, nextClass: 'Seg, 10:00', initials: 'MV' },
  { id: 'st14', name: 'Nathan Oliveira', email: 'nathan@email.com', objective: 'Funcional', status: 'active', since: 'Fev 2026', streak: 11, nextClass: 'Ter, 18:00', initials: 'NO' },
  { id: 'st15', name: 'Olivia Carvalho', email: 'olivia@email.com', objective: 'Condicionamento', status: 'active', since: 'Mar 2026', streak: 7, nextClass: 'Qua, 07:00', initials: 'OC' },
  { id: 'st16', name: 'Paulo Santos', email: 'paulo@email.com', objective: 'Hipertrofia', status: 'active', since: 'Jan 2026', streak: 30, nextClass: 'Qui, 06:00', initials: 'PS' },
  { id: 'st17', name: 'Quésia Pinto', email: 'quesia@email.com', objective: 'Emagrecimento', status: 'active', since: 'Jun 2026', streak: 1, nextClass: 'Sex, 09:00', initials: 'QP' },
  { id: 'st18', name: 'Rafael Cunha', email: 'rafael@email.com', objective: 'Funcional', status: 'active', since: 'Abr 2026', streak: 5, nextClass: 'Seg, 08:30', initials: 'RC' },
  { id: 'st19', name: 'Sabrina Freitas', email: 'sabrina@email.com', objective: 'Condicionamento', status: 'active', since: 'Fev 2026', streak: 14, nextClass: 'Ter, 07:00', initials: 'SF' },
  { id: 'st20', name: 'Thiago Lopes', email: 'thiago@email.com', objective: 'Hipertrofia', status: 'active', since: 'Mar 2026', streak: 10, nextClass: 'Qua, 18:30', initials: 'TL' },
  { id: 'st21', name: 'Ursula Melo', email: 'ursula@email.com', objective: 'Emagrecimento', status: 'active', since: 'Jan 2026', streak: 16, nextClass: 'Qui, 09:00', initials: 'UM' },
  { id: 'st22', name: 'Victor Azevedo', email: 'victor@email.com', objective: 'Funcional', status: 'active', since: 'Mai 2026', streak: 2, nextClass: 'Sex, 07:00', initials: 'VA' },
  { id: 'st23', name: 'Wanda Sousa', email: 'wanda@email.com', objective: 'Condicionamento', status: 'active', since: 'Mar 2026', streak: 8, nextClass: 'Seg, 09:00', initials: 'WS' },
  { id: 'st24', name: 'Xande Ribeiro', email: 'xande@email.com', objective: 'Hipertrofia', status: 'active', since: 'Fev 2026', streak: 13, nextClass: 'Ter, 06:30', initials: 'XR' },
];

export const MOCK_APPOINTMENTS = [
  { id: 'a1', clientName: 'Ana Souza', date: 'Hoje', time: '08:00', status: 'confirmed', objective: 'Emagrecimento' },
  { id: 'a2', clientName: 'Bruno Costa', date: 'Hoje', time: '09:00', status: 'pending', objective: 'Hipertrofia' },
  { id: 'a3', clientName: 'Camila Lima', date: 'Amanhã', time: '18:00', status: 'confirmed', objective: 'Condicionamento' },
  { id: 'a4', clientName: 'Diego Ferreira', date: 'Amanhã', time: '07:00', status: 'confirmed', objective: 'Hipertrofia' },
  { id: 'a5', clientName: 'Elena Martins', date: '18 Jun', time: '10:00', status: 'pending', objective: 'Emagrecimento' },
];

export const MOCK_CLIENT = {
  id: 'c1',
  name: 'Ana Souza',
  email: 'ana@email.com',
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3ODEzNjM1ODR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  objective: 'Emagrecimento',
  trainer: MOCK_TRAINER,
  upcomingClasses: [
    { id: 'a1', date: 'Hoje', time: '08:00', status: 'confirmed', trainerName: 'Carlos Silva' },
    { id: 'a4', date: '15 Jun', time: '08:00', status: 'confirmed', trainerName: 'Carlos Silva' }
  ],
  workouts: [
    {
      id: 'w1',
      title: 'Treino A - Membros Inferiores',
      duration: '45 min',
      level: 'Intermediário',
      exercises: [
        { name: 'Agachamento Livre', sets: 4, reps: '10-12' },
        { name: 'Leg Press 45', sets: 3, reps: '12-15' },
        { name: 'Cadeira Extensora', sets: 3, reps: '15' }
      ]
    },
    {
      id: 'w2',
      title: 'Treino B - Membros Superiores',
      duration: '40 min',
      level: 'Intermediário',
      exercises: [
        { name: 'Supino Reto', sets: 3, reps: '10-12' },
        { name: 'Puxada Frontal', sets: 3, reps: '12' },
        { name: 'Elevação Lateral', sets: 4, reps: '15' }
      ]
    }
  ],
  stats: {
    workoutsCompleted: 24,
    weightLost: '4.5 kg',
    streak: 3
  }
};
