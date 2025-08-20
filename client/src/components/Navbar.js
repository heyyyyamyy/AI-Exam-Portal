import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaBrain } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMenu, setShowMenu] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Check if user is currently taking an exam
    const isInExam = location.pathname.includes('/student/exam/');

    const handleLogout = () => {
        if (isInExam) {
            setPendingNavigation(() => () => {
                logout();
                navigate('/login');
            });
            setShowExitConfirm(true);
        } else {
            logout();
            navigate('/login');
        }
    };

    const handleNavigation = (path) => {
        if (isInExam) {
            setPendingNavigation(() => () => navigate(path));
            setShowExitConfirm(true);
        } else {
            navigate(path);
        }
    };

    const confirmExit = async () => {
        setShowExitConfirm(false);
        
        // If user is in an exam, submit it before navigating
        if (isInExam) {
            try {
                // Extract exam ID from current path
                const examId = location.pathname.split('/').pop();
                
                // Submit exam with empty answers (exit scenario)
                await axios.post(`/api/results/exam/${examId}/exit`, {
                    answers: [],
                    timeTaken: 0
                });
                
                toast.success('Exam exited successfully! Results have been saved.');
            } catch (error) {
                console.error('Error exiting exam:', error);
                const message = error.response?.data?.message || 'Failed to exit exam';
                toast.error(message);
            }
        }
        
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
        setPendingNavigation(null);
    };

    return (
        <nav style={{
            backgroundColor: 'var(--pmi-white)',
            boxShadow: '0 2px 8px 0 rgba(0, 51, 102, 0.15)',
            padding: '1rem 0',
            marginBottom: '2rem',
            borderBottom: '3px solid var(--pmi-secondary-blue)'
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'var(--pmi-primary-blue)',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    transition: 'all 0.3s ease'
                }}>
                    <img 
                        src="/pmi-logo.png" 
                        alt="PMI Logo" 
                        style={{ 
                            height: '40px', 
                            marginRight: '0.75rem',
                            objectFit: 'contain'
                        }} 
                    />
                    PMI Exam Portal
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user?.role === 'admin' && (
                        <>
                            <button onClick={() => handleNavigation('/admin')} className="btn btn-outline">Dashboard</button>
                            <button onClick={() => handleNavigation('/admin/users')} className="btn btn-outline">Users</button>
                            <button onClick={() => handleNavigation('/admin/exams')} className="btn btn-outline">Exams</button>
                            <button onClick={() => handleNavigation('/admin/results')} className="btn btn-outline">Results</button>
                        </>
                    )}

                    {user?.role === 'student' && (
                        <>
                            <button onClick={() => handleNavigation('/student')} className="btn btn-outline">Dashboard</button>
                            <button onClick={() => handleNavigation('/student/exams')} className="btn btn-outline">My Exams</button>
                            <button onClick={() => handleNavigation('/student/results')} className="btn btn-outline">My Results</button>
                            <button onClick={() => handleNavigation('/student/pipelines')} className="btn btn-outline">My Order</button>
                        </>
                    )}

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FaUser />
                            {user?.name}
                        </button>

                        {showMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                minWidth: '200px',
                                zIndex: 1000,
                                marginTop: '0.5rem'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{user?.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{user?.email}</div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        textTransform: 'capitalize'
                                    }}>
                                        {user?.role}
                                    </div>
                                </div>

                                <div style={{ padding: '0.5rem' }}>
                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-outline"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        <FaSignOutAlt />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu overlay */}
            {showMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Exit Exam Confirmation</h3>
                        <p>You are currently taking an exam. If you navigate away:</p>
                        <ul>
                            <li>Your current answers will be saved</li>
                            <li>Unanswered questions will be marked as unattempted</li>
                            <li>Your exam will be submitted automatically</li>
                            <li>You will not be able to retake this exam</li>
                        </ul>
                        <p><strong>Are you sure you want to exit the exam?</strong></p>
                        <div className="modal-buttons">
                            <button 
                                className="btn btn-secondary" 
                                onClick={cancelExit}
                            >
                                Continue Exam
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={confirmExit}
                            >
                                Exit & Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;