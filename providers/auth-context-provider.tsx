"use client";

import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {AuthContextType} from "@/types/auth-context-type";
import axios from "axios";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider=({children}:{children:ReactNode}) =>{
    const [isLogin, setIsLogin] = useState(false)

    // Beim Laden der Anwendung prüfen, ob ein gültiger Token vorhanden ist
    useEffect(() => {
        const checkAuth = async () => {
            try {
                //console.log('AuthContext - Prüfe Token-Status');
                // API-Endpoint erstellen, der den Token-Status prüft
                const response = await axios.get('/api/auth/verify');
                //console.log('AuthContext - Verify Response:', response.status, response.data);
                if (response.status === 200) {
                    setIsLogin(true);
                } else {
                    setIsLogin(false);
                }
            } catch (error) {
                //console.log('AuthContext - Verify Error:', error.response?.status, error.response?.data);
                setIsLogin(false);
            }
        };

        checkAuth();
    }, []);

    return(
        <AuthContext.Provider value={{isLogin, setIsLogin}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useContext must be used within a AutoContextProvider");
    }
    return context;
}