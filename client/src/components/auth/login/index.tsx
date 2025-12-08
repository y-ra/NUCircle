import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * error handling, and a link to the signup page.
 */
const Login = () => {
  const {
    username,
    password,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('login');

  return (
    <div className='container'>
      <h2 className='big-logo'>NUCircle</h2>
      <div className='login-form'>
        <h3 className='welcome'>Welcome!</h3>
        <h3 className='please-login'>Please login to continue to NUCircle</h3>
        <form onSubmit={handleSubmit}>
          <h4>Email</h4>
          <div className='input-wrapper'>
            <svg
              className='input-icon'
              width='18'
              height='18'
              viewBox='0 0 19 21'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M17.25 19.25V17.25C17.25 16.1891 16.8286 15.1717 16.0784 14.4216C15.3283 13.6714 14.3109 13.25 13.25 13.25H5.25C4.18913 13.25 3.17172 13.6714 2.42157 14.4216C1.67143 15.1717 1.25 16.1891 1.25 17.25V19.25M13.25 5.25C13.25 7.45914 11.4591 9.25 9.25 9.25C7.04086 9.25 5.25 7.45914 5.25 5.25C5.25 3.04086 7.04086 1.25 9.25 1.25C11.4591 1.25 13.25 3.04086 13.25 5.25Z'
                stroke='#B0B7C4'
                stroke-width='2.5'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
            <input
              type='text'
              value={username}
              onChange={event => handleInputChange(event, 'username')}
              placeholder='Enter your email'
              required
              className='icon-input'
              id='username-input'
            />
          </div>
          <h4>Password</h4>
          <div className='input-wrapper'>
            <svg
              className='input-icon'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11M5 11H19C20.1046 11 21 11.8954 21 13V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V13C3 11.8954 3.89543 11 5 11Z'
                stroke='#B0B7C4'
                stroke-width='2.5'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => handleInputChange(event, 'password')}
              placeholder='Enter your password'
              required
              className='icon-input'
              id='password-input'
            />
            <div className='password-toggle-icon' onClick={togglePasswordVisibility}>
              {showPassword ? (
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 19'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M1 9.25C1 9.25 5 1.25 12 1.25C19 1.25 23 9.25 23 9.25C23 9.25 19 17.25 12 17.25C5 17.25 1 9.25 1 9.25Z'
                    stroke='#B0B7C4'
                    stroke-width='2.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  />
                  <path
                    d='M12 12.25C13.6569 12.25 15 10.9069 15 9.25C15 7.59315 13.6569 6.25 12 6.25C10.3431 6.25 9 7.59315 9 9.25C9 10.9069 10.3431 12.25 12 12.25Z'
                    stroke='#B0B7C4'
                    stroke-width='2.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  />
                </svg>
              ) : (
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.6819 3.96914 7.65661 6.06 6.06M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23'
                    stroke='#B0B7C4'
                    stroke-width='2.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  />
                </svg>
              )}
            </div>
          </div>
          <button type='submit' className='login-button'>
            Log in
          </button>
        </form>
        {err && <p className='error-message-login'>{err}</p>}
        <Link to='/signup' className='signup-link'>
          <span className='signup-text'>Don&apos;t have an account? </span>
          <span className='signup-highlight'>Sign up here</span>
        </Link>
      </div>
    </div>
  );
};

export default Login;
