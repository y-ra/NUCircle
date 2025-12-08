import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useState } from 'react';
import useLoginContext from './useLoginContext';
import { createUser, loginUser } from '../services/userService';

/**
 * Custom hook to manage authentication logic, including handling input changes,
 * form submission, password visibility toggling, and error validation for both
 * login and signup processes.
 *
 * @param authType - Specifies the authentication type ('login' or 'signup').
 * @returns {Object} An object containing:
 *   - firstName: The current value of the first name input (for signup).
 *   - lastName: The current value of the last name input (for signup).
 *   - username: The current value of the username input.
 *   - password: The current value of the password input.
 *   - passwordConfirmation: The current value of the password confirmation input (for signup).
 *   - showPassword: Boolean indicating whether the password is visible.
 *   - err: The current error message, if any.
 *   - handleInputChange: Function to handle changes in input fields.
 *   - handleSubmit: Function to handle form submission.
 *   - togglePasswordVisibility: Function to toggle password visibility.
 */
const useAuth = (authType: 'login' | 'signup') => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string>('');
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  /**
   * Toggles the visibility of the password input field.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  /**
   * Handles changes in input fields and updates the corresponding state.
   *
   * @param e - The input change event.
   * @param field - The field being updated ('username', 'password', or 'confirmPassword').
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'firstName' | 'lastName' | 'username' | 'password' | 'confirmPassword',
  ) => {
    const fieldText = e.target.value.trim();
    switch (field) {
      case 'firstName':
        setFirstName(fieldText);
        break;
      case 'lastName':
        setLastName(fieldText);
        break;
      case 'username':
        setUsername(fieldText);
        break;
      case 'password':
        setPassword(fieldText);
        break;
      case 'confirmPassword':
        setPasswordConfirmation(fieldText);
        break;
    }
  };

  /**
   * Validates the input fields for the form.
   * Ensures required fields are filled and passwords match (for signup).
   *
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateInputs = (): boolean => {
    if (authType === 'signup') {
      if (
        firstName === '' ||
        lastName === '' ||
        username === '' ||
        password === '' ||
        passwordConfirmation === ''
      ) {
        setErr('Please fill in all fields');
        return false;
      }
      if (!username.endsWith('@northeastern.edu')) {
        setErr('Please use a valid Northeastern email');
        return false;
      }

      const errors: string[] = [];
      if (password.length < 8) {
        errors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('an uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('a lowercase letter');
      }
      if (!/\d/.test(password)) {
        errors.push('a number');
      }
      if (!/[@$!%*?&]/.test(password)) {
        errors.push('a special character');
      }
      if (errors.length > 0) {
        setErr(`Password must contain ${errors.join(', ')}`);
        return false;
      }

      if (password !== passwordConfirmation) {
        setErr('Passwords do not match');
        return false;
      }
    } else if (authType === 'login') {
      if (!username || !password) {
        setErr('Please enter both username and password');
        return false;
      }
    }

    setErr('');
    return true;
  };

  /**
   * Handles the submission of the form.
   * Validates input, performs login/signup, and navigates to the home page on success.
   *
   * @param event - The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    let user;

    try {
      let cleanUsername = username;
      if (authType === 'signup') {
        cleanUsername = username.split('@')[0];
        const response = await createUser({
          firstName,
          lastName,
          username: cleanUsername,
          password,
        });
        user = response.user;
        const token = response.token;
        localStorage.setItem('authToken', token);
      } else if (authType === 'login') {
        if (username.includes('@')) {
          cleanUsername = username.split('@')[0];
        }
        const response = await loginUser({ username: cleanUsername, password });
        user = response.user;
        const token = response.token;
        localStorage.setItem('authToken', token);
      } else {
        throw new Error('Invalid auth type');
      }
      setUser(user);
      navigate('/home');
    } catch (error) {
      if ((error as Error).message.includes('MongoServerError: E11000 duplicate key error')) {
        setErr('This email is already registered');
        return;
      } else {
        setErr((error as Error).message);
      }
    }
  };

  return {
    firstName,
    lastName,
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
  };
};

export default useAuth;
