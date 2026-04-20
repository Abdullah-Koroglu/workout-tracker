import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(2000)
});

export const conversationQuerySchema = z.object({
  withUserId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
