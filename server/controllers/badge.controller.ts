import express, { Response, Router } from 'express';
import { UserByUsernameRequest, FakeSOSocket } from '../types/types';
import { getUserBadges } from '../services/badge.service';

const badgeController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Retrieves all badges for a user by username.
   * @param req The request containing the username parameter
   * @param res The response, either returning the badges or an error
   * @returns A promise resolving to void
   */
  const getUserBadgesRoute = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    const { username } = req.params;

    try {
      const badges = await getUserBadges(username);
      res.json(badges);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving badges: ${(err as Error).message}`);
    }
  };

  router.get('/:username', getUserBadgesRoute);

  return router;
};

export default badgeController;
