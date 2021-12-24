# Operations and events

## Operations

Operations are sent from users to the server.

**Format**: `<operation ID>(<arguments>)`

**operation ID** is a number that specifies the operation used, like logging in, sending a message, etc., always two digits (zero-padded if necessary).

**arguments** is stringified JSON, dependent on the operation used.

### Examples

- `02"Matt"`
- `14{"some":"data"}`
- `09["arg1", "arg2"]`
- `03{"target":"#general","message":"I'm sending **a** __message__\n\nQuoted \"string\""}`

### Operations listing

#### 01 - Register

Args:

```json
[
  "<username>",
  "<password>"
]
```

Username must be unique. Password must be at least 8 characters and no longer than 100. A salted hash of the password will be stored, in accordance with good password-handling practices.

#### 02 - Authenticate

Args:

```json
[
  "<username>",
  "<password>"
]
```

User must have an account already registered.

#### 03 - Me

Args: none

Returns information about the logged-in account.

#### 04 - Whois

Args:

```json
"<name>"
```

Note that the argument is just a string, not an array or similar. The string may be a regex if between `/`, like `/^abc.*def/`. Returns basic information about any matching username.

#### 10 - Channels

Args:

```json
"(<search regex>)"
```

Search for (matching) channels. If a string is specified, it is interpreted as a regex and only matching channels are returned. All channels are returned, including channels that the user is already a member of, and those that the current user cannot join due to whitelists, though they will be marked as such. Channel names match `/^[a-z0-9-_]{1,20}$/`. When mentioned in chat, channels are prefixed with the `#` symbol.

**Example response payload**

```json
[
  {
    "name": "general",
    "member": true,
    "whitelist": false,
    "whitelisted": false,
    "members": 1254
  },
  {
    "name": "random",
    "member": false,
    "whitelist": false,
    "whitelisted": false,
    "members": 254
  },
  {
    "name": "cool_stuff",
    "member": false,
    "whitelist": true,
    "whitelisted": true,
    "members": 25
  },
  {
    "name": "more_cool_stuff",
    "member": false,
    "whitelist": true,
    "whitelisted": false,
    "members": 0
  },
  ...
]
```

When a channel has a whitelist and the user is not whitelisted in it, the `members` datum is always shown as 0.

#### 11 - Join

Args:

```json
"<name>"
```

Join a channel. Some channels have whitelists; if the channel you are attempting to join has such a system in place, your username must be configured there prior to invoking this operation, or it will fail. If you are already a member of the channel, a warning will be returned but no other action needs to be taken.

#### 12- Leave

Args:

```json
"<name>"
```

Leave a channel. If you are not a member of the specified channel, a warning will be returned but no other action needs to be taken.

#### 13 - Message

Args:

```json
{
  "target": "<channel name>",
  "message": "<message"
}
```

Send a message to a channel. You must be a member of the channel at the time of invoking this operation. The arguments to this command are in an object as the functionality of this operation is expected to expand.

## Events

Events are sent from the server to users.

**Format**

```json
{
  "type": "event",
  "trigger": "<trigger>",
  "payload": <payload>
}
```

The `payload` may be any JSON. The `trigger` should give sufficient information to type the data in `payload`.

### Operation responses

**Format**

```json
{
  "type": "event",
  "trigger": "operation",
  "payload": {
    "succeeded": "<bool>",
    "operation_id": <operation_ID>,
    "data": <data>
  }
}
```

The `<operation ID>` is the operation ID that was sent by the user (as a number, so if under 10, it won't be zero-padded). Operations are handled in order sent to the server. If the operation failed, `suceeded` will be `false` and `data` will be a string with information as to why the operation failed. Otherwise, in the event of the operation succeeded, `data` will be operation- (and situation-) specific information.

### Examples

(1) Other user sent a message to a channel that you're a member of:

```json
{
  "type": "event",
  "trigger": "chat",
  "payload": {
    "user": "<user>",
    "channel": "<name>",
    "message": "<message>"
  }
}
```

(2) User left a channel that you're a member of:

```json
{
  "type": "event",
  "trigger": "user-left",
  "payload": {
    "user": "<user>",
    "channel": "<channel>"
  }
}
```

(3) You cannot join a channel due to a whitelist:

```json
{
  "type": "event",
  "trigger": "operation",
  "payload": {
    "suceeded": false,
    "operation_id": 11,
    "message": "Channel has a whitelist that you are not a member of"
  }
}
```

(4) You cannot join a channel due to it not existing:

```json
{
  "type": "event",
  "trigger": "operation",
  "payload": {
    "suceeded": false,
    "operation_id": 11,
    "message": "Channel does not exist"
  }
}
```

(5) You successfully join a channel (note the empty `message`)

```json
{
  "type": "event",
  "trigger": "operation",
  "payload": {
    "suceeded": true,
    "operation_id": 11,
    "message": ""
  }
}
```
