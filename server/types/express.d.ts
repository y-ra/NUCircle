import { TokenPayload } from '../utils/jwt.util';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
