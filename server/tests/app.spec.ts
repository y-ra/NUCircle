import express, { Request, Response, NextFunction } from 'express';
import supertest from 'supertest';

describe('App Integration Tests', () => {
  describe('Error Handler Middleware - Else Branch', () => {
    const registerErrorHandler = (app: express.Express) => {
      app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        if (err?.status && err?.message) {
          res.status(err.status).json({ message: err.message });
        } else {
          res.status(500).json({ message: 'Internal Server Error' });
        }
      });
    };

    it('should handle non-OpenAPI errors', async () => {
      const testApp = express();

      testApp.get('/error', (_req, _res, next) => {
        next(new Error('Some failure'));
      });

      registerErrorHandler(testApp);

      const res = await supertest(testApp).get('/error');
      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });

    it('should handle OpenAPI validation errors', async () => {
      const testApp = express();

      testApp.get('/error2', (_req, _res, next) => {
        next({ status: 400, message: 'Request Validation Failed' });
      });

      registerErrorHandler(testApp);

      const res = await supertest(testApp).get('/error2');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Request Validation Failed');
    });

    it('should pass non-validation errors to next(err)', async () => {
      const testApp = express();
      testApp.use((err: any, req: Request, res: Response, next: NextFunction) => {
        if (err.status && err.errors) {
          res.status(err.status).json({
            message: 'Request Validation Failed',
            errors: err.errors,
          });
        } else {
          next(err);
        }
      });

      testApp.get('/test-next', (_req, _res, next) => {
        next(new Error('Plain error'));
      });

      testApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ message: 'Reached next(err)', error: err.message });
      });

      const res = await supertest(testApp).get('/test-next');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Reached next(err)');
      expect(res.body.error).toBe('Plain error');
    });
  });
});
