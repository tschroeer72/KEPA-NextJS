export type AuthContextType = {
    isLogin: boolean,
    setIsLogin: (value: boolean) => void,
    userId: number | null,
    setUserId: (value: number | null) => void,
    username: string | null,
    setUsername: (value: string | null) => void,
    vorname: string | null,
    setVorname: (value: string | null) => void,
    nachname: string | null,
    setNachname: (value: string | null) => void,
    isAdmin: boolean,
    setIsAdmin: (value: boolean) => void,
}