// import { createContext, useState, useEffect } from "react"

// const AuthContext =  createContext();

// export default AuthContext;

// export const AuthProvider = ({children}) => {
//   const [user, setUser] = useState(null);
//   const [authToken, setAuthToken] = useState(null);
  
//   const loginUser = async (e) => {
//     const response = await fetch('/api/token', {
//       method: "POST",
//       headers: {
//         'Content-type': 'application/json'
//       }
//     })
//   }
//   let data = {
//     tmp: 1
//   }
//   return (
//     <AuthContext.Provider value={data}>
//       {children}
//     </AuthContext.Provider>
//   )
// }