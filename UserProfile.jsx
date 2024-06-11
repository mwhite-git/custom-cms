// src/pages/Admin/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './UserProfile.css';

const UserProfile = () => {
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [displayImage, setDisplayImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || '');
          setImageUrl(userData.imageUrl || '');
        }
      };
      fetchUserProfile();
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (user) {
      await updateProfile(user, { displayName });
      await setDoc(doc(db, 'users', user.uid), { displayName, imageUrl }, { merge: true });
      alert('Profile updated successfully');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match');
      return;
    }

    if (user && currentPassword && newPassword) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        alert('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } catch (error) {
        alert('Error updating password: ' + error.message);
      }
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storage = getStorage();
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      await setDoc(doc(db, 'users', user.uid), { imageUrl: url }, { merge: true });
      alert('Image uploaded successfully');
    }
  };

  return (
    <div className="user-profile">
      <h1>User Profile</h1>
      <div className="profile-section">
        <label>
          Display Name:
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <button onClick={handleUpdateProfile}>Update Profile</button>
      </div>
      <div className="profile-section">
        <label>
          Current Password:
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label>
          New Password:
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm New Password:
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </label>
        <button onClick={handleChangePassword}>Change Password</button>
      </div>
      <div className="profile-section">
        <label>
          Display Image:
          <input type="file" onChange={handleUploadImage} />
        </label>
        {imageUrl && <img src={imageUrl} alt="Display" className="profile-image" />}
      </div>
    </div>
  );
};

export default UserProfile;
