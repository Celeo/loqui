import { OperationExecuteFn, Operations } from "../util.ts";
import { execute as register } from "./register.ts";
import { execute as authenticate } from "./authenticate.ts";

export const OPERATIONS_MAP: Record<
  number,
  OperationExecuteFn
> = {
  [Operations.REGISTER]: register,
  [Operations.AUTHENTICATE]: authenticate,
  // [Operations.MY_INFO]: my_info,
  // [Operations.WHOIS]: whois,
  // [Operations.CHANNELS]: channels,
  // [Operations.JOIN]: join,
  // [Operations.LEAVE]: leave,
  // [Operations.MESSAGE]: message,
};
