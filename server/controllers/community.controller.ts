import express, { Response } from 'express';
import {
  FakeSOSocket,
  CommunityIdRequest,
  CreateCommunityRequest,
  ToggleMembershipRequest,
  DeleteCommunityRequest,
} from '../types/types';
import {
  getCommunitiesByUser,
  getCommunity,
  getAllCommunities,
  toggleCommunityMembership,
  createCommunity,
  deleteCommunity,
  recordCommunityVisit,
} from '../services/community.service';
import { getUserByUsername } from '../services/user.service';

/**
 * This controller handles community-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the community routes.
 * @throws {Error} Throws an error if the community operations fail.
 */
const communityController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves all communities that a user is a part of.
   * @param req - The request object containing the username parameter
   * @param res - The response object used to send back the result
   */
  const getCommunitiesByUserRoute = async (req: express.Request, res: Response): Promise<void> => {
    const { username } = req.params;
    if (username !== req.user!.username) {
      res.status(401).send('Invalid username parameter');
      return;
    }

    try {
      const communities = await getCommunitiesByUser(username);

      if ('error' in communities) {
        throw new Error(communities.error);
      }

      res.json(communities);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving user communities: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves a community by its ID.
   *
   * @param req - The request object containing the communityId parameter
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getCommunityRoute = async (req: CommunityIdRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;

    try {
      const foundCommunity = await getCommunity(communityId);

      if ('error' in foundCommunity) {
        throw new Error(foundCommunity.error);
      }

      res.json(foundCommunity);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving community: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves all communities.
   *
   * @param _req - The express request object (unused, hence the underscore prefix)
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getAllCommunitiesRoute = async (_req: express.Request, res: Response): Promise<void> => {
    try {
      const communities = await getAllCommunities();

      if ('error' in communities) {
        throw new Error(communities.error);
      }

      res.json(communities);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving communities: ${(err as Error).message}`);
    }
  };

  /**
   * Toggles a user's membership status in a community (join/leave).
   *
   * @param req - The request object containing communityId and username
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const toggleMembershipRoute = async (
    req: ToggleMembershipRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId, username } = req.body;
    if (username !== req.user!.username) {
      res.status(401).send('Invalid username parameter');
      return;
    }

    try {
      const result = await toggleCommunityMembership(communityId, username);

      if ('error' in result) {
        // Handle different error types with appropriate status codes
        if (result.error.includes('admins cannot leave')) {
          res.status(403).json({ error: result.error });
        } else if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(500).json({ error: result.error });
        }
        return;
      }

      socket.emit('communityUpdate', {
        type: 'updated',
        community: result.community,
      });

      if (result.added) {
        const admin = await getUserByUsername(result.community.admin);
        if (!('error' in admin) && admin.socketId) {
          socket.to(admin.socketId).emit('notification', {
            type: 'communityNewMember',
            from: username,
            message: `${username} has joined your community "${result.community.name}".`,
          });
        }
      }

      res.json(result.community);
    } catch (err: unknown) {
      res
        .status(500)
        .json({ error: `Error toggling community membership: ${(err as Error).message}` });
    }
  };

  /**
   * Creates a new community with the given details.
   *
   * @param req - The request object containing community details (name, description, admin, etc.)
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const createCommunityRoute = async (
    req: CreateCommunityRequest,
    res: Response,
  ): Promise<void> => {
    const { name, description, admin, visibility = 'PUBLIC', participants = [] } = req.body;
    if (admin !== req.user!.username) {
      res.status(401).send('Invalid admin parameter');
      return;
    }
    // Ensure admin is included in participants list
    const allParticipants = participants.includes(admin) ? participants : [...participants, admin];

    try {
      const savedCommunity = await createCommunity({
        name,
        description,
        admin,
        participants: allParticipants,
        visibility,
      });

      if ('error' in savedCommunity) {
        throw new Error(savedCommunity.error);
      }

      socket.emit('communityUpdate', {
        type: 'created',
        community: savedCommunity,
      });

      res.json(savedCommunity);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a community: ${(err as Error).message}`);
    }
  };

  /**
   * Deletes a community if the requester is the admin.
   *
   * @param req - The request object containing communityId and username
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const deleteCommunityRoute = async (
    req: DeleteCommunityRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId } = req.params;
    const { username } = req.body;
    if (username !== req.user!.username) {
      res.status(401).send('Invalid username parameter');
      return;
    }

    try {
      const result = await deleteCommunity(communityId, username);

      if ('error' in result) {
        // Determine appropriate status code based on error
        if (result.error.includes('Unauthorized')) {
          res.status(403).json({ error: result.error });
        } else if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(500).json({ error: result.error });
        }
        return;
      }

      socket.emit('communityUpdate', {
        type: 'deleted',
        community: result,
      });

      res.json({ community: result, message: 'Community deleted successfully' });
    } catch (err: unknown) {
      res.status(500).json({ error: `Error deleting community: ${(err as Error).message}` });
    }
  };

  const recordVisitRoute = async (req: express.Request, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const { username } = req.body;

    if (username !== req.user!.username) {
      res.status(401).send('Invalid username parameter');
      return;
    }

    try {
      await recordCommunityVisit(communityId, username);
      res.status(200).json({ message: 'Visit recorded' });
    } catch (err: unknown) {
      res.status(500).send(`Error recording visit: ${(err as Error).message}`);
    }
  };

  // Registering routes
  router.get('/getCommunity/:communityId', getCommunityRoute);
  router.get('/getAllCommunities', getAllCommunitiesRoute);
  router.get('/getUserCommunities/:username', getCommunitiesByUserRoute);
  router.post('/toggleMembership', toggleMembershipRoute);
  router.post('/create', createCommunityRoute);
  router.delete('/delete/:communityId', deleteCommunityRoute);
  router.post('/:communityId/visit', recordVisitRoute);

  return router;
};

export default communityController;
