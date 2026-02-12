/**
 * Chords 101 - I-V-vi-IV progression in C major
 * First lesson template: show and repeat chords
 */

import { Lesson } from './Lesson';
import { CHORDS } from '../music/chords';

export const CHORDS_101: Lesson = {
  id: 'chords-101',
  title: 'Chords 101',
  description: 'Learn the I-V-vi-IV progression in C major',
  tasks: [
    {
      id: 'task-1',
      instruction: 'Learning chords: play a C major chord',
      chord: CHORDS.C_MAJOR,
      onIncorrect: "This wasn't quite right, shall we try again?"
    },
    {
      id: 'task-2', 
      instruction: 'Great! Now play a G major chord',
      chord: CHORDS.G_MAJOR,
      onIncorrect: "Not quite. Let's try that G major chord again."
    },
    {
      id: 'task-3',
      instruction: 'Excellent! Now play an A minor chord', 
      chord: CHORDS.A_MINOR,
      onIncorrect: "Almost there. Let's try the A minor chord again."
    },
    {
      id: 'task-4',
      instruction: 'Perfect! Finally, play an F major chord',
      chord: CHORDS.F_MAJOR,
      onIncorrect: "One last time. Let's try the F major chord again."
    }
  ]
};