import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FaFileAlt,
    FaChartBar,
    FaClock,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa';

const StudentDashboard = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const examsResponse = await axios.get('/api/results/my-exams');
            setExams(examsResponse.data.exams || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span style={{ marginLeft: '1rem' }}>Loading dashboard...</span>
            </div>
        );
    }

    const availableExams = exams.filter(exam => exam.canTake);
    const completedExams = exams.filter(exam => exam.result);

    return (
        <div>
            {/* PMI Welcome Header */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, var(--pmi-primary-blue) 0%, var(--pmi-secondary-blue) 100%)',
                color: 'var(--pmi-white)',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img 
                        src="/pmi-logo.png" 
                        alt="PMI Logo" 
                        style={{ 
                            height: '60px', 
                            marginRight: '1rem',
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)'
                        }} 
                    />
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>Welcome to PMI Exam Portal</h1>
                </div>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, margin: 0 }}>Your gateway to professional certification excellence</p>
            </div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Available Exams
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {availableExams.length}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                Ready to take
                            </p>
                        </div>
                        <FaFileAlt size={32} style={{ color: 'var(--pmi-secondary-blue)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Completed Exams
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {completedExams.length}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                Total taken
                            </p>
                        </div>
                        <FaCheckCircle size={32} style={{ color: 'var(--success-green)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Total Exams
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {exams.length}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                Assigned to you
                            </p>
                        </div>
                        <FaFileAlt size={32} style={{ color: 'var(--pmi-accent-orange)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Completed
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {completedExams.length}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                Exams finished
                            </p>
                        </div>
                        <FaCheckCircle size={32} style={{ color: 'var(--pmi-secondary-blue)' }} />
                    </div>
                </div>
            </div>

            {/* Available Exams */}
            {availableExams.length > 0 && (
                <div className="card">
                    <h2 style={{ marginBottom: '1rem', color: 'var(--pmi-primary-blue)', borderBottom: '2px solid var(--pmi-secondary-blue)', paddingBottom: '0.5rem' }}>Available Exams</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1rem'
                    }}>
                        {availableExams.map(exam => (
                            <div key={exam.id} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                backgroundColor: '#f9fafb'
                            }}>
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--pmi-primary-blue)' }}>{exam.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)', marginBottom: '1rem' }}>
                                    {exam.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                        <FaClock style={{ marginRight: '0.25rem' }} />
                                        {exam.duration} minutes
                                    </div>
                                    <Link to={`/student/exam/${exam.id}`} className="btn btn-primary">
                                        Start Exam
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Quick Actions */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: 'var(--pmi-primary-blue)', borderBottom: '2px solid var(--pmi-secondary-blue)', paddingBottom: '0.5rem' }}>Quick Actions</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    <Link to="/student/exams" className="btn btn-primary" style={{ textAlign: 'center' }}>
                        <FaFileAlt />
                        View All Exams
                    </Link>
                    <Link to="/student/results" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                        <FaChartBar />
                        View All Results
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;