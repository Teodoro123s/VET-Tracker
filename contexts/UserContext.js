import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([
    { id, username: 'vetclinic_admin', password: 'VetClinic2024!', clinicName: 'Veterinary Clinic', email: 'admin@vetclinic.com' },
    { id, username: 'petcare_admin', password: 'PetCare2023!', clinicName: 'Pet Care Center', email: 'admin@petcare.com' },
    { id, username: 'animal_admin', password: 'AnimalHosp2023!', clinicName: 'Animal Hospital', email: 'admin@animalhospital.com' }
  ]);

  const updateUserCredentials = (id, username, password) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === id ? { ...user, username, password } : user
      )
    );
  };

  const validateLogin = (username, password) => {
    return users.find(user => user.username === username && user.password === password) || null;
  };

  return (
    <UserContext.Provider value={{ users, updateUserCredentials, validateLogin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
