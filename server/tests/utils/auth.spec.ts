import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authMiddleware from '../../middleware/auth';
import { TokenPayload } from '../../utils/jwt.util';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should call next() with valid token', () => {
    const payload: TokenPayload = { userId: 'test-user-id', username: 'testuser' };
    const token = jwt.sign(payload, JWT_SECRET);

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(expect.objectContaining(payload));
  });

  it('should return 401 when authorization header is missing', () => {
    mockRequest.headers = {};

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Missing or invalid authorization header',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    mockRequest.headers = {
      authorization: 'Basic sometoken',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Missing or invalid authorization header',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is just "Bearer" without token', () => {
    mockRequest.headers = {
      authorization: 'Bearer',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Missing or invalid authorization header',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid.token.here',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 when token is expired', () => {
    const payload: TokenPayload = { userId: 'test-user-id', username: 'testuser' };
    const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

    mockRequest.headers = {
      authorization: `Bearer ${expiredToken}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 when token is signed with wrong secret', () => {
    const payload: TokenPayload = { userId: 'test-user-id', username: 'testuser' };
    const wrongSecretToken = jwt.sign(payload, 'wrong_secret_key');

    mockRequest.headers = {
      authorization: `Bearer ${wrongSecretToken}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 when token is malformed', () => {
    mockRequest.headers = {
      authorization: 'Bearer malformed',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should attach user payload to request object', () => {
    const payload: TokenPayload = { userId: 'user-123', username: 'johndoe' };
    const token = jwt.sign(payload, JWT_SECRET);

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.userId).toBe('user-123');
    expect(mockRequest.user?.username).toBe('johndoe');
    expect(nextFunction).toHaveBeenCalled();
  });
});
