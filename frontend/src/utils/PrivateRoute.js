import {Navigate} from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const authenticated = false;
  return authenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;