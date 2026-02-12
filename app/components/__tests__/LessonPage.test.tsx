import { render, screen } from '@testing-library/react';
import { LessonPage } from '../LessonPage';
import { CHORDS_101 } from '@/lib/lessons/Chords101';

// Mock the useAudioEngineContext hook
jest.mock('@/app/providers/AudioEngineProvider', () => ({
  useAudioEngineContext: () => ({
    isReady: true,
    isLoading: false,
    initAudio: jest.fn(),
    noteOn: jest.fn(),
    noteOff: jest.fn(),
  }),
}));

// Mock the useMidi hook
jest.mock('@/hooks/useMidi', () => ({
  useMidi: () => ({
    status: 'granted',
    devices: [{ id: '1', name: 'Test Keyboard' }],
  }),
}));

// Mock the useLesson hook
jest.mock('@/hooks/useLesson', () => ({
  useLesson: jest.fn(() => ({
    state: {
      hasStarted: false,
      status: 'showing',
    },
    progress: { current: 1, total: 4 },
    highlightedNotes: [],
    instructionText: 'Test instruction',
    evaluationResult: null,
    startLesson: jest.fn(),
    playExampleChord: jest.fn(),
    startListening: jest.fn(),
    handleEvaluation: jest.fn(),
  })),
}));

describe('LessonPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders lesson page without crashing', () => {
    render(<LessonPage lesson={CHORDS_101} />);
    
    expect(screen.getByText('Lesson Mode')).toBeInTheDocument();
    expect(screen.getByText('Chords 101')).toBeInTheDocument();
    expect(screen.getByText('Interactive chord training with real-time feedback.')).toBeInTheDocument();
  });

  it('shows start lesson button when lesson has not started', () => {
    render(<LessonPage lesson={CHORDS_101} />);
    
    expect(screen.getByRole('button', { name: 'Start Lesson' })).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    render(<LessonPage lesson={CHORDS_101} />);
    
    expect(screen.getByText('Cortina')).toBeInTheDocument();
    expect(screen.getByText('Audio ready')).toBeInTheDocument();
    expect(screen.getByText('MIDI granted')).toBeInTheDocument();
    expect(screen.getByText('Devices 1')).toBeInTheDocument();
  });

  it('renders piano keyboard', () => {
    render(<LessonPage lesson={CHORDS_101} />);
    
    // Piano keyboard should be present (we can test for some basic structure)
    const pianoContainer = document.querySelector('[role="group"][aria-label="Piano keyboard"]');
    expect(pianoContainer).toBeInTheDocument();
  });

  it('shows lesson content area', () => {
    render(<LessonPage lesson={CHORDS_101} />);
    
    // Should show the lesson pane area
    expect(screen.getByText('Test instruction')).toBeInTheDocument();
  });
});