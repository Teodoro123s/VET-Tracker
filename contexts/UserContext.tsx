import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  password: string;
  clinicName: string;
  email: string;
}

interface UserContextType {
  users: User[];
  updateUserCredentials: (id: number, username: string, password: string) => void;
  validateLogin: (username: string, password: string) => User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: 'vetclinic_admin', password: 'VetClinic2024!', clinicName: 'Veterinary Clinic', email: 'admin@vetclinic.com' },
    { id: 2, username: 'petcare_admin', password: 'PetCare2023!', clinicName: 'Pet Care Center', email: 'admin@petcare.com' },
    { id: 3, username: 'animal_admin', password: 'AnimalHosp2023!', clinicName: 'Animal Hospital', email: 'admin@animalhospital.com' }
  ]);

  const updateUserCredentials = (id: number, username: string, password: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === id ? { ...user, username, password } : user
      )
    );
  };

  const validateLogin = (username: string, password: string): User | null => {
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