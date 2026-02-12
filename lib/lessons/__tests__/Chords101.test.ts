import { CHORDS_101 } from '../Chords101';
import { CHORDS } from '../../music/chords';

describe('Chords101', () => {
  it('has correct lesson metadata', () => {
    expect(CHORDS_101.id).toBe('chords-101');
    expect(CHORDS_101.title).toBe('Chords 101');
    expect(CHORDS_101.description).toBe('Learn the I-V-vi-IV progression in C major');
  });

  it('has exactly 4 tasks', () => {
    expect(CHORDS_101.tasks).toHaveLength(4);
  });

  it('follows I-V-vi-IV progression in C major', () => {
    const tasks = CHORDS_101.tasks;
    
    // Task 1: C major (I)
    expect(tasks[0].chord).toEqual(CHORDS.C_MAJOR);
    expect(tasks[0].instruction).toContain('C major chord');
    
    // Task 2: G major (V)
    expect(tasks[1].chord).toEqual(CHORDS.G_MAJOR);
    expect(tasks[1].instruction).toContain('G major chord');
    
    // Task 3: A minor (vi)
    expect(tasks[2].chord).toEqual(CHORDS.A_MINOR);
    expect(tasks[2].instruction).toContain('A minor chord');
    
    // Task 4: F major (IV)
    expect(tasks[3].chord).toEqual(CHORDS.F_MAJOR);
    expect(tasks[3].instruction).toContain('F major chord');
  });

  it('has proper task structure', () => {
    CHORDS_101.tasks.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.id).toMatch(/^task-\d+$/);
      
      expect(task.instruction).toBeDefined();
      expect(typeof task.instruction).toBe('string');
      expect(task.instruction.length).toBeGreaterThan(0);
      
      expect(task.chord).toBeDefined();
      expect(Array.isArray(task.chord.notes)).toBe(true);
      expect(task.chord.notes).toHaveLength(3);
      
      expect(task.onIncorrect).toBeDefined();
      expect(typeof task.onIncorrect).toBe('string');
      expect(task.onIncorrect.length).toBeGreaterThan(0);
    });
  });

  it('has appropriate feedback messages', () => {
    const tasks = CHORDS_101.tasks;
    
    // Each task should have a different retry message
    const messages = tasks.map(task => task.onIncorrect);
    const uniqueMessages = [...new Set(messages)];
    expect(uniqueMessages).toHaveLength(4);
    
    // All messages should be encouraging but clear
    messages.forEach(message => {
      expect(message).toMatch(/(try|again|almost|not quite|there)/i);
      expect(message.length).toBeLessThan(100); // Keep it concise
    });
  });

  it('uses chords positioned in middle of keyboard', () => {
    CHORDS_101.tasks.forEach(task => {
      task.chord.notes.forEach(midiNote => {
        // Notes should be in reasonable range for visibility (48-84 ~ C3-C6)
        expect(midiNote).toBeGreaterThanOrEqual(48);
        expect(midiNote).toBeLessThanOrEqual(84);
      });
    });
  });

  it('has progressive instruction flow', () => {
    const tasks = CHORDS_101.tasks;
    
    // First task - learning focus
    expect(tasks[0].instruction).toContain('Learning');
    
    // Subsequent tasks - progression indicators
    expect(tasks[1].instruction).toContain('Great!');
    expect(tasks[2].instruction).toContain('Excellent!');
    expect(tasks[3].instruction).toContain('Perfect!');
  });

  it('matches the exact progression specified in requirements', () => {
    const expectedProgression = [
      { chord: CHORDS.C_MAJOR, description: 'I (C major)' },
      { chord: CHORDS.G_MAJOR, description: 'V (G major)' },
      { chord: CHORDS.A_MINOR, description: 'vi (A minor)' },
      { chord: CHORDS.F_MAJOR, description: 'IV (F major)' }
    ];
    
    CHORDS_101.tasks.forEach((task, index) => {
      const expected = expectedProgression[index];
      expect(task.chord).toEqual(expected.chord);
    });
  });
});