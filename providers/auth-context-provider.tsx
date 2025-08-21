"use client";

import {createContext, ReactNode, useContext, useState} from "react";
import {AuthContextType} from "@/types/auth-context-type";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider=({children}:{children:ReactNode}) =>{
    const [isLogin, setIsLogin] = useState(false)

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