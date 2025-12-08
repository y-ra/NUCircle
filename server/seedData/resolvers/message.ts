import { InsertedDocs } from '../../types/populate';

/**
 * Resolves communityId references in message data
 */
const messageResolver = (data: Record<string, unknown>, inserted: InsertedDocs) => {
  const resolved = { ...data };

  // If message has a communityId, resolve it to the actual ObjectId
  if (resolved.communityId && typeof resolved.communityId === 'string' && inserted.community) {
    const communityDoc = inserted.community.get(resolved.communityId);
    if (communityDoc) {
      resolved.communityId = communityDoc._id.toString();
    }
  }

  return resolved;
};

export default messageResolver;
