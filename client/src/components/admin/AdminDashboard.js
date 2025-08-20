import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    FaUsers,
    FaFileAlt,
    FaChartBar,
    FaPlus,
    FaDownload,
    FaEye
} from 'react-icons/fa';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            console.log('Fetching dashboard statistics...');
            const [userStats, examStats, resultStats] = await Promise.all([
                axios.get('/api/users/stats/overview'),
                axios.get('/api/exams/stats/overview'),
                axios.get('/api/results/stats/overview')
            ]);

            console.log('Stats fetched successfully:', {
                users: userStats.data,
                exams: examStats.data,
                results: resultStats.data
            });

            setStats({
                users: userStats.data,
                exams: examStats.data,
                results: resultStats.data
            });
            toast.success('Dashboard statistics loaded successfully');
        } catch (error) {
            console.error('Error fetching stats:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            toast.error(`Failed to load dashboard statistics: ${error.response?.data?.message || error.message}`);
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

    return (
        <div>
            {/* PMI Header Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: 'var(--pmi-white)',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid var(--pmi-primary-blue)'
            }}>
                <img 
                    src="/pmi-logo.png" 
                    alt="PMI Logo" 
                    style={{ height: '60px', marginRight: '1rem' }}
                />
                <div>
                    <h1 style={{ margin: 0, color: 'var(--pmi-primary-blue)', fontSize: '2rem' }}>Admin Dashboard</h1>
                    <p style={{ margin: 0, color: 'var(--pmi-gray)', fontSize: '1rem' }}>PMI Exam Portal Administration</p>
                </div>
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
                                Total Users
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {stats?.users?.totalUsers || 0}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                {stats?.users?.activeUsers || 0} active
                            </p>
                        </div>
                        <FaUsers size={32} style={{ color: 'var(--pmi-secondary-blue)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Total Exams
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {stats?.exams?.totalExams || 0}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                {stats?.exams?.activeExams || 0} active
                            </p>
                        </div>
                        <FaFileAlt size={32} style={{ color: 'var(--pmi-accent-orange)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Total Results
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {stats?.results?.totalResults || 0}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                {stats?.results?.passRate || 0}% pass rate
                            </p>
                        </div>
                        <FaChartBar size={32} style={{ color: 'var(--pmi-light-blue)' }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--pmi-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Average Score
                            </h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>
                                {isNaN(stats?.results?.averageScore) ? 0 : (stats?.results?.averageScore || 0)}%
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--pmi-gray)' }}>
                                Recent: {stats?.results?.recentResults || 0}
                            </p>
                        </div>
                        <FaChartBar size={32} style={{ color: 'var(--pmi-secondary-blue)' }} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: 'var(--pmi-primary-blue)', borderBottom: '2px solid var(--pmi-secondary-blue)', paddingBottom: '0.5rem' }}>Quick Actions</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    <Link to="/admin/users" className="btn btn-primary" style={{ textAlign: 'center' }}>
                        <FaUsers />
                        Manage Users
                    </Link>
                    <Link to="/admin/exams" className="btn btn-success" style={{ textAlign: 'center' }}>
                        <FaFileAlt />
                        Manage Exams
                    </Link>
                    <Link to="/admin/results" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                        <FaChartBar />
                        View Results
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h2 style={{ marginBottom: '1rem', color: 'var(--pmi-primary-blue)', borderBottom: '2px solid var(--pmi-secondary-blue)', paddingBottom: '0.5rem' }}>System Overview</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--pmi-primary-blue)' }}>User Statistics</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Admin Users:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.users?.adminUsers || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Student Users:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.users?.studentUsers || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Users with Exams:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.users?.usersWithExams || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Users with Results:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.users?.usersWithResults || 0}</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--pmi-primary-blue)' }}>Exam Statistics</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Total Questions:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.exams?.totalQuestions || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Total Assignments:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.exams?.totalAssignments || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Total Results:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{stats?.exams?.totalResults || 0}</span>
                            </li>
                            <li style={{ padding: '0.5rem 0' }}>
                                <span style={{ color: 'var(--pmi-gray)' }}>Average Score:</span>
                                <span style={{ float: 'right', fontWeight: 'bold', color: 'var(--pmi-primary-blue)' }}>{isNaN(stats?.exams?.averageScore) ? 0 : (stats?.exams?.averageScore || 0)}%</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;