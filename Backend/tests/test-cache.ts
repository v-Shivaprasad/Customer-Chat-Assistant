import { ChatCache } from "../ChatCache";

(async () => {
  const cache = new ChatCache();
  const cid = "test-convo";

  await cache.addMessage(cid, "user", "Hi");
  await cache.addMessage(cid, "ai", "Hello");
  await cache.addMessage(cid, "user", "Return policy?");
  await cache.addMessage(cid, "ai", "30 days"); 

  const ctx = await cache.getContext(cid);
  console.log(ctx);

  process.exit(0);
})();
