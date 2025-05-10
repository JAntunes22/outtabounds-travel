import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isAdmin } = useAuth();
  const functions = getFunctions();

  useEffect(() => {
    if (!isAdmin) {
      setError('You do not have permission to view this page');
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setError(null);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (email) => {
    if (!isAdmin) {
      setError('You do not have permission to perform this action');
      return;
    }

    try {
      setError(null);
      const addAdminRole = httpsCallable(functions, 'addAdminRole');
      await addAdminRole({ email });
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding admin role:', error);
      setError(error.message);
    }
  };

  const handleRemoveAdmin = async (email) => {
    if (!isAdmin) {
      setError('You do not have permission to perform this action');
      return;
    }

    if (email === currentUser.email) {
      setError('You cannot remove your own admin privileges');
      return;
    }

    try {
      setError(null);
      const removeAdminRole = httpsCallable(functions, 'removeAdminRole');
      await removeAdminRole({ email });
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error removing admin role:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-list">
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Display Name</th>
            <th>Admin Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.displayName || 'N/A'}</td>
              <td>{user.isAdmin ? 'Yes' : 'No'}</td>
              <td>{user.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
              <td>
                {user.isAdmin ? (
                  <button
                    onClick={() => handleRemoveAdmin(user.email)}
                    disabled={user.email === currentUser.email}
                  >
                    Remove Admin
                  </button>
                ) : (
                  <button onClick={() => handleAddAdmin(user.email)}>
                    Make Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 