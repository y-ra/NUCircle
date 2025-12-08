import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import FakeStackOverflow from './components/fakestackoverflow';
import api from './services/config';
import useLoginContext from './hooks/useLoginContext';

const App = () => {
  const { setUser } = useLoginContext();

  // Restore user session on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      api
        .get('/api/user/me')
        .then(response => {
          const user = response.data;
          setUser(user);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
        });
    }
  }, [setUser]);

  return (
    <Router>
      <FakeStackOverflow />
    </Router>
  );
};

export default App;
