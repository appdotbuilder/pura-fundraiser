import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPuraInputSchema,
  updatePuraInputSchema,
  createDonationInputSchema,
  createEducationalContentInputSchema,
  updateEducationalContentInputSchema,
  smartSearchInputSchema,
  contentCategoryEnum
} from './schema';

// Import handlers
import { getPuras } from './handlers/get_puras';
import { getPuraById } from './handlers/get_pura_by_id';
import { createPura } from './handlers/create_pura';
import { updatePura } from './handlers/update_pura';
import { createDonation } from './handlers/create_donation';
import { getDonationsByPura } from './handlers/get_donations_by_pura';
import { getEducationalContent } from './handlers/get_educational_content';
import { getEducationalContentById } from './handlers/get_educational_content_by_id';
import { createEducationalContent } from './handlers/create_educational_content';
import { updateEducationalContent } from './handlers/update_educational_content';
import { deleteEducationalContent } from './handlers/delete_educational_content';
import { smartSearch } from './handlers/smart_search';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Pura management routes
  getPuras: publicProcedure
    .query(() => getPuras()),
  
  getPuraById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPuraById(input.id)),
  
  createPura: publicProcedure
    .input(createPuraInputSchema)
    .mutation(({ input }) => createPura(input)),
  
  updatePura: publicProcedure
    .input(updatePuraInputSchema)
    .mutation(({ input }) => updatePura(input)),

  // Donation routes
  createDonation: publicProcedure
    .input(createDonationInputSchema)
    .mutation(({ input }) => createDonation(input)),
  
  getDonationsByPura: publicProcedure
    .input(z.object({ puraId: z.number() }))
    .query(({ input }) => getDonationsByPura(input.puraId)),

  // Educational content routes
  getEducationalContent: publicProcedure
    .input(z.object({ category: contentCategoryEnum.optional() }).optional())
    .query(({ input }) => getEducationalContent(input?.category)),
  
  getEducationalContentById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getEducationalContentById(input.id)),
  
  createEducationalContent: publicProcedure
    .input(createEducationalContentInputSchema)
    .mutation(({ input }) => createEducationalContent(input)),
  
  updateEducationalContent: publicProcedure
    .input(updateEducationalContentInputSchema)
    .mutation(({ input }) => updateEducationalContent(input)),
  
  deleteEducationalContent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteEducationalContent(input.id)),

  // AI Chat / Smart Search route
  smartSearch: publicProcedure
    .input(smartSearchInputSchema)
    .query(({ input }) => smartSearch(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();