import { v4 as uuidv4 } from "uuid";
import { CHATDB } from "../ChatDb";

(async () => {
  const db = new CHATDB();
  await db.init();

  const convoId = uuidv4();
  const msgId1 = uuidv4();
  const msgId2 = uuidv4();

  await db.createConversation(convoId);
  await db.saveMessage(msgId1, convoId, "user", "Hello");
  await db.saveMessage(msgId2, convoId, "ai", "Hi, how can I help?");

  const messages = await db.getMessages(convoId);
  console.log(messages);

  process.exit(0);
})();
