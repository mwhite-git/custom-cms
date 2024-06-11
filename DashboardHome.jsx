import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'; // Ensure the path is correct
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const DashboardHome = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({});
    const [blogData, setBlogData] = useState({});
    const [portfolioData, setPortfolioData] = useState({});
    const [todoData, setTodoData] = useState({});
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserData(currentUser.uid);
                fetchBlogData(currentUser.uid);
                fetchPortfolioData(currentUser.uid);
                fetchTodoData(currentUser.uid);
                fetchRecentActivity();
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            setUserData(userDoc.data());
        }
    };

    const fetchBlogData = async (userId) => {
        const blogsSnapshot = await getDocs(collection(db, 'blogs'));
        const blogs = blogsSnapshot.docs.map(doc => doc.data()).filter(blog => blog.userId === userId);
        setBlogData({
            posts: blogs.length,
            drafts: blogs.filter(blog => blog.status === 'draft').length,
            comments: blogs.reduce((acc, blog) => acc + (blog.comments || []).length, 0),
        });
    };

    const fetchPortfolioData = async (userId) => {
        const portfolioSnapshot = await getDocs(collection(db, 'portfolio'));
        const portfolio = portfolioSnapshot.docs.map(doc => doc.data()).filter(project => project.userId === userId);
        setPortfolioData({
            projects: portfolio.length,
            pendingReviews: portfolio.filter(project => project.status === 'pending').length,
        });
    };

    const fetchTodoData = async (userId) => {
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const tasks = tasksSnapshot.docs.map(doc => doc.data()).filter(task => task.userId === userId);
        setTodoData({
            tasks: tasks.length,
            completed: tasks.filter(task => task.status === 'completed').length,
            pending: tasks.filter(task => task.status !== 'completed').length,
        });
    };

    const fetchRecentActivity = async () => {
        // Replace with actual logic for recent activities
        const activities = [
            'New comment on your blog post "React Tips"',
            'Portfolio project "Website Redesign" updated',
            'Task "Write unit tests" completed',
        ];
        setRecentActivity(activities);
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold">Welcome, {userData.name}</h1>
                <p className="text-lg text-gray-600">Here's a summary of your activities</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Blog Overview</h2>
                    <p className="text-gray-700">Posts: {blogData.posts}</p>
                    <p className="text-gray-700">Drafts: {blogData.drafts}</p>
                    <p className="text-gray-700">Comments: {blogData.comments}</p>
                </div>

                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Portfolio Overview</h2>
                    <p className="text-gray-700">Projects: {portfolioData.projects}</p>
                    <p className="text-gray-700">Pending Reviews: {portfolioData.pendingReviews}</p>
                </div>

                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Todo Summary</h2>
                    <p className="text-gray-700">Tasks: {todoData.tasks}</p>
                    <p className="text-gray-700">Completed: {todoData.completed}</p>
                    <p className="text-gray-700">Pending: {todoData.pending}</p>
                </div>

                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Profile Status</h2>
                    <p className="text-gray-700">Profile Completed: {userData.profileCompletion}%</p>
                    <p className="text-gray-700">New Messages: {userData.newMessages}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Recent Activity</h3>
                    <ul className="list-disc pl-4 text-gray-700">
                        {recentActivity.map((activity, index) => (
                            <li key={index}>{activity}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white shadow-lg p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                    <div className="h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                        <span className="text-gray-600">Chart Placeholder</span>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-lg p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Upcoming Tasks</h3>
                <ul className="list-disc pl-4 text-gray-700">
                    <li>Finish writing blog post</li>
                    <li>Review portfolio project submissions</li>
                    <li>Prepare for team meeting</li>
                </ul>
            </div>
        </div>
    );
}

export default DashboardHome;
