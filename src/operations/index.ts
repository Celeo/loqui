import { OperationExecuteFn, Operations } from "../util.ts";
import { execute as register } from "./register.ts";
import { execute as authenticate } from "./authenticate.ts";
import { execute as my_info } from "./my_info.ts";
import { execute as whois } from "./whois.ts";
import { execute as channels } from "./channels.ts";
import { execute as join } from "./join.ts";
import { execute as leave } from "./leave.ts";
import { execute as message } from "./message.ts";
import { execute as channel_create } from "./channel_create.ts";
import { execute as channel_invite } from "./channel_invite.ts";

export const OPERATIONS_MAP: Record<
  number,
  OperationExecuteFn
> = {
  [Operations.REGISTER]: register,
  [Operations.AUTHENTICATE]: authenticate,
  [Operations.MY_INFO]: my_info,
  [Operations.WHOIS]: whois,
  [Operations.CHANNELS]: channels,
  [Operations.JOIN]: join,
  [Operations.LEAVE]: leave,
  [Operations.MESSAGE]: message,
  [Operations.CHANNEL_CREATE]: channel_create,
  [Operations.CHANNEL_INVITE]: channel_invite,
};
