import {
  Database,
  DataTypes,
  Model,
  ModelDefaults,
  ModelFields,
  Relationships,
  SQLite3Connector,
} from "./deps.ts";
import { bcrypt } from "./deps.ts";

/**
 * Username requirements.
 */
export const usernameRegex = /^[a-z0-9][a-z0-9_-]{2,14}$/;

export const db = new Database(
  new SQLite3Connector({ filepath: "./data.db" }),
);

/**
 * User DB model.
 */
export class User extends Model {
  static table = "users";
  static timestamps = true;

  static fields: ModelFields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  };

  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.passwordHash as string);
  }
}

/**
 * Channel DB model.
 */
export class Channel extends Model {
  static table = "channels";
  static timestamps = true;

  static fields: ModelFields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    requiresInvite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  };

  static defaults: ModelDefaults = {
    requiresInvite: false,
  };
}

/**
 * Channel Membership DB model.
 */
export class ChannelMembership extends Model {
  static table = "channel_memberships";
  static timestamps = true;

  static fields: ModelFields = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  };

  static user() {
    return this.hasOne(User);
  }

  static channel() {
    return this.hasOne(Channel);
  }
}

db.link([User, Channel, ChannelMembership]);

/**
 * Perform database setup and basic data insertion.
 *
 * **NOTE** this function will drop any existing data.
 */
export async function databaseSetup(): Promise<void> {
  Relationships.belongsTo(ChannelMembership, User);
  Relationships.belongsTo(ChannelMembership, Channel);
  await db.sync({ drop: true });
  if ((await Channel.count()) === 0) {
    await Channel.create({ name: "general" });
  }
}

/**
 * Create a new user.
 */
export async function createUser(
  username: string,
  password: string,
): Promise<User> {
  const generalChannel = await Channel.where("name", "general").first();
  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(8));
  await User.create({ username, passwordHash });
  const newUser = await User.where({ username }).first();
  await ChannelMembership.create({
    channelId: generalChannel.id as number,
    userId: newUser.id as number,
  });
  return newUser as User;
}
