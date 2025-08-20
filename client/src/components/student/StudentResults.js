import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaChartBar, FaCheck, FaTimes, FaClock, FaQuestionCircle } from 'react-icons/fa';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);
    const [resultDetails, setResultDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await axios.get('/api/results/my-results');
            // Ensure results is always an array
            const resultsData = response.data;
            if (Array.isArray(resultsData)) {
                setResults(resultsData);
            } else if (resultsData && Array.isArray(resultsData.results)) {
                setResults(resultsData.results);
            } else {
                console.warn('Results data is not an array:', resultsData);
                setResults([]);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to fetch results');
            setResults([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchResultDetails = async (resultId) => {
        setLoadingDetails(true);
        try {
            const response = await axios.get(`/api/results/${resultId}`);
            setResultDetails(response.data);
        } catch (error) {
            console.error('Error fetching result details:', error);
            toast.error('Failed to fetch result details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewDetails = (result) => {
        setSelectedResult(result);
        fetchResultDetails(result.id);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const getStatusIcon = (isPassed) => {
        return isPassed ? 
            <FaCheck style={{ color: '#10b981' }} /> : 
            <FaTimes style={{ color: '#ef4444' }} />;
    };

    const getQuestionStatusIcon = (response) => {
        if (!response.selectedOption) {
            return <FaQuestionCircle style={{ color: '#f59e0b' }} title="Unanswered" />;
        }
        return response.isCorrect ? 
            <FaCheck style={{ color: '#10b981' }} title="Correct" /> : 
            <FaTimes style={{ color: '#ef4444' }} title="Incorrect" />;
    };

    if (loading) {
        return (
            <div>
                <h1 style={{ marginBottom: '2rem', color: '#1e293b' }}>My Results</h1>
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Loading results...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', color: '#1e293b' }}>My Results</h1>

            {results.length === 0 ? (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <FaChartBar size={64} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                        <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>No Results Yet</h2>
                        <p style={{ color: '#64748b' }}>
                            You haven't completed any exams yet. Start taking exams to see your results here.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="results-grid">
                        {results.map((result) => (
                            <div key={result.id} className="card result-card">
                                <div className="result-header">
                                    <h3>{result.Exam?.name || 'Exam'}</h3>
                                    <div className="result-status">
                                        {getStatusIcon(result.isPassed)}
                                        <span className={result.isPassed ? 'status-passed' : 'status-failed'}>
                                            {result.isPassed ? 'Passed' : 'Failed'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="result-stats">
                                    <div className="stat">
                                        <span className="stat-label">Score:</span>
                                        <span className="stat-value">{result.score}%</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Correct:</span>
                                        <span className="stat-value">{result.correctAnswers}/{result.totalQuestions}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Attempted:</span>
                                        <span className="stat-value">{result.attemptedQuestions}/{result.totalQuestions}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Time:</span>
                                        <span className="stat-value">
                                            <FaClock style={{ marginRight: '0.25rem' }} />
                                            {formatTime(result.timeTaken)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="result-actions">
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleViewDetails(result)}
                                    >
                                        View Details
                                    </button>
                                </div>
                                
                                <div className="result-date">
                                    Submitted: {new Date(result.submittedAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Result Details Modal */}
                    {selectedResult && (
                        <div className="modal-overlay">
                            <div className="modal result-modal">
                                <div className="modal-header">
                                    <h3>{selectedResult.Exam?.name || 'Exam'} - Detailed Results</h3>
                                    <button 
                                        className="close-btn" 
                                        onClick={() => {
                                            setSelectedResult(null);
                                            setResultDetails(null);
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                                
                                <div className="modal-body">
                                    {loadingDetails ? (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                                            <p>Loading details...</p>
                                        </div>
                                    ) : resultDetails ? (
                                        <div>
                                            <div className="result-summary">
                                                <div className="summary-stats">
                                                    <div className="summary-stat">
                                                        <span className="summary-label">Final Score:</span>
                                                        <span className={`summary-value ${selectedResult.isPassed ? 'passed' : 'failed'}`}>
                                                            {selectedResult.score}%
                                                        </span>
                                                    </div>
                                                    <div className="summary-stat">
                                                        <span className="summary-label">Status:</span>
                                                        <span className={selectedResult.isPassed ? 'status-passed' : 'status-failed'}>
                                                            {selectedResult.isPassed ? 'Passed' : 'Failed'}
                                                        </span>
                                                    </div>
                                                    <div className="summary-stat">
                                                        <span className="summary-label">Questions Attempted:</span>
                                                        <span className="summary-value">
                                                            {selectedResult.attemptedQuestions} of {selectedResult.totalQuestions}
                                                        </span>
                                                    </div>
                                                    <div className="summary-stat">
                                                        <span className="summary-label">Correct Answers:</span>
                                                        <span className="summary-value">
                                                            {selectedResult.correctAnswers}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="questions-review">
                                                <h4>Question by Question Review</h4>
                                                {resultDetails.responses?.map((response, index) => (
                                                    <div key={response.questionId} className="question-review">
                                                        <div className="question-header">
                                                            <span className="question-number">Q{index + 1}</span>
                                                            {getQuestionStatusIcon(response)}
                                                            <span className="question-status">
                                                                {!response.selectedOption ? 'Unanswered' : 
                                                                 response.isCorrect ? 'Correct' : 'Incorrect'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="question-content">
                                                            <p className="question-text">{response.Question?.text}</p>
                                                            
                                                            <div className="answer-options">
                                                                {['A', 'B', 'C', 'D'].map(option => {
                                                                    const isSelected = response.selectedOption === option;
                                                                    const isCorrect = response.Question?.correctAnswer === option;
                                                                    
                                                                    return (
                                                                        <div 
                                                                            key={option} 
                                                                            className={`answer-option ${
                                                                                isCorrect ? 'correct-answer' : ''
                                                                            } ${
                                                                                isSelected && !isCorrect ? 'wrong-answer' : ''
                                                                            } ${
                                                                                isSelected ? 'selected' : ''
                                                                            }`}
                                                                        >
                                                                            <span className="option-letter">{option}.</span>
                                                                            <span className="option-text">
                                                                                {response.Question?.[`option${option}`]}
                                                                            </span>
                                                                            {isCorrect && <FaCheck className="option-icon correct" />}
                                                                            {isSelected && !isCorrect && <FaTimes className="option-icon wrong" />}
                                                                            {!response.selectedOption && isCorrect && 
                                                                                <span className="option-note">(Correct Answer)</span>
                                                                            }
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            
                                                            {!response.selectedOption && (
                                                                <div className="unanswered-note">
                                                                    <FaQuestionCircle style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
                                                                    This question was not answered and received 0 marks.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                                            <p>Failed to load result details.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentResults;