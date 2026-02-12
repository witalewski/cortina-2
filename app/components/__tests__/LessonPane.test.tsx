import { render, screen, fireEvent } from '@testing-library/react';
import { LessonPane } from '../LessonPane';
import { LessonStatus } from '@/lib/lessons/Lesson';

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('LessonPane', () => {
  const defaultProps = {
    lessonTitle: 'Test Lesson',
    instruction: 'Play a C major chord',
    taskNumber: 1,
    totalTasks: 4,
    status: 'showing' as LessonStatus,
    onPlayExample: jest.fn(),
    onStartListening: jest.fn(),
    evaluationResult: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders lesson title and progress', () => {
    render(<LessonPane {...defaultProps} />);
    
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
    expect(screen.getByText('Task 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hear Example/ })).toBeInTheDocument();
  });

  it('shows correct instruction text', () => {
    render(<LessonPane {...defaultProps} instruction="Play a G major chord" />);
    
    expect(screen.getByText('Play a G major chord')).toBeInTheDocument();
  });

  it('shows correct badge for incomplete lesson', () => {
    render(<LessonPane {...defaultProps} />);
    
    expect(screen.getByText('Task 1/4')).toBeInTheDocument();
    expect(screen.queryByText('Complete!')).not.toBeInTheDocument();
  });

  it('shows complete state correctly', () => {
    const completeProps = {
      ...defaultProps,
      status: 'complete' as LessonStatus,
      taskNumber: 4,
    };
    
    render(<LessonPane {...completeProps} />);
    
    expect(screen.getByText('Complete!')).toBeInTheDocument();
    expect(screen.getByText('Start New Lesson')).toBeInTheDocument();
    expect(screen.queryByText('Hear Example')).not.toBeInTheDocument();
  });

  it('shows listening state correctly', () => {
    const listeningProps = {
      ...defaultProps,
      status: 'listening' as LessonStatus,
    };
    
    render(<LessonPane {...listeningProps} />);
    
    expect(screen.getByText('Listening...')).toBeInTheDocument();
    expect(screen.queryByText('Start Playing')).not.toBeInTheDocument();
  });

  it('shows evaluating state correctly', () => {
    const evaluatingProps = {
      ...defaultProps,
      status: 'evaluating' as LessonStatus,
    };
    
    render(<LessonPane {...evaluatingProps} />);
    
    expect(screen.getByText('Evaluating...')).toBeInTheDocument();
    expect(screen.queryByText('Hear Example')).toBeDisabled();
  });

  it('calls onPlayExample when Hear Example button is clicked', () => {
    render(<LessonPane {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Hear Example/ }));
    
    expect(defaultProps.onPlayExample).toHaveBeenCalledTimes(1);
  });

  it('calls onStartListening when Start Playing button is clicked', () => {
    render(<LessonPane {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Start Playing/ }));
    
    expect(defaultProps.onStartListening).toHaveBeenCalledTimes(1);
  });

  it('shows correct evaluation result for correct answer', () => {
    const correctProps = {
      ...defaultProps,
      evaluationResult: {
        isCorrect: true,
        message: 'Excellent! You got it right.',
        shouldAdvance: true,
      },
    };
    
    render(<LessonPane {...correctProps} />);
    
    expect(screen.getByText('Excellent! You got it right.')).toBeInTheDocument();
    expect(screen.getByText('Start New Lesson')).toBeInTheDocument();
    
    // Should be in green styling
    const resultDiv = screen.getByText('Excellent! You got it right.').closest('div');
    expect(resultDiv).toHaveClass('border-green-200', 'bg-green-50', 'text-green-800');
  });

  it('shows correct evaluation result for incorrect answer', () => {
    const incorrectProps = {
      ...defaultProps,
      evaluationResult: {
        isCorrect: false,
        message: 'Try again',
        shouldAdvance: false,
      },
    };
    
    render(<LessonPane {...incorrectProps} />);
    
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    // Should be in orange styling
    const resultDiv = screen.getByText('Try again').closest('div');
    expect(resultDiv).toHaveClass('border-orange-200', 'bg-orange-50', 'text-orange-800');
  });

  it('shows appropriate help text for different statuses', () => {
    // Showing status
    const { rerender } = render(<LessonPane {...defaultProps} status="showing" />);
    expect(screen.getByText(/Listen to example chord/)).toBeInTheDocument();
    
    // Listening status
    rerender(<LessonPane {...defaultProps} status="listening" />);
    expect(screen.getByText(/Play exactly 3 notes/)).toBeInTheDocument();
    
    // Evaluating status
    rerender(<LessonPane {...defaultProps} status="evaluating" />);
    expect(screen.getByText(/Checking your answer/)).toBeInTheDocument();
  });

  it('reloads page when Start New Lesson is clicked from complete state', () => {
    const completeProps = {
      ...defaultProps,
      status: 'complete' as LessonStatus,
    };
    
    render(<LessonPane {...completeProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Start New Lesson' }));
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('reloads page when Start New Lesson is clicked after correct answer', () => {
    const correctProps = {
      ...defaultProps,
      evaluationResult: {
        isCorrect: true,
        message: 'Excellent!',
        shouldAdvance: true,
      },
    };
    
    render(<LessonPane {...correctProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Start New Lesson' }));
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('calls onStartListening when Try Again is clicked after incorrect answer', () => {
    const incorrectProps = {
      ...defaultProps,
      evaluationResult: {
        isCorrect: false,
        message: 'Try again',
        shouldAdvance: false,
      },
    };
    
    render(<LessonPane {...incorrectProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    
    expect(defaultProps.onStartListening).toHaveBeenCalledTimes(1);
  });

  it('disables buttons during evaluation', () => {
    const evaluatingProps = {
      ...defaultProps,
      status: 'evaluating' as LessonStatus,
    };
    
    render(<LessonPane {...evaluatingProps} />);
    
    expect(screen.getByRole('button', { name: /Hear Example/ })).toBeDisabled();
    expect(screen.queryByText('Start Playing')).not.toBeInTheDocument();
  });

  it('shows completion celebration message', () => {
    const completeProps = {
      ...defaultProps,
      status: 'complete' as LessonStatus,
    };
    
    render(<LessonPane {...completeProps} />);
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Excellent! You\'ve completed lesson!')).toBeInTheDocument();
    expect(screen.getByText(/You've mastered the I-V-vi-IV chord progression/)).toBeInTheDocument();
  });
});