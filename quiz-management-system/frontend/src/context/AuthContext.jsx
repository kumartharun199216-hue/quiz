import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('adminUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null);

  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('studentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [studentToken, setStudentToken] = useState(() => localStorage.getItem('studentToken') || null);

  const loginAdminData = (token, adminObj) => {
    setAdminToken(token);
    setAdmin(adminObj);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(adminObj));
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  const loginStudentData = (token, studentObj) => {
    setStudentToken(token);
    setStudent(studentObj);
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentUser', JSON.stringify(studentObj));
  };

  const logoutStudent = () => {
    setStudentToken(null);
    setStudent(null);
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    localStorage.removeItem('activeAttemptId');
  };

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        admin,
        adminToken,
        student,
        studentToken,
        isSuperAdmin,
        loginAdminData,
        logoutAdmin,
        loginStudentData,
        logoutStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
