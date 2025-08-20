import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaClock, FaQuestion, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [examData, setExamData] = useState(null);
    const [questions, setQuestions] = useState([]);
    // Removed currentQuestionIndex for continuous display
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timerActive, setTimerActive] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    useEffect(() => {
        const fetchExamData = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`/api/results/exam/${examId}/start`);
                const { exam, questions } = response.data;

                setExamData(exam);
                setQuestions(questions);

                // Set initial time (in seconds)
                const totalTime = exam.duration * 60;
                setTimeLeft(totalTime);
                setTimerActive(true);

                // Initialize answers object
                const initialAnswers = {};
                questions.forEach((q, index) => {
                    initialAnswers[q.id] = null;
                });
                setAnswers(initialAnswers);
            } catch (error) {
                console.error('Error fetching exam data:', error);
                toast.error('Failed to load exam data');
                navigate('/student/exams');
            } finally {
                setIsLoading(false);
            }
        };

        fetchExamData();
    }, [examId, navigate]);

    // Handle browser back button as exit exam
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (timerActive) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
                return e.returnValue;
            }
        };

        const handlePopState = (e) => {
            if (timerActive && !showExitConfirm) {
                e.preventDefault();
                // Push the current state back to prevent navigation
                window.history.pushState(null, '', window.location.pathname);
                // Show exit confirmation
                setShowExitConfirm(true);
            }
        };

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        // Push initial state to handle back button
        window.history.pushState(null, '', window.location.pathname);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [timerActive, showExitConfirm]);

    const handleSubmitExam = useCallback(async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Prepare answers data
            const answersData = Object.keys(answers).map(questionId => ({
                questionId: parseInt(questionId),
                selectedOption: answers[questionId]
            }));

            // Calculate time taken (initial time - remaining time)
            const initialTime = (examData?.duration || 0) * 60;
            const timeTaken = Math.max(0, initialTime - timeLeft);

            await axios.post(`/api/results/exam/${examId}/submit`, {
                answers: answersData,
                timeTaken
            });

            toast.success('Exam submitted successfully!');
            navigate('/student/results');
        } catch (error) {
            console.error('Error submitting exam:', error);
            const message = error.response?.data?.message || 'Failed to submit exam';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
            setTimerActive(false);
        }
    }, [answers, examData, examId, isSubmitting, navigate, timeLeft]);

    const handleExitExam = useCallback(async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setShowExitConfirm(false);

        try {
            // Prepare answers data (only answered questions)
            const answersData = Object.keys(answers)
                .filter(questionId => answers[questionId] !== null)
                .map(questionId => ({
                    questionId: parseInt(questionId),
                    selectedOption: answers[questionId]
                }));

            // Calculate time taken (initial time - remaining time)
            const initialTime = (examData?.duration || 0) * 60;
            const timeTaken = Math.max(0, initialTime - timeLeft);

            await axios.post(`/api/results/exam/${examId}/exit`, {
                answers: answersData,
                timeTaken
            });

            toast.success('Exam exited successfully! Results have been saved.');
            setTimerActive(false); // Stop timer to prevent back button handling
            navigate('/student/results');
        } catch (error) {
            console.error('Error exiting exam:', error);
            const message = error.response?.data?.message || 'Failed to exit exam';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, examData, examId, isSubmitting, navigate, timeLeft]);

    const handleGoBack = useCallback(() => {
        setTimerActive(false); // Stop timer to prevent back button handling
        setShowExitConfirm(false);
        navigate(-1); // Go back to previous page
    }, [navigate]);

    useEffect(() => {
        if (timerActive && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && timerActive) {
            // Time's up - auto-submit
            handleSubmitExam();
        }
    }, [timeLeft, timerActive, handleSubmitExam]);


    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId, selectedOption) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    // Navigation functions removed for continuous display


    const getQuestionStatus = (questionId) => {
        if (answers[questionId] === null) {
            return 'unanswered';
        } else {
            return 'answered';
        }
    };

    if (isLoading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span>Loading exam...</span>
            </div>
        );
    }

    if (!examData || questions.length === 0) {
        return (
            <div className="error">
                <p>No exam data available</p>
            </div>
        );
    }

    // Calculate overall progress based on answered questions
    const answeredCount = Object.values(answers).filter(answer => answer !== null).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
        <div className="take-exam">
            <div className="exam-header">
                <h1>{examData?.name || examData?.title || 'Exam'}</h1>
                <div className="exam-info">
                    <div className="time-left">
                        <FaClock /> {formatTime(timeLeft)}
                    </div>
                    <div className="question-count">
                        {answeredCount} of {questions.length} questions answered
                    </div>
                    <button
                        className="btn btn-warning btn-sm"
                        onClick={() => setShowExitConfirm(true)}
                        disabled={isSubmitting}
                        title="Exit exam early"
                    >
                        <FaSignOutAlt /> Exit Exam
                    </button>
                </div>
            </div>

            <div className="exam-progress">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="questions-container">
                {questions.map((question, index) => {
                    const questionStatus = getQuestionStatus(question.id);
                    return (
                        <div key={question.id} className="question-container" id={`question-${index + 1}`}>
                            <div className="question-header">
                                <h2>Question {index + 1}</h2>
                                <div className="question-status">
                                    <span className={`status ${questionStatus}`}>
                                        {questionStatus === 'answered' ? (
                                            <><FaCheck /> Answered</>
                                        ) : (
                                            <><FaTimes /> Unanswered</>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="question-text">
                                <FaQuestion /> {question.questionText}
                            </div>

                            <div className="options-container">
                                {['A', 'B', 'C', 'D'].map((option) => (
                                    <div
                                        key={option}
                                        className={`option ${answers[question.id] === option ? 'selected' : ''}`}
                                        onClick={() => handleAnswerSelect(question.id, option)}
                                    >
                                        <span className="option-letter">{option}.</span>
                                        <span className="option-text">{question[`option${option}`]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="exam-navigation">
                <div className="submit-section">
                    <div className="progress-info">
                        <span>Progress: {answeredCount}/{questions.length} questions answered</span>
                    </div>
                    <button
                        className="btn btn-success btn-lg"
                        onClick={handleSubmitExam}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Exit Exam</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowExitConfirm(false)}
                                disabled={isSubmitting}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>What would you like to do?</p>
                            <p><strong>Options:</strong></p>
                            <ul>
                                <li><strong>Continue Exam:</strong> Stay on this page and continue</li>
                                <li><strong>Go Back:</strong> Leave without saving (lose all progress)</li>
                                <li><strong>Exit & Submit:</strong> Save current answers and submit exam</li>
                            </ul>
                            <p><strong>Time remaining:</strong> {formatTime(timeLeft)}</p>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowExitConfirm(false)}
                                disabled={isSubmitting}
                            >
                                Continue Exam
                            </button>
                            <button 
                                className="btn btn-warning" 
                                onClick={handleGoBack}
                                disabled={isSubmitting}
                            >
                                Go Back
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleExitExam}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Exiting...' : 'Exit & Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeExam;