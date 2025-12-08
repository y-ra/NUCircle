import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, TokenPayload } from '../../utils/jwt.util';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

describe('jwt.util', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload: TokenPayload = { userId: 'test-user', username: 'testuser' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload for valid token', () => {
      const payload: TokenPayload = { userId: 'test-user', username: 'testuser' };
      const token = jwt.sign(payload, JWT_SECRET);

      const result = verifyToken(token);

      expect(result.userId).toBe(payload.userId);
      expect(result.username).toBe(payload.username);
    });

    it('should throw error when token is a string (jwt.verify returns string)', () => {
      // Mock jwt.verify to return a string instead of an object
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockReturnValue('string-token');

      expect(() => {
        verifyToken('some-token');
      }).toThrow('Invalid token format');

      // Restore original function
      jwt.verify = originalVerify;
    });
  });
});
